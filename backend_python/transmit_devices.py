import json
import paho.mqtt.client as mqtt
import asyncio
from upnp_devices import scan_ssdp
from ble_scan import scan_ble

# Configure your MQTT broker and topics
MQTT_BROKER = "127.0.0.1"
TOPIC_PUB = "app/devices/discovered"
TOPIC_SUB = "app/devices/discover"

# Define on_connect and on_message callback functions
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe(TOPIC_SUB)  # Subscribe to the topic once connected

def on_message(client, userdata, msg):
    print(f"Message received on topic {msg.topic}: {msg.payload.decode()}")

    if msg.payload.decode().strip().lower() == "search":
        # Run BLE and SSDP scans asynchronously
        loop = asyncio.get_event_loop()
        device_data = loop.run_until_complete(discover_devices())

        # Publish the combined device data
        client.publish(TOPIC_PUB, json.dumps(device_data))
        print(f"Published device data to {TOPIC_PUB}")

async def discover_devices():
    """Run both SSDP and BLE scans and return combined results."""
    ssdp_devices = await scan_ssdp()
    ble_devices = await scan_ble()

    # Merge SSDP and BLE results
    return ssdp_devices + ble_devices

# Set up MQTT client and callbacks
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

# Connect to MQTT broker and start the loop
mqtt_client.connect(MQTT_BROKER, 1883, 60)
mqtt_client.loop_forever()  # Keep the client running
