import React from 'react';
import { View } from 'react-native';

const AnimatedView = React.forwardRef((props: any, ref) => <View {...props} ref={ref} />);

export default {
  View: AnimatedView,
  Text: View,
  ScrollView: View,
};

export const useSharedValue = (initialValue: any) => ({ value: initialValue });
export const useAnimatedStyle = (fn: any) => ({});
export const withSpring = (toValue: any) => toValue;
export const withTiming = (toValue: any) => toValue;
export const withRepeat = (toValue: any) => toValue;
export const withSequence = (toValue: any) => toValue;
export const withDelay = (t: any, v: any) => v;
export const Easing = {
  inOut: () => {},
  out: () => {},
  ease: () => {},
};

