import axios from 'axios';

const API_URL = 'http://192.168.1.134:3000/api';

export async function getDevices() {
  try {
    const res = await axios.get(`${API_URL}/devices`);
    return res.data;
  } catch (err) {
    console.error('Failed to fetch devices:', err.response?.data || err.message);
    throw new Error('Failed to fetch devices');
  }
}

export async function saveDevice(deviceData) {
  try {
    const res = await axios.post(`${API_URL}/devices`, deviceData);
    const savedDevice = res.data;
        console.log("\n" + savedDevice + "\n")


    // Call handleRequest with actual values
    if(savedDevice.protocol === "upnp")
    {
      await handleRequest("app/devices/commands/send", "pub", `${savedDevice.protocol}/${savedDevice.ipAddress}/${savedDevice._id}`);
    }
    else if(savedDevice.protocol === "ble")
    {
      await handleRequest("app/devices/commands/send", "pub", `${savedDevice.protocol}/${savedDevice.metadata}/${savedDevice._id}`);
    }

    return savedDevice;
  } catch (err) {
    console.error('Failed to save device:', err.response?.data || err.message);
    throw new Error('Failed to save device');
  }
}


export async function handleRequest(topic, type, payload) {
  try {
    const res = await axios.post(`${API_URL}/mqtttopic/handle`, {
      topic,
      type,
      payload,
    });
    return res.data;
  } catch (err) {
    console.error('Failed to send the request:', err.response?.data || err.message);
    throw new Error('Failed to send the request');
  }
}

export const fetchDiscoveredDevices = async () => {
  try {
    const res = await axios.get(`${API_URL}/discovered`);
    //console.log('Fetched devices:', res.data);
    return res.data;
  } catch (err) {
    console.error('Error fetching devices:', err.response?.data || err.message);
    return [];
  }
};


export const fetchTVDevices = async () => {
  try {
    const response = await axios.get(`${API_URL}/devices`);
    return response.data.filter(
      (device) => device.type === 'tv' && device.protocol === 'upnp'
    );
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
};

export const fetchTVDeviceCommands = async (deviceId) => {
  try {
    const response = await axios.get(`${API_URL}/devicecommands?deviceId=${deviceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching device commands:', error);
    return [];
  }
};



export default {
  getDevices,
  saveDevice,
  handleRequest,
  fetchDiscoveredDevices,
  fetchTVDevices,
  fetchTVDeviceCommands
};
