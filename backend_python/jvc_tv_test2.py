# import os
# import asyncio
# import aiohttp
# import logging
# import subprocess
# import wakeonlan
# from getmac import get_mac_address
# from async_upnp_client.aiohttp import AiohttpSessionRequester
# from async_upnp_client.client_factory import UpnpFactory
# import paho.mqtt.client as mqtt

# # Configuration
# TV_IP = "192.168.1.129"  # Replace with your TV's IP address
# TV_MAC = "XX:XX:XX:XX:XX:XX"  # Replace with your TV's MAC address for Wake-on-LAN
# DEVICE_DESC_URL = f"http://{TV_IP}:2870/dmr.xml"  # From SSDP response
# MQTT_BROKER = "127.0.0.1"
# MQTT_TOPIC = "home/tv/command"

# logging.basicConfig(level=logging.INFO)

# async def upnp_control(action: str):
#     async with aiohttp.ClientSession() as session:
#         requester = AiohttpSessionRequester(session, with_sleep=True)
#         factory = UpnpFactory(requester)
#         try:
#             device = await factory.async_create_device(DEVICE_DESC_URL)
#         except Exception as e:
#             print("Error loading device:", e)
#             return

#         if action == "volume_up":
#             service = device.service("urn:schemas-upnp-org:service:RenderingControl:1")
#             if service:
#                 try:
#                     result = await service.async_call_action("GetVolume", InstanceID=0, Channel="Master")
#                     current_volume = int(result.get("CurrentVolume", 0))
#                     new_volume = current_volume + 5
#                     await service.async_call_action("SetVolume", InstanceID=0, Channel="Master", DesiredVolume=new_volume)
#                     print(f"Increased volume from {current_volume} to {new_volume}")
#                 except Exception as e:
#                     print("Error adjusting volume:", e)
#             else:
#                 print("RenderingControl service not found.")
#         elif action == "play":
#             service = device.service("urn:schemas-upnp-org:service:AVTransport:1")
#             if service:
#                 try:
#                     # Assume media is already set. For actual playback, media should be loaded first.
#                     await service.async_call_action("Play", InstanceID=0, Speed="1")
#                     print("Sent Play command.")
#                 except Exception as e:
#                     print("Error sending Play command:", e)
#             else:
#                 print("AVTransport service not found.")
#         elif action == "stop":
#             service = device.service("urn:schemas-upnp-org:service:AVTransport:1")
#             if service:
#                 try:
#                     await service.async_call_action("Stop", InstanceID=0)
#                     print("Sent Stop command.")
#                 except Exception as e:
#                     print("Error sending Stop command:", e)
#             else:
#                 print("AVTransport service not found.")
#         else:
#             print("Unknown action.")

# def get_tv_mac(ip_address: str) -> str:
#     """Obtain the MAC address for the given IP using getmac."""
#     mac = get_mac_address(ip=ip_address)
#     if mac:
#         print(f"MAC address for {ip_address} is {mac}")
#     else:
#         print(f"Could not determine MAC address for {ip_address}")
#     return mac

# def power_on_tv():
#     """Turn on the TV using Wake-on-LAN."""
#     mac = get_tv_mac(TV_IP)
#     if mac:
#         wakeonlan.send_magic_packet(mac)
#         print(f"Sent Wake-on-LAN packet to {mac}")
#     else:
#         print("Unable to send Wake-on-LAN packet: MAC address not found.")

# def power_off_tv():
#     """Turn off the TV using HDMI-CEC via cec-client."""
#     try:
#         # This command sends the "standby" command to device 0 (typically the TV).
#         result = subprocess.run(
#             ["cec-client", "-s", "-d", "1"],
#             input="standby 0\n", text=True, capture_output=True
#         )
#         print("Sent HDMI-CEC standby command. cec-client output:")
#         print(result.stdout)
#     except Exception as e:
#         print("Error sending power off command via HDMI-CEC:", e)

# def on_connect(client, userdata, flags, rc, properties=None):
#     print("Connected to MQTT broker with result code", rc)
#     client.subscribe(MQTT_TOPIC)

# def on_message(client, userdata, msg):
#     command = msg.payload.decode("utf-8").strip()
#     print("Received MQTT command:", command)
#     if command == "power_on":
#         power_on_tv()
#     elif command == "power_off":
#         power_off_tv()
#     else:
#         asyncio.run(upnp_control(command))

# mqtt_client = mqtt.Client()
# mqtt_client.on_connect = on_connect
# mqtt_client.on_message = on_message

# mqtt_client.connect(MQTT_BROKER, 1883, 60)
# mqtt_client.loop_forever()
import socket
from getmac import get_mac_address

TV_IP = "192.168.1.133"

def get_tv_mac(ip_address: str) -> str:
    """Obtain the MAC address for the given IP using getmac."""
    mac = get_mac_address(ip=ip_address)
    if mac:
        print(f"MAC address for {ip_address} is {mac}")
    else:
        print(f"Could not determine MAC address for {ip_address}")
    return mac

def send_magic_packet(mac_address):
    # Format the MAC address (remove colons/hyphens)
    mac_bytes = bytes.fromhex(mac_address.replace(':', '').replace('-', ''))
    # Create the magic packet: 6 bytes of FF followed by the MAC address repeated 16 times
    magic_packet = b'\xFF' * 6 + mac_bytes * 16

    # Send the magic packet to the broadcast address
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        sock.sendto(magic_packet, ('<broadcast>', 9))
    print(f"Sent Wake-on-LAN packet to {mac_address}")

# Replace with your TV's MAC address
mac = get_tv_mac(TV_IP)
send_magic_packet(mac)


# def power_on_tv():
#     """Turn on the TV using Wake-on-LAN."""
#     mac = get_tv_mac(TV_IP)
#     if mac:
#         wakeonlan.send_magic_packet(mac)
#         print(f"Sent Wake-on-LAN packet to {mac}")
#     else:
#         print("Unable to send Wake-on-LAN packet: MAC address not found.")