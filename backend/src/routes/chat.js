const express = require("express");
const { loadCase } = require("../utils/caseLoader");
const { sanitizeCase } = require("../utils/safeCase");
const { buildPatientSystemPrompt } = require("../utils/patientPrompt");
const { createPatientReply } = require("../llm/navigatorClient");

const router = express.Router();

// prevent transcript aka data dump
function cleanPatientReply(raw) {
  return String(raw || "")
    .split(/\n\s*(user|assistant)\b[:]?/i)[0]
    .trim();
}

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
    const osceOpening = safeCase.osce_opening || null;

    const sanitizedMessages = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({
        role: m.role,
        content: String(m.content || "")
      }))
      .filter((m) => m.content.trim().length > 0);

    // allow client to fetch case opener metadata WITHOUT starting the chat
    if (sanitizedMessages.length === 0) {
      res.json({ reply: "", osce_opening: osceOpening });
      return;
    }

    // OSCE scripted flow by taking turn
    // count only student turns
    const userMsgCount = sanitizedMessages.filter((m) => m.role === "user").length;

    // 1st student message -> patient responds with name-permission line (polite)
    if (osceOpening?.patient_name_permission?.yes && userMsgCount === 1) {
      res.json({ reply: osceOpening.patient_name_permission.yes, osce_opening: osceOpening });
      return;
    }

    // 2nd student message -> patient gives chief complaint
    if (osceOpening?.patient_chief_complaint_reply && userMsgCount === 2) {
      res.json({ reply: osceOpening.patient_chief_complaint_reply, osce_opening: osceOpening });
      return;
    }

    // after the OSCE opening, use the LLM
    const systemPrompt = buildPatientSystemPrompt(safeCase);

    const replyRaw = await createPatientReply({
      systemPrompt,
      messages: sanitizedMessages
    });

    const reply = cleanPatientReply(replyRaw);

    res.json({ reply, osce_opening: osceOpening });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
