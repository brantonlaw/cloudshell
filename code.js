// Code.gs - Main entry point and API endpoints
// This file connects the web UI to all backend modules

/**
 * Web app entry point - serves the HTML interface
 */
function doGet() {
  // Use the security-hardened index.html with full JavaScript
  try {
    return HtmlService.createHtmlOutputFromFile('index')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle('Collections Manager');
  } catch (error) {
    return HtmlService.createHtmlOutput(
      '<h1>Security-Hardened Index Failed</h1>' +
      '<p>Error: ' + error.toString() + '</p>' +
      '<p>This suggests the JavaScript is still causing issues</p>'
    ).setTitle('Debug - JS Error');
  }
}
/**
 * Include HTML partials (for CSS and JavaScript)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================
// API ENDPOINTS - Called from client JavaScript
// ============================================

/**
 * Get all cases for display in the list
 * Returns array of cases with calculated status
 */
function getCases() {
  try {
    console.log('API: Getting all cases');

    // Check if system needs bootstrapping
    const healthCheck = Bootstrap.checkSystemHealth();
    if (!healthCheck.healthy) {
      console.warn('API: System not healthy, attempting auto-initialization...');
      const initResult = Bootstrap.initializeSystem();
      if (!initResult.success) {
        console.error('API: Auto-initialization failed:', initResult.error);
        return [{
          accountNumber: 'SYSTEM-ERROR',
          businessName: 'System Initialization Required',
          ownerName: 'Please run initializeCollectionsManagerSystem()',
          statusColor: '#cc0000',
          statusText: 'SYSTEM_ERROR'
        }];
      }
      console.log('API: System auto-initialized successfully');
    }

    const cases = SheetManager.getCases();
    console.log('API: Retrieved', cases.length, 'cases from SheetManager');

    if (cases.length === 0) {
      console.warn('API: No cases returned from SheetManager - check sheet access and data');
      return [];
    }

    console.log('API: First case sample:', JSON.stringify(cases[0], null, 2));

    // Convert dates to strings and ensure all data is serializable
    const casesWithStatus = cases.map((caseData, index) => {
      console.log(`API: Processing case ${index + 1}/${cases.length}:`, caseData.businessName);
      const folder = FolderManager.findCaseFolder(caseData);
      const status = StatusEngine.calculateStatus(caseData, folder);
      
      return {
        ...caseData,
        // Convert dates to strings
        placementDate: caseData.placementDate ? caseData.placementDate.toString() : null,
        delinquentSince: caseData.delinquentSince ? caseData.delinquentSince.toString() : null,
        // Add status fields
        hasFolder: !!folder,
        folderUrl: folder ? folder.getUrl() : null,
        status: status.statusText,
        statusColor: status.color,
        statusCode: status.statusCode
      };
    });
    
    console.log(`API: Returning ${casesWithStatus.length} cases`);
    return casesWithStatus;
    
  } catch (error) {
    console.error('API Error in getCases:', error);
    return [];
  }
}

/**
 * Record an action for a case
 * @param {string} businessName - The business name of the case
 * @param {string} actionCode - The action code to record
 * @param {string} narrative - The narrative text
 */
function recordAction(businessName, actionCode, narrative) {
  try {
    console.log('API: Recording action for case:', businessName);
    
    // Get the case data first
    const caseData = SheetManager.getCase(businessName);
    if (!caseData) {
      console.error('API: Case not found:', businessName);
      return { success: false, error: 'Case not found' };
    }
    
    // Process the action using the account number
    const result = ActionProcessor.processAction(
      caseData.accountNumber,
      actionCode,
      narrative
    );
    
    return result;
    
  } catch (error) {
    console.error('API Error in recordAction:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

function runSecurityDiagnostic() {
  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: {
      user: Session.getActiveUser().getEmail(),
      scriptId: ScriptApp.getScriptId()
    },
    permissions: {
      canAccessDrive: testDriveAccess(),
      canAccessSheet: testSheetAccess(),
      canReadFiles: testFileRead(),
      canCreateFiles: testFileCreate()
    }
  };
  
  console.log('Security Diagnostic:', JSON.stringify(diagnostic, null, 2));
  return diagnostic;
}

function testDriveAccess() {
  try {
    DriveApp.getRootFolder();
    return true;
  } catch(e) {
    return false;
  }
}

function testSheetAccess() {
  try {
    SpreadsheetApp.openById(SPREADSHEET_ID);
    return true;
  } catch(e) {
    return false;
  }
}

function testFileRead() {
  try {
    const folder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
    folder.getName();
    return true;
  } catch(e) {
    return false;
  }
}

function testFileCreate() {
  try {
    const folder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
    const testFile = folder.createFile('test.txt', 'test', MimeType.PLAIN_TEXT);
    testFile.setTrashed(true);
    return true;
  } catch(e) {
    return false;
  }
}

/**
 * Public: Run the full test suite (useful from script editor).
 */
function runTests() {
  try {
    // Ensure system is healthy or bootstrap
    const health = Bootstrap.checkSystemHealth();
    if (!health.healthy) {
      const init = Bootstrap.initializeSystem();
      if (!init.success) {
        return { success: false, error: 'Bootstrap failed: ' + init.error };
      }
    }

    const results = runAllTests();
    return { success: true, results: results };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Get detailed information for a specific case
 * Returns case data, history, status, and documents
 */
function getCaseDetails(businessName) {
  try {
    console.log('API: Getting details for case:', businessName);
    
    const caseData = SheetManager.getCase(businessName);
    if (!caseData) {
      console.error('API: Case not found:', businessName);
      return { success: false, error: 'Case not found' };
    }
    
    // Convert dates to strings for serialization
    if (caseData.placementDate) {
      caseData.placementDate = caseData.placementDate.toString();
    }
    if (caseData.delinquentSince) {
      caseData.delinquentSince = caseData.delinquentSince.toString();
    }

    const folder = FolderManager.findCaseFolder(caseData);
    
    // Build response object
    const response = {
      success: true,
      caseData: caseData,
      hasFolder: !!folder,
      folderUrl: folder ? folder.getUrl() : null
    };
    
    if (folder) {
      const metadata = HistoryManager.getMetadata(folder);
      const history = HistoryManager.getHistory(folder);
      
      console.log('History retrieved:', history);
      console.log('History length:', history ? history.length : 'null');
      
  const documents = FolderManager.getDocuments(caseData);
      
      response.metadata = metadata;
      response.history = history;
      response.documents = documents;
      response.status = StatusEngine.calculateStatus(caseData, folder);
      response.allowedActions = StatusEngine.getAllowedActions(caseData, folder);
      response.hasOpenMTC = metadata?.currentState?.mtc_open || false;
      response.hasPendingMSG = metadata?.currentState?.msg_pending_ack || false;
    } else {
      response.history = [];
      response.documents = [];
      response.metadata = null;
      response.status = StatusEngine.calculateStatus(caseData, null);
      response.allowedActions = StatusEngine.getAllowedActions(caseData, null);
      response.hasOpenMTC = false;
      response.hasPendingMSG = false;
    }
    
    console.log('API: Returning case details with history length:', response.history?.length);
    return response;
    
  } catch (error) {
    console.error('API Error in getCaseDetails:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get current user information
 */
function getCurrentUser() {
  try {
    const email = Session.getActiveUser().getEmail();
    const localPart = email.split('@')[0];
    const parts = localPart.split('.');
    
    let initials;
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      initials = localPart.substring(0, 2).toUpperCase();
    }
    
    return {
      email: email,
      displayName: localPart,
      initials: initials,
      isValid: true
    };
    
  } catch (error) {
    console.error('API Error getting user:', error);
    return {
      email: 'unknown',
      displayName: 'Unknown User',
      initials: 'XX',
      isValid: false
    };
  }
}

/**
 * Search cases by any field
 */
function searchCases(searchTerm) {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }
    
    console.log('API: Searching for:', searchTerm);
    const term = searchTerm.toLowerCase();
    const allCases = SheetManager.getCases();
    
    const matches = allCases.filter(caseData => {
      // Search across all text fields
      const searchableText = [
        caseData.businessName,
        caseData.ownerName,
        caseData.phone1,
        caseData.phone2,
        caseData.email1,
        caseData.email2,
        caseData.mailingAddress,
        caseData.physicalAddress,
        caseData.opposingCounselName,
        caseData.accountNumber,
        caseData.flexLoanNumber
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(term);
    });
    
    // Add status to each match
    const resultsWithStatus = matches.map(caseData => {
      const folder = FolderManager.findCaseFolder(caseData);
      const status = StatusEngine.calculateStatus(caseData, folder);
      
      return {
        ...caseData,
        hasFolder: !!folder,
        status: status.statusText,
        statusColor: status.color
      };
    });
    
    console.log(`API: Found ${resultsWithStatus.length} matches`);
    return resultsWithStatus;
    
  } catch (error) {
    console.error('API Error in searchCases:', error);
    return [];
  }
}

/**
 * Get recent actions across all cases
 */
function getRecentActions(limit = 20) {
  try {
    console.log('API: Getting recent actions');
    return ActionProcessor.getRecentActions(limit);
  } catch (error) {
    console.error('API Error in getRecentActions:', error);
    return [];
  }
}

/**
 * Get system configuration (for debugging)
 */
function getSystemConfig() {
  return {
    spreadsheetId: SPREADSHEET_ID,
    sheetName: SHEET_TAB_NAME,
    mainFolderId: MAIN_DRIVE_FOLDER_ID,
    actionCodes: Object.keys(ACTION_CODES),
    colors: COLORS,
    slaRules: SLA
  };
}

/**
 * Debug L1 mailmerge process
 */
function debugL1MailMerge() {
  try {
    console.log('=== L1 MailMerge Debug Test ===');

    // 1. Check if TEMPLATES is defined and has L1
    console.log('1. TEMPLATES check:');
    console.log('typeof TEMPLATES:', typeof TEMPLATES);
    console.log('TEMPLATES defined:', typeof TEMPLATES !== 'undefined');
    console.log('L1 template ID:', TEMPLATES ? TEMPLATES.L1 : 'TEMPLATES undefined');

    // 2. Check if MailMerge module is available
    console.log('2. MailMerge module check:');
    console.log('typeof MailMerge:', typeof MailMerge);
    console.log('MailMerge available:', typeof MailMerge !== 'undefined');

    // 2.5. Test template access
    console.log('2.5. Template access check:');
    if (TEMPLATES && TEMPLATES.L1) {
      try {
        const templateFile = DriveApp.getFileById(TEMPLATES.L1);
        console.log('L1 template accessible:', templateFile.getName());
      } catch (templateError) {
        console.error('L1 template access failed:', templateError.toString());
        return {
          success: false,
          error: 'Cannot access L1 template: ' + templateError.toString()
        };
      }
    }

    // 3. Get a test case
    const cases = SheetManager.getCases();
    if (cases.length === 0) {
      console.log('3. No cases available for testing');
      return { success: false, error: 'No cases in spreadsheet' };
    }

    const testCase = cases[0];
    console.log('3. Test case:', testCase.businessName, testCase.accountNumber);

    // 4. Check StatusEngine validation
    console.log('4. StatusEngine validation check:');
    const folder = FolderManager.findCaseFolder(testCase);
    console.log('Case folder found:', !!folder);

    const validation = StatusEngine.validateAction(testCase, 'L1', folder);
    console.log('L1 validation result:', JSON.stringify(validation, null, 2));

    // 5. Test direct MailMerge call
    if (validation.valid && typeof MailMerge !== 'undefined') {
      console.log('5. Testing direct MailMerge.generateDocument...');
      const mergeResult = MailMerge.generateDocument(testCase.accountNumber, 'L1', folder);
      console.log('MailMerge result:', JSON.stringify(mergeResult, null, 2));

      return {
        success: true,
        testCase: testCase.businessName,
        validation: validation,
        mergeResult: mergeResult
      };
    } else {
      return {
        success: false,
        error: 'Validation failed or MailMerge unavailable',
        validation: validation
      };
    }

  } catch (error) {
    console.error('L1 MailMerge debug error:', error);
    return {
      success: false,
      error: error.toString(),
      stack: error.stack
    };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Test function to verify system setup
 */
function testSystemSetup() {
  console.log('Testing system setup...');
  
  try {
    // Test spreadsheet connection
    const sheet = SheetManager.getSheet();
    console.log('✓ Spreadsheet connected:', sheet.getName());
    
    // Test cases loading
    const cases = SheetManager.getCases();
    console.log('✓ Cases loaded:', cases.length);
    
    // Test folder access
    const folder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
    console.log('✓ Main folder accessible:', folder.getName());
    
    // Test user
    const user = getCurrentUser();
    console.log('✓ User identified:', user.email, '->', user.initials);
    
    console.log('System setup test complete!');
    return {
      success: true,
      message: 'All systems operational'
    };
    
  } catch (error) {
    console.error('System test failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Initialize or reset a test case
 */
function initializeTestCase() {
  try {
    const cases = SheetManager.getCases();
    if (cases.length === 0) {
      return {
        success: false,
        error: 'No cases in spreadsheet'
      };
    }
    
    const testCase = cases[0];
    console.log('Initializing test case:', testCase.businessName);
    
    // Create folder if needed
    const result = FolderManager.initializeCaseFolder(testCase);
    
    // Add a test action
    const actionResult = ActionProcessor.processAction(
      testCase.accountNumber,
      'NOTE',
      'Test case initialized'
    );
    
    return {
      success: true,
      caseId: testCase.accountNumber,
      businessName: testCase.businessName,
      folderCreated: result.created,
      folderUrl: result.folder.getUrl()
    };
    
  } catch (error) {
    console.error('Test initialization failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}