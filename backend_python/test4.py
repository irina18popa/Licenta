import asyncio
import requests
from bleak import BleakScanner
from scapy.all import ARP, Ether, srp

#API_URL = "https://api.maclookup.app/v2/macs/"
API_URL = "https://www.macvendorlookup.com/api/v2/"

### 🔍 Discover BLE Devices ###
async def discover_ble():
    """Scans for BLE devices and returns a list of (name, MAC address) pairs"""
    print("\n🔍 Discovering BLE devices...")
    devices = await BleakScanner.discover()
    
    ble_devices = []
    for device in devices:
        name = device.name if device.name else "Unknown Device"
        mac = device.address
        ble_devices.append((name, mac))
    
    return ble_devices

### 🌐 Discover Network Devices with Scapy ###
def scan_network(ip_range="192.168.1.0/24"):
    """Scans the local network using ARP requests and returns a list of (IP, MAC) pairs"""
    print("\n🌐 Scanning Local Network...")
    arp = ARP(pdst=ip_range)
    ether = Ether(dst="ff:ff:ff:ff:ff:ff")
    packet = ether / arp

    try:
        result = srp(packet, timeout=3, verbose=False)[0]
        network_devices = [{'ip': received.psrc, 'mac': received.hwsrc} for sent, received in result]
        return network_devices
    except PermissionError:
        print("❌ Permission Denied: Run script with sudo (Linux) or as Administrator (Windows).")
        return []

### 🔍 Lookup MAC Vendor ###
def get_mac_vendor(mac_address):
    """Queries the maclookup.app API to get vendor details for a MAC address"""
    try:
        response = requests.get(f"{API_URL}{mac_address}")
        data = response.json()
        # if response.status_code == 200 and "company" in data:
        #     return f"{data['company']} ({data.get('country', 'Unknown')})"
        if response.status_code == 200:
            return data
        else:
            return "Vendor Not Found"
    except Exception as e:
        return f"Error: {e}"

### 🚀 Run Both BLE and Network Discovery ###
async def main():
    # Step 1: Discover BLE devices
    ble_devices = await discover_ble()

    # Step 2: Scan network devices (Requires root/Administrator)
    network_devices = scan_network()

    # Step 3: Display BLE devices with vendor info
    print("\n📋 BLE Devices Found:")
    if not ble_devices:
        print("❌ No BLE devices found.")
    for name, mac in ble_devices:
        vendor = get_mac_vendor(mac)
        print(f"📡 {name} ({mac}) → {vendor}")

    # Step 4: Display network devices with vendor info
    print("\n📋 Network Devices Found:")
    if not network_devices:
        print("❌ No network devices found.")
    for device in network_devices:
        ip, mac = device['ip'], device['mac']
        vendor = get_mac_vendor(mac)
        print(f"🌍 {ip} - 🖧 {mac} → {vendor}")

# Run the script
if __name__ == "__main__":
    asyncio.run(main())
