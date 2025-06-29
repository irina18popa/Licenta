// components/AudioRecorder.tsx

import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import Svg, { Polyline } from 'react-native-svg';
import { Text } from 'react-native';
import { getDeviceById, handleRequest } from '@/app/apis';


interface MusicModeProps {
  deviceID: string; // you can pass this from parent
  mode: string
}


const MusicMode = ({ deviceID, mode } : MusicModeProps) => {

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const interval = useRef<NodeJS.Timer | null>(null);

    const sendMusicModeCommand = async (deviceID: string) => {
      try {
          const payload = {
            commands: [
              {
              code: 'work_mode',
              value: 'music',
              }
            ],
          };

          if (mode === 'live')
          {
            const res = await getDeviceById(deviceID);
            const fullPayload = {
              protocol: 'tuya',
              address: res.metadata || 'unknown',
              ...payload
            };

            const topic = `app/devices/${deviceID}/do_command/in`;
            const type = 'publish';

            await handleRequest(topic, type, JSON.stringify(fullPayload));
          } else {
            await addScenarioCommand(deviceID, 'tuya', payload)
          }

      } catch (err) {
        console.warn('Failed to send work_mode command:', err);
      }
    };



  const startRecording = async () => {
    try {

        // Prevent conflict by stopping existing recording if any
        if (recording) {
            return
        }

        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        });

        await sendMusicModeCommand(deviceID); // optional: only send once

        const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(newRecording);

        interval.current = setInterval(async () => {
        const status = await newRecording.getStatusAsync();
        if (status.isRecording) {
            setWaveform((prev) => {
            const newVal = Math.random() * 100;
            return [...prev.slice(-49), newVal];
            });
        }
        }, 100);

    } catch (err) {
        console.error('Failed to start recording', err);
    }
};


  const stopRecording = async () => {
    if (!recording) return;
    try {
        clearInterval(interval.current!);
        await recording.stopAndUnloadAsync();
        setRecording(null);
    } catch (error) {
        console.error('Failed to stop recording', error);
    }
};


  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const generatePoints = () =>
    waveform.map((val, idx) => `${idx * 4},${100 - val}`).join(' ');

  return (
    <View className="items-center justify-center w-full p-4">
      <Pressable
        className={`bg-red-500 px-4 py-2 rounded-lg mb-4" ${recording ? "bg-green-600" : ""}`}
        onPress={toggleRecording}
      >
        <Text className="text-white">{recording ? 'Stop' : 'Record'}</Text>
      </Pressable>

      <Svg height="100" width="200" className="bg-gray-800 rounded-md">
        <Polyline
          points={generatePoints()}
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
      </Svg>
    </View>
  );
};

export default MusicMode;
