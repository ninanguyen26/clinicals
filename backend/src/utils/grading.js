const { createRubricEval } = require("../llm/navigatorClient");
const { expandCriteriaWithCommon } = require("./rubricCommon");
const { validateAndNormalizeRubricLlmOutput } = require("./llmRubricSchema");

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKeywords(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((item) => normalizeText(item))
      .filter((item) => item.length > 0);
  }
  const keyword = normalizeText(input);
  return keyword ? [keyword] : [];
}

function normalizeKeywordGroups(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((group) => normalizeKeywords(group))
    .filter((group) => group.length > 0);
}

function normalizeOverrideMap(map) {
  if (!map || typeof map !== "object") return {};
  const normalized = {};
  Object.entries(map).forEach(([key, value]) => {
    normalized[normalizeText(key)] = value;
  });
  return normalized;
}

function keywordsFromPhrase(phrase) {
  return normalizeText(phrase)
    .split(/\s+/)
    .filter((word) => word.length >= 4);
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function collectTextBySource(conversation, source) {
  const target = source || "user";
  if (target === "all") {
    return normalizeText((conversation || []).map((message) => message?.content || "").join(" "));
  }

  const allowedRoles = Array.isArray(target) ? target : [target];
  const roleSet = new Set(allowedRoles.map((role) => String(role).toLowerCase()));

  return normalizeText(
    (conversation || [])
      .filter((message) => message && roleSet.has(String(message.role || "").toLowerCase()))
      .map((message) => message.content || "")
      .join(" ")
  );
}

function evaluateRule(text, rule) {
  const anyKeywords = normalizeKeywords(rule?.any);
  const allKeywords = normalizeKeywords(rule?.all);
  const groups = normalizeKeywordGroups(rule?.groups);

  const evidence = [];

  if (allKeywords.length > 0) {
    for (const keyword of allKeywords) {
      if (!text.includes(keyword)) {
        return { matched: false, evidence: [] };
      }
      evidence.push(keyword);
    }
  }

  if (anyKeywords.length > 0) {
    const matchedAny = anyKeywords.filter((keyword) => text.includes(keyword));
    if (matchedAny.length === 0) {
      return { matched: false, evidence: [] };
    }
    evidence.push(...matchedAny.slice(0, 3));
  }

    if (groups.length > 0) {
    const minGroupsMatchedRaw = rule?.min_groups_matched;
    const minGroupsMatched = Number.isFinite(Number(minGroupsMatchedRaw))
      ? Number(minGroupsMatchedRaw)
      : null;

    let matchedCount = 0;

    for (const group of groups) {
      const matched = group.find((keyword) => text.includes(keyword));

      if (matched) {
        matchedCount += 1;
        evidence.push(matched);
      } else if (minGroupsMatched === null) {
        // require ALL groups unless a threshold is specified
        return { matched: false, evidence: [] };
      }
    }

    // if threshold specified, require at least that many groups to match
    if (minGroupsMatched !== null && matchedCount < minGroupsMatched) {
      return { matched: false, evidence: [] };
    }
  }

  if (allKeywords.length === 0 && anyKeywords.length === 0 && groups.length === 0) {
    return { matched: false, evidence: [] };
  }

  return { matched: true, evidence: [...new Set(evidence)].slice(0, 5) };
}

function extractJsonObject(text) {
  if (!text) return null;

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("JSON parse failed:", err);
    return null;
  }
}

function buildConversationTranscript(conversation) {
  return (conversation || [])
    .map((message, idx) => {
      const role = String(message?.role || "unknown").toUpperCase();
      const content = String(message?.content || "").trim();
      return `${idx + 1}. ${role}: ${content}`;
    })
    .join("\n");
}

function describeRuleForLlm(rule) {
  const anyKeywords = normalizeKeywords(rule?.any);
  const allKeywords = normalizeKeywords(rule?.all);
  const groups = normalizeKeywordGroups(rule?.groups);
  const parts = [];

  if (allKeywords.length) {
    parts.push(`Must include all concepts: ${allKeywords.join(", ")}`);
  }
  if (anyKeywords.length) {
    parts.push(`Can match any of: ${anyKeywords.join(", ")}`);
  }
  if (groups.length) {
    const groupSummary = groups.map((group) => `[${group.join(", ")}]`).join(" + ");
    parts.push(`For each group, mention at least one concept: ${groupSummary}`);
  }

  return parts.join(" ");
}

// calls LLM to evaluate rubric criteria and validates its output
async function evaluateCriteriaWithLlm({ caseData, criteria, conversation }) {
  console.log(">>> LLM GRADING CALLED!!!!!!!!");

  // only LLM-enabled criteria
  const llmCriteria = criteria.filter(
    (criterion) =>
      criterion.enabled !== false &&
      (criterion.mode === "llm" || criterion.mode === "llm_or_rule")
  );

  if (!llmCriteria.length) {
    return new Map();
  }

  const criteriaPrompt = llmCriteria
    .map((criterion) => {
      const source = criterion.source || "user";
      const guidance =
        criterion.prompt_hint ||
        criterion.description ||
        describeRuleForLlm(criterion.rule || criterion.fallback_rule);
      const guidanceLine = guidance ? `\n  guidance: ${guidance}` : "";
      return `- id: ${criterion.id}\n  label: ${
        criterion.label || criterion.id
      }\n  points: ${Number(criterion.points) || 0}\n  source: ${source}${guidanceLine}`;
    })
    .join("\n");

  const transcript = buildConversationTranscript(conversation);
    
  // prevent free-form responses
  const systemPrompt = `
    You are a strict clinical OSCE rubric grader.

    Evaluate each criterion using ONLY the transcript.
    Do NOT infer missing information.
    If not explicitly stated, mark as "not_met".

    Return STRICT JSON only.
    No markdown.
    No commentary.
    No extra keys.

    You MUST return this exact schema:

    {
      "results": [
        {
          "id": "criterion_id",
          "status": "met | partially_met | not_met",
          "earned_points": number,
          "evidence": ["exact quote from transcript"],
          "rationale": "brief reason"
        }
      ]
    }

    Rules:
    - Include ALL criteria listed.
    - Do NOT invent ids.
    - earned_points must be 0 if status is not_met.
    - earned_points must equal full points if status is met.
    - partially_met must be between 0 and full points.
  `;

  const userPrompt = [
    `Case ID: ${caseData?.case_id || "unknown"}`,
    "Criteria:",
    criteriaPrompt,
    "Transcript:",
    transcript
  ].join("\n\n");

  try {
    const response = await createRubricEval({ systemPrompt, userPrompt });
    const parsed = extractJsonObject(response);
    console.log("PARSED:", parsed);

    if (!parsed) {
      console.error("LLM response:", response);
    }

    const { normalizedResultsById } = validateAndNormalizeRubricLlmOutput(parsed, llmCriteria);

    // Map(id -> {status, earned_points, evidence[], rationale})
    return normalizedResultsById;
  } catch (err) {
    console.error("Error evaluating LLM criteria:", err);
    return new Map();
  }
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map((tag) => normalizeText(tag)).filter(Boolean);
}

function evaluateCriterion(conversation, criterion, llmResults) {
  const enabled = criterion.enabled !== false;
  const tags = normalizeTags(criterion.tags);
  const points = Number(criterion.points) || 0;

  if (!enabled) {
    return {
      id: criterion.id,
      section: criterion.section,
      label: criterion.label || criterion.id,
      tags,
      points,
      earned_points: 0,
      status: "omitted",
      omit_reason: criterion.omit_reason || "Marked not applicable for this case",
      evidence: [],
      rationale: null
    };
  }

  const mode = criterion.mode || "rule";
  const text = collectTextBySource(conversation, criterion.source || "user");

  if (mode === "llm" || mode === "llm_or_rule") {
    // console.log("Checking ID:", criterion.id);
    // console.log("LLM Map Keys:", Array.from(llmResults.keys()));

    if (llmResults?.has(criterion.id)) {
      const llm = llmResults.get(criterion.id);

      const status =
        llm.status === "met"
          ? "met"
          : llm.status === "partially_met"
          ? "partially_met"
          : "missed"; // not_met -> missed 

      return {
        id: criterion.id,
        section: criterion.section,
        label: criterion.label || criterion.id,
        tags,
        points,
        earned_points: Number(llm.earned_points) || 0,
        status,
        omit_reason: null,
        evidence: Array.isArray(llm.evidence) ? llm.evidence : [],
        rationale: llm.rationale || null
      };
    }

    // missing LLM result -> fallback behavior
    if (mode === "llm_or_rule") {
      const fallbackRule = criterion.fallback_rule || criterion.rule || {};
      const ruleResult = evaluateRule(text, fallbackRule);

      return {
        id: criterion.id,
        section: criterion.section,
        label: criterion.label || criterion.id,
        tags,
        points,
        earned_points: ruleResult.matched ? points : 0,
        status: ruleResult.matched ? "met" : "missed",
        omit_reason: null,
        evidence: ruleResult.evidence,
        rationale: "Fallback rule used (LLM missing result)."
      };
    }

    // mode === "llm" only
    return {
      id: criterion.id,
      section: criterion.section,
      label: criterion.label || criterion.id,
      tags,
      points,
      earned_points: 0,
      status: "missed",
      omit_reason: null,
      evidence: [],
      rationale: "LLM missing result."
    };
  }

  // rule-only path
  const fallbackRule = criterion.fallback_rule || criterion.rule || {};
  const ruleResult = evaluateRule(text, fallbackRule);

  return {
    id: criterion.id,
    section: criterion.section,
    label: criterion.label || criterion.id,
    tags,
    points,
    earned_points: ruleResult.matched ? points : 0,
    status: ruleResult.matched ? "met" : "missed",
    omit_reason: null,
    evidence: ruleResult.evidence,
    rationale: null
  };
}

function summarizeSections(sectionDefs, criterionResults) {
  const sectionMap = new Map();

  (sectionDefs || []).forEach((section) => {
    if (!section || !section.id) return;
    sectionMap.set(section.id, {
      section: section.id,
      label: section.label || section.id,
      earned_points: 0,
      available_points: 0,
      total_points: 0
    });
  });

  criterionResults.forEach((result) => {
    const key = result.section || "other";
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        section: key,
        label: key,
        earned_points: 0,
        available_points: 0,
        total_points: 0
      });
    }

    const section = sectionMap.get(key);
    section.total_points += result.points;
    if (result.status !== "omitted") {
      section.available_points += result.points;
      section.earned_points += result.earned_points;
    }
  });

  const orderedIds = (sectionDefs || []).map((section) => section.id);
  const extraIds = Array.from(sectionMap.keys()).filter((id) => !orderedIds.includes(id));

  return [...orderedIds, ...extraIds].map((id) => sectionMap.get(id));
}

function findMissedByTag(criteriaResults, tag) {
  const normalizedTag = normalizeText(tag);
  return criteriaResults
    .filter(
      (criterion) =>
        // partial == “missed” for required/red-flag lists
        (criterion.status === "missed" || criterion.status === "partially_met") &&
        Array.isArray(criterion.tags) &&
        criterion.tags.includes(normalizedTag)
    )
    .map((criterion) => criterion.label);
}

function matchTextItem(text, item, overrideMap) {
  const key = normalizeText(item);
  const custom = normalizeKeywords(overrideMap?.[key]);
  const keywords = custom.length ? custom : keywordsFromPhrase(item);
  return keywords.length > 0 && includesAny(text, keywords);
}

function gradeWithoutRubric({ caseData, gradingData, conversation }) {
  const keywordOverrides = gradingData.keyword_overrides || {};
  const historyOverrides = normalizeOverrideMap(keywordOverrides.history_topics);
  const actionOverrides = normalizeOverrideMap(keywordOverrides.actions);
  const redFlagOverrides = normalizeOverrideMap(keywordOverrides.red_flags);
  const criticalOverrides = normalizeOverrideMap(keywordOverrides.critical_fails);

  const historyTopics = gradingData.required_history_topics || [];
  const actions = gradingData.required_actions || [];
  const criticalFails = gradingData.critical_fails || [];
  const redFlags = caseData?.hidden_truth?.red_flags || [];

  const userText = collectTextBySource(conversation, "user");

  const coveredHistoryCount = historyTopics.filter((topic) =>
    matchTextItem(userText, topic, historyOverrides)
  ).length;
  const coveredActionsCount = actions.filter((action) =>
    matchTextItem(userText, action, actionOverrides)
  ).length;

  const missedRequiredQuestions = historyTopics.filter(
    (topic) => !matchTextItem(userText, topic, historyOverrides)
  );

  const missedRedFlags = redFlags.filter(
    (flag) => !matchTextItem(userText, flag, redFlagOverrides)
  );

  const criticalFailsTriggered = criticalFails.filter(
    (criterion) => !matchTextItem(userText, criterion, criticalOverrides)
  );

  const scoring = gradingData.scoring || {};
  const historyPoints = Number(scoring.history_topic_points) || 0;
  const actionPoints = Number(scoring.action_points) || 0;
  const criticalPenalty = Number(scoring.critical_fail_penalty) || 0;

  let score = 0;
  score += coveredHistoryCount * historyPoints;
  score += coveredActionsCount * actionPoints;
  score -= criticalFailsTriggered.length * criticalPenalty;

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  const passingScore = Number(scoring.passing_score) || 84;
  const passed = score >= passingScore;

  const feedbackParts = [
    `Legacy checklist score: ${score}%`,
    `Passing threshold: ${passingScore}%.`,
    `History topics covered: ${coveredHistoryCount}/${historyTopics.length}.`,
    `Actions covered: ${coveredActionsCount}/${actions.length}.`
  ];

  if (missedRequiredQuestions.length) {
    feedbackParts.push(`Missed history topics: ${missedRequiredQuestions.join(", ")}.`);
  }
  if (missedRedFlags.length) {
    feedbackParts.push(`Missed red flags: ${missedRedFlags.join(", ")}.`);
  }
  if (criticalFailsTriggered.length) {
    feedbackParts.push(`Critical fails: ${criticalFailsTriggered.join(", ")}.`);
  }

  return {
    score,
    passing_score: passingScore,
    passed,
    can_unlock_next_case: passed,
    earned_points: null,
    available_points: null,
    total_points: null,
    omitted_points: 0,
    section_scores: [],
    criteria_results: [],
    missed_required_questions: missedRequiredQuestions,
    missed_red_flags: missedRedFlags,
    critical_fails_triggered: criticalFailsTriggered,
    feedback: feedbackParts.join(" ")
  };
}

async function gradeWithRubric({ caseData, gradingData, conversation }) {
  const rubric = gradingData.rubric || {};
  const criteria = expandCriteriaWithCommon(rubric);
  const sectionDefs = Array.isArray(rubric.sections) ? rubric.sections : [];

  const llmResults = await evaluateCriteriaWithLlm({ caseData, criteria, conversation });

  const criteriaResults = criteria.map((criterion) =>
    evaluateCriterion(conversation, criterion, llmResults)
  );

  const sectionScores = summarizeSections(sectionDefs, criteriaResults);

  const totalPoints = criteriaResults.reduce((sum, item) => sum + item.points, 0);
  const availablePoints = criteriaResults
    .filter((item) => item.status !== "omitted")
    .reduce((sum, item) => sum + item.points, 0);
  const earnedPoints = criteriaResults.reduce((sum, item) => sum + item.earned_points, 0);
  const omittedPoints = totalPoints - availablePoints;

  const score = availablePoints > 0 ? Math.round((earnedPoints / availablePoints) * 100) : 0;
  const passingScore = Number(rubric.passing_score || gradingData?.scoring?.passing_score || 84);
  const passed = score >= passingScore;

  const missedRequiredQuestions = findMissedByTag(criteriaResults, "required_history");
  const missedRedFlags = findMissedByTag(criteriaResults, "red_flag");
  const criticalFailsTriggered = findMissedByTag(criteriaResults, "critical_fail");

  const feedbackParts = [
    `CPI rubric score: ${score}% (${earnedPoints}/${availablePoints} available points).`,
    `Passing threshold: ${passingScore}%.`
  ];

  if (omittedPoints > 0) {
    feedbackParts.push(`Omitted criteria points removed from denominator: ${omittedPoints}.`);
  }

  const missedCount = criteriaResults.filter((item) => item.status === "missed").length;
  feedbackParts.push(`Criteria met: ${criteriaResults.length - missedCount}/${criteriaResults.length}.`);

  if (missedRequiredQuestions.length > 0) {
    feedbackParts.push(`Missed required history items: ${missedRequiredQuestions.join(", ")}.`);
  }
  if (missedRedFlags.length > 0) {
    feedbackParts.push(`Missed red flags: ${missedRedFlags.join(", ")}.`);
  }
  if (criticalFailsTriggered.length > 0) {
    feedbackParts.push(`Critical fails: ${criticalFailsTriggered.join(", ")}.`);
  }

  return {
    score,
    passing_score: passingScore,
    passed,
    can_unlock_next_case: passed,
    earned_points: roundTo(earnedPoints),
    available_points: roundTo(availablePoints),
    total_points: roundTo(totalPoints),
    omitted_points: roundTo(omittedPoints),
    section_scores: sectionScores.map((section) => ({
      ...section,
      earned_points: roundTo(section.earned_points),
      available_points: roundTo(section.available_points),
      total_points: roundTo(section.total_points)
    })),
    criteria_results: criteriaResults,
    missed_required_questions: missedRequiredQuestions,
    missed_red_flags: missedRedFlags,
    critical_fails_triggered: criticalFailsTriggered,
    feedback: feedbackParts.join(" ")
  };
}

async function gradeConversation({ caseData, gradingData, conversation }) {
  const safeConversation = Array.isArray(conversation) ? conversation : [];

  if (gradingData?.rubric?.criteria?.length || gradingData?.rubric?.common_criteria?.length) {
    return gradeWithRubric({ caseData, gradingData, conversation: safeConversation });
  }

  return gradeWithoutRubric({ caseData, gradingData, conversation: safeConversation });
}

module.exports = { gradeConversation };
