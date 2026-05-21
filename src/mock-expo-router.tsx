import React from 'react';

export const Tabs = ({ children, screenOptions }: any) => {
  return <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>{children}</div>;
};

Tabs.Screen = ({ name, options }: any) => {
  return null;
};

export const Stack = ({ children, screenOptions }: any) => {
  return <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>{children}</div>;
};

Stack.Screen = ({ name, options }: any) => {
  return null;
};
