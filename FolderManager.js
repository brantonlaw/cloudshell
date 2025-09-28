// FolderManager.gs - Handles all Google Drive folder operations
// Folders are named using business name only for human readability

const FolderManager = {
  /**
   * Clean a business name for use as folder name
   * Removes special characters and limits length
   */
  cleanBusinessName: function(businessName) {
    if (!businessName) return 'Unknown_Business';
    
    return businessName
      .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove special characters
      .replace(/\s+/g, '_')             // Replace spaces with underscores
      .substring(0, 50);                // Limit length for Drive
  },

  /**
   * Find a case folder by business name only (DEFINITIVE FIX)
   */
  findCaseFolder: function(caseData, overrideMainFolderId) {
    if (!caseData || !caseData.businessName) {
      console.error('FolderManager: findCaseFolder requires caseData with businessName');
      return null;
    }

    try {
      const mainFolderId = overrideMainFolderId || MAIN_DRIVE_FOLDER_ID;
      const mainFolder = DriveApp.getFolderById(mainFolderId);
      const folders = mainFolder.getFolders();
      const cleanName = this.cleanBusinessName(caseData.businessName);

      // DEFINITIVE: Only search for exact match on cleaned business name
      while (folders.hasNext()) {
        const folder = folders.next();
        const folderName = folder.getName();

        if (folderName === cleanName) {
          console.log('FolderManager: Found folder for', caseData.businessName, ':', folderName);
          return folder;
        }
      }

      console.log('FolderManager: No folder found for', caseData.businessName, 'searching for:', cleanName);
      return null;

    } catch (error) {
      console.error('Error finding folder:', error);
      return null;
    }
  },

  /**
   * Create a new case folder with standard structure
   * Returns the created folder object
   */
  createCaseFolder: function(caseData, overrideMainFolderId) {
    try {
      const cleanName = this.cleanBusinessName(caseData.businessName);
      const folderName = cleanName; // Folders are named by business name only (not account number)

      // Check if already exists
      const existing = this.findCaseFolder(caseData, overrideMainFolderId);
      if (existing) {
        console.log('FolderManager: Folder already exists for', caseData.businessName);
        return existing;
      }
      
      // Create main case folder
      const mainFolderId = overrideMainFolderId || MAIN_DRIVE_FOLDER_ID;
      const mainFolder = DriveApp.getFolderById(mainFolderId);
      const caseFolder = mainFolder.createFolder(folderName);
      console.log('FolderManager: Created folder:', folderName);
      
      // Create subfolders
      FOLDER_STRUCTURE.SUBFOLDERS.forEach(subfolderName => {
        caseFolder.createFolder(subfolderName);
      });
      
      // Create initial metadata.json
      const metadata = {
        accountNumber: caseData.accountNumber,
        flexLoanNumber: caseData.flexLoanNumber,
        businessName: caseData.businessName,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        currentState: {
          l1_sent: null,
          l2_sent: null,
          l3_sent: null,
          mtc_open: false,
          msg_pending_ack: false,
          lastActionCode: null,
          lastActionDate: null,
          lastActionUser: null
        },
        documentCount: {
          demands: 0,
          correspondence: 0,
          filings: 0,
          settlements: 0
        }
      };
      
      caseFolder.createFile(
        FOLDER_STRUCTURE.METADATA_FILE,
        JSON.stringify(metadata, null, 2),
        MimeType.PLAIN_TEXT
      );
      
      // Create initial empty history.json
      caseFolder.createFile(
        FOLDER_STRUCTURE.HISTORY_FILE,
        '[]',
        MimeType.PLAIN_TEXT
      );
      
      // Add initial history entry
      const initialHistory = [{
        timestamp: new Date().toISOString(),
        code: 'FOLDER_CREATED',
        narrative: 'Case folder initialized',
        userInitials: this.getCurrentUserInitials()
      }];
      
      // Update history file
      const historyFiles = caseFolder.getFilesByName(FOLDER_STRUCTURE.HISTORY_FILE);
      if (historyFiles.hasNext()) {
        historyFiles.next().setContent(JSON.stringify(initialHistory, null, 2));
      }
      
      return caseFolder;
      
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  /**
   * Initialize folder if it doesn't exist
   * Returns {folder: Drive folder object, created: boolean}
   */
  initializeCaseFolder: function(caseData, overrideMainFolderId) {
    try {
      let folder = this.findCaseFolder(caseData, overrideMainFolderId);
      
      if (folder) {
        return {
          folder: folder,
          created: false,
          existed: true
        };
      }
      
      folder = this.createCaseFolder(caseData, overrideMainFolderId);
      return {
        folder: folder,
        created: true,
        existed: false
      };
      
    } catch (error) {
      console.error('Error initializing folder:', error);
      throw error;
    }
  },

  /**
   * Get or create a subfolder within a case folder
   */
  getSubfolder: function(caseFolder, subfolderName) {
    try {
      const folders = caseFolder.getFoldersByName(subfolderName);
      
      if (folders.hasNext()) {
        return folders.next();
      }
      
      // Create if doesn't exist
      console.log('FolderManager: Creating missing subfolder:', subfolderName);
      return caseFolder.createFolder(subfolderName);
      
    } catch (error) {
      console.error('Error getting subfolder:', error);
      return null;
    }
  },

  /**
   * Check if a document exists in a case folder
   * Returns {exists: boolean, file: File object or null, url: string or null}
   */
  // Accepts either (caseData, documentType, overrideMainFolderId) OR
  // (caseData, documentType, caseFolder)
  checkDocumentExists: function(caseData, documentType, thirdParam) {
    try {
      // If thirdParam looks like a folder (has getFiles), treat it as caseFolder
      let caseFolder = null;
      if (thirdParam && typeof thirdParam.getFiles === 'function') {
        caseFolder = thirdParam;
      } else {
        const overrideMainFolderId = thirdParam;
        caseFolder = this.findCaseFolder(caseData, overrideMainFolderId);
      }
      if (!caseFolder) {
        return { exists: false, file: null, url: null };
      }
      
      // Determine which subfolder to check based on document type
      let subfolderName;
      if (['L1', 'L2', 'L3'].includes(documentType)) {
        subfolderName = 'demands';
      } else if (['EX', 'SA', 'SAE'].includes(documentType)) {
        subfolderName = 'filings';
      } else if (['MTC', 'MSG'].includes(documentType)) {
        subfolderName = 'correspondence';
      } else {
        subfolderName = 'settlements';
      }
      
      const subfolder = this.getSubfolder(caseFolder, subfolderName);
      if (!subfolder) {
        return { exists: false, file: null, url: null };
      }
      
      // Look for files with the document type in the name
      const files = subfolder.getFiles();
      while (files.hasNext()) {
        const file = files.next();
        if (file.getName().includes(documentType)) {
          return {
            exists: true,
            file: file,
            url: file.getUrl(),
            name: file.getName()
          };
        }
      }
      
      return { exists: false, file: null, url: null };
      
    } catch (error) {
      console.error('Error checking document:', error);
      return { exists: false, file: null, url: null };
    }
  },

  /**
   * List all documents in a case folder
   * Returns array of document info objects
   */
  getDocuments: function(caseData, overrideMainFolderId) {
    try {
      const caseFolder = this.findCaseFolder(caseData, overrideMainFolderId);
      if (!caseFolder) {
        return [];
      }
      
      const documents = [];
      
      // Check each subfolder
      FOLDER_STRUCTURE.SUBFOLDERS.forEach(subfolderName => {
        const subfolder = this.getSubfolder(caseFolder, subfolderName);
        if (!subfolder) return;
        
        const files = subfolder.getFiles();
        while (files.hasNext()) {
          const file = files.next();  // FIX: Added this line to get the file
          documents.push({
            name: file.getName(),
            url: file.getUrl(),
            folder: subfolderName,
            size: file.getSize(),
            created: file.getDateCreated().toString(),  // Convert to string
            modified: file.getLastUpdated().toString()   // Convert to string
          });
        }
      });
      
      return documents;
      
    } catch (error) {
      console.error('Error listing documents:', error);
      return [];
    }
  },

  /**
   * Save a file to the appropriate subfolder
   */
  saveDocument: function(caseData, documentType, fileBlob, fileName, overrideMainFolderId) {
    try {
      const folderResult = this.initializeCaseFolder(caseData, overrideMainFolderId);
      const caseFolder = folderResult.folder;
      
      // Determine subfolder
      let subfolderName;
      if (['L1', 'L2', 'L3'].includes(documentType)) {
        subfolderName = 'demands';
      } else if (['EX', 'SA', 'SAE'].includes(documentType)) {
        subfolderName = 'filings';
      } else if (['MTC', 'MSG'].includes(documentType)) {
        subfolderName = 'correspondence';
      } else {
        subfolderName = 'settlements';
      }
      
      const subfolder = this.getSubfolder(caseFolder, subfolderName);
      
      // Create file
      const file = subfolder.createFile(fileBlob);
      if (fileName) {
        file.setName(fileName);
      }
      
      console.log('FolderManager: Saved document', fileName, 'to', subfolderName);
      
      return {
        success: true,
        file: file,
        url: file.getUrl()
      };
      
    } catch (error) {
      console.error('Error saving document:', error);
      return {
        success: false,
        error: error.toString()
      };
    }
  },

  /**
   * Get case folder URL if it exists
   */
  getCaseFolderUrl: function(caseData, overrideMainFolderId) {
    try {
      const folder = this.findCaseFolder(caseData, overrideMainFolderId);
      return folder ? folder.getUrl() : null;
    } catch (error) {
      console.error('Error getting folder URL:', error);
      return null;
    }
  },

  /**
   * Helper to get current user initials
   */
  getCurrentUserInitials: function() {
    try {
      const email = Session.getActiveUser().getEmail();
      // Generate initials from email
      const parts = email.split('@')[0].split('.');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return email.substring(0, 2).toUpperCase();
    } catch (error) {
      return 'XX';
    }
  }
};