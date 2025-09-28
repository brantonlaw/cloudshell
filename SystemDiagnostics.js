// SystemDiagnostics.gs - Comprehensive system health check
// Runs on user load to identify exactly where failures occur

const SystemDiagnostics = {

  /**
   * Comprehensive diagnostic that runs on user load
   * Returns detailed report of all system components
   */
  runFullDiagnostic: function() {
    const report = {
      timestamp: new Date().toISOString(),
      overall: 'UNKNOWN',
      details: {},
      errors: [],
      warnings: [],
      recommendations: []
    };

    console.log('=== SYSTEM DIAGNOSTICS START ===');

    try {
      // 1. Test Constants Access
      report.details.constants = this.testConstants();

      // 2. Test Sheet Access & Data
      report.details.sheet = this.testSheetAccess();

      // 3. Test Drive Folder Access
      report.details.drive = this.testDriveAccess();

      // 4. Test SheetManager Functions
      report.details.sheetManager = this.testSheetManager();

      // 5. Test FolderManager Functions
      report.details.folderManager = this.testFolderManager();

      // 6. Test StatusEngine Functions
      report.details.statusEngine = this.testStatusEngine();

      // 7. Test End-to-End getCases() Flow
      report.details.getCasesFlow = this.testGetCasesFlow();

      // 8. Determine Overall Status
      report.overall = this.determineOverallStatus(report);

    } catch (error) {
      report.overall = 'CRITICAL_ERROR';
      report.errors.push('Diagnostic failed: ' + error.toString());
      console.error('Diagnostic failed:', error);
    }

    console.log('=== SYSTEM DIAGNOSTICS COMPLETE ===');
    console.log('Overall Status:', report.overall);
    console.log('Full Report:', JSON.stringify(report, null, 2));

    return report;
  },

  testConstants: function() {
    try {
      return {
        status: 'SUCCESS',
        spreadsheetId: SPREADSHEET_ID || 'MISSING',
        sheetTabName: SHEET_TAB_NAME || 'MISSING',
        mainFolderId: MAIN_DRIVE_FOLDER_ID || 'MISSING',
        colsCount: Object.keys(COLS || {}).length,
        actionCodesCount: Object.keys(ACTION_CODES || {}).length
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.toString()
      };
    }
  },

  testSheetAccess: function() {
    try {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = spreadsheet.getSheetByName(SHEET_TAB_NAME);

      return {
        status: 'SUCCESS',
        sheetName: sheet.getName(),
        lastRow: sheet.getLastRow(),
        lastColumn: sheet.getLastColumn(),
        hasData: sheet.getLastRow() > 1,
        headerRow: sheet.getRange(1, 1, 1, Math.min(sheet.getLastColumn(), 25)).getValues()[0]
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.toString()
      };
    }
  },

  testDriveAccess: function() {
    try {
      const folder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
      const subfolders = [];
      const folders = folder.getFolders();
      let count = 0;
      while (folders.hasNext() && count < 5) {
        subfolders.push(folders.next().getName());
        count++;
      }

      return {
        status: 'SUCCESS',
        folderName: folder.getName(),
        subfolderSample: subfolders,
        subfolderCount: count
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.toString()
      };
    }
  },

  testSheetManager: function() {
    try {
      const sheet = SheetManager.getSheet();
      const cases = SheetManager.getCases();

      return {
        status: cases.length > 0 ? 'SUCCESS' : 'NO_DATA',
        casesFound: cases.length,
        firstCaseSample: cases.length > 0 ? {
          accountNumber: cases[0].accountNumber,
          businessName: cases[0].businessName,
          hasAllFields: !!(cases[0].accountNumber && cases[0].businessName && cases[0].ownerName)
        } : null
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.toString()
      };
    }
  },

  testFolderManager: function() {
    try {
      // Test with mock case data
      const testCaseData = {
        accountNumber: 'TEST-123',
        businessName: 'Test Business'
      };

      const folder = FolderManager.findCaseFolder(testCaseData);
      const cleanName = FolderManager.cleanBusinessName(testCaseData.businessName);

      return {
        status: 'SUCCESS',
        cleanNameFunction: cleanName,
        findFolderResult: folder ? 'FOUND' : 'NOT_FOUND',
        folderName: folder ? folder.getName() : null
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.toString()
      };
    }
  },

  testStatusEngine: function() {
    try {
      // Test with sample case data
      const testCaseData = {
        accountNumber: 'TEST-123',
        businessName: 'Test Business',
        placementDate: new Date(),
        daysDelinquent: 30
      };

      const status = StatusEngine.calculateStatus(testCaseData, null);

      return {
        status: 'SUCCESS',
        statusResult: status,
        hasStatusColor: !!(status && status.statusColor),
        hasStatusText: !!(status && status.statusText)
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.toString()
      };
    }
  },

  testGetCasesFlow: function() {
    try {
      // This tests the exact flow the frontend calls
      const startTime = Date.now();
      const cases = getCases(); // The actual API function
      const endTime = Date.now();

      return {
        status: cases.length > 0 ? 'SUCCESS' : 'NO_CASES',
        casesReturned: cases.length,
        executionTime: endTime - startTime,
        firstCaseStructure: cases.length > 0 ? Object.keys(cases[0]) : [],
        hasStatusFields: cases.length > 0 ? !!(cases[0].hasFolder !== undefined && cases[0].statusColor) : false
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.toString()
      };
    }
  },

  determineOverallStatus: function(report) {
    const details = report.details;

    // Check for critical errors
    if (details.constants?.status === 'ERROR' ||
        details.sheet?.status === 'ERROR' ||
        details.drive?.status === 'ERROR') {
      return 'CRITICAL_ERROR';
    }

    // Check for data issues
    if (details.sheet?.status === 'SUCCESS' && !details.sheet.hasData) {
      return 'NO_DATA';
    }

    if (details.getCasesFlow?.status === 'NO_CASES') {
      return 'DATA_PROCESSING_ISSUE';
    }

    if (details.getCasesFlow?.status === 'SUCCESS') {
      return 'HEALTHY';
    }

    return 'DEGRADED';
  }
};

/**
 * Quick diagnostic function that can be called from frontend
 */
function runSystemDiagnostic() {
  return SystemDiagnostics.runFullDiagnostic();
}