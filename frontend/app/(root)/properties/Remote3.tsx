import React, { useState } from 'react';
import { SafeAreaView, View, Text, Image, Pressable, TouchableOpacity, Platform, ToastAndroid, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import images from '@/constants/images';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';


const RemoteControlScreen: React.FC<{ scanning?: boolean }> = ({ scanning = false }) => {

    const [volume, setVolume] = useState<number>(10);
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoUri, setVideoUri] = useState<string | null>(null);

    const { id } = useLocalSearchParams();
    console.log("deviceId:", id);

  const pickVideo = async () => {
    // ask permission (on iOS you also need to add keys to Info.plist)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow gallery access to pick a video.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      // URIs in v5+ are in result.assets[0].uri
      const uri = result.assets[0].uri;
      setVideoUri(uri);
      Platform.OS === 'android'
        ? ToastAndroid.show('Video selected!', ToastAndroid.SHORT)
        : Alert.alert('Selected', 'Video loaded.');
    }
  };

  // Show toast or alert
  const showVolume = (val: number) => {
    const message = `Volume: ${val}`;
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Volume Changed', message);
    }
  };

  // Handlers
  const increaseVolume = () => {
    const newVol = volume + 1;
    setVolume(newVol);
    showVolume(newVol);
  };

  const decreaseVolume = () => {
    const newVol = Math.max(0, volume - 1);
    setVolume(newVol);
    showVolume(newVol);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    const msg = isMuted ? 'Unmuted' : 'Muted';
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
    const msg = isPlaying ? 'Paused' : 'Playing';
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
        <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      {/* <View className="flex-row items-center px-4 py-2">
        <Pressable className="p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
      </View> */}

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

            <TouchableOpacity className="items-center mt-8" onPress={pickVideo}>
              <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center">
                <Ionicons name="download-outline" size={24} color="black" />
              </View>
              <Text className="text-white mt-1">Load content</Text>
            </TouchableOpacity>
          </View>

          {/* Right Column: Volume Slider */}
          <View className="items-center">
            <View className="w-20 h-60 rounded-full bg-gray-300 items-center justify-between py-2">
                <TouchableOpacity onPress={increaseVolume}>
                    <Ionicons name="add" size={30} color="black" />
                </TouchableOpacity>
              <Text className="text-black text-xl">VOL</Text>
                <TouchableOpacity onPress={decreaseVolume}>
                    <Ionicons name="remove" size={30} color="black" />
                </TouchableOpacity>            
            </View>
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
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="black" />
              </TouchableOpacity>
            </View>
            <Text className="text-white mt-1">Media Control</Text>
          </View>

          {/* Stop Button */}
          <TouchableOpacity className="items-center">
            <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center">
              <Ionicons name="square" size={24} color="black" />
            </View>
            <Text className="text-white mt-1">Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
      </BlurView>
    </SafeAreaView>
  );
};

export default RemoteControlScreen;
