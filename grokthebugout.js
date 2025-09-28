// debugger.gs - Systematic issue finder

function runFullDebug() {
  console.log('=== COLLECTIONS MANAGER DEBUG ===');
  console.log('Timestamp:', new Date().toISOString());
  
  // Test 1: Check if constants exist
  testConstants();
  
  // Test 2: Check folder operations
  testFolderOperations();
  
  // Test 3: Check history operations
  testHistoryOperations();
  
  // Test 4: Check complete flow
  testCompleteFlow();
  
  console.log('=== DEBUG COMPLETE ===');
}

function testConstants() {
  console.log('\n--- Testing Constants ---');
  
  // Check if FOLDER_STRUCTURE exists
  try {
    console.log('FOLDER_STRUCTURE type:', typeof FOLDER_STRUCTURE);
    if (typeof FOLDER_STRUCTURE !== 'undefined') {
      console.log('FOLDER_STRUCTURE.HISTORY_FILE:', FOLDER_STRUCTURE.HISTORY_FILE);
      console.log('FOLDER_STRUCTURE.METADATA_FILE:', FOLDER_STRUCTURE.METADATA_FILE);
      console.log('FOLDER_STRUCTURE.SUBFOLDERS:', FOLDER_STRUCTURE.SUBFOLDERS);
    } else {
      console.log('ERROR: FOLDER_STRUCTURE is undefined');
    }
  } catch (e) {
    console.log('ERROR accessing FOLDER_STRUCTURE:', e.toString());
  }
  
  // Check MAIN_DRIVE_FOLDER_ID
  try {
    console.log('MAIN_DRIVE_FOLDER_ID type:', typeof MAIN_DRIVE_FOLDER_ID);
    if (typeof MAIN_DRIVE_FOLDER_ID !== 'undefined') {
      console.log('MAIN_DRIVE_FOLDER_ID value:', MAIN_DRIVE_FOLDER_ID);
    } else {
      console.log('ERROR: MAIN_DRIVE_FOLDER_ID is undefined');
    }
  } catch (e) {
    console.log('ERROR accessing MAIN_DRIVE_FOLDER_ID:', e.toString());
  }
}

function testFolderOperations() {
  console.log('\n--- Testing Folder Operations ---');
  
  try {
    // Test finding Gamma LLC folder
    const folder = FolderManager.findCaseFolder({ businessName: 'Gamma LLC' });
    console.log('Gamma LLC folder found:', folder !== null);
    
    if (folder) {
      // List all files
      console.log('Files in Gamma LLC folder:');
      const files = folder.getFiles();
      while (files.hasNext()) {
        const file = files.next();
        console.log('  -', file.getName(), '(', file.getMimeType(), ')');
      }
    }
  } catch (e) {
    console.log('ERROR in folder operations:', e.toString());
  }
}

function testHistoryOperations() {
  console.log('\n--- Testing History Operations ---');
  
  try {
  const folder = FolderManager.findCaseFolder({ businessName: 'Gamma LLC' });
    if (!folder) {
      console.log('Cannot test - no folder found');
      return;
    }
    
    // Test reading history directly
    console.log('Looking for history files:');
    const historyFiles = folder.getFilesByName('history.json');
    if (historyFiles.hasNext()) {
      const file = historyFiles.next();
      console.log('history.json found');
      const content = file.getBlob().getDataAsString();
      console.log('Content length:', content.length);
      console.log('First 200 chars:', content.substring(0, 200));
      
      // Try to parse
      try {
        const parsed = JSON.parse(content);
        console.log('Successfully parsed, array length:', parsed.length);
      } catch (e) {
        console.log('ERROR parsing JSON:', e.toString());
      }
    } else {
      console.log('No history.json file found');
    }
    
    // Test HistoryManager.getHistory
    console.log('\nTesting HistoryManager.getHistory:');
    try {
      const history = HistoryManager.getHistory(folder);
      console.log('HistoryManager returned:', history);
      console.log('History length:', history ? history.length : 'null');
    } catch (e) {
      console.log('ERROR in HistoryManager.getHistory:', e.toString());
    }
    
  } catch (e) {
    console.log('ERROR in history operations:', e.toString());
  }
}

function testCompleteFlow() {
  console.log('\n--- Testing Complete Flow ---');
  
  try {
    // Simulate getCaseDetails for Gamma LLC
    console.log('Simulating getCaseDetails("Gamma LLC"):');
    
    // Get case data
    const caseData = SheetManager.getCase('Gamma LLC');
    console.log('Case found:', caseData !== null);
    
    if (!caseData) {
      console.log('Cannot continue - case not found');
      return;
    }
    
    // Get folder
    const folder = FolderManager.findCaseFolder({ businessName: caseData.businessName });
    console.log('Folder found:', folder !== null);
    
    if (!folder) {
      console.log('Cannot continue - folder not found');
      return;
    }
    
    // Get history
    const history = HistoryManager.getHistory(folder);
    console.log('History retrieved, length:', history ? history.length : 'null');
    
    // Build response like getCaseDetails does
    const response = {
      success: true,
      caseData: caseData,
      history: history,
      hasFolder: true
    };
    
    console.log('Final response would have history length:', response.history ? response.history.length : 'null');
    
  } catch (e) {
    console.log('ERROR in complete flow:', e.toString());
  }
}

// Run specific test
function quickTest() {
  console.log('Quick test - checking undefined references:');
  
  // Check each file for syntax issues
  try {
    console.log('Testing FolderManager...');
  const testFolder = FolderManager.findCaseFolder({ businessName: 'test' });
    console.log('FolderManager works');
  } catch (e) {
    console.log('ERROR in FolderManager:', e.toString());
  }
  
  try {
    console.log('Testing HistoryManager...');
    const testHistory = HistoryManager.getHistory(null);
    console.log('HistoryManager works');
  } catch (e) {
    console.log('ERROR in HistoryManager:', e.toString());
  }
  
  try {
    console.log('Testing SheetManager...');
    const testCases = SheetManager.getCases();
    console.log('SheetManager works, found', testCases.length, 'cases');
  } catch (e) {
    console.log('ERROR in SheetManager:', e.toString());
  }
}

/**
 * Debug function to check folder finding issue
 * Run this in Apps Script editor to diagnose bootstrap vs API folder access
 */
function debugFolderFinding() {
  console.log('=== DEBUG: Folder Finding Issue ===');
  
  try {
    // Get cases from spreadsheet
    const cases = getCases();
    console.log(`Found ${cases.length} cases in spreadsheet`);
    
    if (cases.length === 0) {
      console.log('No cases found - check spreadsheet access');
      return;
    }
    
    // Check main folder access
    const mainFolder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
    console.log(`Main folder: ${mainFolder.getName()}`);
    console.log(`Main folder URL: ${mainFolder.getUrl()}`);
    
    // List all subfolders in main folder
    const subfolders = mainFolder.getFolders();
    const folderNames = [];
    let count = 0;
    while (subfolders.hasNext() && count < 50) { // Limit to avoid timeout
      const folder = subfolders.next();
      folderNames.push(folder.getName());
      count++;
    }
    console.log(`Found ${count} subfolders in main folder:`);
    console.log(folderNames.join(', '));
    
    // Test finding specific cases
    const testCases = cases.slice(0, 3); // Test first 3 cases
    for (const caseData of testCases) {
      console.log(`\nTesting case: ${caseData.businessName}`);
      
      // Try to find folder
      const foundFolder = FolderManager.findCaseFolder(caseData);
      if (foundFolder) {
        console.log(`✓ Found folder: ${foundFolder.getName()}`);
        console.log(`  URL: ${foundFolder.getUrl()}`);
      } else {
        console.log(`✗ No folder found for: ${caseData.businessName}`);
        
        // Check if folder should exist by name
        const cleanName = FolderManager.cleanBusinessName(caseData.businessName);
        console.log(`  Expected folder name: "${cleanName}"`);
        
        // Check if it exists in our folder list
        const existsInList = folderNames.includes(cleanName);
        console.log(`  Exists in folder list: ${existsInList}`);
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}