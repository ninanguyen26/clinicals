function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectUserText(conversation) {
  return normalizeText(
    conversation
      .filter((message) => message && message.role === "user")
      .map((message) => message.content || "")
      .join(" ")
  );
}

const TOPIC_KEYWORDS = {
  "symptom onset and duration": [
    "when did",
    "how long",
    "start",
    "started",
    "began",
    "onset",
    "duration"
  ],
  "urinary frequency/urgency": [
    "frequency",
    "frequent",
    "urgency",
    "urgent",
    "going more",
    "pee more",
    "urinate more"
  ],
  "fever or chills": ["fever", "chills", "chill"],
  "flank pain": ["flank", "side pain", "back pain"],
  "nausea or vomiting": ["nausea", "vomit", "vomiting", "throw up"],
  "pregnancy status": ["pregnant", "pregnancy", "lmp", "last period"],
  "medication allergies": ["allergy", "allergic", "allergies"],
  "symptom onset": ["when did", "how long", "start", "started", "began", "onset"],
  "urinary frequency": ["frequency", "frequent", "going more", "pee more"],
  "urgency": ["urgency", "urgent"]
};

const ACTION_RULES = {
  "consider urinalysis": {
    any: ["urinalysis", "urine test", "ua", "dipstick"]
  },
  "ask about pregnancy test if applicable": {
    any: ["pregnancy test", "urine pregnancy", "hcg"]
  },
  "provide treatment plan and return precautions": {
    any: ["treat", "treatment", "antibiotic", "prescribe", "plan"],
    any2: ["return", "come back", "worse", "er", "emergency", "precautions", "follow up"]
  }
};

const RED_FLAG_KEYWORDS = {
  "fever > 101f": ["fever", "temperature"],
  "flank pain": ["flank", "side pain", "back pain"],
  "vomiting": ["vomit", "vomiting", "throw up"],
  "pregnancy": ["pregnant", "pregnancy", "lmp", "last period"]
};

function normalizeKeywords(input) {
  if (!input) return null;
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item).toLowerCase().trim())
      .filter((item) => item.length > 0);
  }
  if (typeof input === "string") {
    const keyword = input.toLowerCase().trim();
    return keyword ? [keyword] : null;
  }
  return null;
}

function normalizeOverrideMap(map) {
  if (!map || typeof map !== "object") return {};
  const normalized = {};
  Object.entries(map).forEach(([key, value]) => {
    normalized[String(key).toLowerCase()] = value;
  });
  return normalized;
}

function keywordsFromPhrase(phrase) {
  return phrase
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length >= 4);
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function topicCovered(text, topic, overrideKeywords) {
  const key = topic.toLowerCase();
  const custom = normalizeKeywords(overrideKeywords?.[key]);
  const keywords = custom || TOPIC_KEYWORDS[key] || keywordsFromPhrase(topic);
  return keywords.length > 0 && includesAny(text, keywords);
}

function actionCovered(text, action, overrideRules) {
  const key = action.toLowerCase();
  const override = overrideRules?.[key];
  if (override) {
    const overrideList = normalizeKeywords(override);
    if (overrideList) {
      return includesAny(text, overrideList);
    }
    if (typeof override === "object") {
      const any = normalizeKeywords(override.any) || [];
      const any2 = normalizeKeywords(override.any2) || [];
      if (any.length && any2.length) {
        return includesAny(text, any) && includesAny(text, any2);
      }
      return includesAny(text, any);
    }
  }
  const rule = ACTION_RULES[key];
  if (!rule) {
    const keywords = keywordsFromPhrase(action);
    return keywords.length > 0 && includesAny(text, keywords);
  }
  if (rule.any && rule.any2) {
    return includesAny(text, rule.any) && includesAny(text, rule.any2);
  }
  return includesAny(text, rule.any || []);
}

function redFlagCovered(text, redFlag, overrideKeywords) {
  const key = redFlag.toLowerCase();
  const custom = normalizeKeywords(overrideKeywords?.[key]);
  const keywords = custom || RED_FLAG_KEYWORDS[key] || keywordsFromPhrase(redFlag);
  return keywords.length > 0 && includesAny(text, keywords);
}

function checkCriticalFails(coverage) {
  const fails = [];

  coverage.criticalFails.forEach((failText) => {
    const lowered = failText.toLowerCase();
    if (lowered.includes("pregnancy status")) {
      if (!coverage.historyTopics["pregnancy status"]) {
        fails.push(failText);
      }
      return;
    }

    if (lowered.includes("pyelonephritis") || lowered.includes("fever") || lowered.includes("flank pain")) {
      const feverAsked = coverage.historyTopics["fever or chills"] || false;
      const flankAsked = coverage.historyTopics["flank pain"] || false;
      if (!(feverAsked && flankAsked)) {
        fails.push(failText);
      }
      return;
    }

    if (!coverage.historyTopics[failText.toLowerCase()]) {
      fails.push(failText);
    }
  });

  return fails;
}

function gradeConversation({ caseData, gradingData, conversation }) {
  const userText = collectUserText(conversation);

  const keywordOverrides = gradingData.keyword_overrides || {};
  const historyOverrides = normalizeOverrideMap(keywordOverrides.history_topics);
  const actionOverrides = normalizeOverrideMap(keywordOverrides.actions);
  const redFlagOverrides = normalizeOverrideMap(keywordOverrides.red_flags);

  const historyTopics = gradingData.required_history_topics || [];
  const actions = gradingData.required_actions || [];
  const criticalFails = gradingData.critical_fails || [];

  const coverage = {
    historyTopics: {},
    actions: {},
    criticalFails
  };

  historyTopics.forEach((topic) => {
    coverage.historyTopics[topic.toLowerCase()] = topicCovered(userText, topic, historyOverrides);
  });

  actions.forEach((action) => {
    coverage.actions[action.toLowerCase()] = actionCovered(userText, action, actionOverrides);
  });

  const missedRequiredQuestions = historyTopics.filter(
    (topic) => !coverage.historyTopics[topic.toLowerCase()]
  );

  const redFlags = caseData?.hidden_truth?.red_flags || [];
  const missedRedFlags = redFlags.filter((flag) => !redFlagCovered(userText, flag, redFlagOverrides));

  const scoring = gradingData.scoring || {};
  const historyPoints = Number(scoring.history_topic_points) || 0;
  const actionPoints = Number(scoring.action_points) || 0;
  const criticalPenalty = Number(scoring.critical_fail_penalty) || 0;

  let score = 0;
  score += historyTopics.filter((topic) => coverage.historyTopics[topic.toLowerCase()]).length * historyPoints;
  score += actions.filter((action) => coverage.actions[action.toLowerCase()]).length * actionPoints;

  const triggeredFails = checkCriticalFails(coverage);
  score -= triggeredFails.length * criticalPenalty;

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  const feedbackParts = [
    `History topics covered: ${historyTopics.length - missedRequiredQuestions.length}/${historyTopics.length}.`,
    `Actions covered: ${actions.filter((action) => coverage.actions[action.toLowerCase()]).length}/${actions.length}.`
  ];

  if (missedRequiredQuestions.length) {
    feedbackParts.push(`Missed history topics: ${missedRequiredQuestions.join(", ")}.`);
  }
  if (missedRedFlags.length) {
    feedbackParts.push(`Missed red flags: ${missedRedFlags.join(", ")}.`);
  }
  if (triggeredFails.length) {
    feedbackParts.push(`Critical fails: ${triggeredFails.join(", ")}.`);
  }

  return {
    score,
    missed_required_questions: missedRequiredQuestions,
    missed_red_flags: missedRedFlags,
    feedback: feedbackParts.join(" ")
  };
}

module.exports = { gradeConversation };
