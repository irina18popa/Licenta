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
  ToastAndroid,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import images from '@/constants/images';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUser } from './apis';
import validator from 'validator'


const SignUpScreen: React.FC = () => {

  const [first_name, setFirstName]         = useState('');
  const [last_name, setLastName]           = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const isEmailValid = validator.isEmail(email);

  const isPasswordValid = () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])(?!.*\s).{8,}$/;
    return passwordRegex.test(password);
  };

  const isFormValid = () => {
    return (
      first_name.trim() &&
      last_name.trim() &&
      email.trim() &&
      password &&
      confirmPassword &&
      password === confirmPassword &&
      isEmailValid &&
      isPasswordValid()
    );
  };

  const handleSignUp = async () => {
    if (!isFormValid() || loading) return;

    setLoading(true)

    try {
      await createUser({
        first_name,
        last_name,
        email,
        password,
        role: 'user', // or whatever default role you'd like
      });

      const msg = 'Signed up successfully!';
      Platform.OS === 'android'
        ? ToastAndroid.show(msg, ToastAndroid.SHORT)
        : Alert.alert('Success', msg);

      router.push('/LogIn');

    } catch (error) {
      const err = error as any;
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to sign up';
      
      const myerrormsg = 'Sign Up Failed. Try a different email or password!'
      Platform.OS === 'android'
        ? ToastAndroid.show(myerrormsg, ToastAndroid.LONG)
        : Alert.alert(myerrormsg);
    } finally{
      setLoading(false)
    }
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
            placeholder="First Name (ex: John)"
            placeholderTextColor="#4B5563"
            value={first_name}
            onChangeText={setFirstName}
            className="ml-2 flex-1 text-black"
          />
        </View>

        <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 mb-4">
          <MaterialCommunityIcons name="account-outline" size={20} />
          <TextInput
            placeholder="Last Name (ex: Doe)"
            placeholderTextColor="#4B5563"
            value={last_name}
            onChangeText={setLastName}
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
        {!isEmailValid && email.length > 0 && (
          <Text className="text-red-500 ml-2 mb-4">Invalid email format</Text>
        )}

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
        {!isPasswordValid() && password.length > 0 && (
          <Text className="text-red-500 ml-2 mb-4">
            Password must be 8+ chars with upper, lower, digit, symbol, no spaces.
          </Text>
        )}
        
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
        {confirmPassword !== password && confirmPassword.length > 0 && (
          <Text className="text-red-500 ml-2 mb-2 mt-2">Passwords do not match</Text>
        )}
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        onPress={handleSignUp}
        className={`py-3 rounded-full mb-4 mx-8 mt-4 ${isFormValid() ? 'bg-blue-700' : 'bg-gray-500'}`}
        disabled={!isFormValid}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="text-center text-white font-bold">Sign Up</Text>
        )}
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
