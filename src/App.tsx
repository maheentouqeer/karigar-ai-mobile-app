/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import HomeScreen from '../app/(tabs)/index';
import ChatScreen from '../app/chat';
import NegotiationScreen from '../app/negotiation';
import ProvidersScreen from '../app/providers';
import ConfirmScreen from '../app/confirm';
import TraceScreen from '../app/trace';
import RecoveryScreen from '../app/recovery';
import TrackScreen from '../app/(tabs)/track';

import { View } from 'react-native';

const SCREENS = {
  Home: HomeScreen,
  Chat: ChatScreen,
  Negotiation: NegotiationScreen,
  Providers: ProvidersScreen,
  Confirm: ConfirmScreen,
  Track: TrackScreen,
  Trace: TraceScreen,
  Recovery: RecoveryScreen,
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<keyof typeof SCREENS>('Home');
  const ActiveScreen = SCREENS[currentScreen];

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-gray-800 p-6 flex flex-col gap-2 border-r border-gray-700 overflow-y-auto">
        <h1 className="text-xl font-bold mb-6 text-teal-400">Karigar AI Web Preview</h1>
        <p className="text-xs text-gray-400 mb-4">Select a screen to view the exported React Native UI:</p>
        
        {Object.keys(SCREENS).map((screenName) => (
          <button
            key={screenName}
            onClick={() => setCurrentScreen(screenName as keyof typeof SCREENS)}
            className={`text-left px-4 py-3 rounded-lg text-sm transition-colors ${
              currentScreen === screenName ? 'bg-teal-600 text-white font-medium' : 'hover:bg-gray-700 text-gray-300'
            }`}
          >
            {screenName} Screen
          </button>
        ))}

        <div className="mt-auto pt-6">
          <p className="text-xs text-gray-500">
            Note: React Native components are mapped to HTML via react-native-web. Some native features (BlurView, actual map) are mocked or simplified.
          </p>
        </div>
      </div>

      {/* Main Content Area - Mobile Frame Simulator */}
      <div className="flex-1 flex items-center justify-center bg-black p-4">
        {/* Mobile Device Frame styling */}
        <div 
          className="relative rounded-[40px] border-[12px] border-black bg-gray-900 shadow-2xl overflow-hidden shadow-teal-500/10 hover:shadow-teal-500/20 transition-shadow duration-500"
          style={{ width: '375px', height: '812px' }}
        >
          {/* Status bar mock */}
          <div className="absolute top-0 w-full h-8 flex justify-between items-center px-6 z-50 text-[10px] font-medium text-white/80">
            <span>9:41</span>
            <div className="flex gap-1.5 items-center">
              <div className="w-4 h-3 bg-white/80" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}/>
              <div className="w-4 h-3 border border-white/80 relative rounded-sm flex items-center p-[1px]">
                  <div className="h-full w-[80%] bg-white/80" />
              </div>
            </div>
          </div>
          
          {/* iOS Notch */}
          <div className="absolute left-1/2 -top-1 w-32 h-6 bg-black rounded-b-xl -translate-x-1/2 z-50" />
          
          {/* React Native Web View Container */}
          <div className="w-full h-full pb-8">
            <ActiveScreen />
          </div>
          
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full z-50" />
        </div>
      </div>
    </div>
  );
}
