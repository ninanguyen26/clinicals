import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export const casesStyles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
  },

  // Header bar (name + sign out row)
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerEmail: {
    color: "#4b5563",
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutButtonText: {
    fontWeight: "600",
    color: "#374151",
  },

  // Points card
  pointsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pointsCard: {
    alignSelf: "flex-start",
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 20,
    alignItems: "flex-start",
    width: "100%",
  },
  pointsContent: {
    width: "100%",
  },
  pointsLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6d28d9",
    letterSpacing: 0.5,
    textAlign: "left",
  },
  pointsValue: {
    fontSize: 54,
    lineHeight: 58,
    fontWeight: "900",
    letterSpacing: -1.5,
    color: "#4c1d95",
    marginTop: 4,
    textAlign: "left",
    textShadowColor: "#f7efff",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  pointsSubText: {
    color: "#6b7280",
    marginTop: 6,
    fontSize: 18,
    textAlign: "left",
  },
  pointsProgressText: {
    color: "#4b5563",
    marginTop: 8,
    fontSize: 19,
    fontWeight: "600",
    textAlign: "left",
  },
  pointsRetryNote: {
    color: "#6b7280",
    marginTop: 6,
    textAlign: "left",
    fontSize: 15,
    lineHeight: 20,
  },

  // Section heading
  casesTitle: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    marginBottom: 8,
  },
  casesSubText: {
    color: "#6b7280",
    fontSize: 17,
    lineHeight: 24,
  },

  // Error state
  errorText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  retryButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontWeight: "600",
    color: "#374151",
  },

  // Case card
  caseCard: {
    borderWidth: 1,
    borderColor: "#ddd6fe",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  caseCardPressable: {
    padding: 18,
    backgroundColor: "#ffffff",
  },
  caseCardPressablePressed: {
    backgroundColor: "#faf5ff",
  },
  caseCardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  caseCardHeaderText: {
    flex: 1,
  },
  caseCardHeaderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  caseCardLevelLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6d28d9",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  caseStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  caseStatusBadgeReady: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  caseStatusBadgeComplete: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
  },
  caseStatusBadgeProgress: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
  },
  caseStatusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  caseStatusBadgeTextReady: {
    color: "#1d4ed8",
  },
  caseStatusBadgeTextComplete: {
    color: "#166534",
  },
  caseStatusBadgeTextProgress: {
    color: "#92400e",
  },
  caseCardTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    color: "#111827",
  },
  caseCardHintText: {
    color: "#6b7280",
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
  },
  caseCardLaunchPill: {
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minWidth: 92,
    alignItems: "center",
  },
  caseCardLaunchPillText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  caseMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  caseMetaChip: {
    borderWidth: 1,
    borderColor: "#e9d5ff",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 108,
  },
  caseMetaChipLabel: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 4,
  },
  caseMetaChipValue: {
    color: "#111827",
    fontWeight: "700",
    fontSize: 15,
  },
  attemptsRow: {
    borderTopWidth: 1,
    borderColor: "#ede9fe",
    backgroundColor: "#fcfcff",
  },
  attemptsButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  attemptsButtonText: {
    fontWeight: "600",
    color: "#6b7280",
    fontSize: 16,
  },

  // Empty state
  emptyText: {
    color: "#6b7280",
  },
});
