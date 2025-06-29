import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  FlatList,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { io, Socket } from "socket.io-client";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { deleteDevice, getUserDevices, getLoggedInUser, getDeviceStateById, handleRequest, getDeviceById } from "@/app/apis"; // your existing API helper
import images from "../../../constants/images";
import SwipeableRow from "@/components/SwipeableRow";
import { Swipeable } from "react-native-gesture-handler";
import * as SecureStore from 'expo-secure-store';



interface RawDevice {
  _id: string;
  name: string;
  type: "tv" | "lamp" | string;
  status: "online" | "offline";
  manufacturer: string
  // …other fields…
}

interface DeviceWithState extends RawDevice {
  isOn: boolean;
  stateId?: string | null;
}


interface Weather {
  main: { temp: number; feels_like: number; humidity: number };
  weather: Array<{ description: string; icon: string }>;
  wind: { speed: number };
}

interface Room {
  id: string;
  name: string;
  image: any;
}

const rooms: Room[] = [
  { id: "1", name: "Living room", image: images.livingroom },
  { id: "2", name: "Bedroom 1", image: images.bedroom },
  // …etc.
];

const SOCKET_SERVER_URL = 'http://192.168.1.135:3000';


const HomeScreen = () => {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedTab, setSelectedTab] = useState<"Rooms" | "Devices">("Rooms");
  const [devices, setDevices] = useState<DeviceWithState[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<Swipeable | null>(null);
  const [userName, setUserName] = useState(''); // State to store user's name
  const [profileImage, setProfileImage] = useState('');

  const router = useRouter();

  // Fetch user info from SecureStore
  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = await SecureStore.getItemAsync('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        setUserName(parsedUser.first_name + ' ' + parsedUser.last_name);  // Assuming first_name and last_name are in the response
        setProfileImage(parsedUser.profile_image || ''); // Fallback to default image if no profile_image
      }
    };

    fetchUserInfo();
  }, []);
  

  // const TwoButtonAlert = () => {
  //   Alert.alert("Add device", "Choose a device type:", [
  //     { text: "Scan", onPress: () => router.navigate("/AddDevice") },
  //     { text: "Cancel", onPress: () => console.log("Cancel"), style: "cancel" },
  //   ]);
  // };

  const socketRef = useRef<Socket | null>(null);


  const fetchDevices = async () => {
  try {
    const rawList = await getUserDevices(); // [{_id, ...}, ...]
    const devicesWithState = await Promise.all(
      rawList.map(async (device) => {
        try {
          // Device state may be object with .data (array), or just array
          const stateDataRaw = await getDeviceStateById(device._id);
          const stateArr = Array.isArray(stateDataRaw)
            ? stateDataRaw
            : Array.isArray(stateDataRaw.data)
              ? stateDataRaw.data
              : [];
          const switchLedObj = stateArr.find(s => s.code === "switch_led");
          return {
            ...device,
            isOn: switchLedObj ? switchLedObj.value : false,
            stateId: switchLedObj ? switchLedObj._id : null,
          };
        } catch (err) {
          // If call fails, device will be treated as OFF
          return { ...device, isOn: false };
        }
      })
    );
    setDevices(devicesWithState);
    setDeviceError(null);
  } catch (err: any) {
    setDeviceError(err.message || "Failed to fetch devices");
  } finally {
    setLoadingDevices(false);
  }
};



  useEffect(() => {
    // 1) Initial fetch (so we have something to display right away)
    fetchDevices();

    // 2) Connect to Socket.io
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      // If you move to HTTPS/WSS, just do: "https://your‐domain.com"
    });

    // 3) Listen for “device:status_changed” events
    socketRef.current.on("device:status_changed", ({ deviceId, newStatus }) => {
      // Update local state for just that one device:
      setDevices((prevDevices) =>
        prevDevices.map((d) =>
          d._id === deviceId ? { ...d, status: newStatus } : d
        )
      );
      fetchDevices()
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);


  const handleToggleSwitch = async (deviceId: string, on: boolean) => {
    try {
      // Build Tuya-style payload
      const payload = {
        commands: [
          { code: "switch_led", value: on }
        ]
      };
      // Get device details for tuyaID/metadata
      const res = await getDeviceById(deviceId); // You might have a getDeviceById(deviceId) instead if needed
      const tuyaID = res?.metadata || 'unknown';

      const fullPayload = {
        tuyaID,
        ...payload
      };
      // Topic & type
      const topic = `app/devices/${deviceId}/do_command/in`;
      const type = "publish";
      // Send to backend (MQTT broker or similar)
      await handleRequest(topic, type, JSON.stringify(fullPayload));
      // fetchDevices()

      // Update local state for instant feedback
      setDevices((prev) =>
        prev.map((d) =>
          d._id === deviceId
            ? { ...d, isOn: on }
            : d
        )
      );
      //setTimeout(() => fetchDevices(), 500)
    } catch (err) {
      Alert.alert("Error", "Failed to toggle switch");
      console.error("Toggle error:", err.message || err);
    }
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      className="mr-4 w-60"
      onPress={() => router.navigate("/properties/Remote2")}
    >
      <Image source={item.image} className="w-full h-72 rounded-xl mb-2" />
      <Text className="text-lg font-bold text-gray">{item.name}</Text>
    </TouchableOpacity>
  );

  const renderDevice = ({ item }: { item: DeviceWithState }) => {
    
    const handleRowOpen = (ref: Swipeable) => {
      if (openRow && openRow !== ref) {
        openRow.close();
      }
      setOpenRow(ref);
    };

    const isOnline = item.status === "online"

    const iconName: React.ComponentProps<typeof Ionicons>["name"] =
      item.type === "tv"
        ? "tv-outline"
        : item.type === "lamp"
        ? "bulb-outline"
        : "apps-outline";

    let screen = "";
    switch (item.type) {
      case "lamp":
        screen = "/properties/LampControl";
        break;
      case "tv":
        screen = "/properties/Remote3";
        break;
      default:
        screen = "/properties/LampControl";
    }

    const isTuya = item.manufacturer === "TUYA"

    return (
      <SwipeableRow
        onDelete={() =>
          Alert.alert("Delete Device", "Are you sure?",
            [
              {
                text:"Cancel", style: "cancel"
              },
              {
                text:"Delete", style: "destructive" , 
                onPress: async () =>
                {
                  await deleteDevice(item._id)
                  setDevices((prev) => prev.filter((d) => d._id !== item._id));
                }
              },
            ]
          )
        }
        onSwipeableOpen={handleRowOpen}>
        <TouchableOpacity
          className="flex-row justify-between items-center bg-black bg-opacity-50 mx-5 my-2 rounded-xl p-4"
          onPress={() => router.navigate({
            pathname:screen,
            params:
              {
                id:item._id,
                mode: "live",
                addScenarioCommand=
              },
          })}
          disabled={!isOnline}
        >
          <View className="flex-row items-center">
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
          {isTuya && 
          (<Switch
            value={item.isOn}
            onValueChange={(val) => handleToggleSwitch(item._id, val)}
            trackColor={{ true: "#34D399", false: "#9CA3AF" }}
            thumbColor={item.isOn ? "#10B981" : "#F3F4F8"}
            disabled={!isOnline}
          />)}
        </TouchableOpacity>
      </SwipeableRow>
    );
  };


  return (
    <SafeAreaView className="flex-1 bg-black">
      <Image
        source={images.background}
        className="absolute w-full h-full"
        blurRadius={10}
      />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pt-3">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => router.navigate("/Profile")}
        >
          <Image source={{uri : profileImage}} className="w-10 h-10 rounded-full mr-3" />
          <View>
            <Text className="text-sm text-white">Good Morning</Text>
            <Text className="text-xl font-bold text-white">{userName}</Text>
          </View>
        </TouchableOpacity>
        <View className="flex-col items-center p-2 gap-y-5">
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.navigate("/AddDevice")}>
            <MaterialCommunityIcons name="plus" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View className="flex-row bg-white mx-5 my-5 rounded-lg p-1 items-center">
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          className="flex-1 mx-3 text-base"
          placeholder="Search something"
          value={searchText}
          onChangeText={setSearchText}
        />
        <Ionicons name="options-outline" size={20} color="#9CA3AF" />
      </View>

      {/* Weather Card (unchanged) */}
      {weather && (
        <View className="flex-row bg-blue-500 mx-5 rounded-2xl p-5 items-center">
          <Image
            source={{
              uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`,
            }}
            className="w-20 h-20"
          />
          <View className="ml-4 flex-1">
            <Text className="text-4xl font-bold text-white">
              {Math.round(weather.main.temp)}°
            </Text>
            <Text className="text-sm text-white mb-1">
              Feels like {Math.round(weather.main.feels_like)}°
            </Text>
            <Text className="text-base text-white capitalize">
              {weather.weather[0].description}
            </Text>
            <Text className="text-xs text-blue-200 mt-2">
              Wind: {weather.wind.speed} m/s   Humidity: {weather.main.humidity}%
            </Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row bg-white rounded-lg p-1 mt-5 w-40 mx-auto">
        <TouchableOpacity
          className={`flex-1 items-center py-2 rounded-lg ${
            selectedTab === "Rooms" ? "bg-blue-500" : ""
          }`}
          onPress={() => setSelectedTab("Rooms")}
        >
          <Text
            className={`text-base font-semibold ${
              selectedTab === "Rooms" ? "text-white" : "text-gray-600"
            }`}
          >
            Rooms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 items-center py-2 rounded-lg ${
            selectedTab === "Devices" ? "bg-blue-500" : ""
          }`}
          onPress={() => {
            setSelectedTab("Devices");
            fetchDevices();
          }}
        >
          <Text
            className={`text-base font-semibold ${
              selectedTab === "Devices" ? "text-white" : "text-gray-600"
            }`}
          >
            Devices
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {selectedTab === "Rooms" ? (
        <FlatList
          data={rooms}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
          contentContainerStyle={{ paddingVertical: 20, paddingLeft: 20 }}
        />
      ) : loadingDevices ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-2">Loading devices…</Text>
        </View>
      ) : deviceError ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500">Error: {deviceError}</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={renderDevice}
          contentContainerStyle={{ paddingVertical: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;
