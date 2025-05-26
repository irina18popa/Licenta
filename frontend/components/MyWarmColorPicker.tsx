import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import ColorPicker, {
  Swatches,
  type ColorFormatsObject,
} from 'reanimated-color-picker';

interface MyWarmColorPickerProps {
  sharedColor: SharedValue<string>;
}

export default function MyWarmColorPicker({ sharedColor }: MyWarmColorPickerProps) {
  // first three are warm, last three are white-ish
  const palette = [
    '#FFA500', // warm orange
    '#FFD700', // warm gold
    '#FFFF00', // warm yellow
    '#FFFFFF', // pure white
    '#FFFCF2', // very pale warm white
    '#FFF8E1', // soft cream
  ];

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: sharedColor.value,
  }));

  const onColorSelect = (col: ColorFormatsObject) => {
    'worklet';
    sharedColor.value = col.hex;
  };

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      <View style={styles.pickerContainer}>
        <ColorPicker
          value={sharedColor.value}
          sliderThickness={20}
          thumbSize={20}
          thumbShape="circle"
          onChange={onColorSelect}
        >
          <Swatches
            style={styles.swatchesContainer}
            swatchStyle={styles.swatchStyle}
            colors={palette}
          />
        </ColorPicker>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: 280,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  swatchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
  },
  swatchStyle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    margin: 4,
  },
});
