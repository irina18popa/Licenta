import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import images from '../../../constants/images';  // Default fallback image
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { getLoggedInUser, loadNewProfilePic } from '@/app/apis';
import * as Location from 'expo-location';

const menuItems = [
  { key: 'settings', label: 'Settings', icon: <Feather name="user" size={20} /> },
  { key: 'logout', label: 'Logout', icon: <Feather name="log-out" size={20} />, color: 'text-red-500' },
];

const Profile = () => {
  const [profileImage, setProfileImage] = useState('');
  const [userName, setUserName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [city, setCity] = useState('');              // the city only, for SecureStore
  const [locationCoords, setLocationCoords] = useState(null);  // for reverse geocoding (lat/lng)
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState('');

  // Fetch user info from SecureStore
  useEffect(() => {
    const fetchUserInfo = async () => {
      const userStr = await SecureStore.getItemAsync('user');
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        setUserName(parsedUser.first_name + ' ' + parsedUser.last_name);
        setProfileImage(parsedUser.profile_image || '');
        // Only the city string is saved        
        setCity(parsedUser.location || '');
      }
    };
    fetchUserInfo();
  }, []);

  // Whenever locationCoords changes, update address for UI
  useEffect(() => {
    if (locationCoords && locationCoords.latitude && locationCoords.longitude) {
      fetchAddressFromCoords(locationCoords);
    } else {
      setAddress('');
    }
  }, [locationCoords]);

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('user');
    router.replace('/LogIn');
  };

  const fetchAddressFromCoords = async (coords) => {
    if (!coords) return setAddress('');
    try {
      const geocode = await Location.reverseGeocodeAsync(coords);
      if (geocode && geocode[0]) {
        const { city, country, street, name } = geocode[0];
        const formatted = [street || name, city, country].filter(Boolean).join(', ');
        setAddress(formatted);
      } else {
        setAddress('Unknown address');
      }
    } catch (e) {
      setAddress('Unknown address');
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImageUri = result.assets[0].uri;
      setProfileImage(selectedImageUri);
      uploadImageToServer(selectedImageUri);
    } else {
      Alert.alert('No image selected');
    }
  };

  const uploadImageToServer = async (imageUri) => {
    const user = JSON.parse(await SecureStore.getItemAsync('user'));
    const userToken = await SecureStore.getItemAsync('userToken');

    if (!user || !userToken) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const response = await loadNewProfilePic(user._id, imageUri);

      if (response) {
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

  const getValidImageSource = (img) => {
    if (typeof img !== 'string' || !img.trim()) return images.avatar;
    if (img.startsWith('data:image') || img.startsWith('file://') || img.startsWith('http')) {
      return { uri: img };
    }
    return images.avatar;
  };

  const handleShowDetails = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  // When pressing "Change Location", update both SecureStore (city) and set UI address (from lat/lng)
  const handleChangeLocation = async () => {
    setLocating(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
      setLocating(false);
      return;
    }
    let newLoc = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: newLoc.coords.latitude,
      longitude: newLoc.coords.longitude,
    };

    // Reverse geocode to get city
    let newCity = '';
    try {
      const geocode = await Location.reverseGeocodeAsync(coords);
      if (geocode && geocode[0] && geocode[0].city) {
        newCity = geocode[0].city;
        // set address with full info (street, city, country)
        const { street, name, country } = geocode[0];
        setAddress([street || name, newCity, country].filter(Boolean).join(', '));
      } else {
        setAddress('');
      }
    } catch (e) {
      newCity = '';
      setAddress('');
    }

    setLocationCoords(coords); // Save for further reverse geocode if needed
    setCity(newCity); // This is the only thing saved in SecureStore

    // Save just the city in SecureStore
    if (user) {
      const updatedUser = { ...user, location: newCity };
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }

    setLocating(false);
  };

  return (
    <SafeAreaView className="flex-1">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <View className="items-center mt-6">
        <View className="relative">
          <Image
            source={getValidImageSource(profileImage)}
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
            onPress={async () => {
              if (item.key === 'logout') {
                handleLogout();
              } else if (item.key === 'settings') {
                const loggedInUser = await getLoggedInUser();
                setUser(loggedInUser);
                setCity(loggedInUser?.location ?? '');
                setModalVisible(true);
              } else {
                router.push(`/${item.key}`);
              }
            }}
          >
            <View className="flex-row items-center space-x-4">
              <Text className={`${item.color ?? 'text-white'}`}>{item.icon}</Text>
              <Text className={`${item.color ?? 'text-white'} ml-4 text-base`}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 bg-black/60 justify-center items-center">
          <View className="bg-[#222] rounded-2xl px-6 py-6 min-w-[260px] max-w-[340px] w-11/12 items-center shadow-lg">
            <Text className="text-white text-lg font-bold mb-5 text-center">
              User Details
            </Text>
            <View className="w-full mb-2">
              <Text className="text-gray-400 text-xs mb-1">First Name</Text>
              <Text className="text-white text-base">{user?.first_name ?? '-'}</Text>
            </View>
            <View className="w-full mb-2">
              <Text className="text-gray-400 text-xs mb-1">Last Name</Text>
              <Text className="text-white text-base">{user?.last_name ?? '-'}</Text>
            </View>
            <View className="w-full mb-2">
              <Text className="text-gray-400 text-xs mb-1">Email</Text>
              <Text className="text-white text-base">{user?.email ?? '-'}</Text>
            </View>
            <View className="w-full mb-2">
              <Text className="text-gray-400 text-xs mb-1">Location</Text>
              <Text className="text-white text-base">
                {address ? address : (city || 'No location set')}
              </Text>
            </View>
            <TouchableOpacity
              className={`mt-3 w-full rounded-xl bg-blue-700 py-3 ${locating ? 'opacity-60' : ''}`}
              onPress={handleChangeLocation}
              disabled={locating}
            >
              <Text className="text-white text-center font-bold text-base">
                {locating ? 'Updating...' : 'Change Location'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-4 px-5 py-2 rounded-xl bg-gray-700 self-center"
              onPress={handleCloseModal}
            >
              <Text className="text-blue-200 font-bold text-base">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
