import asyncio
import json
import requests
from bleak import BleakScanner

# Known UUID to Device Type Mapping
DEVICE_UUID_MAP = {
    "0000a201": "IR Blaster (Tuya)",  # Tuya IR Blaster
    "0000fef3": "Bluetooth Speaker / Earbuds (Google Fast Pair)",
    "0000180d": "Heart Rate Monitor (Wearable)",
    "0000180a": "Generic Smart Device",
}

# Known Manufacturer IDs
MANUFACTURER_MAP = {
    2000: "Tuya Smart Device (Bulb, Plug, IR Blaster)",  # Common Tuya Devices
    117: "Samsung Smart Device",
    76: "Apple Inc.",
}

# Function to get MAC vendor
def get_mac_vendor(mac):
    url = f"https://api.macvendors.com/{mac}"
    try:
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            return response.text.strip()
    except requests.RequestException:
        return "Vendor Not Found"
    return "Vendor Not Found"

# Function to classify device type
def classify_device(advertisement):
    device_info = {}
    mac = advertisement.address
    local_name = advertisement.metadata.get("local_name", "Unknown")
    manufacturer_data = advertisement.metadata.get("manufacturer_data", {})
    service_data = advertisement.metadata.get("service_data", {})
    service_uuids = advertisement.metadata.get("service_uuids", [])

    # Get Vendor Info
    vendor = get_mac_vendor(mac)
    
    # Identify Manufacturer
    manufacturer_id = next(iter(manufacturer_data.keys()), None)
    manufacturer_name = MANUFACTURER_MAP.get(manufacturer_id, "Unknown Manufacturer")

    # Identify Device Type based on Service UUID
    device_type = "Unknown Device"
    for uuid in service_uuids:
        if uuid[:8] in DEVICE_UUID_MAP:
            device_type = DEVICE_UUID_MAP[uuid[:8]]

    # Identify Tuya-specific Devices
    if manufacturer_id == 2000 and "0000a201" in service_uuids:
        device_type = "🎛️ IR Blaster (Tuya)"
    elif manufacturer_id == 2000:
        device_type = "Tuya Smart Home Device"

    # Store device info
    device_info["MAC"] = mac
    device_info["Name"] = local_name
    device_info["Vendor"] = vendor
    device_info["Manufacturer"] = manufacturer_name
    device_info["Device Type"] = device_type
    device_info["Service UUIDs"] = service_uuids
    return device_info

# Main BLE Scanner
async def scan_ble():
    print("\n🔍 Scanning for BLE Devices...\n")
    devices = await BleakScanner.discover()
    
    results = []
    for device in devices:
        classified_device = classify_device(device)
        results.append(classified_device)
        
        # Print Clean Output
        print(f"📡 {classified_device['Name']} ({classified_device['MAC']})")
        print(f"   🔹 Vendor: {classified_device['Vendor']}")
        print(f"   🔹 Manufacturer: {classified_device['Manufacturer']}")
        print(f"   🔹 Device Type: {classified_device['Device Type']}")
        print(f"   🔹 Service UUIDs: {', '.join(classified_device['Service UUIDs']) if classified_device['Service UUIDs'] else 'None'}\n")

    # Save to JSON
    # with open("ble_devices.json", "w") as f:
    #     json.dump(results, f, indent=4)

    #print("\n✅ Scan Complete! Results saved to 'ble_devices.json'")

# Run Scanner
asyncio.run(scan_ble())
