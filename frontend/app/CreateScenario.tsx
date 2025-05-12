import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import images from '@/constants/images';


type Device = { id: string; name: string; type: 'tv' | 'lamp'; };

const CreateScenario = () => {
  // --- state ---
  const [allDevices] = useState<Device[]>([
    { id: 'tv1', name: 'Living Room TV', type: 'tv' },
    { id: 'lamp1', name: 'Bedroom Lamp', type: 'lamp' },
  ]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [trigger, setTrigger] = useState<{
    daysOfWeek: number[];
    timeFrom?: Date;
    timeTo?: Date;
  }>({ daysOfWeek: [] });
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // --- helpers ---
  const toggleDevice = (id: string) =>
    setSelectedDeviceIds(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );

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
        />

        {/* 2️⃣ Device Picker */}
        <Text className="text-white mb-2">Select Devices</Text>
        <View className="flex-row flex-wrap mb-6">
          {allDevices.map(dev => (
            <Pressable
              key={dev.id}
              onPress={() => toggleDevice(dev.id)}
              className={`
                m-1 px-3 py-2 rounded-full
                ${selectedDeviceIds.includes(dev.id)
                  ? 'bg-blue-600'
                  : 'bg-neutral-700'}
              `}
            >
              <Text className="text-white">{dev.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* 3️⃣ Device Function Panels */}
        {selectedDeviceIds.map(id => {
          const dev = allDevices.find(d => d.id === id)!;
          return (
            <View
              key={id}
              className="mb-6 rounded-2xl overflow-hidden"
            >
              <BlurView
                intensity={60}
                tint="dark"
                className="p-4"
              >
                {/* Header */}
                <View className="flex-row items-center mb-4">
                  <Image
                    source={dev.type === 'tv' ? images.tv : images.newYork}
                    className="w-10 h-10 mr-3"
                    resizeMode="contain"
                  />
                  <Text className="text-white text-lg font-semibold">
                    {dev.name}
                  </Text>
                </View>

                {/* Function buttons */}
                <View className="flex-row flex-wrap justify-center">
                  {dev.type === 'tv' ? (
                    ['Power','Mute','Vol+','Vol-','Input'].map(cmd => (
                      <Pressable
                        key={cmd}
                        className="m-1 w-20 h-12 bg-neutral-800/70 rounded-lg justify-center items-center"
                      >
                        <Text className="text-white">{cmd}</Text>
                      </Pressable>
                    ))
                  ) : (
                    ['On','Off','Dim+','Dim-'].map(cmd => (
                      <Pressable
                        key={cmd}
                        className="m-1 w-20 h-12 bg-neutral-800/70 rounded-lg justify-center items-center"
                      >
                        <Text className="text-white">{cmd}</Text>
                      </Pressable>
                    ))
                  )}
                </View>
              </BlurView>
            </View>
          );
        })}

        {/* 4️⃣ Trigger Selector */}
        <Text className="text-white mb-2">When to run</Text>

        {/* Days of Week */}
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

        {/* Time Window */}
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
      </ScrollView>

      {/* 5️⃣ Save Button */}
      <Pressable className="m-4 bg-blue-600 p-4 rounded-lg">
        <Text className="text-center text-white font-bold text-lg">
          Save Scenario
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

export default CreateScenario