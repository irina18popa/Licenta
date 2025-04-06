import asyncio
from bleak import BleakScanner, BleakClient

async def connect_to_TY_devices():
    print("Scanning for BLE devices...")
    devices = await BleakScanner.discover(timeout=5)

    # Filter only devices whose name is exactly "TY".
    ty_devices = [d for d in devices if d.name == "TY"]

    if not ty_devices:
        print("No BLE devices named 'TY' found.")
        return

    for device in ty_devices:
        try:
            print(f"Attempting to connect to {device.name} ({device.address})...")
            async with BleakClient(device.address) as client:
                if client.is_connected:
                    print(f"Connected to {device.name} ({device.address}).")

                    # Use the newer approach to retrieve GATT services
                    services = client.services
                    print(services)

                    for service in services:
                        print(f"Service: {service.uuid} - {service.description}")
                        for char in service.characteristics:
                            print(f"  Characteristic: {char.uuid} - {char.description}")
                else:
                    print(f"Failed to connect to {device.name} ({device.address}).")
        except Exception as e:
            print(f"Error connecting to {device.name} ({device.address}): {e}")

async def main():
    await connect_to_TY_devices()

if __name__ == "__main__":
    asyncio.run(main())
