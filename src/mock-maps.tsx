import React from 'react';
import { View } from 'react-native';

export default function MapView({ style, children, initialRegion }: any) {
  return (
    <View style={[style, { backgroundColor: '#1C1F26', overflow: 'hidden' }]}>
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        opacity: 0.1,
        backgroundImage: 'radial-gradient(#81d4d8 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />
      <View style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        opacity: 0.05,
        backgroundColor: '#0D7377'
      }} />
      {children}
    </View>
  );
}

export const Marker = ({ coordinate, children, title, description }: any) => {
  // Mock coordinate mapping to percentage for the bounding box
  const top = coordinate ? `${((90 - coordinate.latitude) / 180) * 100}%` : '50%';
  const left = coordinate ? `${((coordinate.longitude + 180) / 360) * 100}%` : '50%';
  
  return (
    <View style={{ position: 'absolute', top, left, transform: [{ translateX: '-50%' as any }, { translateY: '-50%' as any }] }}>
      {children}
    </View>
  );
};

export const Polyline = ({ coordinates, strokeColor, strokeWidth, strokeDasharray }: any) => {
  return null; // A true polyline requires SVG, skipping for simple mock
};
