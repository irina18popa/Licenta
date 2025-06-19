import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, TextInput } from 'react-native';
import MyColorPicker from '@/components/MyColorPicker';
import MyWarmColorPicker from '@/components/MyWarmColorPicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { colorKit } from 'reanimated-color-picker';
import images from '@/constants/images';
import { useLocalSearchParams } from 'expo-router';
import { getDeviceById, updateDeviceById } from '@/app/apis';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';


type Tab = 'Warm' | 'Color' | 'Scene' | 'Music';
const TAB_TITLES: Tab[] = ['Warm', 'Color', 'Scene', 'Music'];

const API_URL = 'http://192.168.1.135:3000/api';

const LampControl = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Warm');
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialColor = colorKit.randomRgbColor().hex();
  const sharedColor = useSharedValue(initialColor);

  const { id } = useLocalSearchParams();

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const device = await getDeviceById(id as string);
        setDeviceName(device.name);

        // 🔽 Fetch state (e.g., /api/devicestate/:deviceID)
        const stateRes = await axios.get(`${API_URL}/devicestate/${id}`);
        
        const colourData = stateRes.data?.data?.find((d: any) => d.code === 'colour_data_v2');
        if (colourData && colourData.value) {
          const hsvObj = JSON.parse(colourData.value); // { h, s, v }
          const hex = colorKit.HEX({
            h: hsvObj.h,
            s: hsvObj.s / 10,  // Tuya scale to 0–100
            v: hsvObj.v / 10
          });

        sharedColor.value = hex; // ✅ Apply to reanimated shared value
      }
      } catch (err) {
        console.error("Failed to fetch device/state", err);
        setDeviceName("Unknown device");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDevice();
    }
  }, [id]);

  const handleSave = async () => {
  if (!id || !deviceName) return;

  try {
    setSaving(true);
    await updateDeviceById(id as string, { name: deviceName });
    setEditing(false);
  } catch (err) {
    console.error("Failed to update device name", err);
  } finally {
    setSaving(false);
  }
};


  const renderContent = () => {
    switch (activeTab) {
      case 'Warm':
        return <MyWarmColorPicker sharedColor={sharedColor}/>;
      case 'Color':
        return <MyColorPicker sharedColor={sharedColor} deviceID={id}/>;
      case 'Scene':
        return <Text className="text-center text-lg text-white">Choose a Scene</Text>;
      case 'Music':
        return <Text className="text-center text-lg text-white">Music Controls</Text>;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <View className="items-center mt-16">
        <Image source={images.tv} className="w-64 h-40" resizeMode="contain" />
      </View>

      <View className="items-center mt-2 ml-8 flex-row justify-center gap-x-2">
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : editing ? (
        <>
          <TextInput
            value={deviceName ?? ""}
            onChangeText={setDeviceName}
            className="text-white text-lg font-semibold border-b border-white px-2 py-1"
            placeholder="Device name"
            placeholderTextColor="#ccc"
          />
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Ionicons name="checkmark" size={24} color="green"/>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text className="text-white text-lg font-semibold border-b border-white px-2 py-1">{deviceName}</Text>
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Ionicons name="pencil" size={18} color="black" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </>
      )}
    </View>

      <BlurView intensity={100} tint="dark" style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '70%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
      }}>
        <View className="flex-row justify-around py-3">
          {TAB_TITLES.map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 items-center py-2 ${activeTab === tab ? 'border-b-2 border-blue-500' : ''}`}
              onPress={() => setActiveTab(tab)}
            >
              <Text className={`${activeTab === tab ? 'text-blue-500 font-semibold' : 'text-white'} text-base`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View className="flex-1 p-4">{renderContent()}</View>
      </BlurView>
    </SafeAreaView>
  );
};

export default LampControl;
