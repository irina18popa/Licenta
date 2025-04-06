import bluetooth
import paho.mqtt.client as mqtt
import os

# MQTT Broker details
BROKER = "localhost"  # Replace with your MQTT broker's IP if not local
TOPIC_STATUS = "headphones/status"

# Headphone details
HEADPHONE_NAME = "HUAWEI FreeBuds 4i"

# Initialize MQTT client
mqtt_client = mqtt.Client("BluetoothHeadphones")
mqtt_client.connect(BROKER)

def discover_and_connect(headphone_name):
    """
    Discover Bluetooth devices and connect to the specified headphones.
    """
    print("Scanning for Bluetooth devices...")
    nearby_devices = bluetooth.discover_devices(lookup_names=True, duration=8)

    for addr, name in nearby_devices:
        print(f"Found device: {name} at {addr}")
        if name == headphone_name:
            print(f"Found target headphones: {name}")
            # Try connecting using system command (can be adapted)
            os.system(f"bluetoothctl connect {addr}")
            mqtt_client.publish(TOPIC_STATUS, f"{headphone_name} connected at {addr}")
            return addr

    print("Headphones not found.")
    mqtt_client.publish(TOPIC_STATUS, f"{headphone_name} not found")
    return None

# Main logic
if __name__ == "__main__":
    connected_address = discover_and_connect(HEADPHONE_NAME)
    if connected_address:
        print(f"Connected to {HEADPHONE_NAME} successfully.")
    else:
        print("Connection failed.")

    mqtt_client.disconnect()
