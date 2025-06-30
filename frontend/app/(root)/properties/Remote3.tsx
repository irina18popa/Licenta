import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, Image, Pressable, TouchableOpacity, Platform, ToastAndroid, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import images from '@/constants/images';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { getDeviceById, getDeviceStateById, handleRequest, uploadFile, deleteMediaByUrl } from '@/app/apis';
import * as FileSystem from 'expo-file-system';
import { useScenarioBuilder } from '@/app/contexts/ScenarioBuilderContext';



const RemoteControlScreen: React.FC = () => {

  const [volume, setVolume] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const { id, mode } = useLocalSearchParams<{ id: string; mode?: 'live' | 'scenario' }>()
  const { add } = useScenarioBuilder()

    
  useEffect(() => {
    (async () => {
      try {
        const resp = await getDeviceStateById(id);
        const arr  = resp.data || [];

        // find the two entries
        const volEntry = arr.find(e => e.code.endsWith(':GetVolume'));
        const muteEntry = arr.find(e => e.code.endsWith(':GetMute'));

        if (volEntry)  setVolume(Number(volEntry.value));
        if (muteEntry) setIsMuted(Boolean(muteEntry.value));
      } catch (err) {
        console.warn('Failed to load device state', err);
      }
    })();
  }, [id]);


  // helper to publish an UPnP command
  const sendCommand = async (commandName: string, params: Record<string, any>) => {
    const dev     = await getDeviceById(id);
    const protocol = 'upnp'
    const address = dev.metadata || 'unknown';
    const payload = { protocol, address, commands: [{ name: commandName, parameters: params }] };
    const topic   = `app/devices/${id}/do_command/in`;
    await handleRequest(topic, 'publish', JSON.stringify(payload));
  };
  

  const pickVideo = async () => {
    // 1) pick
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const localUri = asset.uri;

    // 2) upload
    showToast('Uploading video…');
    let mediaUrl: string;
    try {
      mediaUrl = await uploadFile(localUri);
    } catch (e) {
      console.error(e);
      return Alert.alert('Upload failed');
    }
    console.log('▶ Uploaded, URL =', mediaUrl);
    //Alert.alert('Debug', `Media URL: ${mediaUrl}`);

    const cmd = {
      name: 'urn:schemas-upnp-org:service:AVTransport:1:SetAVTransportURI',
      parameters: { InstanceID: 0, CurrentURI: mediaUrl, CurrentURIMetaData: '' }
    };

    if (mode === 'live') {
      // send immediately
      await sendCommand(cmd.name, cmd.parameters);
    } else {
      // stash for later
      await add(id, 'upnp', { name: cmd.name, parameters: cmd.parameters });
    }

    setVideoUri(mediaUrl);
  };



  // Show toast or alert
  const showToast = (msg: string) => {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };

  // Handlers

  const changeVolume = async (unit:number) => {
    const newVol = Math.min(100, Math.max(0, volume + unit));
    setVolume(newVol);
    
    const cmd = {
      name: 'urn:schemas-upnp-org:service:RenderingControl:1:SetVolume',
      parameters: { InstanceID: 0, Channel: 'Master', DesiredVolume: newVol }
    };

    if (mode === 'live') {
      // send immediately
      await sendCommand(cmd.name, cmd.parameters);
    } else {
      // stash for later
      add(id, 'upnp', { name: cmd.name, parameters: cmd.parameters });
    }
    //showToast(`Volume: ${newVol}`);
  };


  const toggleMute = async () => {
    const target = !isMuted;
    setIsMuted(target);

    const cmd = {
      name: 'urn:schemas-upnp-org:service:RenderingControl:1:SetMute',
      parameters: { InstanceID: 0, Channel: 'Master', DesiredMute: target }
    };

    if (mode === 'live') {
      // send immediately
      await sendCommand(cmd.name, cmd.parameters);
    } else {
      // stash for later
      add(id, 'upnp', { name: cmd.name, parameters: cmd.parameters });
    }
    //showToast(target ? 'Muted' : 'Unmuted');
  };


  const togglePlay = async() => {
    let cmd = {name:'', parameters:{}}

    if (isPlaying) {
    // currently playing → send STOP
      cmd = {
        name: 'urn:schemas-upnp-org:service:AVTransport:1:Stop',
        parameters: { InstanceID: 0 }
      };
      await deleteMediaByUrl(videoUri)
      showToast('Stopped');

    } else {
      // currently stopped → send PLAY
      cmd = {
        name: 'urn:schemas-upnp-org:service:AVTransport:1:Play',
        parameters: { InstanceID: 0, Speed: '1' }
      };
      showToast('Playing');
    }

    if (mode === 'live') {
      // send immediately
      await sendCommand(cmd.name, cmd.parameters);
    } else {
      // stash for later
      add(id, 'upnp', { name: cmd.name, parameters: cmd.parameters });
    }
    // flip the UI state
    setIsPlaying(prev => !prev);
  };


  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />

      {/* TV Image */}
      <View className="items-center mt-24">
        <Image source={images.tv} className="w-64 h-40" resizeMode="contain" />
      </View>

      {/* Title & Underline */}
      <View className="items-center mt-2">
        <Text className="text-white text-lg font-semibold">JVC TV</Text>
        <View className="w-16 h-0.5 bg-white mt-1" />
      </View>

      {/* Controls Container */}
    <BlurView intensity={100} tint="dark" style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '65%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        }}>
        <View className="flex-1 justify-around px-16 py-12">
        {/* Top Row: Mute and Load and vol*/}
        <View className="flex-row justify-between items-center">
          {/* Left Column: Mute & Load */}
          <View className="items-center">
            <TouchableOpacity className="items-center" onPress={toggleMute}>
              <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center">
                <Ionicons name={isMuted ? 'volume-high' : 'volume-mute'} size={24} color="black" />
              </View>
              <Text className="text-white mt-1">{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center mt-8" onPress={pickVideo} >
              <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center">
                <Ionicons name="download-outline" size={24} color="black" />
              </View>
              <Text className="text-white mt-1">Load content</Text>
            </TouchableOpacity>
          </View>

          {/* Right Column: Volume Slider */}
          <View className="items-center">
            <View className="w-20 h-60 rounded-full bg-gray-300 items-center justify-between py-2">
              <TouchableOpacity onPress={() => changeVolume(1)}>
                  <Ionicons name="add" size={30} color="black" />
              </TouchableOpacity>
              <Text className="text-black text-xl">{volume}</Text>
              <TouchableOpacity onPress={() => changeVolume(-1)}>
                  <Ionicons name="remove" size={30} color="black" />
              </TouchableOpacity>            
            </View>
            <Text className="text-white mt-1">Volume</Text>
          </View>
        </View>

        {/* Bottom Row: Media Control and Stop */}
        <View className="flex-row justify-between items-center">
          {/* Media Control Pad */}
          <View className="items-center">
            <View className="w-36 h-36 rounded-full bg-gray-300 items-center justify-center">
              {/* D-Pad Arrows */}
              <Ionicons name="caret-up" size={30} color="black" style={{ position: 'absolute', top: 10 }} />
              <Ionicons name="caret-down" size={30} color="black" style={{ position: 'absolute', bottom: 10 }} />
              <Ionicons name="caret-back" size={30} color="black" style={{ position: 'absolute', left: 10 }} />
              <Ionicons name="caret-forward" size={30} color="black" style={{ position: 'absolute', right: 10 }} />
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-500 items-center justify-center" onPress={togglePlay}>
                <Ionicons name={isPlaying ? 'stop' : 'play'} size={30} color="black" />
              </TouchableOpacity>
            </View>
            <Text className="text-white mt-1">Media Control</Text>
          </View>

          {/* Stop Button */}
          {/* <TouchableOpacity className="items-center" onPress={handleStop}>
            <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center">
              <Ionicons name="square" size={24} color="black" />
            </View>
            <Text className="text-white mt-1">Stop</Text>
          </TouchableOpacity> */}
        </View>
      </View>
      </BlurView>
    </SafeAreaView>
  );
};

export default RemoteControlScreen;
