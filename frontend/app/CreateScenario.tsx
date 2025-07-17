import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import images from '@/constants/images';
import { createScenario, getDeviceById, getUserDevices } from './apis';
import { router, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useScenarioBuilder } from './contexts/ScenarioBuilderContext';


type Device = { _id: string; name: string; type: String; };

type ScenarioCommand = {
  deviceId: string;
  protocol: 'upnp' | 'tuya' | string;
  address: string;
  commands: Array<
    | { name: string; parameters: Record<string, any> }         // UPnP style
    | { code: string; value: any }                             // Tuya style
  >;
};

const CreateScenario = () => {

  const { commands, reset } = useScenarioBuilder()

  // --- state ---
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [scenarioCommands, setScenarioCommands] = useState<ScenarioCommand[]>([]);
 
  const [trigger, setTrigger] = useState<{
      daysOfWeek: number[];
      timeFrom?: Date;
      timeTo?: Date;
      weatherCondition?: string;
      temperature?: number;
      temperatureCondition?: 'above' | 'below';
    }>({
      daysOfWeek: [],
    });


  const [scenarioName, setScenarioName] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const navigation = useNavigation()

   useEffect(() => {
    (async () => {
      try {
        const devices = await getUserDevices(); 
        setAllDevices(devices);
      } catch (e) {
        console.error('Couldn’t load devices', e);
      }
    })();
  }, []);


  async function addScenarioCommand(
    deviceId: string,
    protocol: ScenarioCommand['protocol'],
    raw: { name?: string; parameters?: any; code?: string; value?: any }
  ) {
    // fetch metadata once per device
    const dev = await getDeviceById(deviceId);
    const address = dev.metadata || 'unknown';

    // build the commands array entry
    let commandsEntry;
    if (protocol === 'upnp') {
      commandsEntry = { name: raw.name!, parameters: raw.parameters! };
    } else {
      commandsEntry = { code: raw.code!, value: raw.value! };
    }

    setScenarioCommands(cmds => [
      ...cmds,
      { deviceId, protocol, address, commands: [commandsEntry] },
    ]);
  }

  const handleSaveScenario = async() => {
      try {
      if (!scenarioName.trim()) {
        Alert.alert('Validation Error', 'Please enter a scenario name.');
        return;
      }
      if (!commands.length) {
        Alert.alert('Validation Error', 'No commands selected for this scenario.');
        return;
      }

      const payload = {
        name: scenarioName, // You’ll need to store this from the input
        triggers: [
          {
            type: 'time',
            timeFrom: trigger.timeFrom?.toTimeString().slice(0,5),
            ...(trigger.timeTo ? { timeTo: trigger.timeTo.toTimeString().slice(0, 5) } : {}),
            daysOfWeek: trigger.daysOfWeek,
          },
          ...(trigger.weatherCondition
            ? [{ type: 'weather', weatherCondition: trigger.weatherCondition }]
            : []),
          ...(trigger.temperature != null && trigger.temperatureCondition
            ? [{
                type: 'temperature',
                temperature: trigger.temperature,
                temperatureCondition: trigger.temperatureCondition,
              }]
            : []),
        ],
        commands: commands,
      };
  // console.log(JSON.stringify(payload, null, 2));
      await createScenario(payload)
      reset()
      router.replace('/Scenarios')
    } catch (error) {
      console.error('Failed to save scenario:', error);
      Alert.alert('Error', 'Failed to save scenario.');
    }
  };



  const toggleDevice = async (id: string) => {
    const isSelected = selectedDeviceIds.includes(id);
    if (isSelected) {
      setSelectedDeviceIds(ids => ids.filter(x => x !== id));
    } else {
      try {
        const dev = await getDeviceById(id);
        if (dev.status !== 'online') {
          alert(`${dev.name} is offline`);
        }
      } catch {
        alert('Failed to check device status');
      }
      setSelectedDeviceIds(ids => [...ids, id]);
    }
  };



  const formatHHMM = (d: Date) =>
    d.toTimeString().slice(0,5);

  const toggleDay = (i: number) => {
    setTrigger(t => {
      const days = t.daysOfWeek.includes(i)
        ? t.daysOfWeek.filter(x => x !== i)
        : [...t.daysOfWeek, i];
      return { ...t, daysOfWeek: days };
    });
  };

  // --- render ---
  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* 1️⃣ Scenario Title */}
        <TextInput
          placeholder="Scenario Name"
          placeholderTextColor="#aaa"
          className="text-white text-xl border-b border-neutral-700 pb-2 mb-6"
          value={scenarioName}
          onChangeText={setScenarioName}
        />

        {/* 2️⃣ Device Picker */}
        <Text className="text-white mb-2">Select Devices</Text>
        <View className="flex-row flex-wrap mb-6">
          {allDevices.map(dev => (
            <Pressable
              key={dev._id}
              onPress={() => toggleDevice(dev._id)}
              className={`
                m-1 px-3 py-2 rounded-full
                ${selectedDeviceIds.includes(dev._id)
                  ? 'bg-blue-600'
                  : 'bg-neutral-700'}
              `}
            >
              <Text className="text-white">{dev.name}</Text>
            </Pressable>
          ))}
        </View>

        {selectedDeviceIds.map(deviceId => {
          const dev = allDevices.find(d => d._id === deviceId)!;
          // pick the right route:
          let screen;
          switch (dev.type) {
            case 'media':
              screen = 'Remote3';
              break;
            case 'bulb':
              screen = 'LampControl';
              break;
            case 'plug':
              screen = 'PlugControl';
              break;
            case 'sensor_th':
              screen = 'THControl';
              break;
            default:
              screen = 'WaterFlood';
          }

          return (
            <Pressable
              key={dev._id}
              onPress={() => router.push({
                pathname: `/properties/${screen}`,
                params: {
                  id: deviceId,
                  mode: "scenario"
                }
              })}
              className="mb-4 rounded-lg bg-neutral-700 p-4 flex-row items-center"
            >
              <Image
                source={images.homeiq_logo_transparent}
                className="w-10 h-10 mr-3"
              />
              <Text className="text-white text-lg">{dev.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" style={{ marginLeft: 'auto' }}/>
            </Pressable>
          );
        })}

        <Text className="text-white mb-2">When to run</Text>

        <View className="flex-row mb-4">
          {['S','M','T','W','T','F','S'].map((L, i) => (
            <Pressable
              key={i}
              onPress={() => toggleDay(i)}
              className={`
                w-10 h-10 m-1 rounded-full justify-center items-center
                ${trigger.daysOfWeek.includes(i)
                  ? 'bg-blue-500'
                  : 'bg-neutral-700'}
              `}
            >
              <Text className="text-white">{L}</Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row justify-between mb-8">
          <Pressable
            onPress={() => setShowFromPicker(true)}
            className="flex-1 mr-2 p-3 bg-neutral-700 rounded-md"
          >
            <Text className="text-white">
              From: {trigger.timeFrom ? formatHHMM(trigger.timeFrom) : '--:--'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setShowToPicker(true)}
            className="flex-1 ml-2 p-3 bg-neutral-700 rounded-md"
          >
            <Text className="text-white">
              To: {trigger.timeTo ? formatHHMM(trigger.timeTo) : '--:--'}
            </Text>
          </Pressable>
        </View>

        {showFromPicker && (
          <DateTimePicker
            value={trigger.timeFrom || new Date()}
            mode="time"
            onChange={(_, date) => {
              setShowFromPicker(false);
              if (date) setTrigger(t => ({ ...t, timeFrom: date }));
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={trigger.timeTo || new Date()}
            mode="time"
            onChange={(_, date) => {
              setShowToPicker(false);
              if (date) setTrigger(t => ({ ...t, timeTo: date }));
            }}
          />
        )}

      <Text className="text-white mb-1">Temperature Trigger</Text>
      <View className="flex-row items-center space-x-2 mb-6">
        <TextInput
          keyboardType="numeric"
          placeholder="Value (°C)"
          placeholderTextColor="#aaa"
          className="flex-1 text-white border-b border-neutral-700 pb-1"
          onChangeText={(val) =>
            setTrigger(t => ({ ...t, temperature: parseFloat(val) }))
          }
        />
        <Pressable
          className={`px-3 py-2 rounded-full ${
            trigger.temperatureCondition === 'above' ? 'bg-blue-600' : 'bg-neutral-700'
          }`}
          onPress={() =>
            setTrigger(t => ({ ...t, temperatureCondition: 'above' }))
          }
        >
          <Text className="text-white">Above</Text>
        </Pressable>
        <Pressable
          className={`px-3 py-2 rounded-full ${
            trigger.temperatureCondition === 'below' ? 'bg-blue-600' : 'bg-neutral-700'
          }`}
          onPress={() =>
            setTrigger(t => ({ ...t, temperatureCondition: 'below' }))
          }
        >
          <Text className="text-white">Below</Text>
        </Pressable>
      </View>

      </ScrollView>

      {/* 5️⃣ Save Button */}
      <Pressable className="m-4 bg-blue-600 p-4 rounded-lg" onPress={handleSaveScenario}>
        <Text className="text-center text-white font-bold text-lg">
          Save Scenario
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

export default CreateScenario