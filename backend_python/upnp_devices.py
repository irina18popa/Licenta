import asyncio
import aiohttp
import xml.etree.ElementTree as ET
from getmac import get_mac_address
from async_upnp_client.search import async_search
from extract_hostIP import get_host_ip


async def get_friendly_name(location_url):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(location_url, timeout=5) as resp:
                resp.raise_for_status()
                xml_content = await resp.read()
    except Exception as e:
        print(f"Error fetching {location_url}: {e}")
        return None

    try:
        root = ET.fromstring(xml_content)
        device_elem = root.find(".//{*}device")
        if device_elem is not None:
            friendly_name = device_elem.find(".//{*}friendlyName")
            return friendly_name.text if friendly_name is not None else None
    except ET.ParseError as e:
        print(f"XML parse error: {e}")

    return None


def get_mac(ip_address: str) -> str:
    mac = get_mac_address(ip=ip_address)
    if not mac:
        print(f"Could not determine MAC address for {ip_address}")
    return mac


async def scan_ssdp():
    """
    Perform SSDP Scan and return discovered device data as a list.
    Optional params to control data fields.
    """
    visited_uuids = set()
    visited_locations = set()
    device_data = []

    async def ssdp_callback(response):
        location_url = response.get("location")
        st_field = response.get("st")
        remote_addr = response.get("_remote_addr", (None, None))
        ip_address = remote_addr[0] if remote_addr else "Unknown"

        if st_field and st_field.startswith("uuid:"):
            device_uuid = st_field
            if device_uuid not in visited_uuids:
                visited_uuids.add(device_uuid)

                friendly_name = None
                if location_url and location_url not in visited_locations:
                    visited_locations.add(location_url)
                    friendly_name = await get_friendly_name(location_url)

                device_entry = {
                    "deviceName": friendly_name if friendly_name else "Unknown",
                    "MAC": get_mac(ip_address).upper(),
                    "IP": ip_address,
                    "uuid": device_uuid.replace("uuid:", ""),
                    "protocol": "upnp",
                    "metadata": location_url
                }

                device_data.append(device_entry)
                #print(f"Discovered Device: {device_entry}")

    try:
        local_ip = get_host_ip()
        await async_search(
            async_callback=ssdp_callback,
            timeout=3,
            search_target="ssdp:all",
            source=(local_ip, 0)
        )
    except Exception as e:
        print("Error during SSDP scan:", e)

    return device_data


async def device_exists(target_uuid: str) -> bool:
    """
    Scan for UPnP devices and check if any device's 'uuid' matches target_uuid.
    Return True if found, False otherwise.
    """
    # Normalize the parameter
    target_uuid = target_uuid.lower()

    # Run the existing scan_ssdp() to get a list of devices
    discovered = await scan_ssdp()

    # Check for a matching UUID (case‐insensitive)
    for device in discovered:
        dev_uuid = device.get("uuid", "").lower()
        if dev_uuid == target_uuid:
            return True

    return False


# if __name__ == "__main__":
#     discovered_devices = asyncio.run(scan_ssdp())

#     # Print final list of devices
#     print("\nFinal List of Discovered SSDP Devices:")
#     for device in discovered_devices:
#         print(device)


# async def main():
#     uuid_to_find = "141435d6-eb51-18db-8000-0009dfea21d4"
#     exists = await device_exists(uuid_to_find)
#     if exists:
#         print(f"Device with UUID {uuid_to_find} was found.")
#     else:
#         print(f"Device with UUID {uuid_to_find} not found.")

# if __name__ == "__main__":
#     asyncio.run(main())
