const express = require("express");
const { loadCase } = require("../utils/caseLoader");
const { sanitizeCase } = require("../utils/safeCase");
const { buildPatientSystemPrompt } = require("../utils/patientPrompt");
const { createPatientReply } = require("../llm/navigatorClient");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { caseId, messages } = req.body || {};
    if (!caseId || !Array.isArray(messages)) {
      res.status(400).json({ error: "caseId and messages are required" });
      return;
    }

    const caseData = await loadCase(caseId);
    if (!caseData) {
      res.status(404).json({ error: "Case not found" });
      return;
    }

    const safeCase = sanitizeCase(caseData);
    const systemPrompt = buildPatientSystemPrompt(safeCase);

    const sanitizedMessages = messages
      .filter((message) => message && (message.role === "user" || message.role === "assistant"))
      .map((message) => ({
        role: message.role,
        content: String(message.content || "")
      }))
      .filter((message) => message.content.trim().length > 0);

    if (sanitizedMessages.length === 0) {
      res.status(400).json({ error: "messages must include at least one user or assistant message" });
      return;
    }

    const reply = await createPatientReply({
      systemPrompt,
      messages: sanitizedMessages
    });

    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
