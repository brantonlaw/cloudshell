// Bootstrap.gs - Simple folder creation for existing spreadsheet data
// Works with existing spreadsheet - does NOT create phantom data

const Bootstrap = {

  /**
   * Initialize folders for all cases in the existing spreadsheet
   * This is the CORRECT bootstrap approach
   */
  initializeSystem: function() {
    console.log('=== BOOTSTRAP: Creating folders for existing cases ===');

    try {
      // Use the existing spreadsheet data - don't create a new one!
      const cases = getCases(); // Use the public API function
      console.log(`Found ${cases.length} cases in existing spreadsheet`);

      if (cases.length === 0) {
        return {
          success: false,
          message: 'No cases found in existing spreadsheet. Check SPREADSHEET_ID in Constants.gs',
          error: 'No data found'
        };
      }

      let created = 0;
      let existing = 0;
      let errors = [];

      // Create folder for each existing case
      for (let i = 0; i < cases.length; i++) {
        const caseData = cases[i];
        console.log(`Processing case ${i + 1}/${cases.length}: ${caseData.businessName}`);

        try {
          const result = FolderManager.initializeCaseFolder(caseData);

          if (result.created) {
            created++;
            console.log(`✓ Created folder for: ${caseData.businessName}`);
          } else {
            existing++;
            console.log(`- Folder already exists: ${caseData.businessName}`);
          }

        } catch (error) {
          errors.push(`${caseData.businessName}: ${error.toString()}`);
          console.error(`✗ Error creating folder for ${caseData.businessName}:`, error);
        }
      }

      const result = {
        success: true,
        message: 'Bootstrap completed',
        totalCases: cases.length,
        foldersCreated: created,
        foldersExisting: existing,
        errors: errors.length,
        errorDetails: errors,
        nextSteps: [
          `Processed ${cases.length} cases from existing spreadsheet`,
          `Created ${created} new case folders`,
          `Found ${existing} existing folders`,
          errors.length > 0 ? `${errors.length} errors encountered` : 'All folders processed successfully'
        ]
      };

      console.log('Bootstrap complete:', result);
      return result;

    } catch (error) {
      console.error('Bootstrap failed:', error);
      return {
        success: false,
        error: error.toString(),
        message: 'Bootstrap failed: ' + error.toString()
      };
    }
  },

  /**
   * Check if system is properly configured (doesn't create anything)
   */
  checkSystemHealth: function() {
    try {
      // Test spreadsheet access
      console.log('Checking spreadsheet access...');
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = spreadsheet.getSheetByName(SHEET_TAB_NAME);
      const rowCount = sheet.getLastRow();

      // Test folder access
      console.log('Checking folder access...');
      const folder = DriveApp.getFolderById(MAIN_DRIVE_FOLDER_ID);
      const folderName = folder.getName();

      console.log('System health check passed');
      return {
        healthy: true,
        spreadsheet: {
          accessible: true,
          rowCount: rowCount,
          name: spreadsheet.getName(),
          id: SPREADSHEET_ID
        },
        folder: {
          accessible: true,
          name: folderName,
          id: MAIN_DRIVE_FOLDER_ID
        }
      };

    } catch (error) {
      console.error('System health check failed:', error);
      return {
        healthy: false,
        error: error.toString(),
        needsConfigurationFix: true,
        checkItems: [
          'Verify SPREADSHEET_ID in Constants.gs points to existing spreadsheet',
          'Verify MAIN_DRIVE_FOLDER_ID in Constants.gs points to accessible folder',
          'Ensure proper permissions to access Drive and Sheets'
        ]
      };
    }
  }
};

/**
 * Public function to initialize the system (folder creation)
 */
function initializeCollectionsManagerSystem() {
  return Bootstrap.initializeSystem();
}

/**
 * Public function to check system health
 */
function checkCollectionsManagerHealth() {
  return Bootstrap.checkSystemHealth();
}