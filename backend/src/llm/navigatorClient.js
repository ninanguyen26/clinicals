const DEFAULT_BASE_URL = "https://api.ai.it.ufl.edu";

function getNavigatorConfig() {
  const apiKey = process.env.NAVIGATOR_API_KEY;
  const chatModel = process.env.NAVIGATOR_MODEL;
  const gradingModel = process.env.NAVIGATOR_GRADING_MODEL || chatModel;
  const baseUrl = process.env.NAVIGATOR_BASE || DEFAULT_BASE_URL;

  if (!apiKey) {
    throw new Error("NAVIGATOR_API_KEY is not set");
  }
  if (!chatModel) {
    throw new Error("NAVIGATOR_MODEL is not set");
  }

  return {
    apiKey,
    chatModel,
    gradingModel,
    baseUrl
  };
}

async function callNavigatorChat({
  model,
  messages,
  temperature = 0.4,
  maxTokens = 250,
  stop = null
}) {
  const { apiKey, baseUrl } = getNavigatorConfig();

  const payload = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages
  };

  if (Array.isArray(stop) && stop.length > 0) {
    payload.stop = stop;
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`NaviGator API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message?.content;
  if (!message) {
    throw new Error("NaviGator API returned no message");
  }
  return message.trim();
}

async function createPatientReply({ systemPrompt, messages }) {
  const { chatModel } = getNavigatorConfig();
  return callNavigatorChat({
    model: chatModel,
    temperature: 0.4,
    maxTokens: 250,
    stop: ["\nuser", "\nUser", "\nassistant", "\nAssistant"],
    messages: [{ role: "system", content: systemPrompt }, ...messages]
  });
}

async function createRubricEval({ systemPrompt, userPrompt }) {
  const { gradingModel } = getNavigatorConfig();
  return callNavigatorChat({
    model: gradingModel,
    temperature: 0,
    maxTokens: 1000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });
}

module.exports = { createPatientReply, createRubricEval };
