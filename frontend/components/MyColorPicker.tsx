import { getDeviceById, handleRequest } from '@/app/apis';
import { useScenarioBuilder } from '@/app/contexts/ScenarioBuilderContext';
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue, runOnJS } from 'react-native-reanimated';
import ColorPicker, { Panel2, BrightnessSlider, InputWidget, ColorFormatsObject, colorKit } from 'reanimated-color-picker';

interface MyColorPickerInlineProps {
  sharedColor: SharedValue<string>;
  deviceID: string; // you can pass this from parent
  mode: string
}

const MyColorPicker = ({ sharedColor, deviceID, mode } : MyColorPickerInlineProps) => {
  const backgroundStyle = useAnimatedStyle(() => ({ backgroundColor: sharedColor.value }));
  const { add } = useScenarioBuilder()
  

  const handleColorChange = async (hex: string) => {
  try {
    const hsv = colorKit.HSV(hex).object();

    const payload = {
      commands: [
        {
          code: 'colour_data_v2',
          value: {
            h: hsv.h,
            s: Math.round(hsv.s * 10),
            v: Math.round(hsv.v * 10),
          }
        }
      ],
    };

    if (mode === 'live')
    {
      const res = await getDeviceById(deviceID);
      const fullPayload = {
        protocol: 'tuya',
        address: res.metadata || 'unknown',
        ...payload
      };

      const topic = `app/devices/${deviceID}/do_command/in`;
      const type = 'publish';

      await handleRequest(topic, type, JSON.stringify(fullPayload));
    } else {
      await add(deviceID, 'tuya', {code : 'colour_data_v2', 
                                    value: {
                                        h: hsv.h,
                                        s: Math.round(hsv.s * 10),
                                        v: Math.round(hsv.v * 10),
                                      }
      })
    }
    
  } catch (err) {
    console.warn('Failed to send color payload:', err);
  }
};

  const onColorSelect = (col: ColorFormatsObject) => {
    'worklet';

    sharedColor.value = col.hex;

    if (typeof col.hex === 'string') {
      runOnJS(handleColorChange)(col.hex);
    }
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
  previewTxtContainer: { paddingTop: 20, marginTop: 20, borderColor: '#bebdbe' },
});

export default MyColorPicker
