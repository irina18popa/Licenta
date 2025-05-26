import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import MyColorPicker from '@/components/MyColorPicker';
import MyWarmColorPicker from '@/components/MyWarmColorPicker'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSharedValue } from 'react-native-reanimated';
import { colorKit } from 'reanimated-color-picker';
import images from '@/constants/images';
import { RouteProp } from '@react-navigation/native';

type Tab = 'Warm' | 'Color' | 'Scene' | 'Music';
const TAB_TITLES: Tab[] = ['Warm', 'Color', 'Scene', 'Music'];

type RootStackParamList = {
  LampControl: { deviceName: string; deviceId: string };
  // …other routes
};

type LampControlRouteProp = RouteProp<RootStackParamList, 'LampControl'>;

const LampControl = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Warm');
  // create a shared value for color so it persists as SharedValue
  const initialColor = colorKit.randomRgbColor().hex();
  const sharedColor = useSharedValue(initialColor);

  

  const renderContent = () => {
    switch (activeTab) {
      case 'Warm':
        return <MyWarmColorPicker sharedColor={sharedColor}></MyWarmColorPicker>
      case 'Color':
        // Pass the SharedValue to the inline picker
        return <MyColorPicker sharedColor={sharedColor} />;
      case 'Scene':
        return <Text className="text-center text-lg text-white">Choose a Scene</Text>;
      case 'Music':
        return <Text className="text-center text-lg text-white">Music Controls</Text>;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <View className="flex-row justify-around py-3">
        {TAB_TITLES.map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 items-center py-2 ${activeTab === tab ? 'border-b-2 border-blue-500' : ''}`}
            onPress={() => setActiveTab(tab)}
          >
            <Text className={`${activeTab === tab ? 'text-blue-500 font-semibold' : 'text-white'} text-base`}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="flex-1 p-4">{renderContent()}</View>
    </SafeAreaView>
  );
};

export default LampControl;