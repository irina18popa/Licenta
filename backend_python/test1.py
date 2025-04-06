from zeroconf import Zeroconf, ServiceBrowser, ServiceListener

class MDNSListener(ServiceListener):
    def add_service(self, zeroconf, service_type, name):
        info = zeroconf.get_service_info(service_type, name)
        if info:
            print(f"Found device: {name}")
            print(f"  - Address: {info.parsed_addresses()}")
            print(f"  - Port: {info.port}")
            print(f"  - Properties: {info.properties}")

    def remove_service(self, zeroconf, service_type, name):
        print(f"Service removed: {name}")

def discover_mdns(service_type="_http._tcp.local."):  # Change service type as needed
    print(f"Searching for mDNS services of type {service_type}...")
    zeroconf = Zeroconf()
    listener = MDNSListener()
    browser = ServiceBrowser(zeroconf, service_type, listener)

    try:
        input("Press Enter to stop mDNS discovery...\n")
    finally:
        zeroconf.close()

# Run the function
discover_mdns()



import miniupnpc

def discover_upnp():
    print("Discovering UPnP devices...")

    upnp = miniupnpc.UPnP()
    upnp.discoverdelay = 200  # Increase delay if needed (200 ms)
    num_devices = upnp.discover()  # Scan for devices

    if num_devices > 0:
        print(f"Discovered {num_devices} UPnP device(s).")

        # Attempt to select a gateway device
        if upnp.selectigd():
            print(f"Gateway Device Found!")
            print(f"  - Local IP: {upnp.lanaddr}")
            try:
                print(f"  - External IP: {upnp.externalipaddress()}")
            except Exception:
                print("  - External IP: Not Available")
            
            print(f"  - Control URL: {upnp.controlurl}")
            print(f"  - Service Type: {upnp.servicetype}")
        else:
            print("No Internet Gateway Device (IGD) found.")

    else:
        print("No UPnP devices found.")

# Run the function
discover_upnp()


import threading

# Run mDNS in a separate thread
mdns_thread = threading.Thread(target=discover_mdns, args=("_http._tcp.local.",))
mdns_thread.start()

# Run UPnP discovery in main thread
discover_upnp()

mdns_thread.join()  # Wait for mDNS to finish
