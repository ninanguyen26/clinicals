import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (isSignedIn) {
    return <Redirect href="/(tabs)/cases" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
