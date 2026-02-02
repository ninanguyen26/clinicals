import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useClerk, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { api } from "../../src/api/client";

export default function HomeScreen() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [loadingCases, setLoadingCases] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cases, setCases] = useState<{ caseId: string; title: string }[]>([]);

  const primaryEmail = useMemo(() => {
    return user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || "Unknown";
  }, [user]);

  const loadCases = useCallback(async () => {
    try {
      setError(null);
      setLoadingCases(true);
      const data = await api.getCases();
      setCases(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load cases.");
    } finally {
      setLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)/signin");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: "#e5e7eb",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "700" }}>Signed in</Text>
          <Text numberOfLines={1} style={{ color: "#4b5563" }}>
            {primaryEmail}
          </Text>
        </View>
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          style={{
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            opacity: signingOut ? 0.6 : 1,
          }}
        >
          <Text style={{ fontWeight: "600" }}>{signingOut ? "Signing out..." : "Sign Out"}</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 4 }}>Cases</Text>
        <Text style={{ color: "#6b7280" }}>Select a case to begin the patient simulation.</Text>
      </View>

      {loadingCases ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <Text style={{ color: "#b91c1c", fontWeight: "600" }}>{error}</Text>
          <Pressable
            onPress={loadCases}
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 10,
              alignSelf: "flex-start",
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ fontWeight: "600" }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={cases}
          keyExtractor={(item) => item.caseId}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: "/(tabs)/level1", params: { caseId: item.caseId } })}
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 12,
                padding: 14,
                backgroundColor: pressed ? "#f9fafb" : "#ffffff",
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: "700" }}>{item.title || item.caseId}</Text>
              <Text style={{ color: "#6b7280", marginTop: 4 }}>Case ID: {item.caseId}</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={{ paddingTop: 24 }}>
              <Text style={{ color: "#6b7280" }}>No cases found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
