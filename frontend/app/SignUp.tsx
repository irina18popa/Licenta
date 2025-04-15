import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import images from '@/constants/images';

const SignUpScreen = () => {
  return (
    <View className="flex-1">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <View className="flex-row justify-center items-center my-10">
          <Text className="text-white text-lg text-center">Welcome to  </Text>
          <Image source={images.logo} className="mr-2 h-14 w-36"/>
      </View>

      <Text className="text-center text-blue-500 mb-6">
        More than a connection with your homeliving
      </Text>

      <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 mb-3">
        <MaterialCommunityIcons name="account-outline" size={20} />
        <TextInput placeholder="Name" className="ml-2 flex-1 text-black" />
      </View>

      <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 mb-3">
        <MaterialCommunityIcons name="email-outline" size={20} />
        <TextInput placeholder="Email" className="ml-2 flex-1 text-black" />
      </View>

      <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 mb-3">
        <MaterialCommunityIcons name="lock-outline" size={20} />
        <TextInput placeholder="Password" secureTextEntry className="ml-2 flex-1 text-black" />
      </View>

      <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 mb-3">
        <MaterialCommunityIcons name="lock-check-outline" size={20} />
        <TextInput placeholder="Confirm password" secureTextEntry className="ml-2 flex-1 text-black" />
      </View>

      <TouchableOpacity className="bg-white py-3 rounded-full mb-4">
        <Text className="text-center font-bold">Sign Up</Text>
      </TouchableOpacity>

      <Text className="text-center text-white mb-2">Or login with</Text>

      <TouchableOpacity className="bg-white py-3 rounded-full">
        <Text className="text-center font-bold">Google</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUpScreen;
