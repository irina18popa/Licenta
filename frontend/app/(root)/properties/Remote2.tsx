import { View, Text, ScrollView, Image, Pressable } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import images from '@/constants/images';

const Remote2 = () => {
  const commands = ['Mute', 'Load content', 'Vol +', 'Vol -', 'Stop', 'Media Control'];

  return (
    <SafeAreaView className="flex-1">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="relative"
        showsVerticalScrollIndicator={false}
      >
        {/* TV Illustration */}
        <View className="items-center mt-6">
          <Image source={images.tv} className="w-64 h-40" resizeMode="contain" />
        </View>

        {/* Device Name */}
        <View className="absolute top-40 left-0 right-0 items-center">
          <Text className="text-white text-lg font-semibold border-b border-white/70 pb-1">
            JVC TV
          </Text>
        </View>

        {/* Frosted Controls Panel */}
        <BlurView intensity={80} tint="dark" className="absolute bottom-0 w-full h-3/4 px-6 pt-8 rounded-lg">
          <View className="flex-row flex-wrap justify-center space-x-4">
            {commands.map(cmd => (
              <Pressable
                key={cmd}
                onPress={() => console.log('Send', cmd)}
                className="
                  bg-neutral-800/60 
                  rounded-full 
                  m-2 
                  w-20 
                  h-20 
                  justify-center 
                  items-center
                  shadow-lg
                "
              >
                {/* Here you would swap in your icon, or just show text */}
                <Text className="text-white text-sm text-center">{cmd}</Text>
              </Pressable>
            ))}
          </View>
        </BlurView>
      </ScrollView>
    </SafeAreaView>
  );
}

export default Remote2