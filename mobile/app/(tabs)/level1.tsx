import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { caseStyles } from "../../assets/styles/case.styles";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const API_PREFIX = "/api";

const PATIENT_IMAGES: Record<string, any> = {
  uti_level1: require("../../assets/patients/uti_level1.png"),
};

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

type CaseData = {
  case_id: string;
  level: number;
  display_title: string;
  setting?: string;
  presenting_info?: {
    chief_complaint?: string;
    opening_statement?: string;
  };
  osce_opening?: {
    student_intro?: string;
    patient_name_permission?: { yes?: string; no?: string };
    student_prompt_variants?: string[];
    patient_chief_complaint_reply?: string;
  };
};

type Msg = {
  id: string;
  role: "user" | "assistant"; // matches backend filter
  content: string;
};

export default function Level1Screen() {
  const params = useLocalSearchParams();
  const caseId = useMemo(() => {
    const raw = params.caseId;
    return Array.isArray(raw) ? raw[0] : raw || "uti_level1";
  }, [params.caseId]);

  const [loadingCase, setLoadingCase] = useState(true);
  const [sending, setSending] = useState(false);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const listRef = useRef<FlatList<Msg>>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Msg[]>([]);
  const [creatingConversation, setCreatingConversation] = useState(false);

  const { user } = useUser();

  const userHeaders = useMemo(() => {
    const headers: Record<string, string> = {};
    if (user?.id) headers["x-clerk-user-id"] = user.id;
    if (user?.fullName) headers["x-user-name"] = user.fullName;
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) headers["x-user-email"] = email;
    if (user?.imageUrl) headers["x-user-image"] = user.imageUrl;
    return headers;
  }, [user]);

  const queueMessage = useCallback((msg: Msg) => {
    setPendingMessages((prev) => [...prev, msg]);
  }, []);

  const persistMessage = useCallback(
    async (msg: Msg) => {
      if (!conversationId) return;
      try {
        await request(`/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: userHeaders,
          body: {
            role: msg.role,
            content: msg.content,
          },
        });
      } catch (err) {
        console.warn("Failed to persist message:", err);
      }
    },
    [conversationId, userHeaders]
  );

  const ensureConversation = useCallback(async () => {
    if (!userHeaders["x-clerk-user-id"] || creatingConversation || conversationId) {
      return;
    }
    setCreatingConversation(true);
    try {
      const data = await request("/conversations", {
        method: "POST",
        headers: userHeaders,
        body: { caseId },
      });
      setConversationId(String(data?.conversationId));
    } catch (err) {
      console.warn("Failed to create conversation:", err);
    } finally {
      setCreatingConversation(false);
    }
  }, [caseId, conversationId, creatingConversation, userHeaders]);

  useEffect(() => {
    setConversationId(null);
    setPendingMessages([]);
  }, [caseId]);

  useEffect(() => {
    ensureConversation();
  }, [ensureConversation]);

  useEffect(() => {
    if (!conversationId || pendingMessages.length === 0) return;
    const toPersist = pendingMessages;
    setPendingMessages([]);
    toPersist.forEach((msg) => {
      persistMessage(msg);
    });
  }, [conversationId, pendingMessages, persistMessage]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingCase(true);
        setError(null);

        const data = await request(`/cases/${caseId}`);
        if (cancelled) return;

        setCaseData(data);

        // Start with an empty transcript so opening behavior is graded from user input.
        setMessages([]);
        setInput("");
      } catch (e: any) {
        if (cancelled) return;
        setError(e.message || "Failed to load case");
      } finally {
        if (!cancelled) setLoadingCase(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (conversationId) {
      persistMessage(userMsg);
    } else {
      queueMessage(userMsg);
    }
    setInput("");
    setSending(true);

    try {
      // backend contract:
      // { caseId, messages: [{role, content}, ...] }
      const data = await request("/chat", {
        method: "POST",
        body: {
          caseId,
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      const replyText = String(data?.reply ?? "");

      const assistantMsg: Msg = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: replyText || "(empty reply)",
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (conversationId) {
        persistMessage(assistantMsg);
      } else {
        queueMessage(assistantMsg);
      }
    } catch (e: any) {
      const assistantMsg: Msg = {
        id: `a-err-${Date.now()}`,
        role: "assistant",
        content: `Error: ${e.message || "chat failed"}`,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  if (loadingCase) {
    return (
      <SafeAreaView style={caseStyles.container}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={caseStyles.container}>
        <Text style={{ fontWeight: "700", marginBottom: 8 }}>Failed</Text>
        <Text>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={caseStyles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        {/* Header */}
        <View style={caseStyles.header}>
          <View style={caseStyles.avatarWrapper}>
            <Image
              source={PATIENT_IMAGES[caseId]}
              style={caseStyles.avatar}
              resizeMode="cover"
            />
          </View>

          <Text style={caseStyles.title}>
            Level {caseData?.level ?? "?"} 
          </Text>

          {!!caseData?.setting && (
            <Text style={caseStyles.subText}>
              Setting: {caseData.setting}
            </Text>
          )}

          {!!caseData?.presenting_info?.chief_complaint && (
            <Text style={caseStyles.subText}>
              Chief complaint: {caseData.presenting_info.chief_complaint}
            </Text>
          )}
        </View>

        {/* Chat */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={caseStyles.chatContainer}
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            return (
              <View
                style={[
                  caseStyles.messageBubble,
                  { alignSelf: isUser ? "flex-end" : "flex-start" },
                ]}
              >
                <Text style={{ fontWeight: "700", marginBottom: 4 }}>
                  {isUser ? "You" : "Patient"}
                </Text>
                <Text>{item.content}</Text>
              </View>
            );
          }}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
        />
        {messages.length === 0 && (
          <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
            <Text style={{ color: "#555" }}>
              Start with your OSCE introduction (name + title), then ask what brings the patient in.
            </Text>
          </View>
        )}

        {/* Input */}
        <View style={caseStyles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask the patient a question..."
            style={caseStyles.textInput}
            editable={!sending}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          <Pressable
            onPress={send}
            disabled={sending || !input.trim()}
            style={({ pressed }) => ({
              ...caseStyles.sendButton,
              opacity: sending || !input.trim() ? 0.4 : pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ fontWeight: "700" }}>{sending ? "..." : "Send"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
