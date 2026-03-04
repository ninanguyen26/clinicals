import "dotenv/config";

export default ({ config }) => ({
  ...config,
  plugins: Array.from(new Set([...(config.plugins || []), "expo-video"])),
  extra: {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  },
});
