import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  TouchableOpacity,
  FlatList
} from 'react-native';

interface SceneUnits {
  unit_change_mode: 'static' | 'jump' | 'gradient';
  unit_switch_duration: number;
  unit_gradient_duration: number;
  bright: number;
  temperature: number;
  h: number;
  s: number;
  v: number;
}

interface SceneData {
  scene_num: number;
  scene_units: SceneUnits;
}

interface SceneProps {
  onSubmit?: (data: SceneData) => void;
  initial?: Partial<SceneData>;
}

export default function LampScene({ onSubmit, initial = {} }: SceneProps) {
  // State for selects
  const [sceneNum, setSceneNum] = useState<number>(initial.scene_num ?? 1);
  const [unitChangeMode, setUnitChangeMode] = useState<SceneUnits['unit_change_mode']>(
    initial.scene_units?.unit_change_mode ?? 'static'
  );
  const [showScenePicker, setShowScenePicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);

  // Numeric fields config
  const numericFields: { key: keyof SceneUnits; label: string; min: number; max: number; }[] = [
    { key: 'unit_switch_duration', label: 'Switch Duration', min: 0, max: 100 },
    { key: 'unit_gradient_duration', label: 'Gradient Duration', min: 0, max: 100 },
    { key: 'bright', label: 'Brightness', min: 0, max: 1000 },
    { key: 'temperature', label: 'Temperature', min: 0, max: 1000 },
    { key: 'h', label: 'Hue', min: 0, max: 360 },
    { key: 's', label: 'Saturation', min: 0, max: 1000 },
    { key: 'v', label: 'Value', min: 0, max: 1000 },
  ];

  // Numeric values state
  const [values, setValues] = useState<Record<string,string>>(
    numericFields.reduce((acc, { key }) => {
      acc[key] = String(initial.scene_units?.[key] ?? 0);
      return acc;
    }, {} as Record<string,string>)
  );

  const handleChange = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  // Submit
  const handleSubmit = () => {
    const scene_units = numericFields.reduce((acc, { key }) => {
      acc[key] = parseInt(values[key],10);
      return acc;
    }, {} as any) as SceneUnits;
    scene_units.unit_change_mode = unitChangeMode;

    const data: SceneData = { scene_num: sceneNum, scene_units };
    onSubmit?.(data);
  };

  // Picker render helper
  const renderPicker = <T extends number | string>(
    visible: boolean,
    items: T[],
    selected: T,
    onSelect: (val: T) => void,
    onClose: () => void
  ) => (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable className="flex-1 bg-black/30" onPress={onClose} />
      <View className="absolute bottom-0 w-full bg-white rounded-t-xl p-4">
        <FlatList
          data={items}
          keyExtractor={item => String(item)}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="py-2"
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text className={`text-lg ${item === selected ? 'font-bold text-blue-600' : ''}`}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );

  return (
    <ScrollView className="p-4 bg-white">
      {/* Scene Number Picker */}
      <Text className="text-lg font-bold mb-1">Scene #</Text>
      <Pressable
        className="mb-4 border rounded bg-gray-100 p-3"
        onPress={() => setShowScenePicker(true)}
      >
        <Text className="text-base">{sceneNum}</Text>
      </Pressable>
      {renderPicker(
        showScenePicker,
        Array.from({ length: 8 }, (_, i) => i+1),
        sceneNum,
        setSceneNum,
        () => setShowScenePicker(false)
      )}

      {/* Unit Change Mode Picker */}
      <Text className="text-lg font-bold mb-1">Change Mode</Text>
      <Pressable
        className="mb-4 border rounded bg-gray-100 p-3"
        onPress={() => setShowModePicker(true)}
      >
        <Text className="text-base capitalize">{unitChangeMode}</Text>
      </Pressable>
      {renderPicker(
        showModePicker,
        ['static','jump','gradient'],
        unitChangeMode,
        val => setUnitChangeMode(val as any),
        () => setShowModePicker(false)
      )}

      {/* Numeric Inputs */}
      {numericFields.map(({ key,label,min,max }) => (
        <View key={key} className="mb-4">
          <Text className="text-base font-semibold">{label} ({min}-{max})</Text>
          <TextInput
            className="h-10 border border-gray-300 rounded p-2 bg-gray-50"
            keyboardType="numeric"
            value={values[key]}
            onChangeText={txt => handleChange(key, txt)}
          />
        </View>
      ))}

      {/* Submit */}
      <Pressable className="mt-2 bg-blue-600 rounded-xl p-3" onPress={handleSubmit}>
        <Text className="text-center text-white font-semibold">Save</Text>
      </Pressable>
    </ScrollView>
  );
}
