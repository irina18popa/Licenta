"""This module has components that are used for testing tuya's device control and Pulsar massage queue."""
import logging
import asyncio
import json
from tuya_connector import (
    TuyaOpenAPI,
    TuyaOpenPulsar,
    TuyaCloudPulsarTopic,
    TUYA_LOGGER,
)

ACCESS_ID = "kqaave9x34ywys3udsq8"
ACCESS_KEY = "97f69c04f69c4314947e639e96b0303d"
API_ENDPOINT = "https://openapi.tuyaeu.com"
MQ_ENDPOINT = "wss://mqe.tuyaeu.com:8285/"

# Enable debug log
#TUYA_LOGGER.setLevel(logging.DEBUG)

# Init openapi and connect
openapi = TuyaOpenAPI(API_ENDPOINT, ACCESS_ID, ACCESS_KEY)
openapi.connect()



def parse_json_properties(values):
    properties = []

    for key, val in values.items():
        prop = {
            "name": key,
            "type": "Enum" if isinstance(val, dict) and "range" in val else "Integer" if "min" in val and "max" in val else "Json",
            "enum": val.get("range", []) if isinstance(val, dict) and "range" in val else [],
            "range": {
                "min": val.get("min") if isinstance(val, dict) and "min" in val else None,
                "max": val.get("max") if isinstance(val, dict) and "max" in val else None,
                "step": val.get("step") if isinstance(val, dict) and "step" in val else None,
            },
            "properties": parse_json_properties(val) if isinstance(val, dict) and not any(k in val for k in ["min", "max", "range", "step"]) else []
        }
        properties.append(prop)

    return properties


async def get_tuya_device_commands(device_tuya_id: str) -> dict:
    # call the blocking openapi.get in a thread
    functions_response = await asyncio.to_thread(
        openapi.get, f"/v1.0/iot-03/devices/{device_tuya_id}/functions"
    )
    if not functions_response.get("success"):
        return {"error": f"Failed to retrieve functions for device {device_tuya_id}"}

    commands = []
    for func in functions_response["result"].get("functions", []):
        values = json.loads(func.get("values", "{}"))
        param_info = {
            "name": func["code"],
            "type": func["type"],
            "enum": values.get("range", []) if func["type"] == "Enum" else [],
            "range": {
                "min": values.get("min") if func["type"] in ("Integer", "Float") else None,
                "max": values.get("max") if func["type"] in ("Integer", "Float") else None,
                "step": values.get("step") if func["type"] in ("Integer", "Float") else None,
            },
            "properties": (
                parse_json_properties(values)
                if func["type"] == "Json"
                else []
            )
        }
        commands.append({
            "name": func["name"],
            "parameters": [param_info]
        })

        ####### aici am eliminat deviceId
    return {"commands": commands}


# API for list of devices
async def get_tuya_device() -> list:
    response = await asyncio.to_thread(openapi.get, "/v2.0/cloud/thing/device", {"page_size": 20})

    CATEGORY_MAP = {
        "cz": "plug",
        "dj": "bulb",
        "wsdcg": "sensor_th",
        "mcs": "sensor_flood",
    }

    output = []
    for device in response.get("result", []):
        device_id = device["id"]
        fi_response = await asyncio.to_thread(
            openapi.get,
            "/v1.0/devices/factory-infos",
            {"device_ids": device_id}
        )
        info_list = fi_response.get("result", [])
        if not info_list:
            print(f"No MAC for device {device_id} ({device.get('customName') or device.get('name')})")
            mac_original = ""
        else:
            info = info_list[0]
            mac_original = info.get("mac", "")

        processed_mac = ":".join(octet.upper() for octet in mac_original.split(":")[::-1]) if mac_original else ""

        category_code = device.get("category")
        device_type = CATEGORY_MAP.get(category_code, category_code or "unknown")

        output.append({
            "deviceName": device.get("customName") or device.get("name"),
            "type": device_type,
            "manufacturer": "TUYA",
            "MAC": processed_mac,
            "uuid": device.get("uuid"),
            "protocol": "ble",
            "status": "online" if device.get("isOnline") else "offline",
            "metadata": device_id
        })

    #print(output)
    return output


    #3️⃣ Print final combined JSON
    #print(json.dumps(output, indent=4))


async def get_tuya_device_status(device_tuya_id:str) -> bool:
    response = await asyncio.to_thread(openapi.get, f"/v1.0/devices/{device_tuya_id}")
    online = response.get("result", {}).get("online", False)

    return online


async def get_device_state(device_tuya_id:str):
    try:
        # Step 1: Fetch device status from Tuya
        response = await asyncio.to_thread(
            openapi.get, f"/v1.0/devices/{device_tuya_id}/status"
        )

        if not response.get("success"):
            print(f"[ERROR] Failed to get status for device {device_tuya_id}")
            return

        status_array = response.get("result", [])

        # Step 2: Format payload
        payload = {
            "state": status_array,  # directly include Tuya's format
        }

        #print(payload)
        return payload

    except Exception as e:
        print(f"[ERROR] Exception in get_device_state: {e}")


async def do_command(tuya_id: str, commands: list):
    """
    Sends commands to a Tuya device and then fetches updated state.
    Returns True if command request was successful, False otherwise.
    """
    try:
        payload_combo = {
            "commands": commands
        }

        # Step 1: Send the command
        response = await asyncio.to_thread(
            openapi.post,
            f"/v1.0/iot-03/devices/{tuya_id}/commands",
            payload_combo
        )

        if not response.get("success"):
            print(f"[Tuya] Failed to send commands to {tuya_id}")
            return False

        # Step 2: Wait briefly (0.5s) then fetch device state
        await asyncio.sleep(0.5)
        updated_state = await get_device_state(tuya_id)

        if not updated_state:
            print(f"[Tuya] No updated state received for {tuya_id}")

        return updated_state

    except Exception as e:
        print(f"[ERROR] do_command failed for {tuya_id}: {e}")
        return False


# async def main():
#     device_id = "bfbdeb81177e0fca75y6ws"
#     status = await get_tuya_device_status(device_id)
#     print(f"Device is {status}")


# async def main():
#     # 1️⃣ Fetch all devices
#     device_s = await get_device_state("bfbdeb81177e0fca75y6ws")
#     print(json.dumps(device_s, indent=2))

# asyncio.run(main())

    
#     # 2️⃣ For each device, fetch its command list
#     for dev in devices:
#         device_id = dev["metadata"]
#         cmds = await get_tuya_device_commands(device_id)
#         print(f"\nCommands for device {device_id}:")
#         print(json.dumps(cmds, indent=2))


#print(json.dumps(get_tuya_device_commands('bfbdeb81177e0fca75y6ws'), indent=4))


# response = openapi.get("/v1.0/devices/bfbdeb81177e0fca75y6ws/users")
# print(json.dumps(response, indent=4))

#api for getting the mac

# response = openapi.get(
#     "/v1.0/devices/factory-infos",
#     params={"device_ids": "bfbdeb81177e0fca75y6ws"}
#     #BA:09:AC:61:D5:11
# )
# print(json.dumps(response, indent=4))

#/v1.0/devices/{device_id}/users

# response = openapi.get("/v2.0/apps/Licenta/users?page_no=1&page_size=100")
# print(json.dumps(response, indent=4)) 


# device_ids = [device["id"] for device in response.get("result", [])]

# # Iterate over device IDs and call the second API
# for device_id in device_ids:
#     device_commands = get_tuya_device_commands(device_id)
#     print(json.dumps(device_commands, indent=4))    



# device_ids = [device["id"] for device in response.get("result", [])]

# all_devices = []

# for device_id in device_ids:
#     functions_response = openapi.get(f"/v1.0/iot-03/devices/{device_id}/functions")
#     functions = functions_response.get("result", {}).get("functions", [])

#     commands = []

#     for func in functions:
#         values = func.get("values", {})
#         if isinstance(values, str):
#             try:
#                 values = json.loads(values)
#             except Exception:
#                 values = {}

#         command = {
#             "name": func.get("code"),
#             "description": func.get("name", ""),
#             "parameters": [
#                 {
#                     "name": "value",
#                     "type": func.get("type"),
#                     "default": values.get("range")  # None if not enum
#                 }
#             ]
#         }
#         commands.append(command)

#     device_info = {
#         "deviceID": "",
#         "commands": commands
#     }

#     all_devices.append(device_info)

# # Print Final JSON
# print(json.dumps(all_devices, indent=4))


# # API for list of functions of a device_id (bfbdeb81177e0fca75y6ws)
# response = openapi.get("/v1.0/iot-03/devices/bfbdeb81177e0fca75y6ws/functions")
# # Pretty-print the JSON response
# print(json.dumps(response, indent=4))


payload = {
    "commands": [
        {
            "code": "switch_led",
            "value": False
        }
    ]
}

payload_combo = {
  "commands": [
    # { 
    #     "code": "switch_led",      
    #     "value": True 
    # },
    { 
        "code": "work_mode", 
        "value": "music" 
    },
    # {
    #     "code": "colour_data_v2", 
    #     "value": 
    #     {
    #         "h":256,
    #         "s":380,
    #         "v":710
    #     }
    # },
    # {
    #     "code": "scene_data_v2",
    #     "value": {
    #         "scene_num": 1,
    #         "scene_units": [
    #             {
    #                 "bright": 100,
    #                 "h": 0,
    #                 "s": 0,
    #                 "temperature": 0,
    #                 "unit_change_mode": "static",
    #                 "unit_gradient_duration": 13,
    #                 "unit_switch_duration": 14,
    #                 "v": 0
    #             }
    #         ]
    #     }
    # }
    # { 
    #     "code": "bright_value_v2", 
    #     "value": 100 
    # },
    # { 
    #     "code": "countdown_1",     
    #     "value": 0 
    # },
    # {
    #     "code": "temp_value_v2",
    #     "value": 0,
    # }
  ]
}


# def main():
#     device_id = "bfbdeb81177e0fca75y6ws"

#     # send the command
#     response = openapi.post(
#         f"/v1.0/iot-03/devices/{device_id}/commands",
#         payload_combo
#     )
#     print("Command response:")
#     print(json.dumps(response, indent=4))

#     # fetch status
#     status = openapi.get(f"/v1.0/devices/{device_id}/status")
#     print("\nDevice status:")
#     print(json.dumps(status, indent=4))


# if __name__ == "__main__":
#     main()

# # # Pretty-print the JSON respons
#print(json.dumps(response, indent=4))


# payload_countdown = {
#     "commands": [
#         {
#             "code": "countdown_1",
#             "value": 10  # Countdown set to 60 seconds (1 minute)
#         }
#     ]
# }

# endpoint = "/v1.0/iot-03/devices/bfbdeb81177e0fca75y6ws/commands"

#response_countdown = openapi.post(endpoint, payload_countdown)
#print("countdown_1 response:")
#print(json.dumps(response_countdown, indent=4))


# # Init Message Queue
# open_pulsar = TuyaOpenPulsar(
#     ACCESS_ID, ACCESS_KEY, MQ_ENDPOINT, TuyaCloudPulsarTopic.PROD
# )
# # Add Message Queue listener
# open_pulsar.add_message_listener(lambda msg: print(f"---\nexample receive: {msg}"))

# # Start Message Queue
# open_pulsar.start()

# input()
# # Stop Message Queue
# open_pulsar.stop()
