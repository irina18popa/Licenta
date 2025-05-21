import { View, Text, Image, TouchableOpacity, Modal } from 'react-native';
import { useState, useRef } from 'react'; // useRef for persisting intervalRef
import { useNavigation } from '@react-navigation/native';
import images from '../constants/images';
import { handleRequest, fetchDiscoveredDevices, saveDevice } from './apis.js';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddDevice = () => {
  
  type Device = {
    name: string;
    macAddress: string;
    ipAddress: string;
    uuid: string;
    protocol: string;
    metadata: Record<string, unknown>;
  };

  const navigation = useNavigation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false); // State to show/hide the modal
  const [savedDeviceName, setSavedDeviceName] = useState<string>(''); // State to store the saved device name
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // useRef to persist the interval

  const startScan = async () => {
    try {
      await handleRequest('app/devices/discover', 'pub', 'search');
      console.log('Scan request sent');
      setScanning(true);

      intervalRef.current = setInterval(async () => {
        const foundDevices = await fetchDiscoveredDevices();
        setDevices(foundDevices);
      }, 5000);
    } catch (error) {
      console.log('Error:', error);
    }
  };

  const stopScan = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current); // Correctly clear the interval
      setScanning(false);
      console.log('Scan stopped');
    }
  };

  // Function to handle saving a device when clicked
  const handleSaveDevice = async (device: Device) => {
    try {
      const savedDevice = await saveDevice(device); // Save device through the API
      //console.log('Device saved:', device);
      setSavedDeviceName(device.name); // Set the name of the saved device
      setShowModal(true); // Show the modal with the success message
    } catch (error) {
      console.log('Error saving device:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <TouchableOpacity onPress={() => navigation.goBack()} className="mt-12 ml-4">
        <Text className="text-white">← Back</Text>
      </TouchableOpacity>

      <View className="flex-1 items-center justify-center">
        <TouchableOpacity
          onPress={() => {
            if (!scanning) {
              startScan();
            }
          }}
        >
          <View className="w-20 h-20 rounded-full border-2 border-blue-600 items-center justify-center">
            <View className="w-40 h-40 rounded-full border-2 border-blue-600 items-center justify-center">
              <View className="w-60 h-60 rounded-full border-2 border-blue-600 items-center justify-center">
                <Text className="text-blue-600 text-lg">{scanning ? 'Scanning...' : 'Scan'}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View className="bg-black/60 rounded-t-3xl p-4">
        {devices.length > 0 ? (
          devices.map((device, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSaveDevice(device)} // When device is clicked, save it
            >
              <View className="flex-row justify-between py-2 border-b border-gray-300">
                <Text className="text-white">{device.name}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-white text-center py-4">
            {scanning ? 'Scanning for devices...' : 'No devices found'}
          </Text>
        )}
      </View>

      {scanning && (
        <TouchableOpacity onPress={stopScan} className="bg-red-800 rounded-xl p-4 mt-4 items-center">
          <Text className="text-white font-bold">Stop scanning</Text>
        </TouchableOpacity>
      )}

      {/* Modal to show success message */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)} // To close modal when back pressed on Android
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white/85 p-6 rounded-lg shadow-lg">
            <Text className="text-center text-xl font-bold">Device Added</Text>
            <Text className="text-center mt-2 text-lg">
              Device {savedDeviceName} added to your home!
            </Text>
            <TouchableOpacity
              onPress={() => setShowModal(false)} // Close modal when button is pressed
              className="bg-blue-600 rounded-xl p-4 mt-4 items-center"
            >
              <Text className="text-white font-bold">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddDevice;
