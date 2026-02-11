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
});