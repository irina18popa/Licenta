import asyncio
import aiohttp
from async_upnp_client.aiohttp import AiohttpSessionRequester
from async_upnp_client.client_factory import UpnpFactory
import paho.mqtt.client as mqtt

# Configuration
DEVICE_DESC_URL = "http://192.168.1.133:2870/dmr.xml"  # From SSDP response
MQTT_BROKER = "127.0.0.1"
MQTT_TOPIC = "home/tv/command"

async def upnp_control(action: str):
    async with aiohttp.ClientSession() as session:
        requester = AiohttpSessionRequester(session, with_sleep=True)
        factory = UpnpFactory(requester)
        try:
            device = await factory.async_create_device(DEVICE_DESC_URL)
        except Exception as e:
            print("Error loading device:", e)
            return

        if action.startswith("VOLUME_"):
            service = device.service("urn:schemas-upnp-org:service:RenderingControl:1")
            if service:
                # Get current volume then increase by 5
                result = await service.async_call_action("GetVolume", InstanceID=0, Channel="Master")
                current_volume = int(result.get("CurrentVolume", 0))
                if(action == 'VOLUME_UP'):
                    new_volume = current_volume + 1
                else:
                    new_volume = current_volume - 1
                await service.async_call_action("SetVolume", InstanceID=0, Channel="Master", DesiredVolume=new_volume)
                print(f"volume from {current_volume} to {new_volume}")
            else:
                print("RenderingControl service not found.")



        elif action == "MUTE":
            service = device.service("urn:schemas-upnp-org:service:RenderingControl:1")
            if service:
            # Get current mute
                result = await service.async_call_action("SetMute", InstanceID=0, Channel="Master", DesiredMute=True)
                #current_mute = bool(result.get("CurrentMute", 0))
                print(f"Muted")
            else:
                print("RenderingControl service not found.")

        elif action == "UNMUTE":
            service = device.service("urn:schemas-upnp-org:service:RenderingControl:1")
            if service:
            # Get current mute
                result = await service.async_call_action("SetMute", InstanceID=0, Channel="Master", DesiredMute=False)
                #current_mute = bool(result.get("CurrentMute", 0))
                print(f"Unmuted")
            else:
                print("RenderingControl service not found.")



        elif action == "play":
            service = device.service("urn:schemas-upnp-org:service:AVTransport:1")
            if service:
                await service.async_call_action(
                    "SetAVTransportURI",
                    InstanceID=0,
                    CurrentURI="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                    CurrentURIMetaData=""
                )
                await service.async_call_action("Play", InstanceID=0, Speed="4")
                #await service.async_call_action("Stop", InstanceID=0)
                print("Sent Play command.")
            else:
                print("AVTransport service not found.")
        elif action == "stop":
            service = device.service("urn:schemas-upnp-org:service:AVTransport:1")
            if service:
                await service.async_call_action(
                    "SetAVTransportURI",
                    InstanceID=0,
                    CurrentURI="",
                    CurrentURIMetaData=""
                )
                #await service.async_call_action("Play", InstanceID=0, Speed="1")
                await service.async_call_action("Stop", InstanceID=0)
                print("Sent Stop command.")
            else:
                print("AVTransport service not found.")
        else:
            print("Unknown action.")

def on_connect(client, userdata, flags, rc, properties=None):
    print("Connected to MQTT broker with result code", rc)
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    action = msg.payload.decode("utf-8").strip()
    print("Received MQTT command:", action)
    asyncio.run(upnp_control(action))

mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

mqtt_client.connect(MQTT_BROKER, 1883, 60)
mqtt_client.loop_forever()
