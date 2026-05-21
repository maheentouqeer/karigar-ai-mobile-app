import React from 'react';
import { Settings } from 'lucide-react'; // Fallback icon

// Very simple mock for vector icons using lucide-react if needed, or just emojis
export const Ionicons = ({ name, size, color, style }: any) => {
  return <div style={{ fontSize: size, color: color, ...style }}>❖</div>;
};
