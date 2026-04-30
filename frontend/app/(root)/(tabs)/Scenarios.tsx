// import React, { useState, memo } from 'react';
// import {
//   Text,
//   View,
//   Image,
//   Dimensions,
//   StyleSheet,
//   TouchableOpacity,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { router } from 'expo-router';
// import Animated, {
//   useSharedValue,
//   useAnimatedScrollHandler,
//   useAnimatedStyle,
//   interpolate,
//   interpolateColor,
//   runOnJS,
//   FadeIn,
//   FadeOut,
//   clamp,
//   SharedValue
// } from 'react-native-reanimated';
// import images from '../../../constants/images';
// import { BlurView } from 'expo-blur';

// const { width } = Dimensions.get('screen');
// const ITEM_SIZE = width * 0.24;
// const SPACING = 12;
// const TOTAL_SIZE = ITEM_SIZE + SPACING;
// const IMAGE_ASSETS = [
//   images.avatar,
//   images.livingroom,
//   images.bathroom,
//   images.newYork,
//   images.japan,
//   images.tv,
// ];
// const IMAGE_COUNT = IMAGE_ASSETS.length;

// interface Scenario {
//   id: string;
//   name: string;
//   devices: { name: string; actions: string[] }[];
//   trigger: string;
// }

// const SCENARIOS: Scenario[] = [
//   {
//     id: '1',
//     name: 'Morning',
//     devices: [
//       { name: 'Coffee Maker', actions: ['On'] },
//       { name: 'TV',           actions: ['Volume 15','Play News'] },
//     ],
//     trigger: 'Every day @ 7:00',
//   },
//   // …etc
// ];

// const COUNT = SCENARIOS.length;

// // interface CarouselItemProps {
// //   scenario: Scenario;
// //   index: number;
// //   scrollX: SharedValue<number>;
// // }

// interface CarouselItemProps {
//   uri: number | string;
//   index: number;
//   scrollX: SharedValue<number>;
// }

// const CarouselItem = memo(({ uri, index, scrollX }: CarouselItemProps) => {
//   const source = typeof uri === 'string' ? { uri } : uri;
//   const animatedStyle = useAnimatedStyle(() => ({
//     borderWidth: 4,
//     borderColor: interpolateColor(
//       scrollX.value,
//       [index - 1, index, index + 1],
//       ['transparent', '#ff0000', 'transparent']
//     ),
//     transform: [
//       {
//         translateY: interpolate(
//           scrollX.value,
//           [index - 1, index, index + 1],
//           [ITEM_SIZE / 3, 0, ITEM_SIZE / 3]
//         ),
//       },
//     ],
//   }));

//   return (
//     <Animated.View style={[styles.itemContainer, animatedStyle]}>      
//       <Image source={source} style={styles.itemImage} />
//     </Animated.View>
//   );
// });

// export default function Scenarios() {
//   const scrollX = useSharedValue(0);
//   const [activeIndex, setActiveIndex] = useState(0);

//   const onScroll = useAnimatedScrollHandler({
//     onScroll: (event) => {
//       const position = clamp(event.contentOffset.x / TOTAL_SIZE, 0, IMAGE_COUNT - 1);
//       scrollX.value = position;
//       const newIndex = Math.round(position);
//       if (newIndex !== activeIndex) {
//         runOnJS(setActiveIndex)(newIndex);
//       }
//     },
//   });

//   return (
//     <SafeAreaView style={styles.container}>
//       <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
//       <View style={StyleSheet.absoluteFillObject}>
//         <Animated.Image
//           key={`bg-${activeIndex}`}
//           source={IMAGE_ASSETS[activeIndex]}
//           style={styles.fullImage}
//           entering={FadeIn.duration(500)}
//           exiting={FadeOut.duration(500)}
//         />
//       </View>

//       {/* Carousel lifted up */}
//       <View style={styles.carouselContainer}>
//         <Animated.FlatList
//           data={IMAGE_ASSETS}
//           keyExtractor={(_, i) => i.toString()}
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           onScroll={onScroll}
//           scrollEventThrottle={16}
//           snapToInterval={TOTAL_SIZE}
//           decelerationRate="fast"
//           contentContainerStyle={styles.listContainer}
//           style={styles.listStyle}
//           renderItem={({ item, index }) => (
//             <CarouselItem uri={item} index={index} scrollX={scrollX} />
//           )}
//         />

//         {/* Plus icon below carousel */}
//         <TouchableOpacity
//           style={styles.addButton}
//           onPress={() => router.push('/CreateScenario')}
//           activeOpacity={0.7}
//         >
//           <Image source={images.plus} style={styles.addIcon} />
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'flex-end' },
//   background: { ...StyleSheet.absoluteFillObject, width: null, height: null },
//   fullImage: { flex: 1, width: null, height: null },

//   carouselContainer: {
//     alignItems: 'center',
//     marginBottom: 60, // lift carousel up
//   },
//   listContainer: {
//     paddingHorizontal: (width - ITEM_SIZE) / 2,
//     gap: SPACING,
//   },
//   listStyle: {
//     flexGrow: 0,
//     height: ITEM_SIZE * 2,
//   },

//   addButton: {
//     width: ITEM_SIZE,
//     height: ITEM_SIZE,
//     borderRadius: ITEM_SIZE / 2,
//     backgroundColor: '#ffffff90',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   addIcon: {
//     width: ITEM_SIZE * 0.6,
//     height: ITEM_SIZE * 0.6,
//     tintColor: '#000',
//   },

//   itemContainer: {
//     width: ITEM_SIZE,
//     height: ITEM_SIZE,
//     borderRadius: ITEM_SIZE / 2,
//     overflow: 'hidden',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   itemImage: {
//     width: ITEM_SIZE,
//     height: ITEM_SIZE,
//     borderRadius: ITEM_SIZE / 2,
//   },
// });

// ScenariosCarousel.tsx
import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  runOnJS,
  FadeIn,
  FadeOut,
  clamp,
} from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { getAllScenarios, deleteScenario } from '@/app/apis';
import SwipeableRow from '@/components/SwipeableRow';
import images from '../../../constants/images';

const { width } = Dimensions.get('screen');
const ITEM_SIZE = width * 0.24;
const SPACING = 12;
const TOTAL_SIZE = ITEM_SIZE + SPACING;

interface Scenario {
  _id: string;
  name: string;
  commands: {
    deviceId: string;
    protocol: string;
    address: string;
    commands: any[];
  }[];
  triggers: any[];
  bg?: any;
}

const CarouselItem = memo(
  ({ scenario, index, scrollX }: { scenario: Scenario; index: number; scrollX: any }) => {
    const style = useAnimatedStyle(() => ({
      borderWidth: 4,
      borderColor: interpolateColor(
        scrollX.value,
        [index - 1, index, index + 1],
        ['transparent', '#ff0000', 'transparent']
      ),
      transform: [
        {
          translateY: interpolate(
            scrollX.value,
            [index - 1, index, index + 1],
            [ITEM_SIZE / 3, 0, ITEM_SIZE / 3]
          ),
        },
      ],
    }));

    return (
      <Animated.View
        style={[
          {
            width: ITEM_SIZE,
            height: ITEM_SIZE,
            borderRadius: ITEM_SIZE / 2,
            backgroundColor: '#333',
          },
          style,
        ]}
        className="items-center justify-center overflow-hidden"
      >
        <Text className="text-white text-xs text-center px-1" numberOfLines={1}>
          {scenario.name}
        </Text>
      </Animated.View>
    );
  }
);

export default function ScenariosCarousel() {
  const scrollX = useSharedValue(0);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [active, setActive] = useState(0);
  const [openRow, setOpenRow] = useState<Swipeable | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const fetched = await getAllScenarios();
        setScenarios(fetched);
      } catch (err) {
        console.error('Failed to load scenarios:', err);
      }
    })();
  }, []);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const pos = clamp(e.contentOffset.x / TOTAL_SIZE, 0, scenarios.length - 1);
      scrollX.value = pos;
      const idx = Math.round(pos);
      if (idx !== active) runOnJS(setActive)(idx);
    },
  });

  const handleRowOpen = (ref: Swipeable) => {
    if (openRow && openRow !== ref) {
      openRow.close();
    }
    setOpenRow(ref);
  };

  const activeScenario = scenarios[active];

  return (
    <SafeAreaView className="flex-1 bg-black">
      <Image
        source={images.background}
        className="absolute w-full h-full"
        blurRadius={10}
      />

      {/* Scenario card or empty state */}
      <View className="absolute top-20 left-5 right-5">
        {activeScenario ? (
          <SwipeableRow
            onSwipeableOpen={handleRowOpen}
            onDelete={() =>
              Alert.alert('Delete Scenario', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteScenario(activeScenario._id);
                      setScenarios((prev) =>
                        prev.filter((s) => s._id !== activeScenario._id)
                      );
                      setActive(0);
                    } catch (err) {
                      Alert.alert('Error', 'Failed to delete scenario.');
                    }
                  },
                },
              ])
            }
          >
            <Text className='text-2xl text-white mt-4 mb-10'>My Scenarios</Text>
            <BlurView
              intensity={100}
              tint="dark"
              className="p-6 rounded-2xl overflow-hidden"
            >
              <Text className="text-white text-2xl font-bold mb-3">
                {activeScenario.name}
              </Text>

              {activeScenario.commands.map((cmd, i) => (
                <View key={i} className="flex-row justify-between py-1">
                  <Text className="text-gray-300">
                    {cmd.commands
                      .map((c: any) => ('code' in c ? c.code : c.name))
                      .join(', ')}
                  </Text>
                </View>
              ))}
              <Text className="text-gray-400 mt-4 italic">
                Trigger:{' '}
                {activeScenario.triggers
                  .map((t) =>
                    t.type === 'time' && t.timeFrom ? `@ ${t.timeFrom}` : t.type
                  )
                  .join(', ')}
              </Text>
            </BlurView>
          </SwipeableRow>
        ) : (
          <BlurView
            intensity={100}
            tint="dark"
            className="p-6 rounded-full items-center justify-center"
          >
            <Text className="text-white text-xl font-semibold mb-2">No scenarios found</Text>
            <Text className="text-gray-300 text-sm text-center">Tap the + button below to create one</Text>
          </BlurView>
        )}
      </View>

      {/* Carousel */}
      <View className="absolute bottom-16 w-full items-center mb-60">
        {scenarios.length > 0 && (
          <Animated.FlatList
            data={scenarios}
            keyExtractor={(s) => s._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            snapToInterval={TOTAL_SIZE}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: (width - ITEM_SIZE) / 2,
              gap: SPACING,
            }}
            style={{ height: ITEM_SIZE }}
            renderItem={({ item, index }) => (
              <CarouselItem scenario={item} index={index} scrollX={scrollX} />
            )}
          />
        )}

        {/* Add button */}
        <TouchableOpacity
          className="absolute -bottom-8 bg-white/60 rounded-full items-center justify-center"
          style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
          onPress={() => router.push('/CreateScenario')}
        >
          <Image source={images.plus} className="w-8 h-8 tint-black" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

