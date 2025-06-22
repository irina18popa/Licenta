import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.135:3000/api';

// export async function getDevices() {
//   try {
//     const res = await axios.get(`${API_URL}/devices`);
//     return res.data;
//   } catch (err) {
//     console.error('Failed to fetch devices:', err.response?.data || err.message);
//     throw new Error('Failed to fetch devices');
//   }
// }

// Helper to get the logged-in user from SecureStore
export async function getLoggedInUser() {
  const user = await SecureStore.getItemAsync('user');
  return user ? JSON.parse(user) : null;
}

// Fetch all devices for the current user
export async function getUserDevices() {
  try {
    // 1. Get the current user (from SecureStore or your backend)
    const currentUser = await getLoggedInUser();
    if (!currentUser?._id || !Array.isArray(currentUser.devices) || currentUser.devices.length === 0) {
      return []; // No devices
    }

    // 2. Fetch each device by ID (parallel requests)
    const devicePromises = currentUser.devices.map(deviceId =>
      axios.get(`${API_URL}/devices/${deviceId}`).then(res => res.data)
    );

    const devices = await Promise.all(devicePromises); // Array of RawDevice
    return devices;
  } catch (err) {
    console.error('Failed to fetch user devices:', err.response?.data || err.message);
    throw new Error('Failed to fetch user devices');
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

export async function getDeviceStateById(id) {
  try {
    const res = await axios.get(`${API_URL}/devicestate/${id}`);
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

    const user = await SecureStore.getItemAsync('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      const res = await axios.put(`${API_URL}/users/${parsedUser._id}`, {'deviceId': savedDevice._id})
      // Update SecureStore with the new user data from the response:
      await SecureStore.setItemAsync('user', JSON.stringify(res.data));
    }

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


// export const fetchTVDevices = async () => {
//   try {
//     const response = await axios.get(`${API_URL}/devices`);
//     return response.data.filter(
//       (device) => device.type === 'tv' && device.protocol === 'upnp'
//     );
//   } catch (error) {
//     console.error('Error fetching devices:', error);
//     return [];
//   }
// };

// export const fetchTVDeviceCommands = async (deviceId) => {
//   try {
//     const response = await axios.get(`${API_URL}/devicecommands?deviceId=${deviceId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching device commands:', error);
//     return [];
//   }
// };

export async function removeDeviceFromUser(userId, deviceId) {
  try {
    const res = await axios.put(`${API_URL}/users/${userId}/removedevice`, { deviceId });
    // Optionally update SecureStore with new user data:
    await SecureStore.setItemAsync('user', JSON.stringify(res.data));
    return res.data;
  } catch (err) {
    console.error('Failed to remove device:', err.response?.data || err.message);
    throw new Error('Failed to remove device from user');
  }
}


export const deleteDevice = async (deviceId) => {
  try {
    const endpoints = [
      axios.delete(`${API_URL}/devices/${deviceId}`),                    // Main device
      axios.delete(`${API_URL}/devicecommands/${deviceId}`),            // Command config
      axios.delete(`${API_URL}/devicestate/${deviceId}`),             // Status config
      axios.delete(`${API_URL}/mqtttopic/device/${deviceId}`),               // MQTT topics
    ];

    const results = await Promise.allSettled(endpoints);

    results.forEach((res, idx) => {
      if (res.status === "rejected") {
        console.warn(`Delete request ${idx + 1} failed:`, res.reason?.message);
      }
    });

    const currentUser = await getLoggedInUser();
    if (!currentUser?._id || !Array.isArray(currentUser.devices) || currentUser.devices.length === 0) {
      return []; // No devices
    }
    await removeDeviceFromUser(currentUser._id, deviceId);

    console.log("All delete attempts processed.");
  } catch (error) {
    console.error("Unexpected error during deleteDevice:", error.message);
  }
};


export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users`, userData);
    console.log('User created:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Server error:', error.response.data.message);
      throw error
    } else {
      console.error('Request error:', error.message);
      throw error
    }
  }
};


export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/users/login`, { email, password });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Server error:', error.response.data.message);
    } else {
      console.error('Request error:', error.message);
    }
  }
};


export const loadNewProfilePic = async (deviceId, profile_pic) => {
  try {
    const response = await axios.put(`${API_URL}/users/${deviceId}`, { profile_image:profile_pic });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Server error:', error.response.data.message);
    } else {
      console.error('Request error:', error.message);
    }
  }
}

export default {
  saveDevice,
  handleRequest,
  fetchDiscoveredDevices,
  getDeviceById,
  getDeviceStateById,
  //fetchTVDevices,
  //fetchTVDeviceCommands, 
  deleteDevice,
  createUser,
  loadNewProfilePic, 
  getLoggedInUser,
  getUserDevices
};
