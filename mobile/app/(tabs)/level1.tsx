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
const DEFAULT_REQUEST_TIMEOUT_MS = 45000;
const SUBMIT_REQUEST_TIMEOUT_MS = 240000;

const PATIENT_IMAGES: Record<string, any> = {
  uti_level1: require("../../assets/patients/uti_level1.png"),
};

function getRequestTimeoutMs(path: string, method: string) {
  if (method === "POST" && /^\/conversations\/[^/]+\/submit$/.test(path)) {
    return SUBMIT_REQUEST_TIMEOUT_MS;
  }
  return DEFAULT_REQUEST_TIMEOUT_MS;
}

async function request(
  path: string,
  opts: { method?: string; body?: any; headers?: Record<string, string> } = {}
) {
  if (!BASE_URL) throw new Error("Missing EXPO_PUBLIC_API_BASE_URL in .env");

  const token = await SecureStore.getItemAsync("token");
  const method = String(opts.method || "GET").toUpperCase();
  const timeoutMs = getRequestTimeoutMs(path, method);

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutHandle);
  }

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

type SectionScore = {
  section: string;
  label?: string;
  earned_points: number;
  available_points: number;
  total_points?: number;
};

type CriterionResult = {
  id: string;
  section: string;
  label: string;
  status: string;
  points: number;
  earned_points: number;
  evidence?: string[];
  rationale?: string | null;
  omit_reason?: string | null;
};

type SubmissionResult = {
  score: number;
  passing_score: number;
  passed: boolean;
  feedback: string;
  section_scores: SectionScore[];
  criteria_results: CriterionResult[];
};

function statusColor(status: string) {
  if (status === "met") return "#166534";
  if (status === "partially_met") return "#92400e";
  if (status === "omitted") return "#6b7280";
  return "#b91c1c";
}

function statusLabel(status: string) {
  if (status === "met") return "Met";
  if (status === "partially_met") return "Partially met";
  if (status === "omitted") return "Omitted";
  return "Missed";
}

function normalizeSubmissionPayload(payload: any): SubmissionResult {
  const details = payload?.details && typeof payload.details === "object" ? payload.details : {};
  const score = Number(payload?.score ?? details?.score ?? 0) || 0;
  const passingScore = Number(payload?.passing_score ?? details?.passing_score ?? 84) || 84;
  const passedRaw = payload?.passed ?? details?.passed;
  const passed = typeof passedRaw === "boolean" ? passedRaw : score >= passingScore;

  const sectionScores = Array.isArray(payload?.section_scores)
    ? payload.section_scores
    : Array.isArray(details?.section_scores)
    ? details.section_scores
    : [];

  const criteriaResults = Array.isArray(payload?.criteria_results)
    ? payload.criteria_results
    : Array.isArray(details?.criteria_results)
    ? details.criteria_results
    : [];

  return {
    score,
    passing_score: passingScore,
    passed,
    feedback: String(payload?.feedback ?? details?.feedback ?? ""),
    section_scores: sectionScores,
    criteria_results: criteriaResults,
  };
}

export default function Level1Screen() {
  const params = useLocalSearchParams();
  const caseId = useMemo(() => {
    const raw = params.caseId;
    return Array.isArray(raw) ? raw[0] : raw || "uti_level1";
  }, [params.caseId]);
  const patientImage = PATIENT_IMAGES[caseId] || PATIENT_IMAGES.uti_level1;

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
  const [stage, setStage] = useState<"chat" | "hpi" | "results">("chat");
  const [hpiText, setHpiText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

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

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (!userHeaders["x-clerk-user-id"]) return null;
    if (conversationId) return conversationId;
    if (creatingConversation) return null;

    setCreatingConversation(true);
    try {
      const data = await request("/conversations", {
        method: "POST",
        headers: userHeaders,
        body: { caseId },
      });
      const id = String(data?.conversationId || "");
      if (!id) return null;
      setConversationId(id);
      return id;
    } catch (err) {
      console.warn("Failed to create conversation:", err);
      return null;
    } finally {
      setCreatingConversation(false);
    }
  }, [caseId, conversationId, creatingConversation, userHeaders]);

  useEffect(() => {
    setConversationId(null);
    setPendingMessages([]);
    setStage("chat");
    setHpiText("");
    setSubmissionResult(null);
    setSubmitError(null);
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
        setStage("chat");
        setHpiText("");
        setSubmissionResult(null);
        setSubmitError(null);
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
    if (stage !== "chat") return;

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

  const beginHpiStep = useCallback(() => {
    if (messages.length === 0) {
      setSubmitError("Complete at least one chat turn before finishing.");
      return;
    }
    setSubmitError(null);
    setStage("hpi");
  }, [messages.length]);

  const submitForFinalGrade = useCallback(async () => {
    const hpi = hpiText.trim();
    if (!hpi || submitting) return;

    setSubmitError(null);
    setSubmitting(true);
    let convoId = conversationId;

    try {
      if (!convoId) {
        convoId = await ensureConversation();
      }
      if (!convoId) {
        throw new Error("Conversation is still being created. Please try again.");
      }

      const data = await request(`/conversations/${convoId}/submit`, {
        method: "POST",
        headers: userHeaders,
        body: { hpi },
      });

      setSubmissionResult(normalizeSubmissionPayload(data));
      setStage("results");
    } catch (e: any) {
      const message = String(e?.message || "Failed to submit case.");
      const timedOut = message.toLowerCase().includes("timed out");

      if (timedOut && convoId) {
        try {
          const conversationData = await request(`/conversations/${convoId}`, {
            headers: userHeaders,
          });

          if (conversationData?.submission) {
            const fromSavedSubmission = {
              ...(conversationData.submission.details || {}),
              score: conversationData.submission.score,
              feedback: conversationData.submission.feedback,
            };
            setSubmissionResult(normalizeSubmissionPayload(fromSavedSubmission));
            setStage("results");
            return;
          }
        } catch (checkErr) {
          console.warn("Failed to check submission status after timeout:", checkErr);
        }

        setSubmitError(
          "Submit timed out. Grading may still be running. Wait 10-20 seconds and tap Submit Case again."
        );
      } else {
        setSubmitError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [conversationId, ensureConversation, hpiText, submitting, userHeaders]);

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
              source={patientImage}
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

        {stage === "results" && submissionResult ? (
          <FlatList
            data={submissionResult.criteria_results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
            ListHeaderComponent={
              <View style={{ gap: 10, marginBottom: 12 }}>
                <View style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", marginBottom: 4 }}>
                    Final Score: {submissionResult.score}%
                  </Text>
                  <Text style={{ fontWeight: "700", color: submissionResult.passed ? "#166534" : "#b91c1c" }}>
                    {submissionResult.passed ? "Passed" : "Not passed"} (threshold {submissionResult.passing_score}%)
                  </Text>
                  {!!submissionResult.feedback && (
                    <Text style={{ marginTop: 8, color: "#374151" }}>{submissionResult.feedback}</Text>
                  )}
                </View>

                <View style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
                    Section Scores
                  </Text>
                  {submissionResult.section_scores.map((section) => (
                    <View
                      key={section.section}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        borderBottomWidth: 1,
                        borderColor: "#e5e7eb",
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ fontWeight: "600" }}>{section.label || section.section}</Text>
                      <Text>
                        {section.earned_points}/{section.available_points}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={{ fontSize: 16, fontWeight: "700" }}>Criterion Breakdown</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={{ borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                  <Text style={{ flex: 1, fontWeight: "700" }}>{item.label || item.id}</Text>
                  <Text style={{ color: statusColor(item.status), fontWeight: "700" }}>
                    {statusLabel(item.status)}
                  </Text>
                </View>
                <Text style={{ color: "#6b7280", marginTop: 2 }}>
                  {item.section} • {item.earned_points}/{item.points}
                </Text>
                {!!item.rationale && (
                  <Text style={{ marginTop: 6, color: "#374151" }}>{item.rationale}</Text>
                )}
                {Array.isArray(item.evidence) && item.evidence.length > 0 && (
                  <Text style={{ marginTop: 6, color: "#374151" }}>
                    Evidence: {item.evidence.slice(0, 2).join(" | ")}
                  </Text>
                )}
                {!!item.omit_reason && (
                  <Text style={{ marginTop: 6, color: "#6b7280" }}>Reason: {item.omit_reason}</Text>
                )}
              </View>
            )}
          />
        ) : (
          <>
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

            {stage === "chat" ? (
              <>
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

                <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                  <Pressable
                    onPress={beginHpiStep}
                    disabled={sending || creatingConversation || messages.length === 0}
                    style={({ pressed }) => ({
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                      opacity:
                        sending || creatingConversation || messages.length === 0
                          ? 0.5
                          : pressed
                          ? 0.7
                          : 1,
                    })}
                  >
                    <Text style={{ fontWeight: "700" }}>
                      {creatingConversation ? "Preparing..." : "Done Interview"}
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 10 }}>
                <View style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 6 }}>
                    Final HPI (4-5 sentences)
                  </Text>
                  <Text style={{ color: "#4b5563", marginBottom: 8 }}>
                    Summarize presenting illness with OLDCARTS elements. This is graded.
                  </Text>
                  <TextInput
                    value={hpiText}
                    onChangeText={setHpiText}
                    multiline
                    textAlignVertical="top"
                    editable={!submitting}
                    placeholder="Write your HPI summary here..."
                    style={{
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      minHeight: 120,
                    }}
                  />
                </View>

                {submitError ? (
                  <Text style={{ color: "#b91c1c", fontWeight: "600" }}>{submitError}</Text>
                ) : null}

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => setStage("chat")}
                    disabled={submitting}
                    style={({ pressed }) => ({
                      flex: 1,
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                      opacity: submitting ? 0.5 : pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontWeight: "700" }}>Back to Chat</Text>
                  </Pressable>
                  <Pressable
                    onPress={submitForFinalGrade}
                    disabled={submitting || !hpiText.trim()}
                    style={({ pressed }) => ({
                      flex: 1,
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                      opacity: submitting || !hpiText.trim() ? 0.5 : pressed ? 0.7 : 1,
                    })}
                  >
                    <Text style={{ fontWeight: "700" }}>
                      {submitting ? "Submitting..." : "Submit Case"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
