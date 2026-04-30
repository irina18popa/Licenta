// MyWarmColorPicker.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import ColorPicker, {
  HueSlider,
  Swatches,
  type ColorFormatsObject,
} from 'reanimated-color-picker';

// kelvin→hex helper (same as before)
function kelvinToHex(k: number): string {
  const temp = k / 100;
  let r: number, g: number, b: number;
  if (temp <= 66) r = 255;
  else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    r = Math.min(Math.max(r, 0), 255);
  }
  if (temp <= 66) {
    // @ts-ignore
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    g = Math.min(Math.max(g, 0), 255);
  } else {
    // @ts-ignore
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    g = Math.min(Math.max(g, 0), 255);
  }
  if (temp >= 66) b = 255;
  else if (temp <= 19) b = 0;
  else {
    // @ts-ignore
    b = 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
    b = Math.min(Math.max(b, 0), 255);
  }
  const toHex = (x: number) => {
    const h = Math.round(x).toString(16);
    return h.length === 1 ? '0' + h : h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

interface MyWarmColorPickerProps {
  deviceId: string
  sharedColor: SharedValue<string>;
  mode: string
}

export default function MyWarmColorPicker({ deviceId, sharedColor, mode }: MyWarmColorPickerProps) {
  // animate the full-screen backdrop
  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: sharedColor.value,
  }));

  // UI-thread callback to update the shared color
  const onColorChange = (col: ColorFormatsObject) => {
    'worklet';
    sharedColor.value = col.hex;
  };

  // temperature stops from cool(6500K)→warm(2000K)
  const kelvins = [6500, 5000, 4000, 3000, 2000];
  const tempColors = kelvins.map(k => kelvinToHex(k));

  return (
    <Animated.View style={[styles.wrapper, backgroundStyle]}>
      <View style={styles.pickerContainer}>
        <ColorPicker
          value={sharedColor.value}
          onChange={onColorChange}
          sliderThickness={28}
          thumbSize={24}
          style={styles.picker}
          adaptSpectrum={false}
          boundedThumb
        >
          {/* ← replace Panel1 with a horizontal temp slider */}
          <HueSlider
            style={styles.slider}
            thumbShape="circle"
          />

          {/* optional quick‐pick swatches underneath */}
          <Swatches
            style={styles.swatchesContainer}
            swatchStyle={styles.swatchStyle}
            colors={kelvins.map(k => kelvinToHex(k))}
          />
        </ColorPicker>
      </View>
    </Animated.View>
  );
}

const { width, height } = Dimensions.get('window');
const CARD_SIZE = Math.min(width, height) * 0.8;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  pickerContainer: {
    width: CARD_SIZE,
    backgroundColor: '#202124',
    padding: 20,
    borderRadius: 20,
    // shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  picker: {
    gap: 20,
  },
  slider: {
    width: '100%',
    height: 40,
    borderRadius: 16,
  },
  swatchesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  swatchStyle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 6,
  },
});
