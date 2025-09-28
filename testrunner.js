// TestRunner.gs - Comprehensive testing and validation module

/**


function runAllTests() {
  console.log('========================================');
  console.log('COLLECTIONS MANAGER - SYSTEM TEST SUITE');
  console.log('========================================');
  console.log('Started:', new Date().toLocaleString());
  console.log('');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
function testGetCaseDetails() {
  const result = getCaseDetails('TEST-006'); // Zeta Motors
  console.log('Result:', result);
}


  // Test 1: Configuration
  console.log('TEST 1: Configuration Check');
  console.log('----------------------------');
  const configTest = testConfiguration();
  if (configTest.success) {
    results.passed.push('Configuration');
    console.log('✅ PASSED: All required constants are set');
  } else {
    results.failed.push('Configuration: ' + configTest.error);
    console.log('❌ FAILED:', configTest.error);
    console.log('⚠️  Cannot continue without proper configuration');
    // Attempt to bootstrap a test system if constants are not set
    console.log('Attempting auto-bootstrap to provide test data...');
    const bootstrapResult = Bootstrap.initializeSystem();
    if (bootstrapResult.success) {
      console.log('Auto-bootstrap succeeded. Using generated spreadsheet and folder for tests.');
      // Use generated IDs for the remainder of the test run via overrides
      var overrideSpreadsheetId = bootstrapResult.spreadsheet.id;
      var overrideFolderId = bootstrapResult.folder.id;
    } else {
      console.log('Auto-bootstrap failed:', bootstrapResult.error);
      return results;
    }
  }
  console.log('');
  
  // Test 2: Spreadsheet Connection
  console.log('TEST 2: Spreadsheet Connection');
  console.log('-------------------------------');
  const sheetTest = testSpreadsheetConnection();
  if (sheetTest.success) {
    results.passed.push('Spreadsheet Connection');
    console.log('✅ PASSED: Connected to sheet with', sheetTest.rowCount, 'cases');
  } else {
    results.failed.push('Spreadsheet: ' + sheetTest.error);
    console.log('❌ FAILED:', sheetTest.error);
    // If bootstrap provided overrides, try again with the override
    if (typeof overrideSpreadsheetId !== 'undefined') {
      console.log('Retrying spreadsheet connection with bootstrapped sheet...');
      const sheetTest2 = testSpreadsheetConnectionWithOverrides(overrideSpreadsheetId, SHEET_TAB_NAME);
      if (sheetTest2.success) {
        console.log('Retry succeeded using bootstrap sheet');
        sheetTest.rowCount = sheetTest2.rowCount;
        sheetTest.success = true;
      }
    }
  }
  console.log('');
  
  // Test 3: Drive Folder Connection
  console.log('TEST 3: Drive Folder Access');
  console.log('----------------------------');
  const driveTest = testDriveFolderAccess();
  if (driveTest.success) {
    results.passed.push('Drive Folder Access');
    console.log('✅ PASSED: Connected to folder:', driveTest.folderName);
  } else {
    results.failed.push('Drive Folder: ' + driveTest.error);
    console.log('❌ FAILED:', driveTest.error);
  }
  console.log('');
  
  // Test 4: User Authentication
  console.log('TEST 4: User Authentication');
  console.log('----------------------------');
  const userTest = testUserAuthentication();
  if (userTest.success) {
    results.passed.push('User Authentication');
    console.log('✅ PASSED: User identified as', userTest.email, '→', userTest.initials);
  } else {
    results.warnings.push('User not in whitelist: ' + userTest.email);
    console.log('⚠️  WARNING:', userTest.message);
  }
  console.log('');
  
  // Test 5: Case Data Structure
  console.log('TEST 5: Case Data Structure');
  console.log('----------------------------');
  const dataTest = testCaseDataStructure();
  if (dataTest.success) {
    results.passed.push('Case Data Structure');
    console.log('✅ PASSED: Data structure validated');
  } else {
    results.failed.push('Data Structure: ' + dataTest.error);
    console.log('❌ FAILED:', dataTest.error);
  }
  console.log('');
  
  // Test 6: Folder Operations (if data exists)
  if (sheetTest.rowCount > 0) {
    console.log('TEST 6: Folder Operations');
    console.log('-------------------------');
  const folderTest = testFolderOperations(typeof overrideFolderId !== 'undefined' ? overrideFolderId : null);
    if (folderTest.success) {
      results.passed.push('Folder Operations');
      console.log('✅ PASSED: Folder operations working');
    } else {
      results.failed.push('Folder Operations: ' + folderTest.error);
      console.log('❌ FAILED:', folderTest.error);
    }
    console.log('');
  }
  
  // Test 7: JSON File Operations
  console.log('TEST 7: JSON File Operations');
  console.log('-----------------------------');
  const jsonTest = testJSONOperations(typeof overrideFolderId !== 'undefined' ? overrideFolderId : null);
  if (jsonTest.success) {
    results.passed.push('JSON Operations');
    console.log('✅ PASSED: JSON read/write working');
  } else {
    results.warnings.push('JSON Operations: ' + jsonTest.message);
    console.log('⚠️  WARNING:', jsonTest.message);
  }
  console.log('');
  
  // Test 8: Status Calculations
  console.log('TEST 8: Status Engine');
  console.log('----------------------');
  const statusTest = testStatusCalculations();
  if (statusTest.success) {
    results.passed.push('Status Engine');
    console.log('✅ PASSED: Status calculations correct');
  } else {
    results.failed.push('Status Engine: ' + statusTest.error);
    console.log('❌ FAILED:', statusTest.error);
  }
  console.log('');
  
  // Summary
  console.log('========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log('✅ Passed:', results.passed.length);
  console.log('❌ Failed:', results.failed.length);
  console.log('⚠️  Warnings:', results.warnings.length);
  console.log('');
  
  if (results.failed.length > 0) {
    console.log('Failed Tests:');
    results.failed.forEach(f => console.log('  -', f));
  }
  
  if (results.warnings.length > 0) {
    console.log('Warnings:');
    results.warnings.forEach(w => console.log('  -', w));
  }
  
  console.log('');
  console.log('Completed:', new Date().toLocaleString());
  
  return results;
}

/**
 * Test 1: Check if all required constants are set
 */
function testConfiguration() {
  try {
    if (!SPREADSHEET_ID || SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID') {
      return { success: false, error: 'SPREADSHEET_ID not set' };
    }
    
    if (!SHEET_TAB_NAME || SHEET_TAB_NAME === 'YOUR_TAB_NAME') {
      return { success: false, error: 'SHEET_TAB_NAME not set' };
    }
    
    if (!MAIN_DRIVE_FOLDER_ID || MAIN_DRIVE_FOLDER_ID === 'YOUR_FOLDER_ID') {
      return { success: false, error: 'MAIN_DRIVE_FOLDER_ID not set' };
    }
    
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Test 2: Verify spreadsheet connection and data
 */
function testSpreadsheetConnection() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
      .getSheetByName(SHEET_TAB_NAME);
    
    if (!sheet) {
      return { success: false, error: 'Sheet tab not found: ' + SHEET_TAB_NAME };
    }
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    console.log(`  Sheet dimensions: ${lastRow} rows × ${lastCol} columns`);
    
    // Try to get cases
    const cases = SheetManager.getCases();
    console.log(`  Cases found: ${cases.length}`);
    
    if (cases.length > 0) {
      const sample = cases[0];
      console.log(`  Sample case: ${sample.businessName} (${sample.accountNumber})`);
    }
    
    return { 
      success: true, 
      rowCount: cases.length,
      sheet: sheet
    };
    
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Helper: test spreadsheet connection with explicit overrides (used after bootstrap)
 */
function testSpreadsheetConnectionWithOverrides(overrideSpreadsheetId, overrideSheetName) {
  try {
    const sheet = SpreadsheetApp.openById(overrideSpreadsheetId)
      .getSheetByName(overrideSheetName);

    if (!sheet) {
      return { success: false, error: 'Sheet tab not found (override): ' + overrideSheetName };
    }

    const lastRow = sheet.getLastRow();
    const cases = SheetManager.getCases(overrideSpreadsheetId, overrideSheetName);

    return { success: true, rowCount: cases.length, sheet: sheet };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Test 3: Verify Drive folder access
 */
function testDriveFolderAccess() {
  try {
    const folder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
    const folderName = folder.getName();
    
    // Check write permissions by trying to create a test file
    const testFile = folder.createFile('test_' + Date.now() + '.txt', 'test', MimeType.PLAIN_TEXT);
    testFile.setTrashed(true); // Immediately trash it
    
    console.log(`  Folder: ${folderName}`);
    console.log(`  URL: ${folder.getUrl()}`);
    console.log(`  Write permissions: Confirmed`);
    
    return { 
      success: true, 
      folderName: folderName,
      folder: folder
    };
    
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Test 4: Check user authentication
 */
function testUserAuthentication() {
  try {
    const email = Session.getActiveUser().getEmail();
    
    if (!email) {
      return { 
        success: false, 
        error: 'Cannot determine user email',
        email: 'unknown'
      };
    }
    
    const initials = STAFF_USERS[email] || email.substring(0, 2).toUpperCase();
    
    console.log(`  Email: ${email}`);
    console.log(`  Initials: ${initials}`);
    console.log(`  Recognized: ${!!STAFF_USERS[email]}`);
    
    return { 
      success: true,
      email: email,
      initials: initials,
      recognized: !!STAFF_USERS[email],
      message: STAFF_USERS[email] ? 'User recognized' : 'User not in whitelist (will use generated initials)'
    };
    
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Test 5: Validate case data structure
 */
function testCaseDataStructure() {
  try {
    const cases = SheetManager.getCases();
    
    if (cases.length === 0) {
      return { 
        success: true, 
        message: 'No cases to validate (empty sheet)' 
      };
    }
    
    const requiredFields = [
      'accountNumber',
      'businessName',
      'daysDelinquent',
      'placementDate'
    ];
    
    const sampleCase = cases[0];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (sampleCase[field] === undefined) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return { 
        success: false, 
        error: 'Missing required fields: ' + missingFields.join(', ')
      };
    }
    
    console.log('  Required fields present: ✓');
    console.log('  Sample account:', sampleCase.accountNumber);
    console.log('  Sample business:', sampleCase.businessName);
    
    return { success: true };
    
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Test 6: Test folder creation and finding
 */
function testFolderOperations(overrideFolderId) {
  try {
    const cases = SheetManager.getCases();
    if (cases.length === 0) {
      return { success: true, message: 'No cases to test' };
    }
    
    const testCase = cases[0];
    console.log(`  Testing with: ${testCase.businessName}`);
    
    // Try to find existing folder
  let folder = FolderManager.findCaseFolder(testCase, overrideFolderId);
    
    if (folder) {
      console.log('  Existing folder found:', folder.getName());
    } else {
      console.log('  No existing folder, will create test folder');
      
      // Create test folder
      folder = FolderManager.createCaseFolder(testCase, overrideFolderId);
      
      if (!folder) {
        return { success: false, error: 'Failed to create folder' };
      }
      
      console.log('  Created folder:', folder.getName());
      
      // Mark for cleanup
      folder.setName('TEST_' + folder.getName());
      console.log('  (Renamed with TEST_ prefix for identification)');
    }
    
    // Verify subfolder structure
    const subfolders = [];
    const subs = folder.getFolders();
    while (subs.hasNext()) {
      subfolders.push(subs.next().getName());
    }
    
    console.log('  Subfolders:', subfolders.join(', '));
    
    return { success: true, folder: folder };
    
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Test 7: Test JSON file operations
 */
function testJSONOperations(overrideFolderId) {
  try {
    const cases = SheetManager.getCases();
    if (cases.length === 0) {
      return { 
        success: true, 
        message: 'No cases to test JSON operations' 
      };
    }
    
    const testCase = cases[0];
    const folder = FolderManager.findCaseFolder(testCase, overrideFolderId);
    
    if (!folder) {
      return { 
        success: true, 
        message: 'No folder exists for JSON testing (normal for new system)' 
      };
    }
    
    // Test reading metadata
    const metadata = HistoryManager.getMetadata(folder);
    console.log('  Metadata exists:', !!metadata);
    
    if (metadata) {
      console.log('  Case ID:', metadata.caseId);
      console.log('  Last modified:', metadata.lastModified);
    }
    
    // Test reading history
    const history = HistoryManager.getHistory(folder);
    console.log('  History entries:', history.length);
    
    return { success: true };
    
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Test 8: Test status calculations
 */
function testStatusCalculations() {
  try {
    // Create test case data
    const testCase = {
      accountNumber: 'TEST-001',
      businessName: 'Test Company',
      placementDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    };
    
    // Test without metadata (new case)
    const status1 = StatusEngine.calculateStatus(testCase, null);
    console.log('  New case status:', status1.statusText);
    console.log('  Color:', status1.color);
    
    if (status1.color !== COLORS.RED) {
      return { 
        success: false, 
        error: 'L1 should be red after 2 days' 
      };
    }
    
    // Test with MTC open
    const metadataWithMTC = {
      currentState: {
        mtc_open: true,
        l1_sent: null
      }
    };
    
    const status2 = StatusEngine.calculateStatus(testCase, metadataWithMTC);
    console.log('  MTC open status:', status2.statusText);
    console.log('  Color:', status2.color);
    
    if (status2.color !== COLORS.MTC) {
      return { 
        success: false, 
        error: 'MTC should override SLA colors' 
      };
    }
    
    return { success: true };
    
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Quick health check - minimal testing
 */
function quickHealthCheck() {
  console.log('=== QUICK HEALTH CHECK ===');
  
  try {
    // Check configuration
    console.log('1. Configuration:', 
      SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID' ? '✓' : '✗');
    
    // Check sheet
    const cases = SheetManager.getCases();
    console.log('2. Sheet access:', cases ? '✓' : '✗');
    console.log('   Cases found:', cases.length);
    
    // Check folder
    const folder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
    console.log('3. Drive folder:', folder ? '✓' : '✗');
    
    // Check user
    const email = Session.getActiveUser().getEmail();
    console.log('4. User:', email || 'unknown');
    
    console.log('=========================');
    console.log('Status:', cases.length > 0 ? 'READY' : 'NO DATA');
    
  } catch (e) {
    console.log('ERROR:', e.toString());
    console.log('Status: FAILED');
  }
}

/**
 * Cleanup test artifacts
 */
function cleanupTestArtifacts() {
  console.log('Cleaning up test artifacts...');
  
  try {
    const mainFolder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
    const folders = mainFolder.getFolders();
    let count = 0;
    
    while (folders.hasNext()) {
      const folder = folders.next();
      if (folder.getName().startsWith('TEST_')) {
        console.log('Removing:', folder.getName());
        folder.setTrashed(true);
        count++;
      }
    }
    
    console.log(`Cleaned up ${count} test folders`);
    
  } catch (e) {
    console.log('Cleanup error:', e.toString());
  }
}

/**
 * Debug helper - show current state
 */
function debugCurrentState() {
  const state = {
    config: {
      spreadsheetId: SPREADSHEET_ID,
      sheetName: SHEET_TAB_NAME,
      folderId: MAIN_DRIVE_FOLDER_ID
    },
    user: {
      email: Session.getActiveUser().getEmail(),
      initials: null
    },
    data: {
      caseCount: 0,
      firstCase: null
    },
    system: {
      executionTime: 0
    }
  };
  
  try {
    const start = Date.now();
    
    // Get user initials
    state.user.initials = STAFF_USERS[state.user.email] || 'XX';
    
    // Get case data
    const cases = SheetManager.getCases();
    state.data.caseCount = cases.length;
    if (cases.length > 0) {
      state.data.firstCase = {
        account: cases[0].accountNumber,
        business: cases[0].businessName
      };
    }

function testGammaHistory() {
  const folder = FolderManager.findCaseFolder({ businessName: 'Gamma LLC' });
  if (folder) {
    console.log('Folder found');
    
    // Try to read the file directly
    const files = folder.getFilesByName('history.json');
    if (files.hasNext()) {
      const file = files.next();
      const content = file.getBlob().getDataAsString();
      console.log('Raw content:', content);
      
      // Try to parse it
      try {
        const parsed = JSON.parse(content);
        console.log('Parsed:', parsed);
        console.log('Is array?', Array.isArray(parsed));
      } catch(e) {
        console.log('Parse error:', e);
      }
    } else {
      console.log('No history.json file found');
    }
    
    // Now try the HistoryManager method
    const history = HistoryManager.getHistory(folder);
    console.log('HistoryManager result:', history);
  } else {
    console.log('No folder found for Gamma LLC');
  }
}



function testGetCases() {
  const result = getCases();
  console.log('getCases returned:', result);
  console.log('Type:', typeof result);
  console.log('Length:', result ? result.length : 'null/undefined');
}

function testGetCaseDetails() {
  const result = getCaseDetails('TEST-006'); // Zeta Motors
  console.log('Result:', result);
}



    state.system.executionTime = Date.now() - start;
    
  } catch (e) {
    state.error = e.toString();
  }
  
  console.log(JSON.stringify(state, null, 2));
  return state;
}