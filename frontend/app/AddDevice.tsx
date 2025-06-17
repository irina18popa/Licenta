import { View, Text, Image, TouchableOpacity, Modal } from 'react-native';
import { useState, useRef, useEffect } from 'react'; // useRef for persisting intervalRef
import { useNavigation } from '@react-navigation/native';
import images from '../constants/images';
import { handleRequest, fetchDiscoveredDevices, saveDevice } from './apis.js';
import { SafeAreaView } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = "http://192.168.1.135:3000"; // ← Node’s LAN IP + port
const DISCOVER_EVENT = "deviceDiscovered";

const AddDevice = () => {
  
  type Device = {
    name: string;
    macAddress: string;
    ipAddress: string;
    uuid: string;
    protocol: string;
    metadata: Record<string, unknown>;
  };

  const socketRef = useRef<Socket | null>(null);
  const navigation = useNavigation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false); // State to show/hide the modal
  const [savedDeviceName, setSavedDeviceName] = useState<string>(''); // State to store the saved device name

  useEffect(() => {
    // 1) Open one socket connection on mount
    const sock = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socketRef.current = sock;

    sock.on("connect", () => {
      console.log("React Native: Socket connected →", sock.id);
    });

    // 2) When server emits a discovered device, add it to our local list
    sock.on(DISCOVER_EVENT, (device) => {
      //console.log("React Native: Received deviceDiscovered →", device);
      setDevices((prev) => {
        // Avoid duplicates by uuid
        if (prev.some((d) => d.uuid === device.uuid)) return prev;
        return [...prev, device];
      });
    });

    // 3) Clean up on unmount
    return () => {
      sock.disconnect();
    };
  }, []);

  const startScan = () => {
    if (!socketRef.current || socketRef.current.disconnected) {
      console.warn("Socket not connected yet!");
      return;
    }

    // 4) Emit “startScan” instead of HTTP POST
    socketRef.current.emit("startScan");
    console.log("React Native: Emitted ‘startScan’ → server");
    setScanning(true);
  };


  const stopScan = () => {
      //clearInterval(intervalRef.current); // Correctly clear the interval
      setScanning(false);
      console.log('Scan stopped');
  };

  // Function to handle saving a device when clicked
  const handleSaveDevice = async (device: Device) => {
    try {
      const savedDevice = await saveDevice(device); // Save device through the API
      //comanda noua
      setDevices((prev) => prev.filter((d) => d.uuid !== device.uuid)); // ✅ remove from list
      
      setSavedDeviceName(device.name); // Set the name of the saved device
      setShowModal(true); // Show the modal with the success message
    } catch (error) {
      console.log('Error saving device:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <TouchableOpacity onPress={() => navigation.goBack()} className="mt-12 ml-4">
        <Text className="text-white">← Back</Text>
      </TouchableOpacity>

      <View className="flex-1 items-center justify-center">
        <TouchableOpacity
          onPress={startScan}
          disabled={scanning}
        >
          <View className="w-24 h-24 rounded-full border-4 border-blue-700 bg-blue-700 items-center justify-center">
            <View className="w-40 h-40 rounded-full border-4 border-blue-700 items-center justify-center">
              <View className="w-60 h-60 rounded-full border-4 border-blue-700 items-center justify-center">
                <Text className="text-white text-lg">{scanning ? 'Scanning...' : 'Scan'}</Text>
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
