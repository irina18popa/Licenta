import React from 'react';
import { Pressable, Text } from 'react-native';

interface NeumorphicCommandButtonProps {
  title: string;
  onPress: () => void;
}

const NeumorphicCommandButton: React.FC<NeumorphicCommandButtonProps> = ({
  title,
  onPress,
}) => (
  <Pressable
    className="bg-white-800 rounded-xl p-4 shadow-innerNeu active:shadow-outerNeu m-2"
    onPress={onPress}
  >
    <Text className="text-white text-center">{title}</Text>
  </Pressable>
);

export default NeumorphicCommandButton;
