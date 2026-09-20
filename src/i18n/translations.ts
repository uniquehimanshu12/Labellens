import { SupportedLanguage } from '../types';

export interface TranslationDictionary {
  appName: string;
  appSubtitle: string;
  sihTag: string;
  prototypeNotice: string;
  disclaimer: string;
  online: string;
  offline: string;
  offlineWarning: string;
  
  // Navigation
  navDashboard: string;
  navNewInspection: string;
  navActiveInspection: string;
  navReviewQueue: string;
  navInspectionHistory: string;
  navRules: string;
  navSavedFindings: string;
  navReports: string;
  navSettings: string;
  dashboard: string;
  newInspection: string;
  activeInspection: string;
  reviewQueue: string;
  inspectionHistory: string;
  reports: string;
  settings: string;
  
  // Profile
  inspectorProfile: string;
  inspectorRole: string;
  inspectorDept: string;
  inspectorId: string;
  password: string;
  loginButton: string;
  myProfile: string;
  logout: string;
  
  // Dashboard
  goodAfternoon: string;
  goodMorning: string;
  goodEvening: string;
  todaysInspections: string;
  todayInspections: string;
  pendingReview: string;
  potentialIssues: string;
  completed: string;
  recentInspections: string;
  continueActiveInspection: string;
  startNewInspection: string;
  
  // Inspection Steps
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  step5: string;
  step1Desc: string;
  step2Desc: string;
  step3Desc: string;
  step4Desc: string;
  step5Desc: string;
  
  // Statuses
  statusDetected: string;
  statusNotDetected: string;
  statusPotentialIssue: string;
  statusCompleted: string;
  statusPendingReview: string;
  
  // Actions
  actionVerify: string;
  actionEdit: string;
  actionAccept: string;
  actionClear: string;
  actionMarkNotVisible: string;
  actionViewEvidence: string;
  actionSaveDraft: string;
  actionComplete: string;
  actionPrint: string;
  actionCancel: string;
  actionRetry: string;
  actionManualLocation: string;
  
  // Package Sides
  sideFront: string;
  sideBack: string;
  sideLateral: string;
  sideAdditional: string;
  
  // Common Fields
  fieldProductName: string;
  fieldMrp: string;
  fieldNetQty: string;
  fieldManufacturer: string;
  fieldAddress: string;
  fieldDate: string;
  fieldBestBefore: string;
  fieldConsumerCare: string;
  fieldBatchNo: string;
  fieldCountryOfOrigin: string;
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: 'LabelLens',
    appSubtitle: 'Evidence-Based Package Inspection Assistant',
    sihTag: 'Prototype for SIH26034',
    prototypeNotice: 'Prototype verification rules are simplified for demonstration and do not replace official legal verification.',
    disclaimer: 'The system assists inspectors by linking visible declarations to image evidence. Final statutory verification remains with the inspector.',
    online: 'Online',
    offline: 'Offline',
    offlineWarning: 'Offline — changes will be saved on this device.',
    
    navDashboard: 'Dashboard',
    navNewInspection: 'New Inspection',
    navActiveInspection: 'Active Inspection',
    navReviewQueue: 'Review Queue',
    navInspectionHistory: 'Inspection History',
    navRules: 'Rules & References',
    navSavedFindings: 'Saved Findings',
    navReports: 'Inspection Reports',
    navSettings: 'Settings',
    dashboard: 'Dashboard',
    newInspection: 'New Inspection',
    activeInspection: 'Active Inspection',
    reviewQueue: 'Review Queue',
    inspectionHistory: 'Inspection History',
    reports: 'Inspection Reports',
    settings: 'Settings',
    
    inspectorProfile: 'Rahul Sharma',
    inspectorRole: 'Field Inspector',
    inspectorDept: 'Consumer Affairs — Prototype',
    inspectorId: 'Officer ID / Badge',
    password: 'Password',
    loginButton: 'Sign In to Inspection Terminal',
    myProfile: 'My Profile',
    logout: 'Sign Out',
    
    goodAfternoon: 'Good afternoon, Rahul',
    goodMorning: 'Good morning, Rahul',
    goodEvening: 'Good evening, Rahul',
    todaysInspections: "Today's Inspections",
    todayInspections: "Today's Inspections",
    pendingReview: 'Pending Review',
    potentialIssues: 'Potential Issues',
    completed: 'Completed',
    recentInspections: 'Recent Inspections',
    continueActiveInspection: 'Continue Active Inspection',
    startNewInspection: 'Start New Inspection',
    
    step1: 'Inspection Details',
    step2: 'Capture Package',
    step3: 'Extract Declarations',
    step4: 'Verify Findings',
    step5: 'Complete Inspection',
    step1Desc: 'Metadata & Location',
    step2Desc: 'Package Images',
    step3Desc: 'OCR & Declarations',
    step4Desc: 'Rule Checks & Evidence',
    step5Desc: 'Remarks & Report',
    
    statusDetected: 'DETECTED',
    statusNotDetected: 'NOT DETECTED IN SUBMITTED IMAGES',
    statusPotentialIssue: 'POTENTIAL ISSUE — MANUAL VERIFICATION',
    statusCompleted: 'Completed',
    statusPendingReview: 'Pending Review',
    
    actionVerify: 'Verify',
    actionEdit: 'Edit',
    actionAccept: 'Accept',
    actionClear: 'Clear',
    actionMarkNotVisible: 'Mark Not Visible',
    actionViewEvidence: 'View Evidence',
    actionSaveDraft: 'Save Progress',
    actionComplete: 'Complete Inspection',
    actionPrint: 'Download / Print Report',
    actionCancel: 'Cancel',
    actionRetry: 'Retry',
    actionManualLocation: 'Use Manual Location',
    
    sideFront: 'Front Side',
    sideBack: 'Back Side',
    sideLateral: 'Side / Flap',
    sideAdditional: 'Additional Surface',
    
    fieldProductName: 'Product Name',
    fieldMrp: 'Maximum Retail Price (MRP)',
    fieldNetQty: 'Net Quantity',
    fieldManufacturer: 'Manufacturer / Packer',
    fieldAddress: 'Manufacturer Address',
    fieldDate: 'Mfg / Packing Date',
    fieldBestBefore: 'Best Before / Expiry',
    fieldConsumerCare: 'Consumer Care Contact',
    fieldBatchNo: 'Batch / Lot Number',
    fieldCountryOfOrigin: 'Country of Origin',
  },
  
  hi: {
    appName: 'लेबल-लेंस (LabelLens)',
    appSubtitle: 'साक्ष्य-आधारित पैकेज्ड वस्तु निरीक्षण सहायक',
    sihTag: 'SIH26034 प्रोटोटाइप',
    prototypeNotice: 'प्रोटोटाइप सत्यापन नियम केवल प्रदर्शन के लिए हैं और आधिकारिक कानूनी सत्यापन का स्थान नहीं लेते हैं।',
    disclaimer: 'यह प्रणाली दृश्य घोषणाओं को छवि साक्ष्य से जोड़कर निरीक्षकों की सहायता करती है। अंतिम निर्णय निरीक्षक का है।',
    online: 'ऑनलाइन',
    offline: 'ऑफ़लाइन',
    offlineWarning: 'ऑफ़लाइन — परिवर्तन इस डिवाइस पर सहेजे जाएंगे।',
    
    navDashboard: 'डैशबोर्ड',
    navNewInspection: 'नई जाँच',
    navActiveInspection: 'सक्रिय जाँच',
    navReviewQueue: 'समीक्षा कतार',
    navInspectionHistory: 'जाँच इतिहास',
    navRules: 'नियम और संदर्भ',
    navSavedFindings: 'सहेजे गए निष्कर्ष',
    navReports: 'निरीक्षण रिपोर्ट',
    navSettings: 'सेटिंग्स',
    dashboard: 'डैशबोर्ड',
    newInspection: 'नई जाँच',
    activeInspection: 'सक्रिय जाँच',
    reviewQueue: 'समीक्षा कतार',
    inspectionHistory: 'जाँच इतिहास',
    reports: 'निरीक्षण रिपोर्ट',
    settings: 'सेटिंग्स',
    
    inspectorProfile: 'राहुल शर्मा',
    inspectorRole: 'क्षेत्र निरीक्षक',
    inspectorDept: 'उपभोक्ता मामले — प्रोटोटाइप',
    inspectorId: 'अधिकारी आईडी',
    password: 'पासवर्ड',
    loginButton: 'टर्मिनल में साइन इन करें',
    myProfile: 'मेरी प्रोफ़ाइल',
    logout: 'लॉग आउट',
    
    goodAfternoon: 'शुभ दोपहर, राहुल',
    goodMorning: 'शुभ प्रभात, राहुल',
    goodEvening: 'शुभ संध्या, राहुल',
    todaysInspections: 'आज के निरीक्षण',
    todayInspections: 'आज के निरीक्षण',
    pendingReview: 'लंबित समीक्षा',
    potentialIssues: 'संभावित समस्याएं',
    completed: 'पूर्ण',
    recentInspections: 'हाल के निरीक्षण',
    continueActiveInspection: 'सक्रिय निरीक्षण जारी रखें',
    startNewInspection: 'नया निरीक्षण शुरू करें',
    
    step1: 'जाँच विवरण',
    step2: 'पैकेज कैप्चर',
    step3: 'घोषणा निष्कर्षण',
    step4: 'निष्कर्ष सत्यापन',
    step5: 'जाँच पूर्ण करें',
    step1Desc: 'मेटाडेटा और स्थान',
    step2Desc: 'पैकेज छवियां',
    step3Desc: 'ओसीआर और घोषणाएं',
    step4Desc: 'नियम जांच और साक्ष्य',
    step5Desc: 'टिप्पणी और रिपोर्ट',
    
    statusDetected: 'पहचाना गया (DETECTED)',
    statusNotDetected: 'छवियों में नहीं मिला (NOT DETECTED)',
    statusPotentialIssue: 'संभावित समस्या — मैनुअल सत्यापन',
    statusCompleted: 'पूर्ण (Completed)',
    statusPendingReview: 'समीक्षा लंबित',
    
    actionVerify: 'सत्यापित करें',
    actionEdit: 'संपादित करें',
    actionAccept: 'स्वीकार करें',
    actionClear: 'हटाएं',
    actionMarkNotVisible: 'दृश्यमान नहीं चिह्नित करें',
    actionViewEvidence: 'साक्ष्य देखें',
    actionSaveDraft: 'प्रगति सहेजें',
    actionComplete: 'निरीक्षण पूर्ण करें',
    actionPrint: 'रिपोर्ट प्रिंट / डाउनलोड करें',
    actionCancel: 'रद्द करें',
    actionRetry: 'पुनः प्रयास करें',
    actionManualLocation: 'मैन्युअल स्थान दर्ज करें',
    
    sideFront: 'सामने का हिस्सा',
    sideBack: 'पीछे का हिस्सा',
    sideLateral: 'किनारा / फ्लैप',
    sideAdditional: 'अतिरिक्त सतह',
    
    fieldProductName: 'उत्पाद का नाम',
    fieldMrp: 'अधिकतम खुदरा मूल्य (MRP)',
    fieldNetQty: 'शुद्ध मात्रा (Net Quantity)',
    fieldManufacturer: 'निर्माता / पैकर',
    fieldAddress: 'निर्माता का पता',
    fieldDate: 'निर्माण / पैकिंग तिथि',
    fieldBestBefore: 'उपयोग की अंतिम तिथि',
    fieldConsumerCare: 'उपभोक्ता हेल्पलाइन',
    fieldBatchNo: 'बैच / लॉट संख्या',
    fieldCountryOfOrigin: 'मूल देश',
  },
  
  pa: {
    appName: 'ਲੇਬਲ-ਲੈਂਸ (LabelLens)',
    appSubtitle: 'ਸਬੂਤ-ਅਧਾਰਿਤ ਪੈਕੇਜ ਜਾਂਚ ਸਹਾਇਕ',
    sihTag: 'SIH26034 ਪ੍ਰੋਟੋਟਾਈਪ',
    prototypeNotice: 'ਪ੍ਰੋਟੋਟਾਈਪ ਤਸਦੀਕ ਨਿਯਮ ਪ੍ਰਦਰਸ਼ਨ ਲਈ ਸਰਲ ਹਨ ਅਤੇ ਅਧਿਕਾਰਤ ਕਾਨੂੰਨੀ ਤਸਦੀਕ ਦਾ ਬਦਲ ਨਹੀਂ ਹਨ।',
    disclaimer: 'ਇਹ ਪ੍ਰਣਾਲੀ ਘੋਸ਼ਣਾਵਾਂ ਨੂੰ ਤਸਵੀਰ ਸਬੂਤਾਂ ਨਾਲ ਜੋੜ ਕੇ ਸਹਾਇਤਾ ਕਰਦੀ ਹੈ। ਅੰਤਮ ਜਾਂਚ ਇੰਸਪੈਕਟਰ ਦੇ ਅਧਿਕਾਰ ਵਿਚ ਹੈ।',
    online: 'ਆਨਲਾਈਨ',
    offline: 'ਆਫਲਾਈਨ',
    offlineWarning: 'ਆਫਲਾਈਨ — ਬਦਲਾਅ ਇਸ ਡਿਵਾਈਸ ਉੱਤੇ ਸੰਭਾਲੇ ਜਾਣਗੇ।',
    
    navDashboard: 'ਡੈਸ਼ਬੋਰਡ',
    navNewInspection: 'ਨਵੀਂ ਜਾਂਚ',
    navActiveInspection: 'ਸਰਗਰਮ ਜਾਂਚ',
    navReviewQueue: 'ਸਮੀਖਿਆ ਕਤਾਰ',
    navInspectionHistory: 'ਜਾਂਚ ਇਤਿਹਾਸ',
    navRules: 'ਨਿਯਮ ਅਤੇ ਹਵਾਲੇ',
    navSavedFindings: 'ਸੰਭਾਲੇ ਗਏ ਸਿੱਟੇ',
    navReports: 'ਜਾਂਚ ਰਿਪੋਰਟਾਂ',
    navSettings: 'ਸੈਟਿੰਗਾਂ',
    dashboard: 'ਡੈਸ਼ਬੋਰਡ',
    newInspection: 'ਨਵੀਂ ਜਾਂਚ',
    activeInspection: 'ਸਰਗਰਮ ਜਾਂਚ',
    reviewQueue: 'ਸਮੀਖਿਆ ਕਤਾਰ',
    inspectionHistory: 'ਜਾਂਚ ਇਤਿਹਾਸ',
    reports: 'ਜਾਂਚ ਰਿਪੋਰਟਾਂ',
    settings: 'ਸੈਟਿੰਗਾਂ',
    
    inspectorProfile: 'ਰਾਹੁਲ ਸ਼ਰਮਾ',
    inspectorRole: 'ਫੀਲਡ ਇੰਸਪੈਕਟਰ',
    inspectorDept: 'ਖਪਤਕਾਰ ਮਾਮਲੇ — ਪ੍ਰੋਟੋਟਾਈਪ',
    inspectorId: 'ਅਧਿਕਾਰੀ ਆਈ.ਡੀ',
    password: 'ਪਾਸਵਰਡ',
    loginButton: 'ਸਾਈਨ ਇਨ ਕਰੋ',
    myProfile: 'ਮੇਰੀ ਪ੍ਰੋਫਾਈਲ',
    logout: 'ਸਾਈਨ ਆਉਟ',
    
    goodAfternoon: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਰਾਹੁਲ',
    goodMorning: 'ਸ਼ੁਭ ਸਵੇਰ, ਰਾਹੁਲ',
    goodEvening: 'ਸ਼ੁਭ ਸੰਝ, ਰਾਹੁਲ',
    todaysInspections: 'ਅੱਜ ਦੀਆਂ ਜਾਂਚਾਂ',
    todayInspections: 'ਅੱਜ ਦੀਆਂ ਜਾਂਚਾਂ',
    pendingReview: 'ਬਕਾਇਆ ਸਮੀਖਿਆ',
    potentialIssues: 'ਸੰਭਾਵਿਤ ਸਮੱਸਿਆਵਾਂ',
    completed: 'ਮੁਕੰਮਲ',
    recentInspections: 'ਹਾਲੀਆ ਜਾਂਚਾਂ',
    continueActiveInspection: 'ਸਰਗਰਮ ਜਾਂਚ ਜਾਰੀ ਰੱਖੋ',
    startNewInspection: 'ਨਵੀਂ ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ',
    
    step1: 'ਜਾਂਚ ਵੇਰਵੇ',
    step2: 'ਪੈਕੇਜ ਕੈਪਚਰ',
    step3: 'ਘੋਸ਼ਣਾਵਾਂ ਕੱਢਣਾ',
    step4: 'ਸਿੱਟੇ ਤਸਦੀਕ ਕਰਨਾ',
    step5: 'ਜਾਂਚ ਮੁਕੰਮਲ',
    step1Desc: 'ਮੈਟਾਡੇਟਾ ਅਤੇ ਸਥਾਨ',
    step2Desc: 'ਪੈਕੇਜ ਤਸਵੀਰਾਂ',
    step3Desc: 'ਓਸੀਆਰ ਘੋਸ਼ਣਾਵਾਂ',
    step4Desc: 'ਨਿਯਮ ਜਾਂਚ ਅਤੇ ਸਬੂਤ',
    step5Desc: 'ਟਿੱਪਣੀ ਅਤੇ ਰਿਪੋਰਟ',
    
    statusDetected: 'ਲੱਭਿਆ ਗਿਆ (DETECTED)',
    statusNotDetected: 'ਤਸਵੀਰਾਂ ਵਿੱਚ ਨਹੀਂ ਮਿਲਿਆ',
    statusPotentialIssue: 'ਸੰਭਾਵਿਤ ਮੁੱਦਾ — ਮੈਨੂਅਲ ਜਾਂਚ',
    statusCompleted: 'ਮੁਕੰਮਲ',
    statusPendingReview: 'ਸਮੀਖਿਆ ਬਕਾਇਆ',
    
    actionVerify: 'ਤਸਦੀਕ ਕਰੋ',
    actionEdit: 'ਸੋਧੋ',
    actionAccept: 'ਸਵੀਕਾਰ ਕਰੋ',
    actionClear: 'ਹਟਾਓ',
    actionMarkNotVisible: 'ਨਾ-ਦਿਖਣਯੋਗ ਮਾਰਕ ਕਰੋ',
    actionViewEvidence: 'ਸਬੂਤ ਦੇਖੋ',
    actionSaveDraft: 'ਤਰੱਕੀ ਸੰਭਾਲੋ',
    actionComplete: 'ਜਾਂਚ ਪੂਰੀ ਕਰੋ',
    actionPrint: 'ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ / ਪ੍ਰਿੰਟ ਕਰੋ',
    actionCancel: 'ਰੱਦ ਕਰੋ',
    actionRetry: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ',
    actionManualLocation: 'ਮੈਨੂਅਲ ਸਥਾਨ ਦਰਜ ਕਰੋ',
    
    sideFront: 'ਸਾਹਮਣਾ ਪਾਸਾ',
    sideBack: 'ਪਿਛਲਾ ਪਾਸਾ',
    sideLateral: 'ਕੰਢਾ / ਫਲੈਪ',
    sideAdditional: 'ਵਾਧੂ ਸਤ੍ਹਾ',
    
    fieldProductName: 'ਉਤਪਾਦ ਦਾ ਨਾਮ',
    fieldMrp: 'ਵੱਧ ਤੋਂ ਵੱਧ ਪ੍ਰਚੂਨ ਮੁੱਲ (MRP)',
    fieldNetQty: 'ਸ਼ੁੱਧ ਮਾਤਰਾ (Net Quantity)',
    fieldManufacturer: 'ਨਿਰਮਾਤਾ / ਪੈਕਰ',
    fieldAddress: 'ਨਿਰਮਾਤਾ ਦਾ ਪਤਾ',
    fieldDate: 'ਨਿਰਮਾਣ / ਪੈਕਿੰਗ ਮਿਤੀ',
    fieldBestBefore: 'ਵਰਤੋਂ ਦੀ ਆਖਰੀ ਮਿਤੀ',
    fieldConsumerCare: 'ਖਪਤਕਾਰ ਹੈਲਪਲਾਈਨ',
    fieldBatchNo: 'ਬੈਚ / ਲਾਟ ਨੰਬਰ',
    fieldCountryOfOrigin: 'ਮੂਲ ਦੇਸ਼',
  }
};
