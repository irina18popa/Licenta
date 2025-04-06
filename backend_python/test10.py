import asyncio
import re
from bleak import BleakScanner, BleakClient

# Suspected UUID for the provisioning service from advertisement (may only be visible in pairing mode)
PROVISIONING_UUID = "0000a201-0000-1000-8000-00805f9b34fb"
# Fallback: Vendor-specific service UUID (from GATT scan)
VENDOR_SPECIFIC_UUID = "00001910-0000-1000-8000-00805f9b34fb"

TARGET_NAME = "TY"

async def scan_for_TY():
    print("Scanning for BLE devices in pairing mode...")
    devices = await BleakScanner.discover(timeout=5)
    # Filter for devices whose name exactly equals "TY"
    ty_devices = [d for d in devices if d.name and d.name.strip() == TARGET_NAME]
    if not ty_devices:
        print("No BLE devices named 'TY' found.")
        return None
    device = ty_devices[0]
    print(f"Found device: {device.name} ({device.address})")
    return device

async def pair_device(address: str, ssid: str, password: str):
    print(f"Connecting to device at {address} for pairing...")
    try:
        async with BleakClient(address) as client:
            if client.is_connected:
                print(f"Connected to {address}.")
                # Iterate over services and print details (for debugging)
                for service in client.services:
                    print(f"Service: {service.uuid} - {service.description}")
                    for char in service.characteristics:
                        print(f"  Characteristic: {char.uuid} - {char.description}")

                provisioning_char = None
                # First try to find a service matching the provisioning UUID
                for service in client.services:
                    if service.uuid.lower() == PROVISIONING_UUID.lower():
                        if service.characteristics:
                            # Choose the first characteristic as candidate
                            provisioning_char = service.characteristics[0]
                            break

                if not provisioning_char:
                    print(f"Provisioning service with UUID {PROVISIONING_UUID} not found.")
                    # Fallback: try the vendor-specific service
                    for service in client.services:
                        if service.uuid.lower() == VENDOR_SPECIFIC_UUID.lower():
                            if service.characteristics:
                                provisioning_char = service.characteristics[1]
                                print("Using vendor-specific service as fallback.")
                                break

                if not provisioning_char:
                    print("No provisioning characteristic found on the device.")
                    return

                print(f"Using characteristic {provisioning_char.uuid} for pairing.")
                # Construct the pairing payload.
                # The actual format is proprietary; this is a simple example.
                payload = f"{ssid}|{password}".encode("utf-8")
                print(f"Sending pairing payload: {payload}")
                await client.write_gatt_char(provisioning_char.uuid, payload)
                print("Pairing payload sent successfully.")
                provisioning_char = service.characteristics[0]
                response = await client.read_gatt_char(provisioning_char.uuid)
                print("Received response:", response)
            else:
                print("Failed to connect to the device for pairing.")
    except Exception as e:
        print("Error during pairing:", e)

async def main():
    device = await scan_for_TY()
    if not device:
        return
    ssid = input("Enter WiFi SSID: ")
    password = input("Enter WiFi Password: ")
    await pair_device(device.address, ssid, password)

if __name__ == "__main__":
    asyncio.run(main())
