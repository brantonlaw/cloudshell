// Constants.gs - Clean Configuration for Demo
// Last Updated: Demo Version

// ============= CORE IDS =============
const SPREADSHEET_ID = '147stamgtlVHVAuJjPrvG4PedOcqQqe5kKCB0g8ChYk8';
const SHEET_TAB_NAME = '1';
const MAIN_DRIVE_FOLDER_ID = '1iPhAXMOToFR5bFNjwSo2OxXA_7Ex8Tgv';

// ============= TEMPLATES =============
const TEMPLATES = {
  'L1': '1NXFcGeBYvIfH9UEEMpL0KZhM7grIY1zSMpDjtBSYZs4',  // Your working L1
  'L2': '1NXFcGeBYvIfH9UEEMpL0KZhM7grIY1zSMpDjtBSYZs4',  // Using L1 for demo
  'L3': '1NXFcGeBYvIfH9UEEMpL0KZhM7grIY1zSMpDjtBSYZs4'   // Using L1 for demo
};

// ============= COLUMN MAPPINGS =============
const COLS = {
  ACCOUNT_NUMBER: 0,        // A
  FLEX_LOAN_NUMBER: 1,      // B
  BUSINESS_NAME: 2,         // C
  OWNER_NAME: 3,            // D
  OWNER_REP_TYPE: 4,        // E
  MAILING_ADDRESS: 5,       // F
  PHYSICAL_ADDRESS: 6,      // G
  PHONE_1: 7,               // H
  PHONE_2: 8,               // I
  EMAIL_1: 9,               // J
  EMAIL_2: 10,              // K
  SOCIAL_MEDIA: 11,         // L
  OUTSTANDING_BALANCE: 12,  // M
  MERCHANT_BALANCE: 13,     // N
  PAST_DUE_AMOUNT: 14,      // O
  DELINQUENT_SINCE: 15,     // P
  DAYS_DELINQUENT: 16,      // Q
  OPPOSING_COUNSEL_NAME: 17,    // R
  OPPOSING_COUNSEL_PHONE: 18,   // S
  OPPOSING_COUNSEL_EMAIL: 19,   // T
  OPPOSING_COUNSEL_ADDRESS: 20, // U
  BANKRUPTCY_FLAG: 21,          // V
  PLACEMENT_DATE: 22            // W
};

// ============= ACTION CODES =============
const ACTION_CODES = ['L1', 'L2', 'L3', 'MTC', 'MSG', 'ACK', 'BK', 'CLOSE', 'NOTE'];

// ============= DOCUMENT REQUIRED ACTIONS =============
const DOC_REQUIRED_ACTIONS = ['L1', 'L2', 'L3'];

// ============= STATUS COLORS =============
const COLORS = {
  MTC: '#0000FF',     // Deep blue - message open
  MSG: '#4285F4',     // Light blue - pending
  RED: '#cc0000',     // Overdue
  YELLOW: '#f1c232',  // Warning
  GREEN: '#0d7813',   // On track
  BLACK: '#000000'    // No SLA
};

// ============= SLA RULES =============
const SLA = {
  L1_DEADLINE: 2,   // Days from placement
  L2_DEADLINE: 10,  // Days from L1
  L3_DEADLINE: 10   // Days from L2
};

// ============= FOLDER STRUCTURE =============
const FOLDER_STRUCTURE = {
  SUBFOLDERS: ['demands', 'correspondence', 'filings', 'settlements'],
  METADATA_FILE: 'metadata.json',
  HISTORY_FILE: 'history.json'
};

// ============= MESSAGE STATUS =============
const MESSAGE_ACTIONS = {
  MTC: 'OPEN',
  MSG: 'PENDING_ACK',
  ACK: 'CLOSED'
};