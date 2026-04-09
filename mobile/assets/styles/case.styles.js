import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export const caseStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: "stretch",
    marginBottom: 2,
  },
  headerMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },

  avatarWrapper: {
    position: "relative",
    borderRadius: 60,
    backgroundColor: "#fff",

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,

    // Android 
    elevation: 6,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarClip: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: "hidden",
  },
  avatarVideo: {
    width: "100%",
    height: "100%",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "left",
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: COLORS.primary || "#6d28d9",
    textTransform: "uppercase",
    textAlign: "left",
  },
  patientNameText: {
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "left",
    marginTop: 4,
  },

  subText: {
    opacity: 0.7,
    textAlign: "left",
    marginTop: 4,
  },
  statusChipRow: {
    width: "auto",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 6,
    marginTop: 8,
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  statusChipPrimary: {
    backgroundColor: "#ede9fe",
    borderColor: "#c4b5fd",
  },
  statusChipSuccess: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
  },
  statusChipAttention: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  statusChipMuted: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusChipPrimaryText: {
    color: "#5b21b6",
  },
  statusChipSuccessText: {
    color: "#166534",
  },
  statusChipAttentionText: {
    color: "#92400e",
  },
  statusChipMutedText: {
    color: "#4b5563",
  },

  voiceControlsRow: {
    width: "auto",
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },

  voiceToggleButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },

  voiceToggleText: {
    fontWeight: "700",
    color: COLORS.primary,
  },

  voiceStateText: {
    color: "#6b7280",
    fontSize: 12,
  },

  chatContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  messageBubble: {
    maxWidth: "90%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#fbfcfd",
  },

  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
  },

  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    minHeight: 44,
    fontSize: 18,
    lineHeight: 22,
  },

  sendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 44,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: "center",
  },

  // Results screen
  resultsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 12,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },

  resultsHeroCard: {
    borderWidth: 1,
    borderColor: "#ddd6fe",
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },

  resultsScoreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  resultsScoreBlock: {
    flex: 1,
  },

  resultsScoreText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  resultsPassText: {
    fontWeight: "700",
  },
  resultsEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6d28d9",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  resultsThresholdText: {
    color: "#6b7280",
    marginTop: 2,
  },
  resultsOutcomeBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  resultsOutcomeBadgePassed: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
  },
  resultsOutcomeBadgeFailed: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  resultsOutcomeBadgeText: {
    fontWeight: "700",
    fontSize: 12,
  },
  resultsOutcomeBadgeTextPassed: {
    color: "#166534",
  },
  resultsOutcomeBadgeTextFailed: {
    color: "#b91c1c",
  },
  resultsSummaryText: {
    color: "#4b5563",
    lineHeight: 20,
  },
  resultsStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  resultsStatTile: {
    minWidth: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#e9d5ff",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  resultsStatLabel: {
    color: "#6b7280",
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  resultsStatValue: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
  },

  resultsPointsText: {
    color: "#6b7280",
  },

  resultsCriticalBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },

  resultsCriticalTitle: {
    fontWeight: "700",
    color: "#b91c1c",
  },

  resultsCriticalItem: {
    color: "#b91c1c",
  },

  resultsRedFlagBox: {
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },

  resultsRedFlagTitle: {
    fontWeight: "700",
    color: "#92400e",
  },

  resultsRedFlagItem: {
    color: "#92400e",
  },

  resultsMissedBox: {
    gap: 4,
  },

  resultsMissedTitle: {
    fontWeight: "700",
    color: "#374151",
  },

  resultsMissedItem: {
    color: "#6b7280",
  },
  resultsPositiveNote: {
    color: "#166534",
    fontWeight: "600",
  },

  resultsSectionDivider: {
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    paddingTop: 10,
    gap: 6,
  },

  resultsSectionTitle: {
    fontWeight: "700",
    color: "#374151",
  },

  resultsSectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  resultsSectionLabel: {
    color: "#374151",
  },

  resultsSectionPoints: {
    color: "#6b7280",
  },

  // Criterion card
  criterionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  criterionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  criterionLabel: {
    flex: 1,
    fontWeight: "700",
  },

  criterionMeta: {
    color: "#6b7280",
    marginTop: 2,
  },

  criterionRationale: {
    marginTop: 6,
    color: "#374151",
  },

  criterionEvidence: {
    marginTop: 6,
    color: "#374151",
  },

  criterionOmitReason: {
    marginTop: 6,
    color: "#6b7280",
  },

  // HPI stage
  hpiCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },

  hpiTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  hpiSubText: {
    color: "#4b5563",
    marginBottom: 8,
  },

  hpiInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 120,
  },

  hpiButtonRow: {
    flexDirection: "row",
    gap: 10,
  },

  // Shared button
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  outlineButtonText: {
    fontWeight: "700",
  },

  errorText: {
    color: "#b91c1c",
    fontWeight: "600",
  },

  // Resume prompt overlay
  resumeOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 99,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  resumeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
  },

  resumeTitle: {
    fontWeight: "700",
    fontSize: 17,
    marginBottom: 8,
  },

  resumeSubText: {
    color: "#555",
    marginBottom: 20,
  },

  resumePrimaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },

  resumePrimaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  resumeSecondaryButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },

  resumeSecondaryButtonText: {
    fontWeight: "600",
    color: "#374151",
  },

  // Error / loading states
  loadErrorTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },

  // Results flat list
  resultsFlatListContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },

  resultsHeaderContainer: {
    gap: 10,
    marginBottom: 12,
  },

  resultsActionsContainer: {
    gap: 10,
    paddingTop: 4,
    paddingBottom: 8,
  },

  resultsRetryNote: {
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 8,
  },

  criterionStatusText: {
    fontWeight: "700",
  },

  // Chat messages
  messageSenderLabel: {
    fontWeight: "700",
    marginBottom: 4,
    fontSize: 17,
  },

  messageText: {
    fontSize: 18,
    lineHeight: 26,
  },

  // Empty chat hint
  chatHintContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9d5ff",
    backgroundColor: "#faf5ff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },

  chatHintTitle: {
    color: "#4c1d95",
    fontWeight: "700",
  },

  chatHintText: {
    color: "#4b5563",
    lineHeight: 19,
  },

  // Done interview button wrapper
  doneButtonContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  // HPI stage wrapper
  hpiStageContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },

  // Layout
  keyboardView: {
    flex: 1,
  },

  // Generic button label
  buttonText: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 18,
  },

  gradingOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 99,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  gradingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    width: "100%",
    alignItems: "center",
    gap: 12,
  },

  gradingTitle: {
    fontWeight: "700",
    fontSize: 17,
  },

  gradingSubText: {
    color: "#6b7280",
    textAlign: "center",
  },
});
