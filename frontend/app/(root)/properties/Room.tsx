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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import images from "../../../constants/images";
import {
  getDeviceById,
  getDeviceStateById,
  getUserDevices,
  getRoomById,
  handleRequest,
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

const DeviceListScreen = () => {
  const { roomId } = useLocalSearchParams();
  const [roomName, setRoomName] = useState("");
  const [devices, setDevices] = useState<DeviceWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      const rawList = await getUserDevices();
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

  const handleRemoveDevice = async (deviceId: string) => {
    Alert.alert("Remove Device", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            // await removeDeviceFromRoom(roomId, deviceId);
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
          <Ionicons name="close" size={22} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />

      <Text className="text-white text-center text-3xl font-bold mt-5 mb-2">
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
        />
      )}
    </SafeAreaView>
  );
};

export default DeviceListScreen;
