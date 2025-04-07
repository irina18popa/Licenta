from bleak import BleakScanner
import asyncio
import re
import json
import datetime


# Regex pattern to detect MAC addresses (either ":" or "-" separated)
mac_pattern = re.compile(r"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$")

async def scan_ble():
    device_data = []

    print("Scanning for BLE devices...")
    devices = await BleakScanner.discover(timeout=5)
    #print(devices)
    if devices:
        for device in devices:
            name = device.name or "Unknown"

            #Filter devices with RSSI >= -50 and ensure the name is not a MAC address
            # if device.rssi >= -50 and not mac_pattern.match(name.upper()):
            if device.rssi >= -60:
                device_entry = {
                    "deviceName": name if name else "Unknown",
                    "MAC": device.address,
                    "IP": 'Unknown',
                    "uuid": 'Uknown',
                    "protocol": "ble",
                }
                device_data.append(device_entry)
                #print(f"BLE: Name: {name}, Address: {device.address}, RSSI: {device.rssi}")
        return device_data
    else:
        print("No BLE devices found.")
    

# if __name__ == "__main__":
#     asyncio.run(scan_ble())

