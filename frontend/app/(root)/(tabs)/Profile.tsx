import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import images from '../../../constants/images';  // Default fallback image
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { loadNewProfilePic } from '@/app/apis';

const menuItems = [
  { key: 'guestQR', label: 'GuestQR', icon: <Ionicons name="qr-code-outline" size={20} /> },
  { key: 'profile', label: 'Profile', icon: <Feather name="user" size={20} /> },
  { key: 'family', label: 'Family', icon: <Ionicons name="people-outline" size={20} /> },
  { key: 'notification', label: 'Notification', icon: <Ionicons name="notifications-outline" size={20} /> },
  { key: 'appearance', label: 'Appearance Settings', icon: <Feather name="moon" size={20} /> },
  { key: 'help', label: 'Help Center', icon: <Feather name="info" size={20} /> },
  { key: 'logout', label: 'Logout', icon: <Feather name="log-out" size={20} />, color: 'text-red-500' },
];

const Profile = () => {
  const [userName, setUserName] = useState(''); // State to store user's name
  const [profileImage, setProfileImage] = useState('');

  // Fetch user info from SecureStore
  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = await SecureStore.getItemAsync('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        setUserName(parsedUser.first_name + ' ' + parsedUser.last_name);  // Assuming first_name and last_name are in the response
        setProfileImage(parsedUser.profile_image || ''); // Fallback to default image if no profile_image
      }
    };

    fetchUserInfo();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('user');
    router.replace('/LogIn');
  };

  // Handle image picker to upload new profile image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImageUri = result.assets[0].uri;
      setProfileImage(selectedImageUri); // Update the local state with the new image URI

      // Now upload the selected image to your server
      uploadImageToServer(selectedImageUri);
    } else {
      Alert.alert('No image selected');
    }
  };

  // Update user with new profile image
  const uploadImageToServer = async (imageUri: string) => {
    const user = JSON.parse(await SecureStore.getItemAsync('user'));
    const userToken = await SecureStore.getItemAsync('userToken');

    if (!user || !userToken) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      // Make a PUT request to update the user profile with the new image
      const response = await loadNewProfilePic(user._id, imageUri);

      if (response) {
        // Save the updated user data in SecureStore
        await SecureStore.setItemAsync('user', JSON.stringify(response));
        Alert.alert('Profile updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to upload profile image');
    }
  };

  // Ensure that profileImage is a valid URI, otherwise, use a fallback image
  const getValidImageSource = (img) => {
    // If not a string, return fallback local image
    if (typeof img !== 'string' || !img.trim()) return images.avatar;
    // Base64 or file URI
    if (img.startsWith('data:image') || img.startsWith('file://') || img.startsWith('http')) {
      return { uri: img };
    }
    // Otherwise fallback
    return images.avatar;
  };


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
            source={getValidImageSource(profileImage)} // Validate the URI before passing it to the Image component
            className="w-28 h-28 rounded-full"
          />
          <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full" onPress={pickImage}>
            <Feather name="edit-2" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="mt-4 text-xl font-semibold text-white">{userName || 'Loading...'}</Text>
      </View>

      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.key}
        className="mt-8 px-6"
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center justify-between py-4 border-b border-gray-200"
            onPress={item.key === 'logout' ? handleLogout : () => router.push(`/${item.key}`)}
          >
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
};

export default Profile;
