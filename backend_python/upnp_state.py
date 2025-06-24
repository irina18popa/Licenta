import aiohttp
import json
import asyncio
import sys
from async_upnp_client.aiohttp import AiohttpSessionRequester
from async_upnp_client.client_factory import UpnpFactory

async def get_upnp_actions(device_url):
    """
    List all UPnP actions exposed by the device.
    Returns:
        dict: {"commands": [{"name": ..., "service": ..., "parameters": [...]}, ...]}
    """
    async with aiohttp.ClientSession() as session:
        requester = AiohttpSessionRequester(session, with_sleep=True)
        factory = UpnpFactory(requester)

        try:
            device = await factory.async_create_device(device_url)
        except Exception as e:
            return {"error": f"Failed to load UPnP device: {e}"}

        commands = []
        for service in device.services.values():
            for action in service.actions.values():
                parameters = []
                for arg in action.arguments:
                    var = arg.related_state_variable
                    parameters.append({
                        "name": arg.name,
                        "type": var.data_type,
                        "enum": list(var.allowed_values) if var.allowed_values else [],
                        "range": var._state_variable_info.type_info.allowed_value_range
                    })
                commands.append({
                    "name": action.name,
                    "service": service.service_type,
                    "parameters": parameters
                })

        return {"commands": commands}

async def get_upnp_device_state(device_url):
    """
    Extracts all available state by calling UPnP "getter" actions (actions with out args).
    Returns:
        dict: {"state": [{"code": ServiceType:Action, "value": ...}, ...]}
    """
    async with aiohttp.ClientSession() as session:
        requester = AiohttpSessionRequester(session, with_sleep=True)
        factory = UpnpFactory(requester)

        try:
            device = await factory.async_create_device(device_url)
        except Exception as e:
            return {"state": [], "error": f"Failed to load UPnP device: {e}"}

        entries = []
        for service in device.services.values():
            for action in service.actions.values():
                # identify getter actions with at least one out argument
                out_args = [arg.name for arg in action.arguments if arg.direction == 'out']
                if not out_args:
                    continue

                # prepare any in args with defaults
                kwargs = {}
                for arg in action.arguments:
                    if arg.direction == 'in':
                        var = arg.related_state_variable
                        if var.allowed_values:
                            kwargs[arg.name] = next(iter(var.allowed_values))
                        elif var._state_variable_info.type_info.allowed_value_range:
                            rng = var._state_variable_info.type_info.allowed_value_range
                            kwargs[arg.name] = int(rng.get('min', 0))
                        elif var.data_type.startswith(('i', 'u', 'r')):
                            kwargs[arg.name] = 0
                        else:
                            kwargs[arg.name] = ""

                try:
                    result = await service.async_call_action(action.name, **kwargs)
                except Exception as e:
                    result = {"error": str(e)}

                # flatten single-key results
                if isinstance(result, dict) and len(result) == 1:
                    value = next(iter(result.values()))
                else:
                    value = result

                code = f"{service.service_type}:{action.name}"
                entries.append({"code": code, "value": value})

        return {"state": entries}

async def main():
    """
    Usage:
      python script.py <device_description_url> [--actions]
    Default (no --actions): prints {{"state": [...]}} to stdout for MQTT payload.
    --actions: lists available commands
    """
    if len(sys.argv) < 2:
        print("Usage: python script.py <device_description_url> [--actions]")
        sys.exit(1)

    device_url = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else '--state'

    if mode == '--actions':
        result = await get_upnp_actions(device_url)
    else:
        result = await get_device_state(device_url)

    print(json.dumps(result, indent=4))

if __name__ == "__main__":
    asyncio.run(main())
