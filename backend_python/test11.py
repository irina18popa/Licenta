import aiohttp
from async_upnp_client.aiohttp import AiohttpSessionRequester
from async_upnp_client.client_factory import UpnpFactory

DEVICE_DESC_URL = "http://192.168.1.131:2870/dmr.xml"

async def get_upnp_actions():
    async with aiohttp.ClientSession() as session:
        requester = AiohttpSessionRequester(session, with_sleep=True)
        factory = UpnpFactory(requester)

        try:
            device = await factory.async_create_device(DEVICE_DESC_URL)
        except Exception as e:
            return {"error": f"Failed to load UPnP device: {e}"}

        actions = {}
        for service_name, service in device.services.items():
            actions[service_name] = list(service.actions.keys())

        return actions

# Example usage
async def main():
    actions = await get_upnp_actions()
    for service, action_list in actions.items():
        print(f"Service: {service}")
        for action in action_list:
            print(f"  - {action}")

import asyncio
asyncio.run(main())
