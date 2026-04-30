import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";
import { getUserDevices, createRoom } from "@/app/apis"; // make sure you have this
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const bgOptions = [
  { key: 'livingroom', image: images.livingroom },
  { key: 'bedroom', image: images.bedroom },
  { key: 'kitchen', image: images.kitchen },
  { key: 'bathroom', image: images.bathroom },
  { key: 'japan', image: images.japan },
  { key: 'newYork', image: images.newYork },
];

const CreateRoom = () => {
  const [name, setName] = useState("");
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedBg, setSelectedBg] = useState(bgOptions[0]);
  const [loading, setLoading] = useState(true);
  const [selectedBgKey, setSelectedBgKey] = useState(bgOptions[0].key);

  const router = useRouter();

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const res = await getUserDevices();
        setDevices(res);
      } catch (err) {
        Alert.alert("Error", "Failed to load devices.");
      } finally {
        setLoading(false);
      }
    };
    loadDevices();
  }, []);

  const toggleDevice = (id: string) => {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      return Alert.alert("Room name required");
    }

    try {
      await createRoom({
        name,
        devices: selectedDevices,
        image: selectedBgKey, // You might want to save just the image name or path
      });
      Alert.alert("Success", "Room created!");
      router.replace('/');
    } catch (err) {
      Alert.alert("Error", "Failed to create room.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
    <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <Text className="text-white text-2xl font-bold mt-4 mb-2">Create New Room</Text>

      {/* Room name input */}
      <View className="bg-white/10 rounded-lg px-4 py-2 mb-4">
        <Text className="text-gray-300 mb-1">Room Name</Text>
        <TextInput
          className="text-white text-base"
          placeholder="e.g. Living Room"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Background selection */}
      <Text className="text-gray-300 mb-2">Choose Background</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        {bgOptions.map((item) => (
            <TouchableOpacity
            key={item.key}
            onPress={() => setSelectedBgKey(item.key)}
            className={`rounded-xl overflow-hidden mr-3 border-2 ${
                selectedBgKey === item.key ? "border-white" : "border-transparent"
            }`}
            >
            <Image source={item.image} className="w-24 h-24 rounded-xl" />
            </TouchableOpacity>
        ))}
        </ScrollView>

      {/* Device selection */}
      <Text className="text-gray-300 mb-2">Add Devices</Text>
      {loading ? (
        <ActivityIndicator color="#fff" size="large" />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item._id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const selected = selectedDevices.includes(item._id);
            return (
              <TouchableOpacity
                onPress={() => toggleDevice(item._id)}
                className={`flex-row items-center justify-between px-4 py-3 mb-2 rounded-xl ${
                  selected ? "bg-blue-500" : "bg-white/10"
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={item.type === "tv" ? "tv-outline" : "bulb-outline"}
                    size={20}
                    color="#fff"
                  />
                  <Text className="text-white ml-3">{item.name}</Text>
                </View>
                {selected && <Ionicons name="checkmark" size={20} color="white" />}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Submit */}
      <TouchableOpacity
        onPress={handleSubmit}
        className="mt-6 bg-blue-600 py-3 rounded-lg items-center"
      >
        <Text className="text-white font-bold text-lg">Create Room</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CreateRoom;
