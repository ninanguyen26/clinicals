const DEFAULT_BASE_URL = "https://api.ai.it.ufl.edu";

async function createPatientReply({ systemPrompt, messages }) {
  const apiKey = process.env.NAVIGATOR_API_KEY;
  const model = process.env.NAVIGATOR_MODEL;
  const baseUrl = process.env.NAVIGATOR_BASE || DEFAULT_BASE_URL;

  if (!apiKey) {
    throw new Error("NAVIGATOR_API_KEY is not set");
  }
  if (!model) {
    throw new Error("NAVIGATOR_MODEL is not set");
  }

  const payload = {
    model,
    temperature: 0.4,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
    ]
  };

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

module.exports = { createPatientReply };
