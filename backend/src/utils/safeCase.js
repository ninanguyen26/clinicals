function sanitizeCase(caseData) {
  if (!caseData || typeof caseData !== "object") {
    return caseData;
  }
  const { hidden_truth, ...safeCase } = caseData;
  return safeCase;
}

module.exports = { sanitizeCase };
