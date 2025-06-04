import json
import asyncio
import paho.mqtt.client as mqtt

from upnp_devices import scan_ssdp, device_exists
from ble_scan import scan_ble
from upnp_commands import get_upnp_actions
from testTuya.device import get_tuya_device, get_tuya_device_commands, get_tuya_device_status

# ───────────────────────────────────────────────────────────────────────
# MQTT broker + topics
MQTT_BROKER  = "127.0.0.1"
TOPIC_PUB    = "app/devices/discovered"
TOPIC_PUB2   = "app/devices/commands/return"
TOPIC_PUB3   = "app/devices/status/out"

TOPIC_SUB    = "app/devices/discover"
TOPIC_SUB2   = "app/devices/commands/send"
TOPIC_SUB3   = "app/devices/status/in"
# ───────────────────────────────────────────────────────────────────────

# In-memory list of devices to poll
# Each entry: { "db_id": "<MongoDB _id>", "protocol": "<upnp|tuya|ble|…>", "id_val": "<identifier>" }
monitored_devices = []

# last_status maps db_id → "online" or "offline"
last_status = {}

# Will hold our asyncio Task for the 2-second polling loop
polling_task = None

# The asyncio event loop (created in main and used throughout)
event_loop: asyncio.AbstractEventLoop = None

mqtt_client = mqtt.Client()


# ───────────────────────────────────────────────────────────────────────
def on_connect(client, userdata, flags, rc):
    print(f"[Python] Connected to MQTT broker (code {rc})")
    client.subscribe(TOPIC_SUB)  
    client.subscribe(TOPIC_SUB2)
    client.subscribe(TOPIC_SUB3)    # Clear retained on TOPIC_PUB once
    client.publish(TOPIC_PUB, payload=None, retain=True)


def on_message(client, userdata, msg):
    """
    Paho callback runs in its own thread. 
    Schedule work on the main asyncio loop instead of calling get_event_loop().
    """
    topic = msg.topic
    payload = msg.payload.decode().strip()

    print(topic)

    if topic == TOPIC_SUB:
        # schedule discovery task
        event_loop.call_soon_threadsafe(asyncio.create_task, _do_discover(payload))

    elif topic == TOPIC_SUB2:
        # schedule handle_commands task
        event_loop.call_soon_threadsafe(asyncio.create_task, _do_handle_commands(payload))

    elif topic == TOPIC_SUB3:
        # schedule status‐message handling
        event_loop.call_soon_threadsafe(asyncio.create_task, _handle_status_message(payload))

    else:
        print(f"[Python] No handler for topic {topic}")


# ───────────────────────────────────────────────────────────────────────
async def _do_discover(raw: str):
    """
    Runs on the main asyncio loop. If raw == "search", do SSDP+BLE+Tuya scan and publish each device.
    """
    if raw.lower() != "search":
        return

    device_list = await discover_devices()
    for dev in device_list:
        mqtt_client.publish(TOPIC_PUB, json.dumps(dev), qos=0, retain=False)
    # (No need to return anything. Node.js will pick up all published JSONs.)


async def discover_devices():
    """Run both SSDP and BLE scans and return combined results."""
    upnp_devices = await scan_ssdp()
    ble_devices  = await scan_ble()
    tuya_devices = await get_tuya_device()
    return upnp_devices + ble_devices + tuya_devices


# ───────────────────────────────────────────────────────────────────────
async def _do_handle_commands(raw: str):
    """
    Runs on the main asyncio loop. Parse raw = "protocol/addr/device_id",
    then await the appropriate command‐fetcher and publish to TOPIC_PUB2.
    """
    try:
        protocol, addr, device_id = raw.split("/")
        protocol = protocol.lower()
        if protocol == "upnp":
            DEVICE_DESC_URL = f"http://{addr}:2870/dmr.xml"
            actions = await get_upnp_actions(DEVICE_DESC_URL, device_id)

        elif protocol in ("ble", "tuya"):
            actions = await get_tuya_device_commands(addr, device_id)

        else:
            print(f"[Python] handle_commands: unsupported protocol '{protocol}'")
            return

        mqtt_client.publish(TOPIC_PUB2, json.dumps(actions), qos=0, retain=False)

    except ValueError:
        print(f"[Python] ERROR: Invalid payload for commands. Expected 'protocol/addr/device_id', got '{raw}'")


# ───────────────────────────────────────────────────────────────────────
async def _handle_status_message(raw: str):
    """
    Runs on the main asyncio loop. Parse raw = "<db_id>/<protocol>/<id_val>/<old_status>",
    register/update monitored_devices & last_status, and ensure status_poll_loop is started once.
    """
    global polling_task

    try:
        db_id, protocol, id_val, old_status = raw.split("/")
        protocol   = protocol.strip().lower()
        db_id      = db_id.strip()
        id_val     = id_val.strip()
        old_status = old_status.strip().lower()
        if old_status not in ("online", "offline"):
            old_status = None

        existing_ids = {d["db_id"] for d in monitored_devices}
        if db_id not in existing_ids:
            monitored_devices.append({
                "db_id":    db_id,
                "protocol": protocol,
                "id_val":   id_val,
            })
            last_status[db_id] = old_status
        else:
            # If re-sent with a (possibly different) old_status, update it
            last_status[db_id] = old_status

        # Ensure our 2-second polling task is running
        if polling_task is None or polling_task.done():
            polling_task = asyncio.create_task(status_poll_loop())

    except ValueError:
        print(f"[Python] ERROR: STATUS_IN must be '<db_id>/<protocol>/<id_val>/<old_status>'. Got: '{raw}'")


# ───────────────────────────────────────────────────────────────────────
async def status_poll_loop():
    """
    Every 2 seconds, iterate through monitored_devices:
     • Do the protocol-specific existence check
     • If the observed status ("online"/"offline") ≠ last_status[db_id], publish "<db_id>/<current>" to TOPIC_PUB3
    """
    print("[Python] Starting 2-second polling loop for status checks.")
    while True:
        for dev in monitored_devices:
            db_id    = dev["db_id"]
            protocol = dev["protocol"]
            id_val   = dev["id_val"]

            if not db_id or not id_val:
                continue

            if protocol == "upnp":
                found = await device_exists(id_val)
            elif protocol in ("tuya", "ble"):
                found = await get_tuya_device_status(id_val)
            else:
                # Unrecognized protocol → skip
                continue

            current = "online" if found else "offline"
            prior   = last_status.get(db_id)

            if prior != current:
                payload = f"{db_id}/{current}"
                mqtt_client.publish(TOPIC_PUB3, payload, qos=0, retain=False)
                last_status[db_id] = current

        await asyncio.sleep(2)


# ───────────────────────────────────────────────────────────────────────
def main():
    global event_loop

    # 1) Create and set the main asyncio loop in this (main) thread
    event_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(event_loop)

    # 2) Configure Paho callbacks
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    mqtt_client.connect(MQTT_BROKER, 1883, 60)

    # 3) Start Paho’s network loop in its own background thread
    mqtt_client.loop_start()

    # 4) Run the asyncio loop forever (so our coroutines can run)
    try:
        event_loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        mqtt_client.loop_stop()
        event_loop.stop()
        print("[Python] Shutting down.")


if __name__ == "__main__":
    main()
