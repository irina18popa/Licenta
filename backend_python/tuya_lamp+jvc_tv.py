"""This module controls a Tuya lamp and a UPnP TV via MQTT commands."""

import logging
import json
import asyncio
import aiohttp
from tuya_connector import TuyaOpenAPI
from async_upnp_client.aiohttp import AiohttpSessionRequester
from async_upnp_client.client_factory import UpnpFactory
import paho.mqtt.client as mqtt

# Tuya API Configuration
ACCESS_ID = "psuk4e4q5x57nxtuhj5m"
ACCESS_KEY = "7896c8f95d034ea5bcbfc884880f8ccb"
API_ENDPOINT = "https://openapi.tuyaeu.com"
openapi = TuyaOpenAPI(API_ENDPOINT, ACCESS_ID, ACCESS_KEY)
openapi.connect()

# Tuya Device Configuration
TUYA_DEVICE_ID = "bfbdeb81177e0fca75y6ws"  # Your Tuya Lamp device ID

# TV UPnP Configuration
DEVICE_DESC_URL = "http://192.168.1.131:2870/dmr.xml"

# MQTT Configuration
MQTT_BROKER = "127.0.0.1"
TV_COMMAND_TOPIC = "home/upnp/tv/command"
LAMP_COMMAND_TOPIC = "home/tuya/lamp/command"

# Function to control Tuya Lamp based on MQTT command
def control_tuya_lamp(command):
    if command == "True":
        command = True
    elif command == "False":
        command = False
        
    payload = {
        "commands": [
            {
                "code": "switch_led",
                "value": command
            }
        ]
    }
    response = openapi.post(f"/v1.0/iot-03/devices/{TUYA_DEVICE_ID}/commands", payload)
    print(f"Sent command '{command}' to Tuya lamp.")
    print("Response from Tuya API:", json.dumps(response, indent=4))

# Function to control TV using UPnP
async def upnp_control(action: str):
    async with aiohttp.ClientSession() as session:
        requester = AiohttpSessionRequester(session, with_sleep=True)
        factory = UpnpFactory(requester)
        try:
            device = await factory.async_create_device(DEVICE_DESC_URL)
        except Exception as e:
            print("Error loading UPnP device:", e)
            return

        # TV Volume Control
        if action.startswith("VOLUME_"):
            service = device.service("urn:schemas-upnp-org:service:RenderingControl:1")
            if service:
                result = await service.async_call_action("GetVolume", InstanceID=0, Channel="Master")
                current_volume = int(result.get("CurrentVolume", 0))
                new_volume = current_volume + 1 if action == 'VOLUME_UP' else current_volume - 1
                await service.async_call_action("SetVolume", InstanceID=0, Channel="Master", DesiredVolume=new_volume)
                print(f"Volume changed from {current_volume} to {new_volume}")
            else:
                print("RenderingControl service not found.")
        
        # TV Mute/Unmute
        elif action in ["MUTE", "UNMUTE"]:
            service = device.service("urn:schemas-upnp-org:service:RenderingControl:1")
            if service:
                mute_value = (action == "MUTE")
                await service.async_call_action("SetMute", InstanceID=0, Channel="Master", DesiredMute=mute_value)
                print(f"{'Muted' if mute_value else 'Unmuted'} the TV.")
            else:
                print("RenderingControl service not found.")
        
        # TV Play/Stop commands
        elif action in ["play", "stop"]:
            service = device.service("urn:schemas-upnp-org:service:AVTransport:1")
            if service:
                if action == "play":
                    await service.async_call_action("SetAVTransportURI", InstanceID=0, CurrentURI="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", CurrentURIMetaData="")
                    await service.async_call_action("Play", InstanceID=0, Speed="1")
                    print("Sent Play command.")
                elif action == "stop":
                    await service.async_call_action("Stop", InstanceID=0)
                    print("Sent Stop command.")
            else:
                print("AVTransport service not found.")
        else:
            print("Unknown action.")

# MQTT Callback functions
def on_connect(client, userdata, flags, rc, properties=None):
    print("Connected to MQTT broker with result code", rc)
    client.subscribe([(TV_COMMAND_TOPIC, 0), (LAMP_COMMAND_TOPIC, 0)])

def on_message(client, userdata, msg):
    command = msg.payload.decode("utf-8").strip()
    topic = msg.topic
    print(f"Received command '{command}' on topic '{topic}'")

    if topic == TV_COMMAND_TOPIC:
        asyncio.run(upnp_control(command))
    elif topic == LAMP_COMMAND_TOPIC:
        control_tuya_lamp(command)

# Initialize MQTT client
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.connect(MQTT_BROKER, 1883, 60)
mqtt_client.loop_forever()