import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import images from '../../../constants/images'


const menuItems = [
  { key: 'guestQR', label: 'GuestQR', icon: <Ionicons name="qr-code-outline" size={20} /> },
  { key: 'profile', label: 'Profile', icon: <Feather name="user" size={20} /> },
  { key: 'family', label: 'Familiy', icon: <Ionicons name="people-outline" size={20} /> },
  { key: 'notification', label: 'Notification', icon: <Ionicons name="notifications-outline" size={20} /> },
  { key: 'appearance', label: 'Appearance Settings', icon: <Feather name="moon" size={20} /> },
  { key: 'help', label: 'Help Center', icon: <Feather name="info" size={20} /> },
  { key: 'logout', label: 'Logout', icon: <Feather name="log-out" size={20} />, color: 'text-red-500' },
];

const Profile = () => {
  return (
    <SafeAreaView className="flex-1">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <View className="px-6 py-4 flex-row justify-between items-center">
        <Text className="text-xl font-semibold">Profile</Text>
        <TouchableOpacity className="p-2 rounded-full bg-gray-100">
          <Ionicons name="notifications-outline" size={24} />
        </TouchableOpacity>
      </View>

      <View className="items-center mt-6">
        <View className="relative">
          <Image
            source={images.avatar}
            className="w-28 h-28 rounded-full"
          />
          <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full">
            <Feather name="edit-2" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="mt-4 text-xl font-semibold text-white">Adrian Hajdin</Text>
      </View>

      <FlatList
        data={menuItems}
        keyExtractor={item => item.key}
        className="mt-8 px-6"
        renderItem={({ item }) => (
          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <View className="flex-row items-center space-x-4">
              <Text className={`${item.color ?? 'text-white'}`}>{item.icon}</Text>
              <Text className={`${item.color ?? 'text-white'} text-base`}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

export default Profile
