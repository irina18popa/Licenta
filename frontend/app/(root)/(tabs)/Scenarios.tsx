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
import React, { useState, memo } from 'react';
import {
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
  SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import images from '../../../constants/images';

const { width } = Dimensions.get('screen');
const ITEM_SIZE  = width * 0.24;
const SPACING    = 12;
const TOTAL_SIZE = ITEM_SIZE + SPACING;

interface Scenario {
  id: string;
  name: string;
  devices: { name: string; actions: string[] }[];
  trigger: string;
  bg?: any;
}
const SCENARIOS: Scenario[] = [
  {
    id: '1',
    name: 'Morning',
    bg: images.livingroom,
    devices: [
      { name: 'Coffee Maker', actions: ['On'] },
      { name: 'TV',           actions: ['Volume 15','Play News'] },
    ],
    trigger: 'Every day @ 7:00',
  },
  {
    id: '2',
    name: 'Evening',
    bg: images.bathroom,
    devices: [
      { name: 'Lamp', actions: ['Dim to 30%'] },
      { name: 'TV',   actions: ['Off'] },
    ],
    trigger: 'Sunset',
  },
];
const COUNT = SCENARIOS.length;

interface CarouselItemProps {
  scenario: Scenario;
  index: number;
  scrollX: SharedValue<number>;
}
const CarouselItem = memo(({ scenario, index, scrollX }: CarouselItemProps) => {
  const style = useAnimatedStyle(() => ({
    borderWidth: 4,
    borderColor: interpolateColor(
      scrollX.value,
      [index - 1, index, index + 1],
      ['transparent','#ff0000','transparent']
    ),
    transform: [{
      translateY: interpolate(
        scrollX.value,
        [index - 1, index, index + 1],
        [ITEM_SIZE/3, 0, ITEM_SIZE/3]
      )
    }],
  }));
  return (
    <Animated.View style={[{ width: ITEM_SIZE, height: ITEM_SIZE, borderRadius: ITEM_SIZE/2, backgroundColor: '#333' }, style]} className="items-center justify-center overflow-hidden">
      <Text className="text-white text-xs text-center px-1" numberOfLines={1}>
        {scenario.name}
      </Text>
    </Animated.View>
  );
});

export default function ScenariosCarousel() {
  const scrollX = useSharedValue(0);
  const [active, setActive] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: e => {
      const pos = clamp(e.contentOffset.x / TOTAL_SIZE, 0, COUNT - 1);
      scrollX.value = pos;
      const idx = Math.round(pos);
      if (idx !== active) runOnJS(setActive)(idx);
    },
  });

  if (!SCENARIOS[active]) return null;
  const { name, devices, trigger, bg } = SCENARIOS[active];

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* full-screen blurred background */}
      <BlurView intensity={100} tint="dark" className="absolute inset-0">
        <Animated.Image
          key={`bg-${active}`}
          source={bg || images.background}
          className="absolute inset-0 w-full h-full"
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(500)}
          blurRadius={10}
        />
      </BlurView>

      {/* detail card */}
      <BlurView intensity={100} tint="dark" className="absolute top-20 left-5 right-5 p-6 rounded-2xl overflow-hidden">
        <Text className="text-white text-2xl font-bold mb-3">{name}</Text>
        {devices.map((d, i) => (
          <View key={i} className="flex-row justify-between py-1">
            <Text className="text-white font-semibold">{d.name}</Text>
            <Text className="text-gray-300">{d.actions.join(', ')}</Text>
          </View>
        ))}
        <Text className="text-gray-400 mt-4 italic">Trigger: {trigger}</Text>
      </BlurView>

      {/* carousel */}
      <View className="absolute bottom-16 w-full items-center mb-60">
        <Animated.FlatList
          data={SCENARIOS}
          keyExtractor={s => s.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          snapToInterval={TOTAL_SIZE}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: (width - ITEM_SIZE)/2,
            gap: SPACING,
          }}
          style={{ height: ITEM_SIZE }}
          renderItem={({ item, index }) => (
            <CarouselItem scenario={item} index={index} scrollX={scrollX} />
          )}
        />
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
