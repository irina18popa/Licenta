from scapy.all import ARP, Ether, srp

def scan_network(ip_range="192.168.1.0/24"):
    print("Scanning network...")
    arp = ARP(pdst=ip_range)
    ether = Ether(dst="ff:ff:ff:ff:ff:ff")
    packet = ether/arp
    result = srp(packet, timeout=3, verbose=False)[0]

    devices = []
    for sent, received in result:
        devices.append({'ip': received.psrc, 'mac': received.hwsrc})
    return devices

# Scan your local network
devices = scan_network()
for dev in devices:
    print(f"Device: {dev['ip']} - MAC: {dev['mac']}")
