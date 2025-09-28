// HistoryManager.gs - Handles all JSON file operations for metadata and history
// These files store all dynamic state that would have been in the spreadsheet

const HistoryManager = {
  /**
   * Read metadata.json from a case folder
   * Returns parsed JSON object or null
   */
  getMetadata: function(caseFolder) {
    try {
      if (!caseFolder) return null;
      
      const files = caseFolder.getFilesByName(FOLDER_STRUCTURE.METADATA_FILE);
      if (files.hasNext()) {
        const file = files.next();
        const content = file.getBlob().getDataAsString();
        return JSON.parse(content);
      }
      
      console.log('HistoryManager: No metadata.json found');
      return null;
      
    } catch (error) {
      console.error('Error reading metadata:', error);
      return null;
    }
  },

  /**
   * Update metadata.json with new values
   * Supports nested updates using dot notation
   */
  updateMetadata: function(caseFolder, updates) {
    try {
      if (!caseFolder) {
        console.error('No folder provided for metadata update');
        return false;
      }
      
      // Get existing metadata or create new
      let metadata = this.getMetadata(caseFolder) || {
        created: new Date().toISOString(),
        currentState: {}
      };
      
      // Apply updates (supports nested properties with dot notation)
      Object.keys(updates).forEach(key => {
        if (key.includes('.')) {
          // Handle nested update like 'currentState.l1_sent'
          const parts = key.split('.');
          let target = metadata;
          
          for (let i = 0; i < parts.length - 1; i++) {
            if (!target[parts[i]]) {
              target[parts[i]] = {};
            }
            target = target[parts[i]];
          }
          
          target[parts[parts.length - 1]] = updates[key];
        } else {
          // Direct property update
          metadata[key] = updates[key];
        }
      });
      
      // Always update lastModified
      metadata.lastModified = new Date().toISOString();
      
      // Write back to file
      const files = caseFolder.getFilesByName(FOLDER_STRUCTURE.METADATA_FILE);
      if (files.hasNext()) {
        const file = files.next();
        file.setContent(JSON.stringify(metadata, null, 2));
        console.log('HistoryManager: Metadata updated');
        return true;
      } else {
        // Create metadata file if it doesn't exist
        caseFolder.createFile(
          FOLDER_STRUCTURE.METADATA_FILE,
          JSON.stringify(metadata, null, 2),
          MimeType.JSON
        );
        console.log('HistoryManager: Metadata created');
        return true;
      }
      
    } catch (error) {
      console.error('Error updating metadata:', error);
      return false;
    }
  },

  /**
   * Read history.json from a case folder
   * Returns array of history entries
   */
  getHistory: function(caseFolder) {
    try {
      if (!caseFolder) return [];
      
      const files = caseFolder.getFilesByName(FOLDER_STRUCTURE.HISTORY_FILE);
      if (files.hasNext()) {
        const file = files.next();
        const content = file.getBlob().getDataAsString();
        const history = JSON.parse(content);
        
        // Ensure it's an array
        return Array.isArray(history) ? history : [];
      }
      
      console.log('HistoryManager: No history.json found');
      return [];
      
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  },

  /**
   * Add a new entry to history.json
   * History is append-only for audit integrity
   */
  addHistoryEntry: function(caseFolder, entry) {
    try {
      if (!caseFolder) {
        console.error('No folder provided for history entry');
        return false;
      }
      
      // Get existing history
      const history = this.getHistory(caseFolder);
      
      // Ensure entry has required fields
      const completeEntry = {
        timestamp: entry.timestamp || new Date().toISOString(),
        code: entry.code || 'NOTE',
        narrative: entry.narrative || '',
        userInitials: entry.userInitials || this.getCurrentUserInitials(),
        ...entry  // Include any additional fields
      };
      
      // Add to history array
      history.push(completeEntry);
      
      // Write back to file
      const files = caseFolder.getFilesByName(FOLDER_STRUCTURE.HISTORY_FILE);
      if (files.hasNext()) {
        const file = files.next();
        file.setContent(JSON.stringify(history, null, 2));
      } else {
        // Create history file if it doesn't exist
        caseFolder.createFile(
          FOLDER_STRUCTURE.HISTORY_FILE,
          JSON.stringify(history, null, 2),
          MimeType.JSON
        );
      }
      
      console.log('HistoryManager: History entry added:', completeEntry.code);
      return true;
      
    } catch (error) {
      console.error('Error adding history entry:', error);
      return false;
    }
  },

  /**
   * Get the most recent history entry matching a code
   */
  getLatestEntryByCode: function(caseFolder, code) {
    try {
      const history = this.getHistory(caseFolder);
      
      // Search backwards for most recent
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].code === code) {
          return history[i];
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('Error finding history entry:', error);
      return null;
    }
  },

  /**
   * Check if there's an open MTC (Message to Client)
   */
  hasOpenMTC: function(caseFolder) {
    try {
      const metadata = this.getMetadata(caseFolder);
      return metadata?.currentState?.mtc_open === true;
    } catch (error) {
      console.error('Error checking MTC status:', error);
      return false;
    }
  },

  /**
   * Check if there's a pending MSG (Client Message awaiting ACK)
   */
  hasPendingMSG: function(caseFolder) {
    try {
      const metadata = this.getMetadata(caseFolder);
      return metadata?.currentState?.msg_pending_ack === true;
    } catch (error) {
      console.error('Error checking MSG status:', error);
      return false;
    }
  },

  /**
   * Get summary of case state from metadata and history
   */
  getCaseSummary: function(caseFolder) {
    try {
      const metadata = this.getMetadata(caseFolder);
      const history = this.getHistory(caseFolder);
      
      return {
        hasFolder: true,
        created: metadata?.created,
        lastModified: metadata?.lastModified,
        l1Sent: metadata?.currentState?.l1_sent,
        l2Sent: metadata?.currentState?.l2_sent,
        l3Sent: metadata?.currentState?.l3_sent,
        mtcOpen: metadata?.currentState?.mtc_open || false,
        msgPending: metadata?.currentState?.msg_pending_ack || false,
        lastAction: metadata?.currentState?.lastActionCode,
        lastActionDate: metadata?.currentState?.lastActionDate,
        historyCount: history.length,
        documentCount: metadata?.documentCount
      };
      
    } catch (error) {
      console.error('Error getting case summary:', error);
      return {
        hasFolder: false,
        error: error.toString()
      };
    }
  },

  /**
   * Initialize metadata for a new case
   */
  initializeMetadata: function(caseFolder, caseData) {
    try {
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
        MimeType.JSON
      );
      
      console.log('HistoryManager: Metadata initialized for', caseData.businessName);
      return true;
      
    } catch (error) {
      console.error('Error initializing metadata:', error);
      return false;
    }
  },

  /**
   * Helper to get current user initials
   */
  getCurrentUserInitials: function() {
    try {
      const email = Session.getActiveUser().getEmail();
      // Generate initials from email format: firstname.lastname@domain.com
      const parts = email.split('@')[0].split('.');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      // Fallback to first two characters
      return email.substring(0, 2).toUpperCase();
    } catch (error) {
      return 'XX';
    }
  }
};