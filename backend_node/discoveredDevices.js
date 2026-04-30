// discoveredDevices.js
const discoveredDevices = new Map();

export const saveDiscoveredDevice = (device) => {
  discoveredDevices.set(device.macAddress, device);
};

export const getDiscoveredDevices = () => {
  return Array.from(discoveredDevices.values());
};

export const clearDiscoveredDevices = () => {
  discoveredDevices.clear();
};
