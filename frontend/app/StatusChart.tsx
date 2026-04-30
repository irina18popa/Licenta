import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions, Text, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
// Import your socket connection method
import {io, Socket} from 'socket.io-client';
import { getDeviceById } from './apis';
import images from '@/constants/images';

const SOCKET_SERVER_URL = 'http://192.168.1.135:3000';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const chartConfig = {
  backgroundGradientFrom: "#23272F",
  backgroundGradientTo: "#23272F",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "5", strokeWidth: "2", stroke: "#fff" }
};


function getInitialTimeLabels() {
  const now = new Date();
  const labels = [];
  for (let i = 5 * 5; i >= 0; i -= 5) {
    const labelTime = new Date(now.getTime() - i * 60000);
    labels.push(labelTime.toTimeString().slice(0, 5));
  }
  return labels;
}


const StatusChart = () => {
  const { id } = useLocalSearchParams();
  const [name, setName] = useState('')
  const [labels, setLabels] = useState(getInitialTimeLabels());
  const [statuses, setStatuses] = useState([0,0,0,0,0,0]); // temp

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    async function fetchInitialStatus() {
      const resp = await getDeviceById(id);
      const lastStatus = resp.status === "online" ? 1 : 0;
      setName(resp.name)
      setStatuses(Array(6).fill(lastStatus));
    }
    fetchInitialStatus();

    socketRef.current = io(SOCKET_SERVER_URL);
    socketRef.current.on('device:status_changed', ({ deviceId, newStatus }) => {
      if (deviceId === id) {
        const newTime = new Date();
        const label = newTime.toTimeString().slice(0, 5);
        setLabels(prev => [...prev.slice(-5), label]);
        setStatuses(prev => [...prev.slice(-5), newStatus === "online" || newStatus === 1 ? 1 : 0]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [id]);

  const data = {
    labels,
    datasets: [
      {
        data: statuses,
        color: (opacity = 1) => `rgba(34,197,94,${opacity})`, // green
        strokeWidth: 2,
      },
    ],
  };

  return (
    <SafeAreaView className="flex-1 bg-black ">
      <Image
        source={images.background}
        className="absolute w-full h-full"
        blurRadius={10}
      />
      <Text className="text-2xl font-bold text-white mb-16 text-center mt-16">{name} Live Status</Text>
      <LineChart
        data={data}
        width={screenWidth}
        height={screenHeight * 0.5}
        yAxisLabel=""
        fromZero
        withVerticalLines={false}
        withHorizontalLines={true}
        chartConfig={chartConfig}
        bezier
        style={{ borderRadius: 0 }}
        formatYLabel={y => (parseInt(y) === 1 ? "Online" : "Offline")}
        segments={1}
      />
    </SafeAreaView>
  );
}

export default StatusChart;
