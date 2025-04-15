import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import images from '@/constants/images';


const LoginScreen = () => {
  return (
    <View className="flex-1">
        <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
        <View className="flex-row justify-center items-center my-10">
            <Text className="text-white text-lg text-center">Welcome to  </Text>
            <Image source={images.logo} className="mr-2 h-14 w-36"/>
        </View>

        <Text className="text-center text-black-300 mb-6">
            More than a connection with your homeliving
        </Text>

        <View className="flex-row justify-center items-center mb-4 space-x-4">
            <MaterialCommunityIcons name="face-recognition" size={30} color="white" />
            <Text className="text-white">or</Text>
            <MaterialCommunityIcons name="fingerprint" size={30} color="white" />
        </View>

        <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 my-5 mx-8">
            <MaterialCommunityIcons name="email-outline" size={20} />
            <TextInput
            placeholder="Email"
            className="ml-2 flex-1 text-black"
            />
        </View>

        <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 mb-2 mx-8">
            <MaterialCommunityIcons name="lock-outline" size={20} />
            <TextInput
            placeholder="Password"
            secureTextEntry
            className="ml-2 flex-1 text-black"
            />
        </View>

        <Text className="text-right text-sm text-blue-300 mr-14 my-4">Forgot password</Text>

        <TouchableOpacity className="bg-blue-700 py-3 rounded-full mb-4 mx-8">
            <Text className="text-center font-bold">Login</Text>
        </TouchableOpacity>

        <Text className="text-center text-white mb-2">Or login with</Text>

        <TouchableOpacity className="bg-white py-3 rounded-full mx-8">
            <Text className="text-center font-bold">Google</Text>
        </TouchableOpacity>

        <Text className="text-center text-white mt-6">
            Don’t have an account? <Text className="text-blue-400">Sign In</Text>
        </Text>
    </View>
  );
};

export default LoginScreen;
