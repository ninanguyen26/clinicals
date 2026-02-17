const express = require("express");
const prisma = require("../db/prisma");
const { ensureCaseFromId } = require("../utils/caseSync");
const { getOrCreateUser } = require("../utils/userResolver");
const { loadCase, loadGrading } = require("../utils/caseLoader");
const { gradeConversation } = require("../utils/grading");

const router = express.Router();

function getClerkUserId(req) {
  return req.header("x-clerk-user-id");
}

async function resolveUser(req) {
  const clerkUserId = getClerkUserId(req);
  if (!clerkUserId) {
    const error = new Error("Missing x-clerk-user-id header");
    error.status = 401;
    throw error;
  }
  const name = req.header("x-user-name") || undefined;
  const email = req.header("x-user-email") || undefined;
  const imageUrl = req.header("x-user-image") || undefined;
  return getOrCreateUser(clerkUserId, { name, email, imageUrl });
}

router.post("/", async (req, res, next) => {
  try {
    const { caseId } = req.body || {};
    if (!caseId) {
      res.status(400).json({ error: "caseId is required" });
      return;
    }

    const user = await resolveUser(req);
    const caseRecord = await ensureCaseFromId(caseId);
    if (!caseRecord) {
      res.status(404).json({ error: "Case not found" });
      return;
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        caseId: caseRecord.id
      }
    });

    res.json({ conversationId: conversation.id });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/messages", async (req, res, next) => {
  try {
    const { role, content } = req.body || {};
    if (!role || !content) {
      res.status(400).json({ error: "role and content are required" });
      return;
    }
    if (role !== "user" && role !== "assistant") {
      res.status(400).json({ error: "role must be user or assistant" });
      return;
    }

    const user = await resolveUser(req);
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id }
    });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    if (conversation.userId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: role.toUpperCase(),
        content: String(content)
      }
    });

    res.json({ messageId: message.id });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        patientCase: true,
        messages: { orderBy: { createdAt: "asc" } },
        submission: true
      }
    });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    if (conversation.userId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json({
      conversationId: conversation.id,
      caseId: conversation.patientCase.caseId,
      status: conversation.status,
      startedAt: conversation.startedAt,
      submittedAt: conversation.submittedAt,
      messages: conversation.messages.map((msg) => ({
        role: msg.role.toLowerCase(),
        content: msg.content,
        createdAt: msg.createdAt
      })),
      submission: conversation.submission
        ? {
            score: conversation.submission.score,
            feedback: conversation.submission.feedback,
            details: conversation.submission.details,
            submittedAt: conversation.submission.submittedAt
          }
        : null
    });
  } catch (err) {
    next(err);
  }
});

async function updateUserProgress(userId, score) {
  const existing = await prisma.userProgress.findUnique({ where: { userId } });
  const xpGain = Number(score) || 0;

  if (!existing) {
    const level = Math.floor(xpGain / 100) + 1;
    return prisma.userProgress.create({
      data: {
        userId,
        xp: xpGain,
        level
      }
    });
  }

  const nextXp = existing.xp + xpGain;
  const nextLevel = Math.max(existing.level, Math.floor(nextXp / 100) + 1);

  return prisma.userProgress.update({
    where: { userId },
    data: {
      xp: nextXp,
      level: nextLevel
    }
  });
}

router.post("/:id/submit", async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.id },
      include: {
        patientCase: true,
        messages: { orderBy: { createdAt: "asc" } },
        submission: true
      }
    });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    if (conversation.userId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (conversation.submission) {
      const savedDetails = conversation.submission.details || {};
      const passingScore = Number(savedDetails.passing_score || 84);
      const passed =
        typeof savedDetails.passed === "boolean"
          ? savedDetails.passed
          : conversation.submission.score >= passingScore;

      res.json({
        score: conversation.submission.score,
        feedback: conversation.submission.feedback,
        passing_score: passingScore,
        passed,
        can_unlock_next_case:
          typeof savedDetails.can_unlock_next_case === "boolean"
            ? savedDetails.can_unlock_next_case
            : passed,
        earned_points: savedDetails.earned_points ?? null,
        available_points: savedDetails.available_points ?? null,
        total_points: savedDetails.total_points ?? null,
        omitted_points: savedDetails.omitted_points ?? 0,
        section_scores: savedDetails.section_scores || [],
        criteria_results: savedDetails.criteria_results || [],
        missed_required_questions: savedDetails.missed_required_questions || [],
        missed_red_flags: savedDetails.missed_red_flags || [],
        critical_fails_triggered: savedDetails.critical_fails_triggered || [],
        details: savedDetails
      });
      return;
    }

    const caseId = conversation.patientCase.caseId;
    const [caseData, gradingData] = await Promise.all([
      loadCase(caseId),
      loadGrading(caseId)
    ]);

    if (!caseData || !gradingData) {
      res.status(404).json({ error: "Case or grading rubric not found" });
      return;
    }

    const conversationPayload = conversation.messages.map((msg) => ({
      role: msg.role.toLowerCase(),
      content: msg.content
    }));

    const result = await gradeConversation({
      caseData,
      gradingData,
      conversation: conversationPayload
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date()
      }
    });

    await prisma.submission.create({
      data: {
        conversationId: conversation.id,
        score: result.score,
        feedback: result.feedback,
        details: {
          passing_score: result.passing_score,
          passed: result.passed,
          can_unlock_next_case: result.can_unlock_next_case,
          earned_points: result.earned_points ?? null,
          available_points: result.available_points ?? null,
          total_points: result.total_points ?? null,
          omitted_points: result.omitted_points ?? 0,
          section_scores: result.section_scores || [],
          criteria_results: result.criteria_results || [],
          missed_required_questions: result.missed_required_questions,
          missed_red_flags: result.missed_red_flags,
          critical_fails_triggered: result.critical_fails_triggered || []
        }
      }
    });

    await updateUserProgress(user.id, result.score);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
