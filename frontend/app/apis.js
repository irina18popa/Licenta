import axios from 'axios';

const API_URL = 'http://192.168.1.135:3000/api';

export async function getDevices() {
  try {
    const res = await axios.get(`${API_URL}/devices`);
    return res.data;
  } catch (err) {
    console.error('Failed to fetch devices:', err.response?.data || err.message);
    throw new Error('Failed to fetch devices');
  }
}

export async function getDeviceById(id) {
  try {
    const res = await axios.get(`${API_URL}/devices/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Failed to fetch device ${id}:`, err.response?.data || err.message);
    throw new Error('Failed to fetch device');
  }
}

export async function updateDeviceById(id, updateData) {
  try {
    const res = await axios.put(`${API_URL}/devices/${id}`, updateData);
    return res.data;
  } catch (err) {
    console.error(`Failed to update device ${id}:`, err.response?.data || err.message);
    throw new Error('Failed to update device');
  }
}

export async function saveMqttTopic(savedDevice) {
  try {
    const { _id, protocol, metadata, manufacturer, uuid, status } = savedDevice;
    const baseUrl = `${API_URL}/mqtttopic`;

    let param1 = "", param2 = "", param3 = "";

    // Device-specific status topic
    if (protocol === "upnp") {
      param1 = protocol;
      param2 = metadata;
      param3 = uuid;

      await axios.post(baseUrl, {
        basetopic: `app/devices/${_id}/status/in`,
        payload: `${param1}/${param3}/${status}`,
        type: "publish",
        qos: 1,
      });

    } else if (manufacturer === "TUYA") {
      param1 = manufacturer;
      param2 = metadata;

      await axios.post(baseUrl, {
        basetopic: `app/devices/${_id}/status/in`,
        payload: `${param1}/${param2}/${status}`,
        type: "publish",
        qos: 1,
      });
    }

    // Common topics

    await axios.post(baseUrl, {
        basetopic: `app/devices/${_id}/status/out`,
        type: "subscribe",
        qos: 1,
    });

    await axios.post(baseUrl, {
      basetopic: `app/devices/${_id}/commands/in`,
      payload: `${param1}/${param2}`,
      type: "publish",
      qos: 1,
    });

     await axios.post(baseUrl, {
      basetopic: `app/devices/${_id}/commands/out`,
      type: "subscribe",
      qos: 1,
    });

    await axios.post(baseUrl, {
      basetopic: `app/devices/${_id}/state/in`,
      payload: `${param1}/${param2}`,
      type: "publish",
      qos: 1,
    });

     await axios.post(baseUrl, {
      basetopic: `app/devices/${_id}/state/out`,
      type: "subscribe",
      qos: 1,
    });

    await axios.post(baseUrl, {
      basetopic: `app/devices/${_id}/do_command/in`,
      type: "publish",
      qos: 1,
    });

    await axios.post(baseUrl, {
      basetopic: `app/devices/${_id}/do_command/out`,
      type: "subscribe",
      qos: 1,
    });

  } catch (err) {
    console.error("Failed to save MQTT topics:", err.response?.data || err.message);
  }
}

export async function saveDevice(deviceData) {
  try {
    const res = await axios.post(`${API_URL}/devices`, deviceData);
    const savedDevice = res.data;

    await saveMqttTopic(savedDevice)
    // Call handleRequest with actual values

    const res2 = await axios.get(`${API_URL}/mqtttopic/device/${savedDevice._id}/commands/in`)
    const topic1 = res2.data
    await handleRequest(`${topic1.basetopic}/${topic1.deviceId}/${topic1.action}/${topic1.direction}`, `${topic1.type}`, `${topic1.payload}`)

    const res3 = await axios.get(`${API_URL}/mqtttopic/device/${savedDevice._id}/state/in`)
    const topic2 = res3.data
    await handleRequest(`${topic2.basetopic}/${topic2.deviceId}/${topic2.action}/${topic2.direction}`, `${topic2.type}`, `${topic2.payload}`)


    // if(savedDevice.protocol === "upnp")
    // {
    //   await handleRequest("app/commands/in", "pub", `${savedDevice.protocol}/${savedDevice.metadata}/${savedDevice._id}`);
    //   await handleRequest("app/devices/state/in", "pub", `${savedDevice.protocol}/${savedDevice.metadata}`)
    // }
    // else if(savedDevice.manufacturer === "TUYA")
    // {
    //   await handleRequest("app/commands/in", "pub", `${savedDevice.manufacturer}/${savedDevice.metadata}/${savedDevice._id}`);
    //   await handleRequest("app/devices/state/in", "pub", `${savedDevice.manufacturer}/${savedDevice.metadata}`)
    // }

    return savedDevice;
  } catch (err) {
    console.error('Failed to save device:', err.response?.data || err.message);
    throw new Error('Failed to save device');
  }
}


export async function handleRequest(topic, type, payload) {
  try {
    console.log(`published to ${topic} payload: ${payload}`)

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
