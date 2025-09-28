// MailMerge.gs - Document generation from templates
const MailMerge = {
  /**
   * Generates a document from template and saves as PDF in case folder
   */
  generateDocument: function(caseId, actionCode, caseFolder) {
    let tempFile = null;
    try {
      // Get template ID
      const templateId = TEMPLATES[actionCode];
      if (!templateId) {
        throw new Error(`No template defined for ${actionCode}`);
      }
      
      // Get case data
      const caseData = SheetManager.getCase(caseId);
      if (!caseData) {
        throw new Error(`Case not found: ${caseId}`);
      }
      
      // Use provided caseFolder if passed (avoids extra Drive lookups), otherwise resolve
      if (!caseFolder) {
        caseFolder = FolderManager.findCaseFolder(caseData);
      }
      if (!caseFolder) {
        const folderResult = FolderManager.initializeCaseFolder(caseData);
        caseFolder = folderResult.folder;
      }
      
      // Create temp copy of template
      const originalTemplate = DriveApp.getFileById(templateId);
      tempFile = originalTemplate.makeCopy(`TEMP_${actionCode}_${Date.now()}`);
      const tempDoc = DocumentApp.openById(tempFile.getId());
      const body = tempDoc.getBody();
      
      // Replace all placeholders
      const mergeData = this._getFormattedMergeData(caseData);
      for (const key in mergeData) {
        body.replaceText(key, mergeData[key]);
      }
      
      // Save as PDF
      tempDoc.saveAndClose();
      const pdfBlob = tempFile.getAs(MimeType.PDF);
      // Sanitize name to avoid invalid filename chars
      const safeBusiness = (caseData.businessName || 'case').replace(/[^a-zA-Z0-9 _-]/g, '_');
      const datePart = new Date().toISOString().split('T')[0];
      const pdfName = `${actionCode}_${safeBusiness}_${datePart}.pdf`;
      pdfBlob.setName(pdfName);
      
      // Save to demands folder
      const demandsFolder = FolderManager.getSubfolder(caseFolder, 'demands');
      const savedPdf = demandsFolder.createFile(pdfBlob);
      
      // Update metadata to trigger status change
      const updates = StatusEngine.getMetadataUpdatesForAction(actionCode);
      if (updates && Object.keys(updates).length > 0) {
        HistoryManager.updateMetadata(caseFolder, updates);
      }
      
      // Add history entry with document link
      HistoryManager.addHistoryEntry(caseFolder, {
        code: actionCode,
        narrative: `${actionCode} generated and saved`,
        userInitials: getCurrentUser().initials,
        documentUrl: savedPdf.getUrl()
      });
      
      console.log(`Generated ${actionCode} for ${caseData.businessName}`);
      
      return {
        success: true,
        pdfUrl: savedPdf.getUrl(),
        message: `${actionCode} document generated successfully`
      };
      
    } catch (error) {
      console.error('Document generation failed:', error);
      return {
        success: false,
        error: error.toString()
      };
    } finally {
      if (tempFile) {
        try { tempFile.setTrashed(true); } catch (e) { /* ignore */ }
      }
    }
  },
  
  
  /**
   * Format case data for mail merge
   */
  _getFormattedMergeData: function(caseData) {
    const formatCurrency = (val) => {
      if (!val || val === '') return '$0.00';
      const num = parseFloat(val);
      return isNaN(num) ? '$0.00' : num.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      });
    };
    
    const formatDate = (val) => {
      if (!val) return '';
      try {
        return new Date(val).toLocaleDateString('en-US');
      } catch (e) {
        return '';
      }
    };
    
    return {
      '{{Business_Name}}': caseData.businessName || '',
      '{{Owner_Name}}': caseData.ownerName || '',
      '{{Mailing_Address}}': caseData.mailingAddress || '',
      '{{Physical_Address}}': caseData.physicalAddress || '',
      '{{Email_1}}': caseData.email1 || '',
      '{{Email_2}}': caseData.email2 || '',
      '{{Phone_1}}': caseData.phone1 || '',
      '{{Phone_2}}': caseData.phone2 || '',
      '{{Date}}': new Date().toLocaleDateString('en-US'),
      '{{Account_Number}}': caseData.accountNumber || '',
      '{{Flex_Loan_Number}}': caseData.flexLoanNumber || '',
      '{{Past_Due_Amount}}': formatCurrency(caseData.pastDueAmount),
      '{{Outstanding_Balance}}': formatCurrency(caseData.outstandingBalance),
      '{{Merchant_Balance}}': formatCurrency(caseData.merchantBalance),
      '{{Delinquent_Since}}': formatDate(caseData.delinquentSince),
      '{{Days_Delinquent}}': caseData.daysDelinquent || '0',
      '{{Placement_Date}}': formatDate(caseData.placementDate)
    };
  }
};
