import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/app/LogIn';
import SignUpScreen from '@/app/SignUp';
import VoiceAssistant from '@/app/TestVoiceAssistant'
import DemoTTS from '@/app/DemoTTS'

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name='VoiceAssistant' component={VoiceAssistant} />
        <Stack.Screen name='DemoTTS' component={DemoTTS} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
