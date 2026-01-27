import React, { useState } from "react";
import { ScrollView, View, Text, Button } from "react-native";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_PREFIX = "/api";

async function request(
  path: string,
  opts: { method?: string; body?: any; headers?: Record<string, string> } = {}
) {
  if (!BASE_URL) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL in .env");

  const token = await SecureStore.getItemAsync("token");

  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `${res.status} ${res.statusText}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export default function HomeScreen() {
  const [out, setOut] = useState<string>("");

  const run = async (fn: () => Promise<any>) => {
    try {
      setOut("Loading...");
      const data = await fn();
      setOut(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setOut(
        JSON.stringify(
          { error: e.message, status: e.status, data: e.data },
          null,
          2
        )
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>API Test</Text>

      <Button title="GET /health" onPress={() => run(() => request("/health"))} />
      <Button title="GET /cases" onPress={() => run(() => request("/cases"))} />

      <View style={{ padding: 12, borderWidth: 1, borderRadius: 8 }}>
        <Text selectable style={{ fontFamily: "Menlo" }}>
          {out || "Tap a button above."}
        </Text>
      </View>

      <Text style={{ opacity: 0.6 }}>
        Base URL: {process.env.EXPO_PUBLIC_API_BASE_URL}
      </Text>
    </ScrollView>
  );
}