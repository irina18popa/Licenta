import asyncio
import aiohttp
import xml.etree.ElementTree as ET
import datetime
from getmac import get_mac_address
from async_upnp_client.search import async_search
from extract_hostIP import get_host_ip

visited_uuids = set()  # Keep track of unique UUIDs
visited_locations = set()  # Keep track of which URLs we've already parsed
device_data = []  # List to store discovered device details

async def get_friendly_name(location_url):
    """
    Fetch the device descriptor from the given location_url,
    parse the XML, and return the friendlyName (or None if not found).
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(location_url, timeout=5) as resp:
                resp.raise_for_status()
                xml_content = await resp.read()
    except Exception as e:
        print(f"Error fetching {location_url}: {e}")
        return None

    try:
        # Parse the XML to find the <friendlyName> element
        root = ET.fromstring(xml_content)
        device_elem = root.find(".//{*}device")
        if device_elem is not None:
            friendly_name = device_elem.find(".//{*}friendlyName")
            return friendly_name.text if friendly_name is not None else None
    except ET.ParseError as e:
        print(f"XML parse error: {e}")

    return None


def get_mac(ip_address: str) -> str:
    """Obtain the MAC address for the given IP using getmac."""
    mac = get_mac_address(ip=ip_address)
    if mac:
        print(f"MAC address for {ip_address} is {mac}")
    else:
        print(f"Could not determine MAC address for {ip_address}")
    return mac


async def scan_ssdp():
    #print("Scanning for SSDP devices...")

    async def ssdp_callback(response):
        """
        Called for each SSDP response.
        Filters responses with ST fields containing 'uuid:<device-UUID>',
        ensuring each unique UUID is processed only once.
        """
        location_url = response.get("location")
        st_field = response.get("st")
        remote_addr = response.get("_remote_addr", (None, None))
        ip_address = remote_addr[0] if remote_addr else "Unknown"

        # Check for a UUID in the ST field and ensure it's unique
        if st_field and st_field.startswith("uuid:"):
            device_uuid = st_field
            if device_uuid not in visited_uuids:
                visited_uuids.add(device_uuid)

                # Fetch and parse the friendly name only if the location is unique
                friendly_name = None
                if location_url and location_url not in visited_locations:
                    visited_locations.add(location_url)
                    friendly_name = await get_friendly_name(location_url)

                # Get MAC address (optional)
                mac_address = get_mac(ip_address)

                # Prepare device data entry
                device_entry = {
                    "deviceName": friendly_name if friendly_name else "Unknown",
                    "MAC": mac_address,
                    #"IP_addr": ip_address,
                    #"uuid": device_uuid,
                    "protocol": "upnp",
                    "status": "Online",
                    #"timestamp": datetime.datetime.now().isoformat()
                }

                # Add to the list
                device_data.append(device_entry)

                # Print the discovered device details
                print(f"Discovered Device: {device_entry}")
            else:
                print(f"Skipping duplicate UUID: {device_uuid}")
        else:
            # Skip responses without a valid UUID in the ST field
            pass

    try:
        # Get local IP address
        local_ip = get_host_ip()

        # Perform the SSDP search
        await async_search(
            async_callback=ssdp_callback,
            timeout=3,
            search_target="ssdp:all",
            source=(local_ip, 0)
        )
    except Exception as e:
        print("Error during SSDP scan:", e)

    print(device_data)

    return device_data  # Return the list of discovered devices

# if __name__ == "__main__":
#     discovered_devices = asyncio.run(scan_ssdp())

#     # Print final list of devices
#     print("\nFinal List of Discovered SSDP Devices:")
#     for device in discovered_devices:
#         print(device)