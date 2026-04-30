import aiohttp
import json
import asyncio
import sys
from async_upnp_client.aiohttp import AiohttpSessionRequester
from async_upnp_client.client_factory import UpnpFactory

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


async def upnp_do_commands(device_url:str, commands:list):
    async with aiohttp.ClientSession() as session:
        requester = AiohttpSessionRequester(session, with_sleep=True)
        factory   = UpnpFactory(requester)

        # load the device
        try:
            device = await factory.async_create_device(device_url)
        except Exception as e:
            print(f"[UPnP] Failed to load device: {e}")
            return

        for cmd in commands:
            name   = cmd.get("name", "")
            params = cmd.get("parameters", {})

            # parse service_type and action
            try:
                service_type, action_name = name.rsplit(":", 1)
            except ValueError:
                print(f"[UPnP] Invalid command name: {name}")
                continue

            service = device.service(service_type)
            if not service:
                print(f"[UPnP] Service not found: {service_type}")
                continue

            try:
                result = await service.async_call_action(action_name, **params)
                # you can choose to print or ignore the result:
                print(f"[UPnP] {action_name} succeeded → {result}")
            except Exception as e:
                print(f"[UPnP] {action_name} error → {e}")
        
        ret = await get_upnp_device_state(device_url)
        #print(json.dumps(ret, indent=4))
        return ret


# import asyncio

# DEVICE_XML = "http://192.168.1.134:2870/dmr.xml"
# media_url = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
# COMMANDS = [
#     {
#         "name": "urn:schemas-upnp-org:service:RenderingControl:1:SetVolume",
#         "parameters": {
#             "InstanceID": 0,
#             "Channel": "Master",
#             "DesiredVolume": 5
#         }
#     },
#     {
#         "name": "urn:schemas-upnp-org:service:RenderingControl:1:SetMute",
#         "parameters": {
#             "InstanceID": 0,
#             "Channel": "Master",
#             "DesiredMute": False
#         }
#     },
#     # {
#     #     "name": "urn:schemas-upnp-org:service:AVTransport:1:SetAVTransportURI",
#     #     "parameters": {
#     #         "InstanceID": 0,
#     #         "CurrentURI": media_url,
#     #         "CurrentURIMetaData": ""
#     #     }
#     # },
#     {
#         "name": "urn:schemas-upnp-org:service:AVTransport:1:Play",
#         "parameters": {
#             "InstanceID": 0,
#             "Speed": "1"
#         }
#     },
# #    {
# #         "name": "urn:schemas-upnp-org:service:AVTransport:1:Stop",
# #         "parameters": {
# #             "InstanceID": 0
# #         }
# #     } 
# ]

# async def main():
#     # No return; commands execute and print their own status
#     await upnp_do_commands(DEVICE_XML, COMMANDS)

# if __name__ == "__main__":
#     asyncio.run(main())
