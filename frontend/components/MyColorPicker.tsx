import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue, runOnJS } from 'react-native-reanimated';
import ColorPicker, { Panel2, OpacitySlider, BrightnessSlider, InputWidget, ColorFormatsObject } from 'reanimated-color-picker';

interface MyColorPickerInlineProps {
  sharedColor: SharedValue<string>;
}

const MyColorPicker = ({ sharedColor }: MyColorPickerInlineProps) => {
  const backgroundStyle = useAnimatedStyle(() => ({ backgroundColor: sharedColor.value }));

  const onColorSelect = (col: ColorFormatsObject) => {
    'worklet';
    sharedColor.value = col.hex;
  };

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      <View style={styles.pickerContainer}>
        <ColorPicker
          value={sharedColor.value}
          sliderThickness={25}
          thumbSize={30}
          thumbShape="rect"
          onChange={onColorSelect}
        >
          <Panel2 style={styles.panelStyle} thumbShape="ring" reverseVerticalChannel />
          <BrightnessSlider style={styles.sliderStyle} />
          <OpacitySlider style={styles.sliderStyle} />
          <View style={styles.previewTxtContainer}>
            <InputWidget
              inputStyle={{ color: '#fff', paddingVertical: 2, borderColor: '#707070', fontSize: 12, marginLeft: 5 }}
              iconColor="#707070"
            />
          </View>
        </ColorPicker>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius:30 },
  pickerContainer: {
    width: 300,
    backgroundColor: '#202124',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  panelStyle: { borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  sliderStyle: { borderRadius: 20, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  previewTxtContainer: { paddingTop: 20, marginTop: 20, borderTopWidth: 1, borderColor: '#bebdbe' },
});

export default MyColorPicker
