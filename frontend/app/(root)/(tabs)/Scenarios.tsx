import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import images from '../../../constants/images';
import { SafeAreaView } from 'react-native-safe-area-context';

const scenarios = [
  'Movie Time',
  'Reading',
  'Date Night',
  'Party Hours',
];

export default function Scenarios() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
        <Image
          source={images.background}
          className="absolute w-full h-full"
          blurRadius={10}>
        </Image>
      <View className="px-6">
        <Text className="text-2xl font-bold text-gray-800 mb-4">
          Configure Your Moments
        </Text>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {scenarios.map((title) => (
            <TouchableOpacity
              key={title}
              className="bg-white p-4 mb-3 rounded-lg shadow"
              onPress={() => console.log(`Pressed ${title}`)}
            >
              <Text className="text-lg text-gray-800">
                {title}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            className="bg-blue-500 p-4 mt-2 rounded-lg items-center"
            onPress={() => console.log('Add new scenario')}
          >
            <Text className="text-lg text-white">+ Add Scenario</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
