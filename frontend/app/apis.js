const API_URL = 'http://192.168.1.135:3000/api';
import axios from 'axios';


export async function getDevices() {
  const res = await fetch(`${API_URL}/devices`);
  if (!res.ok) throw new Error('Failed to fetch devices');
  return await res.json();
}

export async function saveDevice(deviceData) {
  const res = await fetch(`${API_URL}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deviceData),
  });
  if (!res.ok) throw new Error('Failed to save device');
  return await res.json();
}

export async function handleRequest(topic, type, payload) {
    const res = await fetch(`${API_URL}/mqtttopic/handle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, type, payload }),
    });
  
    if (!res.ok) throw new Error('Failed to send the search');
  
    return await res.json();
  }

  export const fetchDiscoveredDevices = async () => {
    try {
      const res = await axios.get(`${API_URL}/discovered`);
      console.log('Fetched devices:', res.data);
      return res.data;
    } catch (err) {
      console.log('Error fetching devices:', err.response?.data || err.message);
      return [];
    }
  };
  

  export default {
    getDevices,
    saveDevice,
    handleRequest,
    fetchDiscoveredDevices,
  };
  