import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardTypeOptions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import images from '@/constants/images';
import { useRouter } from 'expo-router';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// 2) Define a field descriptor interface
interface FieldDescriptor {
  icon: IconName;
  placeholder: string;
  value: string;
  setter: (text: string) => void;
  secure: boolean;
  keyboard?: KeyboardTypeOptions;
}

const  SignUpScreen = () => {
  // 3) State declarations come first
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]             = useState(false);
  const router = useRouter();

  // 4) Then you can build your typed fields array
  const fields: FieldDescriptor[] = [
    {
      icon: 'account-outline',
      placeholder: 'Name',
      value: name,
      setter: setName,
      secure: false,
    },
    {
      icon: 'email-outline',
      placeholder: 'Email',
      value: email,
      setter: setEmail,
      secure: false,
      keyboard: 'email-address',
    },
    {
      icon: 'lock-outline',
      placeholder: 'Password',
      value: password,
      setter: setPassword,
      secure: true,
    },
    {
      icon: 'lock-check-outline',
      placeholder: 'Confirm password',
      value: confirmPassword,
      setter: setConfirmPassword,
      secure: true,
    },
  ];



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

      <View className="space-y-4">
        {[
          { icon: 'account-outline', placeholder: 'Name', value: name, setter: setName, secure: false },
          { icon: 'email-outline',    placeholder: 'Email', value: email, setter: setEmail, secure: false, keyboard: 'email-address' },
          { icon: 'lock-outline',      placeholder: 'Password', value: password, setter: setPassword, secure: true },
          { icon: 'lock-check-outline',placeholder: 'Confirm password', value: confirmPassword, setter: setConfirmPassword, secure: true },
        ].map(({ icon, placeholder, value, setter, secure, keyboard }, i) => (
          <View
            key={i}
            className="flex-row items-center bg-gray-200 rounded-full px-4 py-3"
          >
            <MaterialCommunityIcons name={icon} size={20} />
            <TextInput
              placeholder={placeholder}
              value={value}
              onChangeText={setter}
              secureTextEntry={secure}
              keyboardType={keyboard as any}
              className="ml-2 flex-1 text-black"
            />
          </View>
        ))}
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
