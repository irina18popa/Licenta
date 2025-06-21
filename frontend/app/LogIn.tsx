import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import images from '@/constants/images';
import { Link, router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginUser } from './apis';
import * as SecureStore from 'expo-secure-store'


const LoginScreen = () => {

    // async function handleBiometricAuth() {
    // // 1. Check if hardware supports biometrics
    // const hasHardware = await LocalAuthentication.hasHardwareAsync();
    // if (!hasHardware) {
    //     Alert.alert('Biometrics not supported on this device');
    //     return false;
    // }
    
    // // 2. Check if any biometrics are enrolled
    // const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    // if (!isEnrolled) {
    //     Alert.alert('No biometrics enrolled. Please set up Face ID or fingerprint on your device.');
    //     return false;
    // }
    
    // // 3. Prompt the user
    // const result = await LocalAuthentication.authenticateAsync({
    //     promptMessage: 'Log in with Biometrics',
    //     fallbackLabel: 'Use Passcode',   // optional, only iOS
    // });

    // return result.success;
    // }


    const [isBiometricAuthSupported, setIsBiometricAuthSupported] = useState(false)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const fallBackToDefaultAuth=()=>
    {
        console.log("auth with password please")
    }

    const alertComponent=(
        title, 
        mess,
        btnTxt,
        btnFunc,
    ) => {
        return Alert.alert(title, mess, [
            {
                text:btnTxt,
                onPress: btnFunc
            }
        ])
    }

    const TwoButtonAlert = ()=>
    {
        Alert.alert("You are logged in", "Welcome to your Smart Home",[
            {
                text:"Back",
                onPress:()=>console.log("Cancel Pressed"),
                style:"cancel"
            },
            {
                text:"START",
                onPress:()=>console.log("OK Pressed"),
            }
        ])
    }

    const handleBiometricAuth = async() =>
    {
        const isBiometricAvailable = await LocalAuthentication.hasHardwareAsync()

        if(!isBiometricAvailable)
        {
            return alertComponent(
                'Auth with password please',
                'Biometric Auth not supported',
                'OK',
                ()=> fallBackToDefaultAuth()
            )
        }

        let supportedBiometrics
        supportedBiometrics = await LocalAuthentication.supportedAuthenticationTypesAsync()
    
        const savedBiometrics = await LocalAuthentication.isEnrolledAsync()
        if(!savedBiometrics)
        {
            return alertComponent(
                'Biometric record not found',
                'Auth with password please',
                'OK',
                () => fallBackToDefaultAuth()
            )
        }

        // const { success } = await LocalAuthentication.authenticateAsync({
        //     promptMessage: 'Authenticate',
        //     cancelLabel: 'Cancel',
        //     // disableDeviceFallback: true,
        //   });
        
        //   if (success) {
        //     TwoButtonAlert();        // only on real success
        //   } else {
        //     alertComponent('Authentication failed', 'Please try again', 'OK', () => {});
        //   }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate',
            cancelLabel: 'Cancel',
            // disableDeviceFallback: true, // comment out until it works
          });
          console.log('Biometric result:', result);
        
          if (result.success) {
            TwoButtonAlert();
          } else {
            alertComponent(
              'Authentication failed',
              result.error
                ? `Error: ${result.error}`
                : 'Please try again',
              'OK',
              () => {}
            );
          }
    }

    useEffect(() => {
        (async () => {
          const compatible = await LocalAuthentication.hasHardwareAsync();
          setIsBiometricAuthSupported(compatible);
        })();
      }, []);  // important: invoke once on mount


    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);

        try {
            const response = await loginUser(email, password);
            // TODO: navigate or save user context/token if needed
            //console.log("response", response); // Add this line to inspect the response structure
        
            if (response?.token) {
                // Store token and user info
                await SecureStore.setItemAsync('userToken', response.token);
                await SecureStore.setItemAsync('user', JSON.stringify(response.user));

                Alert.alert('Welcome!', `Logged in as ${response.user.first_name} ${response.user.last_name}`);
                router.replace('/'); // Navigate to the home screen
            } else {
                Alert.alert('Login Failed', 'Token not found in response');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Login failed';
            Alert.alert('Login Failed', errorMsg);
        } finally {
            setLoading(false);
        }
    };


  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top']}>
        <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
        <View className="flex-row justify-center items-center my-8">
            <Text className="text-white text-lg text-center">Welcome to  </Text>
            <Image source={images.logo} className="mr-2 h-14 w-36"/>
        </View>

        <Text className="text-center text-black-300 mb-16 font-bold">
            More than a connection with your homeliving
        </Text>

        {
            isBiometricAuthSupported && (
                <View className="flex-row justify-center items-center mb-4 space-x-16">
                <TouchableOpacity onPress={handleBiometricAuth} className="flex-row items-center space-x-2">
                    <MaterialCommunityIcons name="face-recognition" size={30} color="white" />
                    <Text className="text-white">or</Text>
                    <MaterialCommunityIcons name="fingerprint" size={30} color="white" />
                </TouchableOpacity>
                </View>
            )
        }

        <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 my-5 mx-8">
            <MaterialCommunityIcons name="email-outline" size={20} />
            <TextInput
            placeholder="Email"
            placeholderTextColor="#4B5563"
            value={email}
            onChangeText={setEmail}
            className="ml-2 flex-1 text-black"
            />
        </View>

        <View className="flex-row items-center bg-gray-200 rounded-full px-4 py-3 mb-2 mx-8">
            <MaterialCommunityIcons name="lock-outline" size={20} />
            <TextInput
            placeholder="Password"
            placeholderTextColor="#4B5563"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            className="ml-2 flex-1 text-black"
            />
        </View>

        <Text className="text-right text-sm text-blue-300 mr-14 my-4">Forgot password</Text>

        <TouchableOpacity className="bg-blue-700 py-3 rounded-full mb-4 mx-8" 
                            onPress={handleLogin}
                            disabled={loading}>
            <Text className="text-center font-bold">{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        <Text className="text-center text-white mb-2">Or login with</Text>

        <TouchableOpacity className="bg-white py-3 rounded-full mx-8 flex-row items-center justify-center">
            <MaterialCommunityIcons name='google' size={20}></MaterialCommunityIcons>
            <Text className="text-center font-bold ml-1">Google</Text>
        </TouchableOpacity>

        <View className='flex-row items-center justify-center mt-6'>
            <Text className="text-white">Don’t have an account? </Text>
            <Link className='text-blue-300' href="/SignUp">SignUp</Link>
        </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
