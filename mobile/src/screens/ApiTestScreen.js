import React, { useState } from "react";
import { View, Text, Button, ScrollView } from "react-native";
import { api } from "../api/client";

export default function ApiTestScreen() {
  const [out, setOut] = useState("");

  const run = async (fn) => {
    try {
      setOut("Loading...");
      const data = await fn();
      setOut(JSON.stringify(data, null, 2));
    } catch (e) {
      setOut(
        JSON.stringify(
          {
            error: e.message,
            status: e.status,
            data: e.data,
          },
          null,
          2
        )
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>API Test</Text>

      <Button title="GET /health" onPress={() => run(() => api.health())} />
      <Button title="GET /cases" onPress={() => run(() => api.getCases())} />

      <View style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
        <Text selectable style={{ fontFamily: "Menlo" }}>
          {out}
        </Text>
      </View>

      <Text style={{ opacity: 0.6 }}>
        Base URL: {process.env.EXPO_PUBLIC_API_BASE_URL}
      </Text>
    </ScrollView>
  );
}
