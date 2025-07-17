import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getDeviceById, getDeviceStateById } from '@/app/apis';
import images from '@/constants/images';

type FloodSensorData = {
  battery: number; // battery percentage (e.g. 82)
  flood: boolean;  // true = FLOOD, false = SAFE
};

const WaterFlood = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<FloodSensorData | null>(null);
  const [loading, setLoading] = useState(true);
    const [name, setName] = useState<string>('');


  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const resp = await getDeviceStateById(id);
        const arr = resp.data || [];
        const getVal = (code: string) => arr.find((e: any) => e.code === code)?.value;
        
        const resp2 = await getDeviceById(id);
        setName(resp2.name)

        setData({
          battery: Number(getVal('battery_percentage') ?? getVal('battery') ?? 0),
          flood: String(getVal('doorcontact_state')).toLowerCase() === 'true' || getVal('flood_alert') === true,
        });
      } catch (err) {
        console.warn('Failed to load sensor state', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // UI: battery icon/color logic
  let batteryIcon = 'battery-full';
  let batteryColor = '#22c55e';
  if (data?.battery <= 33) {
    batteryIcon = 'battery-quarter';
    batteryColor = '#ef4444';
  } else if (data?.battery <= 66) {
    batteryIcon = 'battery-half';
    batteryColor = '#f59e42';
  }

  return (
    <SafeAreaView className="flex-1 bg-black items-center justify-center">
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
        <View className="items-center mt-24">
            <Image source={images.flood_sensor} className="w-64 h-40" resizeMode="contain" />
        </View>
        <View className="items-center mt-2">
            <Text className="text-white text-lg font-semibold">{name}</Text>
            {/* <View className="w-16 h-0.5 bg-white mt-1" /> */}
        </View>
      <View className="bg-white p-8 rounded-2xl shadow-2xl w-80 items-center">
        {/* Flood status */}
        {loading || data === null ? (
          <View className="my-12">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <View className="items-center mb-8">
            <View className={`rounded-2xl px-6 py-4 mb-3 ${data.flood ? 'bg-red-500' : 'bg-green-500'}`}>
              <Text className="text-white text-xl font-bold tracking-wide">
                {data.flood ? '🚨 FLOOD RISK DETECTED' : '✅ SAFE'}
              </Text>
            </View>
          </View>
        )}

        {/* Battery */}
        {!loading && data && (
          <View className="flex-row items-center mt-2">
            <FontAwesome5 name={batteryIcon} size={28} color={batteryColor} />
            <Text className="ml-2 text-lg font-semibold">{data.battery}% Battery</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default WaterFlood;
