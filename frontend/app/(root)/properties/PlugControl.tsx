import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import images from '@/constants/images';
import { router, useLocalSearchParams } from 'expo-router';
import { createLog, getDeviceById, getDeviceStateById, handleRequest } from '@/app/apis';
import { ActivityIndicator, Image, Text, TouchableOpacity, View, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PlugControl = () => {
  const { id, mode } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ deviceName: '', current: 0, power: 0, voltage: 0 });
  const [childLock, setChildLock] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);

  // Fetch plug state
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      try {
        const stateRes = await getDeviceStateById(id);
        const arr = stateRes.data || [];
        const getVal = (code) => arr.find(e => e.code === code)?.value;

        const devRes = await getDeviceById(id);

        setData({
          deviceName: devRes.name,
          current: Number(getVal('cur_current')) || 0,
          power: Number(getVal('cur_power')) || 0,
          voltage: Number(getVal('cur_voltage')/10) || 0,
        });
        setChildLock(!!getVal('child_lock'));
      } catch (err) {
        // fallback to empty values
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Handle child lock switch
  const handleChildLockSwitch = async (val) => {
    setSwitchLoading(true);
    try {
      // Build tuya payload
      const payload = {
        commands: [
          { code: "child_lock", value: val }
        ]
      };
      const devRes = await getDeviceById(id);
      const fullPayload = {
        protocol: 'tuya',
        address: devRes.metadata || 'unknown',
        ...payload
      };
      const topic = `app/devices/${id}/do_command/in`;
      await handleRequest(topic, "publish", JSON.stringify(fullPayload));
      setChildLock(val);
    } catch (e) {
      // revert on fail
      setChildLock(!val);
    }
    setSwitchLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-2 text-lg text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

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
          onPress={() => id && router.navigate({ pathname: "/StatusChart", params: { id } })}
        >
          <Ionicons name="stats-chart" size={28} color="#60A5FA" />
          <Text className="text-white text-xs mt-1">Statistics</Text>
        </TouchableOpacity>
      </View>
      <View className="items-center mt-16 mb-6">
        <Image source={images.plug} className="w-52 h-40" resizeMode="contain" />
      </View>
      <View className="items-center mt-2 mb-8">
        <Text className="text-white text-lg font-semibold">{data.deviceName}</Text>
        <View className="w-16 h-0.5 bg-white mt-1" />
      </View>

      <View className="mx-4 my-8 p-6 rounded-2xl shadow-2xl bg-white">
        {/* Current */}
        <View className="flex-row items-center mb-4">
          <Ionicons name="flash-outline" size={28} color="#3b82f6" />
          <Text className="ml-2 text-xl font-bold">{data.current} mA</Text>
          <Text className="ml-2 text-gray-500">Current</Text>
        </View>
        {/* Power */}
        <View className="flex-row items-center mb-4">
          <Ionicons name="bulb-outline" size={28} color="#f59e42" />
          <Text className="ml-2 text-xl font-bold">{data.power} W</Text>
          <Text className="ml-2 text-gray-500">Power</Text>
        </View>
        {/* Voltage */}
        <View className="flex-row items-center mb-4">
          <Ionicons name="battery-charging-outline" size={28} color="#a78bfa" />
          <Text className="ml-2 text-xl font-bold">{data.voltage} V</Text>
          <Text className="ml-2 text-gray-500">Voltage</Text>
        </View>
        {/* Child Lock Switch */}
        <View className="flex-row items-center justify-between mt-8">
          <Text className="text-lg font-bold text-gray-700">Child Protection</Text>
          <Switch
            value={childLock}
            onValueChange={handleChildLockSwitch}
            disabled={switchLoading}
            trackColor={{ true: "#60A5FA", false: "#E5E7EB" }}
            thumbColor={childLock ? "#2563EB" : "#F3F4F6"}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PlugControl;
