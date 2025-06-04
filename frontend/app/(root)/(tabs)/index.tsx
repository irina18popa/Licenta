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
import { useRouter } from "expo-router";
import { getDevices } from "@/app/apis"; // your existing API helper
import images from "../../../constants/images";

interface RawDevice {
  _id: string;
  name: string;
  type: "tv" | "lamp" | string;
  status: "online" | "offline";
  // …other fields…
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
  const [devices, setDevices] = useState<RawDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const router = useRouter();

  const TwoButtonAlert = () => {
    Alert.alert("Add device", "Choose a device type:", [
      { text: "Tuya", onPress: () => console.log("Tuya selected"), style: "cancel" },
      { text: "UPNP", onPress: () => router.navigate("/AddDevice") },
    ]);
  };

  const socketRef = useRef<Socket | null>(null);

  // Polling ref so we can clear on unmount
  const pollingRef = useRef<number | null>(null);

  useEffect(() => {
    // 1) Initial fetch (so we have something to display right away)
    const fetchDevices = async () => {
      try {
        const rawList = await getDevices(); // REST API: GET /devices
        setDevices(rawList);
        setDeviceError(null);
      } catch (err: any) {
        setDeviceError(err.message || "Failed to fetch devices");
      } finally {
        setLoadingDevices(false);
      }
    };

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
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const toggleDevice = (_id: string) => {
  setDevices((prev) =>
    prev.map((d) =>
      d._id === _id
        ? {
            ...d,
            status: d.status === "online" ? "offline" : "online"
          }: d));
    // If you need to persist toggle to backend, call your toggle‐API here.
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

  const renderDevice = ({ item }: { item: RawDevice }) => {
    
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

    return (
      <TouchableOpacity
        className="flex-row justify-between items-center bg-black bg-opacity-50 mx-5 my-2 rounded-xl p-4"
        onPress={() => router.navigate(screen)}
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
        {/* <Switch
          value={isOnline}
          onValueChange={() => toggleDevice(item._id)}
          trackColor={{ true: "#34D399", false: "#9CA3AF" }}
          thumbColor={isOnline ? "#10B981" : "#F3F4F8"}
          disabled={!isOnline}
        /> */}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white-100">
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
          <Image source={images.avatar} className="w-10 h-10 rounded-full mr-3" />
          <View>
            <Text className="text-sm text-white">Good Morning</Text>
            <Text className="text-xl font-bold text-white">Adrian Hajdin</Text>
          </View>
        </TouchableOpacity>
        <View className="flex-col items-center p-2 gap-y-5">
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity onPress={TwoButtonAlert}>
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
          onPress={() => setSelectedTab("Devices")}
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
