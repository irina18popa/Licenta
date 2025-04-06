import asyncio
from zeroconf import Zeroconf, ServiceBrowser
from bleak import BleakScanner
import bluetooth
import miniupnpc
from threading import Thread


def discover_mdns():
    print("Discovering mDNS devices...")

    class MyListener:
        def add_service(self, zeroconf, type, name):
            info = zeroconf.get_service_info(type, name)
            if info:
                print(f"Found device: {name} - Address: {info.parsed_addresses()}")

        def remove_service(self, zeroconf, type, name):
            print(f"Service removed: {name}")

        def update_service(self, zeroconf, type, name):
            pass  # Future-proof method

    zeroconf = Zeroconf()
    browser = ServiceBrowser(zeroconf, "_http._tcp.local.", MyListener())
    try:
        input("Press Enter to stop mDNS...\n")
    finally:
        zeroconf.close()


def discover_upnp():
    print("Discovering UPnP devices...")
    try:
        upnp = miniupnpc.UPnP()
        upnp.discoverdelay = 200  # Set discovery delay
        num_devices = upnp.discover()  # Discover UPnP devices

        if num_devices > 0:
            print(f"Discovered {num_devices} UPnP device(s).")

            for i in range(num_devices):
                try:
                    print(f"\nDevice {i + 1}:")

                    # Attempt to select an IGD, but not all UPnP devices are IGDs
                    if not upnp.selectigd():
                        print("  - This device is NOT an IGD (no gateway functions).")
                    
                    # Print available device details
                    print(f"  - Local IP: {upnp.lanaddr}")

                    # Attempt to retrieve external IP, but handle failures
                    try:
                        external_ip = upnp.externalipaddress()
                        print(f"  - External IP: {external_ip}")
                    except Exception:
                        print("  - External IP: Not Available (Not an IGD)")

                    # Print optional attributes safely
                    control_url = getattr(upnp, "controlurl", "N/A")
                    service_type = getattr(upnp, "servicetype", "N/A")
                    print(f"  - Control URL: {control_url}")
                    print(f"  - Service Type: {service_type}")

                except Exception as e:
                    print(f"  - Error retrieving details for this device: {e}")

        else:
            print("No UPnP devices found.")

    except Exception as e:
        print(f"Error during UPnP discovery: {e}")





def discover_bluetooth():
    print("Discovering Bluetooth devices...")
    try:
        devices = bluetooth.discover_devices(duration=8, lookup_names=True)
        for addr, name in devices:
            print(f"Found Bluetooth device: {name} ({addr})")
    except Exception as e:
        print(f"Error during Bluetooth discovery: {e}")


async def discover_ble():
    print("Discovering BLE devices...")
    try:
        devices = await BleakScanner.discover()
        for device in devices:
            print(f"Found BLE device: {device.name} ({device.address})")
    except Exception as e:
        print(f"Error during BLE discovery: {e}")


async def main():
    # Run blocking functions in threads
    #Thread(target=discover_mdns).start()

    await asyncio.to_thread(discover_mdns)
    await asyncio.to_thread(discover_upnp)
    await asyncio.to_thread(discover_bluetooth)

    # Run async BLE discovery
    await discover_ble()


if __name__ == "__main__":
    asyncio.run(main())
