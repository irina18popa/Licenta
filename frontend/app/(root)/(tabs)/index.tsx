import { View, Text, TouchableOpacity, Image, StatusBar, TextInput, FlatList, ImageSourcePropType, ListRenderItem, Switch, Alert } from 'react-native'
import React, { useState } from 'react'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import images from '../../../constants/images'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const WEATHER_API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';
const CITY_NAME = 'City Name'; // make dynamic if needed

const rooms = [
  { id: '1', name: 'Living room', image: images.livingroom },
  { id: '2', name: 'Bedroom 1', image: images.bedroom },
  // more rooms
];

// Device data
const initialDevices = [
  { id: '1', name: 'JVC Tv', icon: <Ionicons name="tv-outline" size={24} color="white" />, status: true },
  { id: '2', name: 'Smart lamp', icon: <Ionicons name="bulb-outline" size={24} color="white" />, status: true },
];

interface Weather {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    description: string;
    icon: string
  }>;
  wind: {
    speed: number;
  };
}

interface Room {
  id: string;
  name: string;
  image: ImageSourcePropType;
}


const HomeScreen = () => {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedTab, setSelectedTab] = useState<'Rooms'|'Devices'>('Rooms');
  const [devices, setDevices] = useState(initialDevices);

  const router = useRouter()

  const TwoButtonAlert = ()=>
      {
          Alert.alert("Add device", "Choose a device type:",[
              {
                  text:"Tuya",
                  onPress:()=>console.log("Cancel Pressed"),
                  style:"cancel"
              },
              {
                  text:"UPNP",
                  onPress:()=> router.navigate('/AddDevice'),
              }
          ])
      }

  // useEffect(() => { fetchWeather(); }, []);

  // const fetchWeather = async () => {
  //   try {
  //     const res = await fetch(
  //       `https://api.openweathermap.org/data/2.5/weather?q=${CITY_NAME}&units=metric&appid=${WEATHER_API_KEY}`
  //     );
  //     const data = await res.json();

  //     if (!res.ok || typeof data.main?.temp !== 'number') {
  //     console.warn('Weather API error:', data);
  //     return;
  //   }

  //   setWeather(data);
  //     setWeather(data);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  const toggleDevice = (id: string) => {
    setDevices(prev => prev.map(dev => dev.id === id ? { ...dev, status: !dev.status } : dev));
  };

  const renderRoom: ListRenderItem<Room> = ({ item }) => (
    <TouchableOpacity className="mr-4 w-60" onPress={() => router.navigate('/properties/Remote2')}>
      <Image source={item.image} className="w-full h-72 rounded-xl mb-2" />
      <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
    </TouchableOpacity>
  );

  const renderDevice: ListRenderItem<typeof devices[0]> = ({ item }) => {
  // item.id is a string, so compare to '2'
  const screen =
    item.id === '2'
      ? '/properties/LampControl'
      : '/properties/RemoteControl';

  return (
    <TouchableOpacity
      className="flex-row justify-between items-center bg-black bg-opacity-50 mx-5 my-2 rounded-xl p-4"
      onPress={() => router.navigate(screen)}
    >
      <View className="flex-row items-center">
        {item.icon}
        <View className="ml-3">
          <Text className="text-white text-lg font-bold">
            {item.name}
          </Text>
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-green-400 rounded-full mr-1" />
            <Text className="text-white">Online</Text>
          </View>
        </View>
      </View>
      <Switch
        value={item.status}
        onValueChange={() => toggleDevice(item.id)}
        trackColor={{ true: '#34D399', false: '#9CA3AF' }}
        thumbColor={item.status ? '#10B981' : '#F3F4F8'}
      />
    </TouchableOpacity>
  );
};

  return (
    <SafeAreaView className="flex-1 bg-white-100">
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pt-3">
        <TouchableOpacity className="flex-row items-center" onPress={() => router.navigate('/Profile')}>
          <Image source={images.avatar} className="w-10 h-10 rounded-full mr-3" />
          <View>
            <Text className="text-sm text-white">Good Morning</Text>
            <Text className="text-xl font-bold text-white">Adrian Hajdin</Text>
          </View>
        </TouchableOpacity>
        <View className="flex-col items-center p-2 gap-y-5">
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity>
            <MaterialCommunityIcons name="qrcode-scan" size={24} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity onPress={TwoButtonAlert}>
            <MaterialCommunityIcons name="plus" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View className="flex-row bg-white mx-5 my-5 rounded-lg p-1 items-center">
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          className="flex-1 mx-3 text-base"
          placeholder="Search something"
          value={searchText}
          onChangeText={setSearchText}
        />
        <Ionicons name="options-outline" size={20} color="#9CA3AF" />
      </View>

      {/* Weather Card */}
      {weather && (
        <View className="flex-row bg-blue-500 mx-5 rounded-2xl p-5 items-center">
          <Image
            source={{ uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png` }}
            className="w-20 h-20"
          />
          <View className="ml-4 flex-1">
            <Text className="text-4xl font-bold text-white">{Math.round(weather.main.temp)}°</Text>
            <Text className="text-sm text-white mb-1">Feels like {Math.round(weather.main.feels_like)}°</Text>
            <Text className="text-base text-white capitalize">{weather.weather[0].description}</Text>
            <Text className="text-xs text-blue-200 mt-2">Wind: {weather.wind.speed} m/s   Humidity: {weather.main.humidity}%</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row bg-white rounded-lg p-1 mt-5 w-40 mx-auto">
        <TouchableOpacity
          className={`flex-1 items-center py-2 rounded-lg ${selectedTab === 'Rooms' ? 'bg-blue-500' : ''}`}
          onPress={() => setSelectedTab('Rooms')}
        >
          <Text className={`text-base font-semibold ${selectedTab === 'Rooms' ? 'text-white' : 'text-gray-600'}`}>Rooms</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 items-center py-2 rounded-lg ${selectedTab === 'Devices' ? 'bg-blue-500' : ''}`}
          onPress={() => setSelectedTab('Devices')}
        >
          <Text className={`text-base font-semibold ${selectedTab === 'Devices' ? 'text-white' : 'text-gray-600'}`}>Devices</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {selectedTab === 'Rooms' ? (
        <FlatList
          data={rooms}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          renderItem={renderRoom}
          contentContainerStyle={{ paddingVertical: 20, paddingLeft: 20 }}
        />
      ) : (
        <FlatList
          data={devices}
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.id}
          renderItem={renderDevice}
          contentContainerStyle={{ paddingVertical: 20 }}
        />
      )}
    </SafeAreaView>
  )
}

export default HomeScreen