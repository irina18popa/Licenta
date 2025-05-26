import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardTypeOptions,
  Alert,
  Platform,
  ToastAndroid
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import images from '@/constants/images';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignUpScreen: React.FC = () => {
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleSignUp = () => {
    // your signup logic...
    const msg = 'Signed up successfully!';
    Platform.OS === 'android'
      ? ToastAndroid.show(msg, ToastAndroid.SHORT)
      : Alert.alert('Success', msg);
    router.push('/LogIn');
  };

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
      <Image
        source={images.background}
        className="absolute w-full h-full"
        blurRadius={10}
      />

      {/* Header / Logo */}
      <View className="flex-row justify-center items-center my-10">
        <Text className="text-white text-lg text-center">Welcome to </Text>
        <Image source={images.logo} className="h-14 w-36 ml-2" />
      </View>

      <Text className="text-center text-black-300 mb-16 mx-8 font-bold">
        More than a connection with your homeliving
      </Text>

      {/* Form Fields */}
      <View className="flex flex-col space-y-4 mx-8 mb-8">
        <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 mb-4">
          <MaterialCommunityIcons name="account-outline" size={20} />
          <TextInput
            placeholder="Name"
            placeholderTextColor="#4B5563"
            value={name}
            onChangeText={setName}
            className="ml-2 flex-1 text-black"
          />
        </View>

        <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 mb-4">
          <MaterialCommunityIcons name="email-outline" size={20} />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#4B5563"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            className="ml-2 flex-1 text-black"
          />
        </View>

        <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 mb-4">
          <MaterialCommunityIcons name="lock-outline" size={20} />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#4B5563"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="ml-2 flex-1 text-black"
          />
        </View>

        <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3">
          <MaterialCommunityIcons name="lock-check-outline" size={20} />
          <TextInput
            placeholder="Confirm password"
            placeholderTextColor="#4B5563"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            className="ml-2 flex-1 text-black"
          />
        </View>
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        onPress={handleSignUp}
        className="bg-blue-700 py-3 rounded-full mb-4 mx-8 mt-6"
      >
        <Text className="text-center text-white font-bold">Sign Up</Text>
      </TouchableOpacity>

      {/* Or login link */}
      <View className="flex-row justify-center items-center mb-4">
        <Text className="text-white">Already have an account? </Text>
        <Link href="/LogIn" className="text-blue-300 font-bold">
          Log In
        </Link>
      </View>

      <Text className="text-center text-white mb-2">Or sign up with</Text>

      {/* Google Button */}
      <TouchableOpacity className="bg-white py-3 rounded-full mx-8 flex-row items-center justify-center mb-6">
        <MaterialCommunityIcons name="google" size={20} />
        <Text className="font-bold ml-2">Google</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default SignUpScreen;
