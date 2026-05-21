import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react-native': 'react-native-web',
        'expo-router': path.resolve(__dirname, 'src/mock-expo-router.tsx'),
        '@expo/vector-icons': path.resolve(__dirname, 'src/mock-vector-icons.tsx'),
        'expo-font': path.resolve(__dirname, 'src/mock-expo-font.tsx'),
        'expo-blur': path.resolve(__dirname, 'src/mock-expo-blur.tsx'),
        'react-native-reanimated': path.resolve(__dirname, 'src/mock-reanimated.tsx'),
        'react-native-maps': path.resolve(__dirname, 'src/mock-maps.tsx'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
