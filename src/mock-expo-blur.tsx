import React from 'react';
import { View } from 'react-native';

export const BlurView = ({ children, style }: any) => {
  return <View style={[{ backgroundColor: 'rgba(0,0,0,0.5)' }, style]}>{children}</View>;
};
