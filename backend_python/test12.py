import aiohttp
import json
from async_upnp_client.aiohttp import AiohttpSessionRequester
from async_upnp_client.client_factory import UpnpFactory

DEVICE_DESC_URL = "http://192.168.1.131:2870/dmr.xml"

async def get_upnp_actions_with_only_inputs():
    async with aiohttp.ClientSession() as session:
        requester = AiohttpSessionRequester(session, with_sleep=True)
        factory = UpnpFactory(requester)

        try:
            device = await factory.async_create_device(DEVICE_DESC_URL)
        except Exception as e:
            return {"error": f"Failed to load UPnP device: {e}"}

        commands = []

        for service_name, service in device.services.items():
            for action in service.actions.values():
                
                # Skip actions that have any 'out' arguments
                if any(arg.direction == "out" for arg in action.arguments):
                    continue

                parameters = []
                for arg in action.arguments:
                    var = arg.related_state_variable
                    param_info = {
                        "name": arg.name,
                        "type": var.data_type,
                        "description": var.name,
                        "enum": list(var.allowed_values) if var.allowed_values else [],
                        "range": {},
                        "properties": []
                    }
                    parameters.append(param_info)

                command_info = {
                    "name": action.name,
                    "parameters": parameters
                }
                commands.append(command_info)

        device_commands = {
            "deviceID": device.udn if device else "",
            "commands": commands
        }

        return device_commands

        # result = {}

        # for service_name, service in device.services.items():
        #     service_actions = {}

        #     for action in service.actions.values():
        #         action_info = {"inputs": [], "outputs": []}

        #         for arg in action.arguments:
        #             direction = arg.direction
        #             var = arg.related_state_variable
        #             allowed_values = list(var.allowed_values) if var.allowed_values else None
                    
        #             # Handling allowed_value_range safely as a dictionary
        #             # allowed_range = getattr(var, 'allowed_value_range', None)
        #             # min_val = max_val = step_val = None

        #             # if allowed_range:
        #             #     min_val = allowed_range.get("min", None)
        #             #     max_val = allowed_range.get("max", None)
        #             #     step_val = allowed_range.get("step", None)


        #             arg_info = {
        #                 "name": arg.name,
        #                 "type": var.data_type,
        #                 "allowed_values": allowed_values,
        #                  # "min": min_val,
        #                 # "max": max_val,
        #                 # "step": step_val
        #             }

        #             if direction == "in":
        #                 action_info["inputs"].append(arg_info)
        #             elif direction == "out":
        #                 action_info["outputs"].append(arg_info)

        #         # Only keep actions with inputs and no outputs
        #         if action_info["inputs"] and not action_info["outputs"]:
        #             service_actions[action.name] = action_info

        #     if service_actions:
        #         result[service_name] = service_actions

        # return result


# async def get_upnp_device_commands():
#     async with aiohttp.ClientSession() as session:
#         requester = AiohttpSessionRequester(session, with_sleep=True)
#         factory = UpnpFactory(requester)

#         try:
#             device = await factory.async_create_device(DEVICE_DESC_URL)
#         except Exception as e:
#             return {"error": f"Failed to load UPnP device: {e}"}

#         commands = []

#         for service_name, service in device.services.items():
#             for action in service.actions.values():
#                 parameters = []

#                 for arg in action.arguments:
#                     var = arg.related_state_variable
#                     param_info = {
#                         "name": arg.name,
#                         "type": var.data_type,
#                         "description": var.name,
#                         "enum": list(var.allowed_values) if var.allowed_values else [],
#                         "range": {
#                             # "min": var.allowed_value_range.get("min", None) if var.allowed_value_range else None,
#                             # "max": var.allowed_value_range.get("max", None) if var.allowed_value_range else None,
#                             # "step": var.allowed_value_range.get("step", None) if var.allowed_value_range else None,
#                         },
#                         "properties": []  # UPnP actions typically don't have nested properties
#                     }
#                     parameters.append(param_info)

#                 command_info = {
#                     "name": action.name,
#                     "description": action.name,
#                     "parameters": parameters
#                 }
#                 commands.append(command_info)

#         device_commands = {
#             "deviceID": "",
#             "commands": commands
#         }

#         return device_commands


# Example usage
import asyncio

# async def main():
#     metadata = await get_upnp_actions_with_only_inputs()
#     for service, actions in metadata.items():
#         print(f"Service: {service}")
#         for action, info in actions.items():
#             print(f"  Action: {action}")
#             for i in info['inputs']:
#                 print(f"    Input: {i['name']} ({i['type']}) Allowed: {i['allowed_values']}")
#                 #   f"Min: {i['min']} Max: {i['max']}")

async def main():
    device_commands = await get_upnp_actions_with_only_inputs()
    print(json.dumps(device_commands, indent=4))  # Pretty print the JSON


asyncio.run(main())