import asyncio
from bleak import BleakScanner, BleakClient

async def print_provisioning_services(address: str):
    async with BleakClient(address) as client:
        print(f"Connected to {address}")
        for service in client.services:
            print(f"Service: {service.uuid} - {service.description}")
            for char in service.characteristics:
                print(f"  Characteristic: {char.uuid} - {char.description}")

if __name__ == "__main__":
    # Replace with the device address (here it's TY)
    asyncio.run(print_provisioning_services("24:2F:D0:10:60:E0"))
