// ActionProcessor.gs - Central orchestrator for all actions
const ActionProcessor = {
  processAction: function(caseId, actionCode, narrative) {
    try {
      console.log(`ActionProcessor: Processing ${actionCode} for case ${caseId}`);
      
      // Get case data
      const caseData = SheetManager.getCase(caseId);
      if (!caseData) {
        return { success: false, error: 'Case not found' };
      }
      
      // Get/create folder
      let folder = FolderManager.findCaseFolder(caseData);
      if (!folder) {
        const folderResult = FolderManager.initializeCaseFolder(caseData);
        folder = folderResult.folder;
      }
      
      // Validate action using StatusEngine
      const validation = StatusEngine.validateAction(caseData, actionCode, folder);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }
      
      // Process special actions
      let result = { success: true, message: 'Action recorded' };
      
      // Handle action-specific logic
      switch(actionCode) {
        case 'L1':
        case 'L2':
        case 'L3':
        case 'MCA':
          // Document generation actions
          if (typeof MailMerge !== 'undefined' && TEMPLATES && TEMPLATES[actionCode]) {
            // Pass the already-resolved folder to avoid extra Drive lookups
            result = MailMerge.generateDocument(caseId, actionCode, folder);
            if (!result.success) {
              return result;
            }
            narrative = narrative + ` | Document: ${result.pdfUrl}`;
          }
          break;
          
        case 'CLOSE':
          // Archive the case folder
          const archiveResult = FolderManager.archiveCase(folder);
          if (!archiveResult.success) {
            return archiveResult;
          }
          narrative = `File closed and archived | ${narrative}`;
          break;
          
        case 'BK':
          // Move folder to BK archive
          const bkResult = FolderManager.moveToBKFolder(folder);
          if (!bkResult.success) {
            return bkResult;
          }
          
  narrative = `Bankruptcy filed - case stayed | ${narrative}`;
  break;

        default:
          // All other actions just get recorded
          break;
      }
      
      // Update metadata for state changes
      const updates = StatusEngine.getMetadataUpdatesForAction(actionCode);
      if (updates && Object.keys(updates).length > 0) {
        HistoryManager.updateMetadata(folder, updates);
      }
      
      // Record in history
      HistoryManager.addHistoryEntry(folder, {
        code: actionCode,
        narrative: narrative,
        userInitials: getCurrentUser().initials,
        timestamp: new Date().toISOString()
      });
      
      console.log(`ActionProcessor: ${actionCode} completed successfully`);
      return result;
      
    } catch (error) {
      console.error('ActionProcessor error:', error);
      return { 
        success: false, 
        error: error.toString() 
      };
    }
  }
};