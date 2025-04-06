import asyncio
from bleak import BleakScanner
from async_upnp_client.search import async_search
from zeroconf import Zeroconf, ServiceBrowser
from extract_hostIP import get_host_ip

# ---------------------------
# BLE Scanning Functionality
# ---------------------------
async def scan_ble():
    print("Scanning for BLE devices...")
    devices = await BleakScanner.discover(timeout=5)
    if devices:
        for device in devices:
            name = device.name or "Unknown"
            print(f"BLE: Name: {name}, Address: {device.address}, RSSI: {device.rssi}")
    else:
        print("No BLE devices found.")

# ---------------------------
# SSDP Scanning Functionality
# ---------------------------
async def scan_ssdp():
    print("Scanning for SSDP devices...")
    async def ssdp_callback(response):
        print("SSDP Response:")
        for key, value in response.items():
            print(f"  {key}: {value}")
        print()
    try:
        # Replace with your actual local IP address.
        local_ip = get_host_ip()
        await async_search(
            async_callback=ssdp_callback,
            timeout=3,
            search_target='ssdp:all',
            source=(local_ip, 0)
        )
    except Exception as e:
        print("Error during SSDP scan:", e)



# ---------------------------
# mDNS (Zeroconf) Scanning Functionality
# ---------------------------
class MDNSListener:
    def add_service(self, zeroconf, service_type, name):
        info = zeroconf.get_service_info(service_type, name)
        if info:
            addresses = info.parsed_addresses()
            print(f"mDNS: Service added: {name}")
            print(f"       Addresses: {addresses}")
            print(f"       Port: {info.port}")
            print(f"       Properties: {info.properties}")

    def remove_service(self, zeroconf, service_type, name):
        print(f"mDNS: Service removed: {name}")

    def update_service(self, zeroconf, service_type, name):
        # This method is required to suppress the FutureWarning.
        pass

async def scan_mdns():
    print("Scanning for mDNS/Zeroconf services...")
    zeroconf = Zeroconf()
    listener = MDNSListener()
    # You can change the service type as needed (e.g., "_hap._tcp.local." for HomeKit devices)
    service_type = "_http._tcp.local."
    browser = ServiceBrowser(zeroconf, service_type, listener)
    await asyncio.sleep(5)
    zeroconf.close()

# ---------------------------
# Main: Run All Scanners Concurrently
# ---------------------------
async def main():
    await asyncio.gather(
        scan_ble(),
        scan_ssdp(),
        scan_mdns()
    )

if __name__ == "__main__":
    asyncio.run(main())
