import React, { useEffect, useState } from 'react';
import { FlatList, Text, View, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router'; // to get deviceId from URL/params
import { getLogsByDeviceId } from './apis'; // <- your API function
import { SafeAreaView } from 'react-native-safe-area-context';
import images from '@/constants/images';

const LogItem = ({ log }) => (
    <View className="bg-gray-900 rounded-xl p-4 mb-3">
        <Text className="text-white font-bold">{log.type}</Text>
        <Text className="text-gray-400 text-xs mb-1">
        {new Date(log.timestamp).toLocaleString()}
        </Text>
        {log.command && <Text className="text-blue-300">Command: {log.command}</Text>}
        {log.status && <Text className="text-green-400">Status: {log.status}</Text>}
        {log.value !== undefined && log.value !== null && (
        <Text className="text-yellow-300">
            Value: {typeof log.value === 'object' ? JSON.stringify(log.value) : String(log.value)}
        </Text>
        )}
    </View>
);

const DeviceLogsList = () => {
  const { id } = useLocalSearchParams(); // expects deviceId param
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const logs = await getLogsByDeviceId(id);
      setLogs(logs || []);
      setLoading(false);
    }
    fetchLogs();
  }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-black">
        <Image
            source={images.background}
            className="absolute w-full h-full"
            blurRadius={10}
      />
      <Text className="text-2xl font-bold text-white mb-4 mt-10 text-center">Device Logs</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#60a5fa" />
      ) : logs.length === 0 ? (
        <Text className="text-gray-400 text-center mt-10">No logs for this device.</Text>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <LogItem log={item} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
};

export default DeviceLogsList;
