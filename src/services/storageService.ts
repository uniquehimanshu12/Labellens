import { InspectionRecord, AppSettings, DashboardMetrics } from '../types';
import { INITIAL_DEMO_INSPECTIONS } from '../data/demoData';

const STORAGE_KEYS = {
  INSPECTIONS_INDEX: 'labellens_v6_inspection_index',
  INSPECTION_PREFIX: 'labellens_v6_inspection:',
  ACTIVE_DRAFT: 'labellens_v6_active_draft',
  SETTINGS: 'labellens_v6_settings',
  AUTH: 'labellens_v6_auth',
};

// Purge legacy storage namespaces to avoid stale or polluted data
export function purgeLegacyStorage(): void {
  try {
    const legacyKeys = [
      'labellens:inspection_index',
      'labellens_inspections_v1',
      'labellens_active_draft_v1',
      'labellens_settings_v1',
      'labellens_auth_v1',
      'labellens_inspections_v2',
      'labellens_inspections_v3',
      'labellens_inspections_v4',
      'labellens_inspections_v5',
    ];
    for (const key of legacyKeys) {
      localStorage.removeItem(key);
    }
    // Purge any key starting with old prefix
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('labellens:inspection:')) {
        localStorage.removeItem(k);
      }
    }
  } catch (err) {
    console.warn('Storage purge non-critical error:', err);
  }
}

// Automatically invoke purge on startup
if (typeof window !== 'undefined') {
  purgeLegacyStorage();
}

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'light',
  enableAutoLocation: true,
  showCoordinates: true,
  ocrMode: 'live',
  autoSaveDrafts: true,
  requiredImageSides: ['front', 'back', 'side'],
};

export function createFreshInspection(customId?: string): InspectionRecord {
  const year = new Date().getFullYear();
  const randomSuffix = String(Math.floor(10000 + Math.random() * 90000));
  const id = customId || `LL-${year}-${randomSuffix}`;
  const now = new Date().toISOString();

  return {
    id,
    productName: '',
    inspector: {
      id: 'INS-1042',
      name: 'R. Sharma',
      role: 'Legal Metrology Inspector',
      officerId: 'LM-DEL-2024-089',
      jurisdiction: 'Zone 4, New Delhi',
      department: 'Department of Legal Metrology',
    },
    createdAt: now,
    updatedAt: now,
    location: {
      placeName: 'Central Delhi, Delhi',
      marketName: 'Selected Market / Retail Point',
      district: 'Central Delhi',
      state: 'Delhi',
      latitude: 28.6139,
      longitude: 77.209,
      accuracy: 15,
      timestamp: now,
      locationSource: 'Manual',
    },
    images: {
      front: null,
      back: null,
      side: null,
      additional: null,
    },
    imageRecords: {
      front: null,
      back: null,
      side: null,
      additional: null,
    },
    debugInfo: null,
    extractedFields: {},
    detectedTexts: [],
    scanSummary: {
      totalTextsFound: 0,
      fieldsIdentified: 0,
      manualVerificationNeeded: 0,
      notDetected: 0,
    },
    findings: [],
    remarks: '',
    status: 'Pending Review',
    step: 1,
    activityLog: [
      {
        id: `act_${Date.now()}`,
        timestamp: now,
        action: 'INSPECTION_CREATED',
        description: `New fresh inspection session initialized [${id}]`,
        officer: 'R. Sharma',
      },
    ],
  };
}

export const storageService = {
  getInspections(): InspectionRecord[] {
    try {
      const indexData = localStorage.getItem(STORAGE_KEYS.INSPECTIONS_INDEX);
      if (!indexData) {
        return [];
      }
      const ids: string[] = JSON.parse(indexData);
      const records: InspectionRecord[] = [];
      for (const id of ids) {
        const itemData = localStorage.getItem(`${STORAGE_KEYS.INSPECTION_PREFIX}${id}`);
        if (itemData) {
          try {
            records.push(JSON.parse(itemData));
          } catch (e) {
            console.warn(`Failed to parse inspection ${id}:`, e);
          }
        }
      }
      return records;
    } catch (e) {
      console.error('Error reading inspections from localStorage:', e);
      return [];
    }
  },

  getInspectionById(id: string): InspectionRecord | undefined {
    try {
      const itemData = localStorage.getItem(`${STORAGE_KEYS.INSPECTION_PREFIX}${id}`);
      if (itemData) {
        return JSON.parse(itemData);
      }
      const inspections = this.getInspections();
      return inspections.find((item) => item.id.toLowerCase() === id.toLowerCase());
    } catch (e) {
      console.error(`Error loading inspection ${id}:`, e);
      return undefined;
    }
  },

  saveInspection(record: InspectionRecord): void {
    try {
      record.updatedAt = new Date().toISOString();
      localStorage.setItem(`${STORAGE_KEYS.INSPECTION_PREFIX}${record.id}`, JSON.stringify(record));

      let ids: string[] = [];
      const indexData = localStorage.getItem(STORAGE_KEYS.INSPECTIONS_INDEX);
      if (indexData) {
        try {
          ids = JSON.parse(indexData);
        } catch {}
      }
      if (!ids.includes(record.id)) {
        ids.unshift(record.id);
        localStorage.setItem(STORAGE_KEYS.INSPECTIONS_INDEX, JSON.stringify(ids));
      }
    } catch (e) {
      console.error('Error saving inspection:', e);
    }
  },

  deleteInspection(id: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.INSPECTION_PREFIX}${id}`);
      const indexData = localStorage.getItem(STORAGE_KEYS.INSPECTIONS_INDEX);
      if (indexData) {
        const ids: string[] = JSON.parse(indexData);
        const updatedIds = ids.filter((item) => item !== id);
        localStorage.setItem(STORAGE_KEYS.INSPECTIONS_INDEX, JSON.stringify(updatedIds));
      }
    } catch (e) {
      console.error('Error deleting inspection:', e);
    }
  },

  getActiveDraft(): InspectionRecord | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error loading active draft:', e);
      return null;
    }
  },

  saveActiveDraft(draft: InspectionRecord): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT, JSON.stringify(draft));
    } catch (e) {
      console.error('Error saving draft:', e);
    }
  },

  clearActiveDraft(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT);
    } catch (e) {
      console.error('Error clearing draft:', e);
    }
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error saving settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  getDashboardMetrics(): DashboardMetrics {
    const inspections = this.getInspections();
    const todayStr = new Date().toISOString().split('T')[0];

    let todayCount = 0;
    let pendingReviewCount = 0;
    let potentialIssuesCount = 0;
    let completedCount = 0;

    inspections.forEach((item) => {
      if (item.createdAt.startsWith(todayStr)) {
        todayCount++;
      }
      if (item.status === 'Pending Review') {
        pendingReviewCount++;
      } else if (item.status === 'Potential Issue — Manual Verification') {
        potentialIssuesCount++;
      } else if (item.status === 'Completed') {
        completedCount++;
      }
    });

    return {
      todayCount,
      pendingReviewCount,
      potentialIssuesCount,
      completedCount,
    };
  },

  resetDemoData(): void {
    this.clearAllData();
    INITIAL_DEMO_INSPECTIONS.forEach((rec: InspectionRecord) => {
      this.saveInspection(rec);
    });
  },

  clearAllData(): void {
    try {
      const indexData = localStorage.getItem(STORAGE_KEYS.INSPECTIONS_INDEX);
      if (indexData) {
        const ids: string[] = JSON.parse(indexData);
        for (const id of ids) {
          localStorage.removeItem(`${STORAGE_KEYS.INSPECTION_PREFIX}${id}`);
        }
      }
      localStorage.removeItem(STORAGE_KEYS.INSPECTIONS_INDEX);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT);
    } catch (e) {
      console.error('Error clearing data:', e);
    }
  },
};
