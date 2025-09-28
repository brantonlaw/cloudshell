// SheetManager.gs - Handles all spreadsheet READ operations
// Remember: Sheet is READ-ONLY - we never write to it

const SheetManager = {
  /**
   * Get the sheet reference
   */
  getSheet: function() {
    try {
      const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      return spreadsheet.getSheetByName(SHEET_TAB_NAME);
    } catch (error) {
      console.error('Failed to access spreadsheet:', error);
      throw new Error('Cannot access spreadsheet. Check SPREADSHEET_ID and permissions.');
    }
  },

  /**
   * Get all cases from the spreadsheet
   * Returns array of case objects with all fields
   */
  getCases: function(overrideSpreadsheetId, overrideSheetName) {
    try {
      const sheet = this.getSheet(overrideSpreadsheetId, overrideSheetName);
      if (!sheet) {
        console.log('No sheet available - returning empty cases list');
        return [];
      }

      const lastRow = sheet.getLastRow();
      console.log('SheetManager: Sheet has', lastRow, 'rows (including header)');

      if (lastRow <= 1) {
        console.warn('SheetManager: No data rows found in spreadsheet (only header row)');
        return [];
      }

      // Get all data (23 columns - no case_folder_id)
      const numCols = 23;
      const dataRange = sheet.getRange(2, 1, lastRow - 1, numCols);
      const data = dataRange.getValues();
      console.log('SheetManager: Retrieved', data.length, 'data rows from sheet');

      if (data.length > 0) {
        console.log('SheetManager: First row sample:', JSON.stringify(data[0], null, 2));
      }

      // Map to case objects
      const cases = data.map((row, index) => {
        return {
          rowIndex: index + 2,  // Actual sheet row (1-based, accounting for header)
          
          // Case identifiers
          accountNumber: row[COLS.ACCOUNT_NUMBER] || '',
          flexLoanNumber: row[COLS.FLEX_LOAN_NUMBER] || '',
          
          // Business/owner information
          businessName: row[COLS.BUSINESS_NAME] || '',
          ownerName: row[COLS.OWNER_NAME] || '',
          ownerRepType: row[COLS.OWNER_REP_TYPE] || '',
          
          // Addresses
          mailingAddress: row[COLS.MAILING_ADDRESS] || '',
          physicalAddress: row[COLS.PHYSICAL_ADDRESS] || '',
          
          // Contact information
          phone1: row[COLS.PHONE_1] || '',
          phone2: row[COLS.PHONE_2] || '',
          email1: row[COLS.EMAIL_1] || '',
          email2: row[COLS.EMAIL_2] || '',
          socialMedia: row[COLS.SOCIAL_MEDIA] || '',
          
          // Financial information
          outstandingBalance: row[COLS.OUTSTANDING_BALANCE] || 0,
          merchantBalance: row[COLS.MERCHANT_BALANCE] || 0,
          pastDueAmount: row[COLS.PAST_DUE_AMOUNT] || 0,
          
          // Delinquency information
          delinquentSince: row[COLS.DELINQUENT_SINCE] || null,
          daysDelinquent: row[COLS.DAYS_DELINQUENT] || 0,
          
          // Opposing counsel
          opposingCounselName: row[COLS.OPPOSING_COUNSEL_NAME] || '',
          opposingCounselPhone: row[COLS.OPPOSING_COUNSEL_PHONE] || '',
          opposingCounselEmail: row[COLS.OPPOSING_COUNSEL_EMAIL] || '',
          opposingCounselAddress: row[COLS.OPPOSING_COUNSEL_ADDRESS] || '',
          
          // Flags and dates
          bankruptcyFlag: row[COLS.BANKRUPTCY_FLAG] || 'N',
          placementDate: row[COLS.PLACEMENT_DATE] || null
        };
      }).filter(c => c.accountNumber || c.flexLoanNumber); // Filter out completely empty rows
      
      console.log(`SheetManager: Found ${cases.length} cases`);
      return cases;
      
    } catch (error) {
      console.error('Error in getCases:', error);
      return [];
    }
  },

  /**
   * Get a single case by a unique identifier.
   * The identifier can be an account number, flex loan number, or business name.
   */
  getCase: function(identifier, overrideSpreadsheetId, overrideSheetName) {
    if (!identifier) {
      console.error('SheetManager.getCase: identifier is required.');
      return null;
    }
    try {
      const cases = this.getCases(overrideSpreadsheetId, overrideSheetName);
      const foundCase = cases.find(c => 
        c.accountNumber === identifier || 
        c.flexLoanNumber === identifier ||
        c.businessName === identifier
      );
      
      if (!foundCase) {
        console.log('SheetManager: Case not found for identifier:', identifier);
        return null;
      }
      
      return foundCase;
      
    } catch (error) {
      console.error('Error in getCase:', error);
      return null;
    }
  },

  /**
   * Get multiple cases by a list of business names
   */
  getCasesByBusinessNames: function(businessNames) {
    try {
      const cases = this.getCases();
      
      return cases.filter(c => businessNames.includes(c.businessName));
      
    } catch (error) {
      console.error('Error in getCasesByBusinessNames:', error);
      return [];
    }
  },

  /**
   * Get cases that match certain criteria
   * Used for batch operations
   */
  getFilteredCases: function(filters = {}) {
    try {
      const cases = this.getCases();
      
      return cases.filter(c => {
        // Apply each filter if provided
        if (filters.hasPlacementDate && !c.placementDate) return false;
        if (filters.noBankruptcy && c.bankruptcyFlag === 'Y') return false;
        if (filters.minBalance && c.outstandingBalance < filters.minBalance) return false;
        if (filters.minDaysDelinquent && c.daysDelinquent < filters.minDaysDelinquent) return false;
        
        return true;
      });
      
    } catch (error) {
      console.error('Error in getFilteredCases:', error);
      return [];
    }
  },

  /**
   * Debug function to verify sheet connection
   */
  debugSheetConnection: function() {
    try {
      const sheet = this.getSheet();
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      
      return {
        connected: true,
        sheetName: sheet.getName(),
        rows: lastRow,
        columns: lastCol,
        spreadsheetId: SPREADSHEET_ID
      };
    } catch (error) {
      return {
        connected: false,
        error: error.toString()
      };
    }
  }
};