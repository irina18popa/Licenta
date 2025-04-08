import json
import paho.mqtt.client as mqtt
import asyncio
from upnp_devices import scan_ssdp
from ble_scan import scan_ble
from upnp_commands import get_upnp_actions

# Configure your MQTT broker and topics
MQTT_BROKER = "127.0.0.1"
TOPIC_PUB = "app/devices/discovered"
TOPIC_PUB2 = "app/devices/commands/return"
TOPIC_SUB = "app/devices/discover"
TOPIC_SUB2 = "app/devices/commands/send"


# Define on_connect and on_message callback functions
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe(TOPIC_SUB)  
    client.subscribe(TOPIC_SUB2)

    # Clear retained message (only needed once)
    client.publish(TOPIC_PUB, payload=None, retain=True)


TOPIC_PUB = "app/devices/discovered"
TOPIC_PUB2 = "app/devices/commands/return"
TOPIC_SUB = "app/devices/discover"
TOPIC_SUB2 = "app/devices/commands/send"
n   

def on_message(client, userdata, msg):
    print(f"Message received on topic {msg.topic}: {msg.payload.decode()}")

    if msg.topic == TOPIC_SUB:
        handle_discover(client, msg)

    elif msg.topic == TOPIC_SUB2:
        handle_commands(client, msg)

    else:
        print("No handler for this topic")

# Handle search logic
def handle_discover(client, msg):
    if msg.payload.decode().strip().lower() == "search":
        loop = asyncio.get_event_loop()
        device_data = loop.run_until_complete(discover_devices())
        client.publish(TOPIC_PUB, json.dumps(device_data), retain=False)
        print(f"Published device data to {TOPIC_PUB}")

# Handle command logic (protocol/MAC)
def handle_commands(client, msg):
    payload = msg.payload.decode().strip()
    try:
        protocol, ip_addr = payload.split("/")
        print(f"Protocol: {protocol.upper()}, IP_addr: {ip_addr}")

        # Assuming DEVICE_DESC_URL depends on protocol & mac
        DEVICE_DESC_URL = f"http://{ip_addr}:2870/dmr.xml"  # Example URL, adjust as needed

        loop = asyncio.get_event_loop()
        actions = loop.run_until_complete(get_upnp_actions(DEVICE_DESC_URL))

        client.publish(TOPIC_PUB2, json.dumps(actions), retain=False)
        print(f"Published actions to {TOPIC_PUB2}")

    except ValueError:
        print("Invalid payload format. Expected: protocol/MAC")


async def discover_devices():
    """Run both SSDP and BLE scans and return combined results."""
    upnp_devices = await scan_ssdp()
    ble_devices = await scan_ble()

    # Merge SSDP and BLE results
    return upnp_devices + ble_devices


# Set up MQTT client and callbacks
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

# Connect to MQTT broker and start the loop
mqtt_client.connect(MQTT_BROKER, 1883, 60)
mqtt_client.loop_forever()  # Keep the client running
