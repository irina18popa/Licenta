import React, { useState, memo } from 'react';
import {
  View,
  Image,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
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
  SharedValue
} from 'react-native-reanimated';
import images from '../../../constants/images';

const { width } = Dimensions.get('screen');
const ITEM_SIZE = width * 0.24;
const SPACING = 12;
const TOTAL_SIZE = ITEM_SIZE + SPACING;
const IMAGE_ASSETS = [
  images.avatar,
  images.livingroom,
  images.bathroom,
  images.newYork,
  images.japan,
  images.tv,
];
const IMAGE_COUNT = IMAGE_ASSETS.length;

interface CarouselItemProps {
  uri: number | string;
  index: number;
  scrollX: SharedValue<number>;
}

const CarouselItem = memo(({ uri, index, scrollX }: CarouselItemProps) => {
  const source = typeof uri === 'string' ? { uri } : uri;
  const animatedStyle = useAnimatedStyle(() => ({
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
    <Animated.View style={[styles.itemContainer, animatedStyle]}>      
      <Image source={source} style={styles.itemImage} />
    </Animated.View>
  );
});

export default function Scenarios() {
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const position = clamp(event.contentOffset.x / TOTAL_SIZE, 0, IMAGE_COUNT - 1);
      scrollX.value = position;
      const newIndex = Math.round(position);
      if (newIndex !== activeIndex) {
        runOnJS(setActiveIndex)(newIndex);
      }
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Image source={images.background} className="absolute w-full h-full" blurRadius={10} />
      <View style={StyleSheet.absoluteFillObject}>
        <Animated.Image
          key={`bg-${activeIndex}`}
          source={IMAGE_ASSETS[activeIndex]}
          style={styles.fullImage}
          entering={FadeIn.duration(500)}
          exiting={FadeOut.duration(500)}
        />
      </View>

      {/* Carousel lifted up */}
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          data={IMAGE_ASSETS}
          keyExtractor={(_, i) => i.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          snapToInterval={TOTAL_SIZE}
          decelerationRate="fast"
          contentContainerStyle={styles.listContainer}
          style={styles.listStyle}
          renderItem={({ item, index }) => (
            <CarouselItem uri={item} index={index} scrollX={scrollX} />
          )}
        />

        {/* Plus icon below carousel */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/CreateScenario')}
          activeOpacity={0.7}
        >
          <Image source={images.plus} style={styles.addIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  background: { ...StyleSheet.absoluteFillObject, width: null, height: null },
  fullImage: { flex: 1, width: null, height: null },

  carouselContainer: {
    alignItems: 'center',
    marginBottom: 60, // lift carousel up
  },
  listContainer: {
    paddingHorizontal: (width - ITEM_SIZE) / 2,
    gap: SPACING,
  },
  listStyle: {
    flexGrow: 0,
    height: ITEM_SIZE * 2,
  },

  addButton: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    backgroundColor: '#ffffff90',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    width: ITEM_SIZE * 0.6,
    height: ITEM_SIZE * 0.6,
    tintColor: '#000',
  },

  itemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
  },
});
