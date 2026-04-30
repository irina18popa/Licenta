import React, { useEffect, useRef, useState } from 'react';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import images from '@/constants/images';
import { router, useLocalSearchParams } from 'expo-router';
import { getDeviceById, getDeviceStateById, handleRequest, uploadFile, deleteMediaByUrl } from '@/app/apis';
import * as FileSystem from 'expo-file-system';
import { useScenarioBuilder } from '@/app/contexts/ScenarioBuilderContext';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


type DeviceData = {
  deviceName: string;
  temperature: number;
  humidity: number;
  battery: string;
};



const THControl = () => {
    const { id, mode } = useLocalSearchParams<{ id: string; mode?: 'live' | 'scenario' }>()
    const { add } = useScenarioBuilder()
   // Local state for device info
    const [data, setData] = useState<DeviceData | null>(null);
    const [unit, setUnit] = useState<'c' | 'f'>('c');
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState<string>('');


    useEffect(() => {
        if (!id) return;
        setLoading(true);
        (async () => {
        try {
            const resp = await getDeviceStateById(id);
            // resp.data is the array you showed earlier
            const arr = resp.data || [];
            // Helper to get value by code
            const getVal = (code: string) => arr.find((e: any) => e.code === code)?.value;
            
            const resp2 = await getDeviceById(id)

            setData({
                deviceName: resp2.name,
                temperature: Number(getVal('va_temperature')), // e.g., 275
                humidity: Number(getVal('va_humidity')),
                battery: String(getVal('battery_state') ?? ''),
            });
        } catch (err) {
            console.warn('Failed to load device state', err);
        } finally {
            setLoading(false);
        }
        })();
    }, [id]);

    if (loading || !data) {
        return (
        <SafeAreaView className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-2 text-lg text-gray-500">Loading...</Text>
        </SafeAreaView>
        );
    }

    // Calculate temp in °C and °F
    const tempC = data.temperature / 10; // 275 => 27.5°C
    const tempF = tempC * 9 / 5 + 32;
    const tempDisplay = unit === 'c'
        ? `${tempC.toFixed(1)} °C`
        : `${tempF.toFixed(1)} °F`;

    // Battery icon/color logic
    let batteryIcon = 'battery-full';
    let batteryColor = '#22c55e';
    if (data.battery === 'middle') {
        batteryIcon = 'battery-half';
        batteryColor = '#f59e42';
    } else if (data.battery === 'low') {
        batteryIcon = 'battery-quarter';
        batteryColor = '#ef4444';
    }


    const handleTempUnitChange = async (targetUnit: 'c' | 'f') => {
        try {
            // Compose the basic payload
            const payload = {
            commands: [
                {
                code: 'temp_unit_convert',
                value: targetUnit, // 'c' or 'f'
                },
            ],
            };


            if (mode === 'live') {
            // Get device address/protocol
            const res = await getDeviceById(id);
            const fullPayload = {
                protocol: 'tuya', // or whatever protocol your device uses
                address: res.metadata || 'unknown',
                ...payload,
            };

            const topic = `app/devices/${id}/do_command/in`;
            const type = 'publish';

            await handleRequest(topic, type, JSON.stringify(fullPayload));
            } else {
            // For scenario/automation mode
            await add(id, 'tuya', {
                code: 'temp_unit_convert',
                value: targetUnit,
            });
            }
        } catch (err) {
            console.warn('Failed to send temp unit payload:', err);
        }
    };


  return (
    <SafeAreaView className="flex-1 bg-black">
        <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
        <View className="absolute top-14 left-6 z-10">
          <TouchableOpacity
            className="bg-white/20 rounded-full p-2 flex-row items-center"
            onPress={() => {
              if (id) {
                router.navigate({
                  pathname: "/Logs",
                  params: { id: id },
                });
              }
            }}
          >
            <Ionicons name="list-outline" size={28} color="#FBBF24" />
            <Text className="ml-1 text-yellow-300 font-semibold">Logs</Text>
          </TouchableOpacity>
        </View>
        <View className="absolute top-12 right-6 z-10">
          <TouchableOpacity
            className="bg-white/20 rounded-full p-2"
            onPress={() => {
              if (id) {
                router.navigate({
                  pathname: "/StatusChart",
                  params: { id:id },
                })
              }
            }}
          >
            <Ionicons name="stats-chart" size={28} color="#60A5FA" />
            <Text>Statistics</Text>
          </TouchableOpacity>
        </View>
        <View className="items-center mt-16 mb-6">
          <Image source={images.th_sensor} className="w-64 h-40" resizeMode="contain" />
        </View>
        <View className="items-center mt-2 mb-16">
          <Text className="text-white text-lg font-semibold">{data.deviceName}</Text>
          <View className="w-16 h-0.5 bg-white mt-1" />
        </View>
      <View className="mx-4 my-8 p-6 rounded-2xl shadow-2xl bg-white">
        {/* Temperature */}
        <View className="flex-row items-center mb-4">
          <MaterialCommunityIcons name="thermometer" size={32} color="#3b82f6" />
          <Text className="text-3xl font-bold ml-2">{tempDisplay}</Text>
          <TouchableOpacity
            className="ml-3 border border-gray-300 px-3 py-1 rounded-xl"
            onPress={() => setUnit(unit === 'c' ? 'f' : 'c')}
          >
            <Text className="text-base text-gray-600">
              {unit === 'c' ? 'Show in °F' : 'Show in °C'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => handleTempUnitChange(unit === 'c' ? 'f' : 'c')}>
            <Text>
                {unit === 'c' ? 'Switch to Fahrenheit' : 'Switch to Celsius'}
            </Text>
        </TouchableOpacity>

        {/* Humidity */}
        <View className="flex-row items-center mb-4">
          <Ionicons name="water-outline" size={28} color="#38bdf8" />
          <Text className="ml-2 text-xl font-semibold">{data.humidity}%</Text>
          <Text className="ml-1 text-base text-gray-500">Humidity</Text>
        </View>
        {/* Battery */}
        <View className="flex-row items-center mt-2">
          <FontAwesome5 name={batteryIcon} size={24} color={batteryColor} />
          <Text className="ml-2 font-semibold">{data.battery.toUpperCase()} Battery</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default THControl;