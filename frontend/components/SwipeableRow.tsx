import React, { useRef } from "react";
import { TouchableOpacity } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, { interpolate, Extrapolate, Extrapolation } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  onSwipeableOpen: (ref: Swipeable) => void;
}


const SwipeableRow = ({ children, onDelete, onSwipeableOpen }: Props) => {
  const swipeableRef = useRef<Swipeable>(null);

  const handleSwipeableOpen = () => {
    if (swipeableRef.current) {
      onSwipeableOpen(swipeableRef.current);
    }
  };

  const renderRightActions = (progress: any, _dragAnimatedValue: any) => {
    const animatedStyle = {
      opacity: interpolate(progress, [0.3, 1], [0, 1], Extrapolation.CLAMP),
    };

    return (
      <Animated.View style={animatedStyle} className="w-20 justify-center items-center">
        <TouchableOpacity
          onPress={onDelete}
          className="bg-red-600 w-12 h-12 rounded-full justify-center items-center"
        >
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeableOpen}
      friction={2}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
};

export default SwipeableRow;
