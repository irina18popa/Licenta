import aiohttp
import json
import asyncio
from async_upnp_client.aiohttp import AiohttpSessionRequester
from async_upnp_client.client_factory import UpnpFactory

async def get_upnp_actions(device_url):
    async with aiohttp.ClientSession() as session:
        requester = AiohttpSessionRequester(session, with_sleep=True)
        factory = UpnpFactory(requester)

        try:
            device = await factory.async_create_device(device_url)
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
                        "range": var._state_variable_info.type_info.allowed_value_range,
                            # "min": var.min_value if var.min_value is not None else None,
                            # "max": var.max_value if var.max_value is not None else None,
                            # "step": var._state_variable_info.type_info.allowed_value_range,
                        "properties": []
                    }
                    parameters.append(param_info)

                command_info = {
                    "name": action.name,
                    "parameters": parameters
                }
                commands.append(command_info)


        ####### aici am eliminat deviceId
        device_commands = {
            "commands": commands
        }

        return device_commands

       

# async def main():
#     device_commands = await get_upnp_actions(DEVICE_DESC_URL)
#     print(json.dumps(device_commands, indent=4))  # Pretty print the JSON


# asyncio.run(main())