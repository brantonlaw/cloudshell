// IntegrityGate.js
const IntegrityGate = {
  validateStateChange: function(caseData, caseFolder, actionCode, proposedUpdates) {
    // L1 is always allowed - no prerequisites required
    if (actionCode === 'L1') {
      return { allowed: true, corrections: {} };
    }

    if (actionCode === 'L2') {
      const l1 = FolderManager.checkDocumentExists(caseData, 'L1', caseFolder);
      if (!l1 || !l1.exists) {
        return { allowed: false, reason: 'L1 document must exist before L2', recovery: 'Generate L1 first' };
      }
    }
    if (actionCode === 'L3') {
      const l2 = FolderManager.checkDocumentExists(caseData, 'L2', caseFolder);
      if (!l2 || !l2.exists) {
        return { allowed: false, reason: 'L2 document must exist before L3', recovery: 'Generate L2 first' };
      }
    }
    const metadata = HistoryManager.getMetadata(caseFolder);
    if (metadata && metadata.currentState && metadata.currentState.l1_sent) {
      const l1v = FolderManager.checkDocumentExists(caseData, 'L1', caseFolder);
      if (!l1v || !l1v.exists) {
        return { allowed: false, reason: 'Metadata claims L1 sent but document missing', recovery: 'Metadata will be corrected', corrections: { 'currentState.l1_sent': null } };
      }
    }
    if (!StatusEngine.verifySLA(caseData)) {
      return { allowed: false, reason: 'SLA verification failed', recovery: 'Review case SLA inputs' };
    }
    return { allowed: true, corrections: {} };
  }
};
if (typeof module !== 'undefined') { module.exports = { IntegrityGate }; }
