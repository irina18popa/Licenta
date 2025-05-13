"""This module has components that are used for testing tuya's device control and Pulsar massage queue."""
import logging
import json
from tuya_connector import (
    TuyaOpenAPI,
    TuyaOpenPulsar,
    TuyaCloudPulsarTopic,
    TUYA_LOGGER,
)

ACCESS_ID = "psuk4e4q5x57nxtuhj5m"
ACCESS_KEY = "7896c8f95d034ea5bcbfc884880f8ccb"
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


def get_tuya_device_commands(device_id):
    functions_response = openapi.get(f"/v1.0/iot-03/devices/{device_id}/functions")

    if not functions_response.get("success"):
        return {"error": f"Failed to retrieve functions for device {device_id}"}

    commands = []

    for func in functions_response.get("result", {}).get("functions", []):
        values = json.loads(func.get("values", "{}"))

        param_info = {
            "name": func.get("code"),
            "type": func.get("type"),
            # "description": func.get("desc"),
            "enum": values.get("range", []) if func.get("type") == "Enum" else [],
            "range": {
                "min": values.get("min") if func.get("type") in ["Integer", "Float"] else None,
                "max": values.get("max") if func.get("type") in ["Integer", "Float"] else None,
                "step": values.get("step") if func.get("type") in ["Integer", "Float"] else None,
            },
            "properties": parse_json_properties(values) if func.get("type") == "Json" else []
        }

        command_info = {
            "name": func.get("name"),
            # "description": func.get("desc"),
            "parameters": [param_info]
        }

        commands.append(command_info)

    device_commands = {
        "deviceID": device_id,
        "commands": commands
    }

    return device_commands


# API for list of devices
def get_tuya_device():
    response = openapi.get("/v2.0/cloud/thing/device?page_size=20")

    output = []

    # 2️⃣ Iterate devices, fetch factory infos, process MAC and build output
    for device in response["result"]:
        device_id = device["id"]
        
        # Fetch factory infos
        fi_response = openapi.get(
            "/v1.0/devices/factory-infos",
            params={"device_ids": device_id}
        )
        info = fi_response["result"][0]
        
        # Process MAC: strip colons, reverse, uppercase
        mac_original = info.get("mac", "")
        reversed_octets = mac_original.split(":")[::-1]
        processed_mac = ":".join(octet.upper() for octet in reversed_octets)
        
        # Determine display name and status
        device_name = device.get("customName") or device.get("name")
        status = "online" if device.get("isOnline") else "offline"
        
        # Combine into final record
        output.append({
            "deviceName": device_name,
            "manufacturer": "TUYA",
            "MAC": processed_mac,
            "uuid": device.get("uuid"),
            "protocol": "ble",
            "status": status,
            "metadata": device_id
        })
    return output
    # 3️⃣ Print final combined JSON
    #print(json.dumps(output, indent=4))


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


# payload = {
#     "commands": [
#         {
#             "code": "switch_led",
#             "value": False
#         }
#     ]
# }

# # #Make a POST request to the API endpoint with the payload
# response = openapi.post("/v1.0/iot-03/devices/bfbdeb81177e0fca75y6ws/commands", payload)

# # # Pretty-print the JSON respons
# print(json.dumps(response, indent=4))


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
