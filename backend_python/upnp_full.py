# # upnp_devices.py
# import asyncio
# import aiohttp
# import xml.etree.ElementTree as ET
# from async_upnp_client.search import async_search
# from async_upnp_client.aiohttp import AiohttpSessionRequester
# from async_upnp_client.client_factory import UpnpFactory
# from getmac import get_mac_address
# from extract_hostIP import get_host_ip

# # --- Device registry: uuid -> { "location": ..., "db_id": ... }
# UPNP_DEVICES = {}

# # --- Helper: get friendly name
# async def get_friendly_name(location_url):
#     try:
#         async with aiohttp.ClientSession() as session:
#             async with session.get(location_url, timeout=5) as resp:
#                 xml_content = await resp.read()
#         root = ET.fromstring(xml_content)
#         device_elem = root.find(".//{*}device")
#         if device_elem is not None:
#             fn = device_elem.find(".//{*}friendlyName")
#             return fn.text if fn is not None else None
#     except Exception:
#         pass
#     return None

# # --- Helper: get MAC by IP
# def get_mac(ip_address: str) -> str:
#     mac = get_mac_address(ip=ip_address)
#     return mac.upper() if mac else ""

# # --- SSDP scan, updating UPNP_DEVICES
# async def scan_and_update_upnp_devices():
#     local_ip = get_host_ip()
#     results = []

#     async def ssdp_callback(response):
#         location = response.get("location")
#         st_field = response.get("st")
#         remote_addr = response.get("_remote_addr", (None, None))
#         ip_address = remote_addr[0] if remote_addr else None
#         if st_field and st_field.startswith("uuid:"):
#             uuid = st_field.replace("uuid:", "")
#             friendly_name = await get_friendly_name(location) if location else None
#             results.append({
#                 "uuid": uuid,
#                 "location": location,
#                 "friendly_name": friendly_name or "Unknown",
#                 "MAC": get_mac(ip_address) if ip_address else "",
#                 "IP": ip_address,
#             })
#             # Register/update in device registry
#             if uuid not in UPNP_DEVICES or UPNP_DEVICES[uuid]["location"] != location:
#                 UPNP_DEVICES[uuid] = {"location": location}

#     await async_search(ssdp_callback, timeout=3, search_target="ssdp:all", source=(local_ip, 0))
#     return results

# # --- Check existence by UUID (does NOT rescan SSDP each time!)
# def upnp_device_exists(uuid):
#     return uuid in UPNP_DEVICES

# # --- Get the most recent location for a UUID
# def get_upnp_device_location(uuid):
#     return UPNP_DEVICES[uuid]["location"] if uuid in UPNP_DEVICES else None

# # --- Run this in background to keep registry fresh
# async def upnp_periodic_scan_task():
#     while True:
#         await scan_and_update_upnp_devices()
#         await asyncio.sleep(60)  # scan every minute

# # --- Run this once at startup, then regularly with upnp_periodic_scan_task()
# async def upnp_initial_scan():
#     await scan_and_update_upnp_devices()

# # --- Get full device state by location (URL)
# async def get_upnp_device_state(location_url):
#     async with aiohttp.ClientSession() as session:
#         requester = AiohttpSessionRequester(session, with_sleep=True)
#         factory = UpnpFactory(requester)
#         try:
#             device = await factory.async_create_device(location_url)
#         except Exception as e:
#             return {"state": [], "error": f"Failed to load UPnP device: {e}"}
#         entries = []
#         for service in device.services.values():
#             for action in service.actions.values():
#                 out_args = [arg.name for arg in action.arguments if arg.direction == 'out']
#                 if not out_args:
#                     continue
#                 kwargs = {}
#                 for arg in action.arguments:
#                     if arg.direction == 'in':
#                         var = arg.related_state_variable
#                         if var.allowed_values:
#                             kwargs[arg.name] = next(iter(var.allowed_values))
#                         elif var._state_variable_info.type_info.allowed_value_range:
#                             rng = var._state_variable_info.type_info.allowed_value_range
#                             kwargs[arg.name] = int(rng.get('min', 0))
#                         elif var.data_type.startswith(('i', 'u', 'r')):
#                             kwargs[arg.name] = 0
#                         else:
#                             kwargs[arg.name] = ""
#                 try:
#                     result = await service.async_call_action(action.name, **kwargs)
#                 except Exception as e:
#                     result = {"error": str(e)}
#                 if isinstance(result, dict) and len(result) == 1:
#                     value = next(iter(result.values()))
#                 else:
#                     value = result
#                 code = f"{service.service_type}:{action.name}"
#                 entries.append({"code": code, "value": value})
#         return {"state": entries}

# # --- Run UPnP commands
# async def upnp_do_commands(location_url, commands):
#     async with aiohttp.ClientSession() as session:
#         requester = AiohttpSessionRequester(session, with_sleep=True)
#         factory = UpnpFactory(requester)
#         try:
#             device = await factory.async_create_device(location_url)
#         except Exception as e:
#             print(f"[UPnP] Failed to load device: {e}")
#             return
#         for cmd in commands:
#             name = cmd.get("name", "")
#             params = cmd.get("parameters", {})
#             try:
#                 service_type, action_name = name.rsplit(":", 1)
#             except ValueError:
#                 continue
#             service = device.service(service_type)
#             if not service:
#                 continue
#             try:
#                 await service.async_call_action(action_name, **params)
#             except Exception:
#                 pass
#         return await get_upnp_device_state(location_url)

# # --- Get upnp actions (for command UI)
# async def get_upnp_actions(location_url):
#     async with aiohttp.ClientSession() as session:
#         requester = AiohttpSessionRequester(session, with_sleep=True)
#         factory = UpnpFactory(requester)
#         try:
#             device = await factory.async_create_device(location_url)
#         except Exception as e:
#             return {"error": f"Failed to load UPnP device: {e}"}
#         commands = []
#         for service in device.services.values():
#             for action in service.actions.values():
#                 if any(arg.direction == "out" for arg in action.arguments):
#                     continue
#                 parameters = []
#                 for arg in action.arguments:
#                     var = arg.related_state_variable
#                     param_info = {
#                         "name": arg.name,
#                         "type": var.data_type,
#                         "enum": list(var.allowed_values) if var.allowed_values else [],
#                         "range": var._state_variable_info.type_info.allowed_value_range,
#                         "properties": []
#                     }
#                     parameters.append(param_info)
#                 command_info = {
#                     "name": f"{service.service_type}:{action.name}",
#                     "parameters": parameters
#                 }
#                 commands.append(command_info)
#         return {"commands": commands}


import asyncio
import aiohttp
import xml.etree.ElementTree as ET
from getmac import get_mac_address
from async_upnp_client.search import async_search
from extract_hostIP import get_host_ip

async def get_friendly_name(location_url):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(location_url, timeout=5) as resp:
                resp.raise_for_status()
                xml_content = await resp.read()
    except Exception as e:
        print(f"Error fetching {location_url}: {e}")
        return None

    try:
        root = ET.fromstring(xml_content)
        device_elem = root.find(".//{*}device")
        if device_elem is not None:
            friendly_name = device_elem.find(".//{*}friendlyName")
            return friendly_name.text if friendly_name is not None else None
    except ET.ParseError as e:
        print(f"XML parse error: {e}")

    return None

def get_mac(ip_address: str) -> str:
    mac = get_mac_address(ip=ip_address)
    if not mac:
        print(f"Could not determine MAC address for {ip_address}")
    return mac

async def scan_ssdp():
    """
    Returns a dict: {uuid: {"uuid":..., "location":..., "ip":..., "deviceName":..., ...}, ...}
    """
    found_devices = {}

    async def ssdp_callback(response):
        location_url = response.get("location")
        st_field = response.get("st")
        remote_addr = response.get("_remote_addr", (None, None))
        ip_address = remote_addr[0] if remote_addr else "Unknown"

        if st_field and st_field.startswith("uuid:"):
            uuid = st_field.replace("uuid:", "")
            friendly_name = None
            if location_url:
                friendly_name = await get_friendly_name(location_url)
            found_devices[uuid] = {
                "uuid": uuid,
                "location": location_url,
                "type": "media",
                "IP": ip_address,
                "deviceName": friendly_name or "Unknown",
                "MAC": (get_mac(ip_address) or "").upper(),
                "protocol": "upnp",
                "metadata": location_url
            }

    try:
        local_ip = get_host_ip()
        await async_search(
            async_callback=ssdp_callback,
            timeout=3,
            search_target="ssdp:all",
            source=(local_ip, 0)
        )
    except Exception as e:
        print("Error during SSDP scan:", e)

    return found_devices


async def get_upnp_location_for_uuid(target_uuid):
    """
    Returns (location_url, ip_address) or (None, None) if not found.
    """
    target_uuid = target_uuid.lower()
    found_devices = await scan_ssdp()
    for uuid, dev in found_devices.items():
        if uuid.lower() == target_uuid:
            return dev["location"], dev["IP"]
    return None, None
