import asyncio
from bleak import BleakScanner, BleakClient

# Replace this with the actual UUID for the Tuya pairing characteristic
PAIRING_CHAR_UUID = "00002b10-0000-1000-8000-00805f9b34fb"

async def pair_device(device_address: str, ssid: str, password: str):
    """
    Connect to the BLE device and send pairing information.
    The pairing payload format is assumed to be:
         <SSID>|<PASSWORD>
    The actual format may differ depending on the Tuya protocol.
    """
    print(f"Connecting to device at {device_address} for pairing...")
    try:
        async with BleakClient(device_address) as client:
            if client.is_connected:
                print(f"Connected to {device_address}.")
                # Construct the pairing payload.
                payload = f"{ssid}|{password}".encode("utf-8")
                print(f"Sending pairing payload: {payload}")
                await client.write_gatt_char(PAIRING_CHAR_UUID, payload)
                print("Pairing payload sent.")
                # Optionally, you might read a response from the device
                response = await client.read_gatt_char(PAIRING_CHAR_UUID)
                print("Received response:", response)
            else:
                print("Failed to connect.")
    except Exception as e:
        print(f"Error during pairing: {e}")

async def main():
    print("Scanning for BLE devices in pairing mode...")
    devices = await BleakScanner.discover(timeout=5)
    
    # Filter for devices with the name "TY"
    ty_devices = [d for d in devices if d.name and d.name.strip() == "TY"]
    
    if not ty_devices:
        print("No BLE devices with the name 'TY' found.")
        return

    # For this example, we'll just use the first device found.
    target_device = ty_devices[0]
    print(f"Found device: {target_device.name} ({target_device.address})")
    
    # Get Wi-Fi credentials (in practice, you might obtain these from a secure source)
    ssid = input("Enter WiFi SSID: ")
    password = input("Enter WiFi Password: ")

    # Attempt to pair with the device by writing the credentials.
    await pair_device(target_device.address, ssid, password)

if __name__ == "__main__":
    asyncio.run(main())
