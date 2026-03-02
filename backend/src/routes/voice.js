const express = require("express");
const { createSpeechAudio } = require("../llm/navigatorClient");

const router = express.Router();

router.post("/speak", async (req, res, next) => {
  try {
    const { text, voice, speed } = req.body || {};
    const trimmedText = String(text || "").trim();

    if (!trimmedText) {
      res.status(400).json({ error: "text is required" });
      return;
    }

    const { audioBase64, mimeType } = await createSpeechAudio({
      text: trimmedText.slice(0, 1200),
      voice,
      speed
    });

    res.json({ audio_base64: audioBase64, mime_type: mimeType });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
