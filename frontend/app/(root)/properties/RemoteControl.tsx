import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import NeumorphicCommandButton from '../../../components/NeumorphicCommandButton';
import { fetchTVDeviceCommands, fetchTVDevices } from '@/app/apis';
import axios from 'axios';

interface Device {
  name: string;
  uuid: string;
}

const RemoteControl: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [commands, setCommands] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    const loadDevices = async () => {
      const rawDevices = await fetchTVDevices();
      const tvDevices = rawDevices.map((d) => ({
        name: d.name,
        uuid: d._id,
      }));

      setDevices(tvDevices);
      if (tvDevices.length > 0) {
        const firstDevice = tvDevices[1];
        setSelectedDevice(firstDevice);

        const commandObjects = await fetchTVDeviceCommands(firstDevice.uuid);
        const commandNames = commandObjects[0]?.commands?.map((c) => c.name) || [];
        setCommands(commandNames);
      }
    };
    loadDevices();
  }, []);

  const handleCommandPress = async (commandName: string) => {
    if (!selectedDevice) return;

    try {
      await axios.post('http://localhost/api/sendcommand', {
        deviceId: selectedDevice.uuid,
        command: commandName,
      });
      console.log(`Command "${commandName}" sent to ${selectedDevice.name}`);
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-neutral-900 p-4">
      <Text className="text-white text-xl mb-4">
        Remote for {selectedDevice?.name}
      </Text>
      <View className="flex flex-wrap flex-row justify-center">
        {commands.map((cmd) => (
          <NeumorphicCommandButton
            key={cmd}
            title={cmd}
            onPress={() => handleCommandPress(cmd)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default RemoteControl;
