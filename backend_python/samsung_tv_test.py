import paho.mqtt.client as mqtt
from samsungtvws import SamsungTVWS

# Replace with your TV's IP address.
TV_IP = "192.168.1.5"

# If your TV requires a token after pairing, you can store it and pass it here.
# For example:
# TV_TOKEN = "YOUR_SAVED_TOKEN"
# Then initialize SamsungTVWS with: SamsungTVWS(host=TV_IP, token=TV_TOKEN)
# For simplicity, this example assumes no token is required.

def on_connect(client, userdata, flags, rc, properties=None):
    print("Connected to MQTT broker with result code:", rc)
    # Subscribe to the topic that will carry TV control commands.
    client.subscribe("home/tv/command")

def on_message(client, userdata, msg):
    command = msg.payload.decode("utf-8").strip()
    print("Received command:", command)

    try:
        # Create a TV control object.
        # You may want to reuse the same object instead of re-creating it every time.
        tv = SamsungTVWS(host=TV_IP)
        
        # Map MQTT commands to TV key codes.
        if command == "power_on" or command == "power_off":
            # Many Samsung TVs use the same key to toggle power.
            tv.send_key("KEY_POWER")
            print("Sent KEY_POWER command to TV")
        elif command == "volume_up":
            tv.send_key("KEY_VOLUP")
            print("Sent KEY_VOLUP command")
        elif command == "volume_down":
            tv.send_key("KEY_VOLDOWN")
            print("Sent KEY_VOLDOWN command")
        elif command == "mute":
            tv.send_key("KEY_MUTE")
            print("Sent KEY_MUTE command")
        elif command == "channel_up":
            tv.send_key("KEY_CHUP")
            print("Sent KEY_CHUP command")
        elif command == "channel_down":
            tv.send_key("KEY_CHDOWN")
            print("Sent KEY_CHDOWN command")
        else:
            print("Unknown command received.")
    except Exception as e:
        print("Error controlling TV:", e)

# Create an MQTT client using callback API version 2.
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

# Replace with your MQTT broker's address and port.
MQTT_BROKER = "127.0.0.1"
MQTT_PORT = 1883

mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
mqtt_client.loop_forever()
