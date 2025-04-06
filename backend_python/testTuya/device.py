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


# API for list of devices
# response = openapi.get("/v2.0/cloud/thing/device?page_size=10")
# # Pretty-print the JSON response
# print(json.dumps(response, indent=4))



response = openapi.get("/v2.0/cloud/thing/device?page_size=20")

device_ids = [device["id"] for device in response.get("result", [])]

# Iterate over device IDs and call the second API
for device_id in device_ids:
    functions_response = openapi.get(f"/v1.0/iot-03/devices/{device_id}/functions")
    
    print(f"Functions for Device ID: {device_id}")
    print(json.dumps(functions_response, indent=4))




# response = openapi.get("/v2.0/cloud/thing/device?page_size=20")

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
            "value": True
        }
    ]
}

# Make a POST request to the API endpoint with the payload
# response = openapi.post("/v1.0/iot-03/devices/bfbdeb81177e0fca75y6ws/commands", payload)

# # Pretty-print the JSON response
# print(json.dumps(response, indent=4))


payload_countdown = {
    "commands": [
        {
            "code": "countdown_1",
            "value": 10  # Countdown set to 60 seconds (1 minute)
        }
    ]
}

endpoint = "/v1.0/iot-03/devices/bfbdeb81177e0fca75y6ws/commands"

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
