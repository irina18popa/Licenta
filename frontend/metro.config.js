const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// load Expo’s default
const config = getDefaultConfig(__dirname);

// alias “Slider” (and any direct react-native import) to the community package
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'Slider': require.resolve('@react-native-community/slider'),
  '@react-native-community/slider': require.resolve('@react-native-community/slider'),
};

module.exports = withNativeWind(config, {
  input: "./app/global.css",
});