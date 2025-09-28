// DebugDocAccess.gs - Helpers to validate DocumentApp/Drive access for templates
// Run `testConfiguredTemplateAccess()` from the Apps Script editor to quickly verify
// that the runtime has the Documents scope and can open the L1 template.

/**
 * Try to open a Google Doc by id via DriveApp and DocumentApp.
 * If no templateId provided, uses TEMPLATES.L1 when available.
 * Returns a small object describing success or the exact exception.
 */
function testDocumentAccess(templateId) {
  try {
    // Prefer explicit param, fall back to configured template L1
    if (!templateId) {
      if (typeof TEMPLATES !== 'undefined' && TEMPLATES && TEMPLATES.L1) {
        templateId = TEMPLATES.L1;
      }
    }

    if (!templateId) {
      return { success: false, error: 'No templateId provided and TEMPLATES.L1 not set' };
    }

    // 1) Basic Drive access check
    var driveFile = DriveApp.getFileById(templateId);
    var driveName = driveFile.getName();

    // 2) DocumentApp check - will throw if scope not granted
    var doc = DocumentApp.openById(templateId);
    var docName = doc.getName();

    return {
      success: true,
      driveName: driveName,
      docName: docName,
      templateId: templateId
    };

  } catch (e) {
    // Return the raw error for fast diagnosis in the editor logs
    return {
      success: false,
      error: e.toString(),
      stack: e.stack ? e.stack : null,
      templateId: templateId
    };
  }
}

/**
 * Convenience wrapper that tests the configured L1 template (if present).
 */
function testConfiguredTemplateAccess() {
  return testDocumentAccess();
}