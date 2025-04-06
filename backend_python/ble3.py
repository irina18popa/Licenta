import asyncio
from bleak import BleakClient

address = "BA:09:AC:61:D5:11"
MODEL_NBR_UUID = "00001910-0000-1000-8000-00805f9b34fb"

async def main(address):
    async with BleakClient(address) as client:
        model_number = await client.read_gatt_char(MODEL_NBR_UUID)
        print("Model Number: {0}".format("".join(map(chr, model_number))))

asyncio.run(main(address))