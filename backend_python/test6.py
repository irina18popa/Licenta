#!/usr/bin/env python3

import threading
import time
import queue
import signal
import sys

# -------- DHCP (Scapy) Imports --------
from scapy.all import sniff, DHCP

# -------- MQTT (paho-mqtt) Imports --------
import paho.mqtt.client as mqtt

# -------- SSDP (python-ssdp) Imports --------
#from ssdp import SSDPServer

# -------- Zeroconf (zeroconf) Imports --------
from zeroconf import Zeroconf, ServiceBrowser, ServiceStateChange

###############################################################################
# DiscoveryManager: Manages multiple discovery mechanisms
###############################################################################
class DiscoveryManager:
    def __init__(self, mqtt_broker="localhost", mqtt_port=1883):
        """
        :param mqtt_broker: Host/IP of your MQTT broker
        :param mqtt_port: Port of your MQTT broker
        """
        self.mqtt_broker = mqtt_broker
        self.mqtt_port = mqtt_port

        # A thread-safe queue to collect discovered device data
        self.discovery_queue = queue.Queue()

        # Thread stop signals
        self.stop_event = threading.Event()

        # Threads
        self.dhcp_thread = None
        self.mqtt_thread = None
        self.ssdp_thread = None
        self.zeroconf_thread = None

        # Zeroconf instance
        self.zeroconf = None

    ############################################################################
    # DHCP Discovery (Scapy)
    ############################################################################
    def dhcp_discovery(self):
        """
        Listen for DHCP packets (on UDP ports 67, 68) and extract hostnames.
        NOTE: Requires root privileges or special permissions on most systems.
        """

        def dhcp_callback(packet):
            if packet.haslayer(DHCP):
                dhcp_options = packet[DHCP].options
                hostname = None
                for opt in dhcp_options:
                    if isinstance(opt, tuple) and opt[0] == 'hostname':
                        hostname = opt[1]
                if hostname:
                    device_info = {
                        "type": "DHCP",
                        "hostname": hostname,
                        "mac": packet.src,
                    }
                    self.discovery_queue.put(device_info)

        # Sniff DHCP traffic until stop_event is set
        sniff(
            filter="udp and (port 67 or port 68)",
            prn=dhcp_callback,
            store=0,
            stop_filter=lambda x: self.stop_event.is_set()
        )

    def start_dhcp_discovery(self):
        self.dhcp_thread = threading.Thread(target=self.dhcp_discovery, daemon=True)
        self.dhcp_thread.start()

    ############################################################################
    # MQTT Discovery (paho-mqtt)
    ############################################################################
    def mqtt_discovery(self):
        """
        Connect to an MQTT broker, subscribe to a discovery topic,
        and parse any incoming messages.
        """

        client = mqtt.Client()

        def on_connect(client, userdata, flags, rc):
            print(f"[MQTT] Connected with result code {rc}")
            # Subscribe to all "homeassistant/#" topics by default:
            client.subscribe("homeassistant/#")

        def on_message(client, userdata, msg):
            topic = msg.topic
            payload = msg.payload.decode("utf-8", "ignore")
            device_info = {
                "type": "MQTT",
                "topic": topic,
                "payload": payload
            }
            self.discovery_queue.put(device_info)

        client.on_connect = on_connect
        client.on_message = on_message

        # Attempt to connect to the broker
        client.connect(self.mqtt_broker, self.mqtt_port, 60)

        # Loop until stop is requested
        while not self.stop_event.is_set():
            client.loop(timeout=1.0)

        # Clean up
        client.disconnect()

    def start_mqtt_discovery(self):
        self.mqtt_thread = threading.Thread(target=self.mqtt_discovery, daemon=True)
        self.mqtt_thread.start()

    # ############################################################################
    # # SSDP Discovery (python-ssdp)
    # ############################################################################
    # def ssdp_discovery(self):
    #     """
    #     Create an SSDP "server" (though we typically use a 'client' approach).
    #     We will send an M-SEARCH to discover devices, then listen for responses.
    #     """

    #     ssdp = SSDPServer()

    #     @ssdp.on("response")
    #     def on_ssdp_response(sender, headers):
    #         # Collect the raw SSDP headers
    #         device_info = {
    #             "type": "SSDP",
    #             "headers": headers
    #         }
    #         self.discovery_queue.put(device_info)

    #     # Send an M-SEARCH for all devices
    #     ssdp.m_search(st="ssdp:all")

    #     # We'll keep this SSDP server open until stop_event is set
    #     while not self.stop_event.is_set():
    #         time.sleep(0.5)

    #     ssdp.close()

    # def start_ssdp_discovery(self):
    #     self.ssdp_thread = threading.Thread(target=self.ssdp_discovery, daemon=True)
    #     self.ssdp_thread.start()

    ############################################################################
    # Zeroconf (mDNS) Discovery
    ############################################################################
    def zeroconf_discovery(self, service_type="_hap._tcp.local."):
        """
        Discover mDNS/Bonjour services (e.g., `_hap._tcp.local.` for HomeKit).
        """

        def on_service_state_change(zeroconf, service_type, name, state_change):
            if state_change is ServiceStateChange.Added:
                info = zeroconf.get_service_info(service_type, name)
                if info:
                    device_info = {
                        "type": "Zeroconf",
                        "service_type": service_type,
                        "name": name,
                        "addresses": info.parsed_addresses(),
                        "port": info.port,
                        "properties": info.properties
                    }
                    self.discovery_queue.put(device_info)

        self.zeroconf = Zeroconf()
        browser = ServiceBrowser(
            self.zeroconf,
            service_type,
            handlers=[on_service_state_change]
        )

        # Keep running until stop_event is set
        while not self.stop_event.is_set():
            time.sleep(0.5)

        # Clean up Zeroconf
        self.zeroconf.close()

    def start_zeroconf_discovery(self, service_type="_hap._tcp.local."):
        self.zeroconf_thread = threading.Thread(
            target=self.zeroconf_discovery,
            args=(service_type,),
            daemon=True
        )
        self.zeroconf_thread.start()

    ############################################################################
    # Start all methods
    ############################################################################
    def start_all(self):
        # Start each discovery method
        self.start_dhcp_discovery()
        #self.start_mqtt_discovery()
       # self.start_ssdp_discovery()
        self.start_zeroconf_discovery()

    ############################################################################
    # Stop all methods
    ############################################################################
    def stop_all(self):
        # Signal threads to stop
        self.stop_event.set()

        # Join threads if they exist
        if self.dhcp_thread and self.dhcp_thread.is_alive():
            self.dhcp_thread.join(timeout=2)

        if self.mqtt_thread and self.mqtt_thread.is_alive():
            self.mqtt_thread.join(timeout=2)

        # if self.ssdp_thread and self.ssdp_thread.is_alive():
        #     self.ssdp_thread.join(timeout=2)

        if self.zeroconf_thread and self.zeroconf_thread.is_alive():
            self.zeroconf_thread.join(timeout=2)

    ############################################################################
    # Main run loop
    ############################################################################
    def run(self):
        """
        Continuously read from the discovery_queue and print
        discovered devices until the user stops the script.
        """
        self.start_all()
        print("Discovery started. Press Ctrl+C to stop.\n")

        try:
            while True:
                try:
                    device_info = self.discovery_queue.get(timeout=1)
                    print(f"Discovered: {device_info}")
                except queue.Empty:
                    # No discovery events in this timeframe, just loop
                    pass
        except KeyboardInterrupt:
            print("\nStopping discovery...")
        finally:
            self.stop_all()
            print("Discovery stopped.")


###############################################################################
# Main entry point
###############################################################################
if __name__ == "__main__":
    # You can adjust the broker IP/port here
    manager = DiscoveryManager(mqtt_broker="192.168.1.11", mqtt_port=1883)
    manager.run()
