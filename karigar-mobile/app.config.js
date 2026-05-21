// CommonJS — NOT "export default". EAS CLI reads this with require().
module.exports = {
  expo: {
    name: "Karigar AI",
    slug: "karigar-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: false,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0A0A0F",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.maheentuk.karigarai",
    },
    android: {
      package: "com.maheentuk.karigarai",
      usesCleartextTraffic: true,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A0A0F",
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "RECORD_AUDIO",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "INTERNET",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
    ],
    extra: {
      eas: {
        projectId: "9dbb243f-b7a1-4987-8d72-6f9ba92aa33f",
      },
      apiUrl: "http://192.168.0.108:8000",
    },
    owner: "maheentouqeer",
  },
};
