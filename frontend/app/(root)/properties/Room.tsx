import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  ActivityIndicator,
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import images from "../../../constants/images";
import {
  getDeviceById,
  getDeviceStateById,
  getRoomById,
  handleRequest,
  removeDeviceFromRoom,
  getDevicesFromRoom,
  getUserDevices,
  addDeviceToRoom
} from "@/app/apis";

interface RawDevice {
  _id: string;
  name: string;
  type: string;
  status: string;
  manufacturer: string;
}

interface DeviceWithState extends RawDevice {
  isOn: boolean;
  stateId?: string | null;
}

const Room = () => {
  const { roomId } = useLocalSearchParams();
  const [roomName, setRoomName] = useState("");
  const [devices, setDevices] = useState<DeviceWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<RawDevice[]>([]);


  useEffect(() => {
    if (roomId && typeof roomId === "string") {
      getRoomById(roomId)
        .then((room) => {
          setRoomName(room.name || "Room");
        })
        .catch(() => setRoomName("Room"));
    }
  }, [roomId]);

  const fetchDevices = async () => {
    try {
      const rawList = await getDevicesFromRoom(roomId);
      const devicesWithState = await Promise.all(
        rawList.map(async (device) => {
          try {
            const stateDataRaw = await getDeviceStateById(device._id);
            const stateArr = Array.isArray(stateDataRaw)
              ? stateDataRaw
              : Array.isArray(stateDataRaw.data)
              ? stateDataRaw.data
              : [];
            const switchLedObj = stateArr.find((s) => s.code === "switch_led");
            return {
              ...device,
              isOn: switchLedObj ? switchLedObj.value : false,
              stateId: switchLedObj ? switchLedObj._id : null,
            };
          } catch {
            return { ...device, isOn: false };
          }
        })
      );
      setDevices(devicesWithState);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleToggleSwitch = async (deviceId: string, on: boolean) => {
    try {
      const res = await getDeviceById(deviceId);
      const topic = `app/devices/${deviceId}/do_command/in`;
      const payload = {
        protocol: "tuya",
        address: res?.metadata || "",
        commands: [{ code: "switch_led", value: on }],
      };
      await handleRequest(topic, "publish", JSON.stringify(payload));

      setDevices((prev) =>
        prev.map((d) => (d._id === deviceId ? { ...d, isOn: on } : d))
      );
    } catch (err) {
      Alert.alert("Error", "Failed to toggle device");
    }
  };

  const openAddDeviceModal = async () => {
    setShowAddModal(true);
    try {
      const userDevices = await getUserDevices();
      const alreadyInRoomIds = devices.map(d => d._id);
      const filtered = userDevices.filter(dev => !alreadyInRoomIds.includes(dev._id));
      setAvailableDevices(filtered);
    } catch (err) {
      setAvailableDevices([]);
      Alert.alert('Error', 'Failed to fetch available devices');
    }
  };


  const handleAddDevice = async (deviceId: string) => {
    try {
      await addDeviceToRoom(roomId, deviceId);
      setShowAddModal(false);
      fetchDevices(); // Refresh room devices
    } catch (err) {
      Alert.alert("Error", "Failed to add device to room.");
    }
  };


  const handleRemoveDevice = async (deviceId: string) => {
    Alert.alert("Remove Device", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeDeviceFromRoom(roomId, deviceId);
            setDevices((prev) => prev.filter((d) => d._id !== deviceId));
          } catch (err) {
            Alert.alert("Error", "Failed to remove device from room.");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: DeviceWithState }) => {
    const isOnline = item.status === "online";
    const iconName: React.ComponentProps<typeof Ionicons>["name"] =
      item.type === "tv"
        ? "tv-outline"
        : item.type === "lamp"
        ? "bulb-outline"
        : "apps-outline";

    const isTuya = item.manufacturer === "TUYA";

    return (
      <View className="flex-row justify-between items-center bg-black bg-opacity-50 mx-5 my-2 rounded-xl p-4">
        <View className="flex-row items-center flex-1">
          <Ionicons name={iconName} size={24} color="white" />
          <View className="ml-3">
            <Text className="text-white text-lg font-bold">{item.name}</Text>
            <View className="flex-row items-center">
              <View
                className={`w-2 h-2 rounded-full mr-1 ${
                  isOnline ? "bg-green-400" : "bg-red-600"
                }`}
              />
              <Text className="text-white">{isOnline ? "Online" : "Offline"}</Text>
            </View>
          </View>
        </View>

        {isTuya && (
          <Switch
            value={item.isOn}
            onValueChange={(val) => handleToggleSwitch(item._id, val)}
            trackColor={{ true: "#34D399", false: "#9CA3AF" }}
            thumbColor={item.isOn ? "#10B981" : "#F3F4F8"}
            disabled={!isOnline}
          />
        )}

        <TouchableOpacity onPress={() => handleRemoveDevice(item._id)} className="ml-4">
          <Ionicons name="trash" size={22} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />

      <Text className="text-white text-center text-3xl font-bold mt-5 mb-16">
        {roomName}
      </Text>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-2">Loading devices…</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 20 }}
          ListFooterComponent={() => (
          <TouchableOpacity
            onPress={openAddDeviceModal}
            className="mx-5 mt-2 mb-6 bg-blue-700 rounded-xl items-center py-3"
          >
            <Text className="text-white font-bold text-base">+ Add Device</Text>
          </TouchableOpacity>
        )}
        />
      )}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        {/* Dimmed background & center content */}
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-[#222] rounded-2xl px-6 py-6 min-w-[260px] max-w-[340px] w-11/12 items-center shadow-lg">
            <Text className="text-white text-lg font-bold mb-5 text-center">
              Select device to add
            </Text>
            {availableDevices.length === 0 ? (
              <Text className="text-white mb-3">No available devices</Text>
            ) : (
              availableDevices.map((dev) => (
                <TouchableOpacity
                  key={dev._id}
                  className="py-3 w-full border-b border-gray-700"
                  onPress={() => handleAddDevice(dev._id)}
                >
                  <Text className="text-white text-base">{dev.name}</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              className="mt-4 px-5 py-2 rounded-xl bg-gray-700 self-center"
              onPress={() => setShowAddModal(false)}
            >
              <Text className="text-blue-200 font-bold text-base">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Room;
