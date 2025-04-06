#!/usr/bin/env python3
import asyncio
import socket
from async_upnp_client.profiles.igd import IgdDevice
from async_upnp_client.client_factory import UpnpFactory
from async_upnp_client.aiohttp import AiohttpRequester
from zeroconf import Zeroconf, ServiceBrowser
from ipaddress import IPv4Network

# UPnP Discovery
async def discover_upnp_devices():
    print("Discovering UPnP devices...")
    discoveries = await IgdDevice.async_search(source=("0.0.0.0", 0))
    if not discoveries:
        print("No UPnP devices found.")
        return []
    return [discovery["location"] for discovery in discoveries]

# mDNS Discovery
class MDNSListener:
    def __init__(self):
        self.devices = []

    def add_service(self, zeroconf, service_type, name):
        info = zeroconf.get_service_info(service_type, name)
        if info:
            self.devices.append({
                "name": info.name,
                "ip": socket.inet_ntoa(info.addresses[0]),
                "port": info.port,
                "type": service_type,
            })

async def discover_mdns_devices():
    print("Discovering mDNS devices...")
    zeroconf = Zeroconf()
    listener = MDNSListener()
    browser = ServiceBrowser(zeroconf, "_http._tcp.local.", listener)
    await asyncio.sleep(5)  # Allow time for discovery
    zeroconf.close()
    return listener.devices

# Basic Network Scan
# async def scan_network(subnet="192.168.1.0/24", ports=[80, 443, 8080]):
#     print("Scanning network...")
#     devices = []
#     for ip in IPv4Network(subnet):
#         for port in ports:
#             try:
#                 reader, writer = await asyncio.open_connection(str(ip), port)
#                 devices.append({"ip": str(ip), "port": port})
#                 writer.close()
#                 await writer.wait_closed()
#             except:
#                 pass
#     return devices

# Main Discovery Function
async def discover_devices():
    print("Starting device discovery...")
    upnp_devices = await discover_upnp_devices()
    print(f"UPnP devices found: {upnp_devices}")

    mdns_devices = await discover_mdns_devices()
    print(f"mDNS devices found: {mdns_devices}")

    # scanned_devices = await scan_network()
    # print(f"Devices found via network scan: {scanned_devices}")

    # Combine all discovered devices
    all_devices = {
        "upnp": upnp_devices,
        "mdns": mdns_devices,
        #"scanned": scanned_devices,
    }
    return all_devices

# Main Entry Point
def main():
    try:
        devices = asyncio.run(discover_devices())
        print("Discovered devices:", devices)
    except KeyboardInterrupt:
        print("Discovery interrupted.")

if __name__ == "__main__":
    main()
