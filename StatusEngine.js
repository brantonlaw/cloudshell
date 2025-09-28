
const StatusEngine = {
  /**
   * Calculate the display status and color for a case
   * Priority: Message flags > SLA status
   */
  calculateStatus: function(caseData, caseFolder) {
    try {
      // Get dynamic state from folder if it exists
      const metadata = caseFolder ? HistoryManager.getMetadata(caseFolder) : null;
      
      // Priority 1: Check message flags (these override SLA colors)
      if (metadata?.currentState?.mtc_open) {
        return {
          color: COLORS.MTC,
          statusText: 'MTC Open - Awaiting Client Response',
          statusCode: 'MTC_OPEN',
          priority: 1
        };
      }
      
      if (metadata?.currentState?.msg_pending_ack) {
        return {
          color: COLORS.MSG,
          statusText: 'Client Response - Needs Acknowledgment',
          statusCode: 'MSG_PENDING',
          priority: 1
        };
      }
      
      // Priority 2: Calculate SLA status based on placement date and letter dates
      const slaStatus = this.calculateSLAStatus(caseData, metadata);
      return slaStatus;
      
    } catch (error) {
      console.error('Error calculating status:', error);
      return {
        color: COLORS.BLACK,
        statusText: 'Status Unknown',
        statusCode: 'ERROR',
        priority: 3
      };
    }
  },

  /**
   * Calculate SLA status based on deadlines
   */
  calculateSLAStatus: function(caseData, metadata) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // No placement date = no SLA
    if (!caseData.placementDate) {
      return {
        color: COLORS.BLACK,
        statusText: 'No Placement Date',
        statusCode: 'NO_PLACEMENT',
        priority: 3
      };
    }
    
    const placementDate = new Date(caseData.placementDate);
    placementDate.setHours(0, 0, 0, 0);
    
    const daysSincePlacement = this.daysBetween(placementDate, today);
    
    // Verify letter dates from metadata match actual documents
    const l1Date = metadata?.currentState?.l1_sent ? 
      (this.verifyDocumentExists(caseData, 'L1', caseFolder) ? 
        new Date(metadata.currentState.l1_sent) : null) : null;
    const l2Date = metadata?.currentState?.l2_sent ? 
      (this.verifyDocumentExists(caseData, 'L2', caseFolder) ? 
        new Date(metadata.currentState.l2_sent) : null) : null;
    const l3Date = metadata?.currentState?.l3_sent ? 
      (this.verifyDocumentExists(caseData, 'L3', caseFolder) ? 
        new Date(metadata.currentState.l3_sent) : null) : null;

    // Check for metadata/document mismatches
    if (metadata?.currentState?.l1_sent && !l1Date) {
      return {
        color: COLORS.RED,
        statusText: 'L1 Metadata Invalid - PDF Missing',
        statusCode: 'L1_INVALID',
        priority: 1
      };
    }
    if (metadata?.currentState?.l2_sent && !l2Date) {
      return {
        color: COLORS.RED,
        statusText: 'L2 Metadata Invalid - PDF Missing',
        statusCode: 'L2_INVALID',
        priority: 1
      };
    }
    if (metadata?.currentState?.l3_sent && !l3Date) {
      return {
        color: COLORS.RED,
        statusText: 'L3 Metadata Invalid - PDF Missing',
        statusCode: 'L3_INVALID',
        priority: 1
      };
    }
    
    // Check L1 status
    if (!l1Date) {
      if (daysSincePlacement > SLA.L1_DEADLINE) {
        return {
          color: COLORS.RED,
          statusText: `L1 Overdue by ${daysSincePlacement - SLA.L1_DEADLINE} days`,
          statusCode: 'L1_OVERDUE',
          priority: 2,
          daysOverdue: daysSincePlacement - SLA.L1_DEADLINE
        };
      } else if (daysSincePlacement === SLA.L1_DEADLINE) {
        return {
          color: COLORS.YELLOW,
          statusText: 'L1 Due Today',
          statusCode: 'L1_DUE',
          priority: 2
        };
      } else {
        const daysUntilDue = SLA.L1_DEADLINE - daysSincePlacement;
        return {
          color: COLORS.GREEN,
          statusText: `L1 Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          statusCode: 'L1_PENDING',
          priority: 2,
          daysUntilDue: daysUntilDue
        };
      }
    }
    
    // Check L2 status
    if (l1Date && !l2Date) {
      l1Date.setHours(0, 0, 0, 0);
      const daysSinceL1 = this.daysBetween(l1Date, today);
      
      if (daysSinceL1 > SLA.L2_DEADLINE) {
        return {
          color: COLORS.RED,
          statusText: `L2 Overdue by ${daysSinceL1 - SLA.L2_DEADLINE} days`,
          statusCode: 'L2_OVERDUE',
          priority: 2,
          daysOverdue: daysSinceL1 - SLA.L2_DEADLINE
        };
      } else if (daysSinceL1 === SLA.L2_DEADLINE) {
        return {
          color: COLORS.YELLOW,
          statusText: 'L2 Due Today',
          statusCode: 'L2_DUE',
          priority: 2
        };
      } else {
        const daysUntilDue = SLA.L2_DEADLINE - daysSinceL1;
        return {
          color: COLORS.GREEN,
          statusText: `L2 Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          statusCode: 'L2_PENDING',
          priority: 2,
          daysUntilDue: daysUntilDue
        };
      }
    }
    
    // Check L3 status
    if (l2Date && !l3Date) {
      l2Date.setHours(0, 0, 0, 0);
      const daysSinceL2 = this.daysBetween(l2Date, today);
      
      if (daysSinceL2 > SLA.L3_DEADLINE) {
        return {
          color: COLORS.RED,
          statusText: `L3 Overdue by ${daysSinceL2 - SLA.L3_DEADLINE} days`,
          statusCode: 'L3_OVERDUE',
          priority: 2,
          daysOverdue: daysSinceL2 - SLA.L3_DEADLINE
        };
      } else if (daysSinceL2 === SLA.L3_DEADLINE) {
        return {
          color: COLORS.YELLOW,
          statusText: 'L3 Due Today',
          statusCode: 'L3_DUE',
          priority: 2
        };
      } else {
        const daysUntilDue = SLA.L3_DEADLINE - daysSinceL2;
        return {
          color: COLORS.GREEN,
          statusText: `L3 Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          statusCode: 'L3_PENDING',
          priority: 2,
          daysUntilDue: daysUntilDue
        };
      }
    }
    
    // All letters sent
    if (l3Date) {
      return {
        color: COLORS.BLACK,
        statusText: 'All Letters Sent - Complete',
        statusCode: 'COMPLETE',
        priority: 3
      };
    }
    
    // Default (shouldn't reach here)
    return {
      color: COLORS.BLACK,
      statusText: 'Status Unknown',
      statusCode: 'UNKNOWN',
      priority: 3
    };
  },

  /**
   * Validate if an action can be taken on a case
   */
  validateAction: function(caseData, actionCode, caseFolder) {
    // Backwards compatibility: if called as (caseData, metadata, actionCode)
    if (typeof actionCode === 'object' && typeof caseFolder === 'string') {
      // Swap: actionCode is actually metadata, caseFolder is actionCode
      const metadata = actionCode;
      actionCode = caseFolder;
      caseFolder = null;
      // Note: metadata won't be used directly here; callers should pass caseFolder when possible
    }
    try {
      // Get current state
      const metadata = caseFolder ? HistoryManager.getMetadata(caseFolder) : null;
      
      // Check bankruptcy flag
      if (caseData.bankruptcyFlag === 'Y' && ['L1', 'L2', 'L3', 'EX'].includes(actionCode)) {
        return {
          valid: false,
          reason: 'Cannot send demands or file exemplar - bankruptcy flag is set'
        };
      }
      
      // Check document requirements. For L1/L2/L3 allow generation when a MailMerge template is available.
      if (DOC_REQUIRED_ACTIONS.includes(actionCode)) {
        // If a MailMerge template exists for this action, allow generation without scanning files.
        if (typeof TEMPLATES !== 'undefined' && TEMPLATES[actionCode]) {
          console.log(`StatusEngine: Allowing ${actionCode} because template is available for generation (short-circuit)`);
        } else {
          // Use caseData object for folder checks
          const docCheck = FolderManager.checkDocumentExists(caseData, actionCode);

          if (!docCheck.exists) {
            return {
              valid: false,
              reason: `${actionCode} requires document to be uploaded first`
            };
          }
        }
      }
      
      // Check message sequence requirements
      if (actionCode === 'MSG') {
        if (!metadata?.currentState?.mtc_open) {
          return {
            valid: false,
            reason: 'MSG requires an open MTC (Message to Client)'
          };
        }
      }
      
      if (actionCode === 'ACK') {
        if (!metadata?.currentState?.msg_pending_ack) {
          return {
            valid: false,
            reason: 'ACK requires a pending MSG (Client Response)'
          };
        }
      }
      
      // Check letter sequence requirements
      if (actionCode === 'L2') {
        if (!metadata?.currentState?.l1_sent) {
          return {
            valid: false,
            reason: 'L2 requires L1 to be sent first'
          };
        }
      }
      
      if (actionCode === 'L3') {
        if (!metadata?.currentState?.l2_sent) {
          return {
            valid: false,
            reason: 'L3 requires L2 to be sent first'
          };
        }
      }
      
      // Action is valid
      return {
        valid: true,
        reason: 'Action allowed'
      };
      
    } catch (error) {
      console.error('Error validating action:', error);
      return {
        valid: false,
        reason: 'Validation error: ' + error.toString()
      };
    }
  },

  /**
   * Get list of allowed actions for current case state
   */
  getAllowedActions: function(caseData, caseFolder) {
    const allowed = [];
    const metadata = caseFolder ? HistoryManager.getMetadata(caseFolder) : null;
    
    // Always allowed actions
    allowed.push('NOTE', 'HIS', 'PC', 'VM', 'EM', 'EMR', 'PTP', 'PAY');
    
    // Check bankruptcy flag
    if (caseData.bankruptcyFlag !== 'Y') {
      // Check letter sequence
      if (!metadata?.currentState?.l1_sent) {
        allowed.push('L1');
      } else if (!metadata?.currentState?.l2_sent) {
        allowed.push('L2');
      } else if (!metadata?.currentState?.l3_sent) {
        allowed.push('L3');
      }
      
      // Legal actions
      allowed.push('EX', 'SA', 'SAE');
    }
    
    // Message sequence
    if (!metadata?.currentState?.mtc_open && !metadata?.currentState?.msg_pending_ack) {
      allowed.push('MTC');
    }
    if (metadata?.currentState?.mtc_open) {
      allowed.push('MSG');
    }
    if (metadata?.currentState?.msg_pending_ack) {
      allowed.push('ACK');
    }
    
    return allowed;
  },

  /**
   * Determine what metadata updates are needed for an action
   */
  getMetadataUpdatesForAction: function(actionCode) {
    const updates = {
      'currentState.lastActionCode': actionCode,
      'currentState.lastActionDate': new Date().toISOString()
    };
    
    switch (actionCode) {
      case 'L1':
        updates['currentState.l1_sent'] = new Date().toISOString();
        break;
        
      case 'L2':
        updates['currentState.l2_sent'] = new Date().toISOString();
        break;
        
      case 'L3':
        updates['currentState.l3_sent'] = new Date().toISOString();
        break;
        
      case 'MTC':
        updates['currentState.mtc_open'] = true;
        updates['currentState.msg_pending_ack'] = false;
        break;
        
      case 'MSG':
        updates['currentState.mtc_open'] = false;
        updates['currentState.msg_pending_ack'] = true;
        break;
        
      case 'ACK':
        updates['currentState.mtc_open'] = false;
        updates['currentState.msg_pending_ack'] = false;
        break;
    }
    
    return updates;
  },

  /**
   * Calculate days between two dates
   */
  /**
   * Verify document exists in Drive before accepting metadata date
   */
  verifyDocumentExists: function(caseData, actionCode, caseFolder) {
    if (!caseFolder || !actionCode) return false;
    const docCheck = FolderManager.checkDocumentExists(caseData, actionCode, caseFolder);
    return docCheck.exists;
  },

  daysBetween: function(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    return Math.floor((date2 - date1) / oneDay);
  },

  /**
   * Format a status for display in the UI
   */
  formatStatusForDisplay: function(status) {
    return {
      color: status.color,
      text: status.statusText,
      isOverdue: status.color === COLORS.RED,
      isWarning: status.color === COLORS.YELLOW,
      isMessage: status.priority === 1,
      daysInfo: status.daysOverdue || status.daysUntilDue || null
    };
  }
};
