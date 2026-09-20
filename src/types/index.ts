/**
 * Core Data Models for LabelLens (SIH26034)
 * Evidence-Based Packaged Commodity Inspection Tool
 */

export type ConfidenceState =
  | 'HIGH CONFIDENCE'
  | 'MEDIUM CONFIDENCE'
  | 'LOW CONFIDENCE'
  | 'NOT DETECTED'
  | 'VERIFIED BY INSPECTOR'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT DETECTED';

export type FieldStatus =
  | 'DETECTED'
  | 'NOT_DETECTED'
  | 'LOW_CONFIDENCE'
  | 'NEEDS_MANUAL_VERIFICATION'
  | 'VERIFIED_BY_INSPECTOR';

export interface OcrToken {
  id: string;
  text: string;
  confidence: number; // 0 to 1
  bbox: {
    x: number; // original image pixel coordinate
    y: number;
    width: number;
    height: number;
  };
  imageId: string;
}

export interface ImagePixelDimensions {
  imageId: string;
  side: ImageSide;
  width: number;
  height: number;
  dataUrl?: string;
}

export interface EvidenceBox {
  x: number; // original image pixel coordinate or normalized
  y: number;
  width: number;
  height: number;
  originalWidth?: number;
  originalHeight?: number;
  imageId: string;
  sourceSide: 'Front' | 'Back' | 'Side' | 'Additional';
  sourceTokenIds: string[];
  tokenIds?: string[];
  tokens?: Array<{
    id: string;
    text: string;
    bbox: { x: number; y: number; width: number; height: number };
    confidence?: number;
  }>;
}

export interface EvidenceRegion {
  id: string;
  sourceImageId: string;
  sourceSide: 'Front' | 'Back' | 'Side' | 'Additional';
  x: number; // normalized 0..1 or pixel relative
  y: number;
  width: number;
  height: number;
  pixelBbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  snippet?: string;
  confidence?: ConfidenceLevel;
}

export interface DetectedText {
  id: string;
  text: string;
  sourceImageId: string;
  sourceSide: 'Front' | 'Back' | 'Side' | 'Additional';
  x: number;
  y: number;
  width: number;
  height: number;
  pixelBbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type OverallInspectionStatus =
  | 'DRAFT'
  | 'IN PROGRESS'
  | 'READY FOR REVIEW'
  | 'REQUIRES MANUAL VERIFICATION'
  | 'COMPLETED'
  // Legacy aliases for backward compatibility
  | 'Completed'
  | 'Potential Issue — Manual Verification'
  | 'Pending Review'
  | 'In Progress';

export type InspectionStatus =
  | 'DETECTED'
  | 'NOT DETECTED IN SUBMITTED IMAGES'
  | 'POTENTIAL ISSUE — MANUAL VERIFICATION';

export type ImageSide = 'front' | 'back' | 'side' | 'additional';

export type ImageQualityState =
  | 'Good image quality'
  | 'Readable'
  | 'Low lighting'
  | 'Possible blur'
  | 'Too small'
  | 'Text may be partially hidden';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null; // in meters
  placeName: string;
  marketName?: string;
  district?: string;
  state?: string;
  timestamp: string;
  locationSource: 'GPS' | 'Manual' | 'Unavailable';
}

export interface Inspector {
  id: string;
  name: string;
  role: string;
  department: string;
  officerId?: string;
  jurisdiction?: string;
  avatar?: string;
}

export interface UploadedImageRecord {
  id?: string;
  imageId: string; // e.g. "front_1726689000123"
  side: ImageSide;
  fileName: string;
  mimeType?: string;
  width?: number;
  height?: number;
  originalWidth?: number;
  originalHeight?: number;
  size?: number;
  previewUrl?: string;
  dataUrl: string;
  capturedAt?: string;
  uploadedAt?: string;
}

export interface RawAnalysisDebugInfo {
  inspectionId: string;
  imageId: string;
  fileName: string;
  width: number;
  height: number;
  modelUsed: string;
  extractionMode: 'LIVE AI ANALYSIS' | 'DEMO MODE';
  timestamp: string;
  rawResponse: string;
  parsedResult: any;
  evidenceItems: Array<{
    field: string;
    value: string | null;
    imageId: string;
    boundingBox: [number, number, number, number] | null;
    pixelBox?: { x: number; y: number; width: number; height: number };
  }>;
}

export interface PackageImages {
  front: string | null;
  back: string | null;
  side: string | null;
  additional: string | null;
}

export interface ImageQualityWarning {
  qualityState: ImageQualityState;
  blurDetected?: boolean;
  lowLighting?: boolean;
  angleSteep?: boolean;
  textDifficultToRead?: boolean;
  notes?: string;
}

export interface ExtractedField {
  key: string;
  label: string;
  extractedValue: string;
  verifiedValue: string;
  sourceImage: 'Front' | 'Back' | 'Side' | 'Additional' | 'Not Visible';
  sourceImageId?: string;
  confidenceState?: ConfidenceState;
  confidenceLevel?: ConfidenceLevel;
  confidence?: number; // Optional numeric score for backend/demo mapping
  status?: FieldStatus;
  evidence?: EvidenceRegion[];
  evidenceBox?: EvidenceBox | null;
  evidenceTokenIds?: string[];
  ocrTokens?: OcrToken[];
  selectedEvidenceIndex?: number;
  sourceTextIds?: string[];
  sourceTokenIds?: string[];
  isManuallyVerified: boolean;
  isNotVisible: boolean;
  evidenceSnippet?: string;
  locationDescription?: string;
  audit?: {
    originalValue: string;
    originalExtractedValue?: string | null;
    verifiedValue: string;
    changedBy: string;
    timestamp: string;
    actionType?: 'edit' | 'accept' | 'clear' | 'mark_not_visible';
  };
}

export interface RuleDefinition {
  id: string;
  code: string; // e.g. "LM-001"
  name: string;
  requirement: string;
  legalReference: string;
  category: string;
  criticality: 'Mandatory' | 'Conditional';
  lookFor: string;
  evidenceRequired: string;
  prototypeStatus: string;
  officialReference: string;
  prototypeInterpretation: string;
}

export interface RuleReference {
  id: string;
  title: string;
  source: string;
  description: string;
  officialSection: string;
  prototypeInterpretation: string;
  externalUrl?: string;
}

export interface RuleFinding {
  ruleId: string;
  ruleCode: string;
  requirement: string;
  observedEvidence: string;
  status: InspectionStatus;
  evidenceImage: 'Front' | 'Back' | 'Side' | 'Additional' | 'None';
  extractedValue: string;
  inspectorValue?: string;
  confidenceState?: ConfidenceState;
  confidence?: number;
  notes?: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  timeFormatted?: string;
  action: string;
  actor?: string;
  officer?: string;
  details?: string;
  description?: string;
}

export interface InspectorSignature {
  signatureDataUrl: string;
  signedAt: string;
  officerName: string;
  officerId: string;
}

export interface ManualCorrectionItem {
  fieldKey: string;
  fieldLabel: string;
  originalValue: string;
  verifiedValue: string;
  changedBy: string;
  timestamp: string;
}

export interface OtherDetectedInfo {
  title: string;
  content: string;
  sourceImage: 'Front' | 'Back' | 'Side' | 'Additional' | 'Not Visible';
}

export interface InspectionRecord {
  id: string; // e.g. "LL-2026-00143"
  inspectionId?: string; // Canonical alias
  productName: string;
  barcode?: string;
  inspector: Inspector;
  createdAt: string;
  updatedAt: string;
  location: LocationData;
  images: PackageImages;
  imageRecords?: Record<ImageSide, UploadedImageRecord | null>;
  debugInfo?: RawAnalysisDebugInfo | null;
  imageMetadata?: Record<string, { id: string; side: ImageSide; previewUrl: string; width?: number; height?: number }>;
  qualityWarnings?: Record<ImageSide, ImageQualityWarning>;
  extractedFields: Record<string, ExtractedField>;
  packageInformation?: Record<string, any>;
  detectedTexts?: DetectedText[];
  allDetectedText?: Record<'Front' | 'Back' | 'Side' | 'Additional', string[]>;
  otherDetectedInfo?: OtherDetectedInfo[];
  manualCorrections?: ManualCorrectionItem[];
  scanSummary?: {
    totalTextsFound: number;
    fieldsIdentified: number;
    manualVerificationNeeded: number;
    notDetected: number;
  };
  findings: RuleFinding[];
  remarks: string;
  status: OverallInspectionStatus;
  signature?: InspectorSignature;
  activityLog: ActivityLogItem[];
  step: number; // 1 to 5 (PREPARE, CAPTURE, SCAN, VERIFY, COMPLETE)
}

export interface DashboardMetrics {
  todayCount: number;
  pendingReviewCount: number;
  potentialIssuesCount: number;
  completedCount: number;
}

export type SupportedLanguage = 'en' | 'hi' | 'pa';

export interface AppSettings {
  language: SupportedLanguage;
  theme: 'light' | 'dark';
  enableAutoLocation: boolean;
  showCoordinates: boolean;
  ocrMode: 'demo' | 'ai' | 'live';
  autoSaveDrafts: boolean;
  requiredImageSides: ImageSide[];
}
