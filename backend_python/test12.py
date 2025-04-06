import aiohttp
import json
import asyncio
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
                        # "description": var.name,
                        "enum": list(var.allowed_values) if var.allowed_values else [],
                        "range": {
                            "min":"",
                            "max":"",
                            "step":"",

                            # "min": var.allowed_value_range.get("min", None) if var.allowed_value_range else None,
                            # "max": var.allowed_value_range.get("max", None) if var.allowed_value_range else None,
                            # "step": var.allowed_value_range.get("step", None) if var.allowed_value_range else None,
                        },
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

       

async def main():
    device_commands = await get_upnp_actions_with_only_inputs()
    print(json.dumps(device_commands, indent=4))  # Pretty print the JSON


asyncio.run(main())