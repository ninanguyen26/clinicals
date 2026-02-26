import { StyleSheet } from "react-native";

export const caseStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    padding: 16,
    gap: 5,
    alignItems: "center",
    marginBottom: 5,
  },

  avatarWrapper: {
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
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  subText: {
    opacity: 0.7,
    textAlign: "center",
  },

  chatContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  messageBubble: {
    maxWidth: "85%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
  },

  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },

  // Results screen
  resultsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },

  resultsScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },

  resultsScoreText: {
    fontSize: 28,
    fontWeight: "800",
  },

  resultsPassText: {
    fontWeight: "700",
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
    backgroundColor: "#1d4ed8",
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
  },
});