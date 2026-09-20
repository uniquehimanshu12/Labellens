import { InspectionRecord, Inspector } from '../types';

export const CURRENT_INSPECTOR: Inspector = {
  id: 'INS-1042',
  name: 'Rahul Sharma',
  role: 'Field Inspector',
  department: 'Consumer Affairs — Prototype',
};

// Generates an SVG data URL representing a realistic field package surface
function createSamplePackageSvg(title: string, side: string, contentLines: string[], bgColor: string = '#f8fafc', accentColor: string = '#1e3a8a'): string {
  const linesSvg = contentLines.map((line, idx) => 
    `<text x="28" y="${120 + idx * 26}" font-family="Public Sans, sans-serif" font-size="14" font-weight="${idx === 0 ? '700' : '500'}" fill="#334155">${line}</text>`
  ).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480" width="600" height="480">
    <rect width="600" height="480" fill="${bgColor}" rx="12"/>
    <rect x="16" y="16" width="568" height="448" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" rx="8"/>
    <!-- Header banner -->
    <rect x="16" y="16" width="568" height="60" fill="${accentColor}" rx="8"/>
    <text x="32" y="52" font-family="Public Sans, sans-serif" font-size="20" font-weight="700" fill="#ffffff">${title.toUpperCase()}</text>
    <rect x="460" y="28" width="108" height="34" fill="#ffffff" rx="4"/>
    <text x="514" y="50" font-family="Public Sans, sans-serif" font-size="12" font-weight="700" fill="${accentColor}" text-anchor="middle">${side.toUpperCase()} VIEW</text>

    <!-- Barcode simulation if back -->
    ${side.toLowerCase() === 'back' ? `
      <g transform="translate(420, 320)">
        <rect width="130" height="80" fill="#ffffff" stroke="#e2e8f0" rx="4"/>
        <line x1="15" y1="10" x2="15" y2="60" stroke="#0f172a" stroke-width="3"/>
        <line x1="22" y1="10" x2="22" y2="60" stroke="#0f172a" stroke-width="1.5"/>
        <line x1="28" y1="10" x2="28" y2="60" stroke="#0f172a" stroke-width="4"/>
        <line x1="36" y1="10" x2="36" y2="60" stroke="#0f172a" stroke-width="2"/>
        <line x1="44" y1="10" x2="44" y2="60" stroke="#0f172a" stroke-width="5"/>
        <line x1="56" y1="10" x2="56" y2="60" stroke="#0f172a" stroke-width="2"/>
        <line x1="64" y1="10" x2="64" y2="60" stroke="#0f172a" stroke-width="3.5"/>
        <line x1="74" y1="10" x2="74" y2="60" stroke="#0f172a" stroke-width="1.5"/>
        <line x1="84" y1="10" x2="84" y2="60" stroke="#0f172a" stroke-width="4"/>
        <line x1="94" y1="10" x2="94" y2="60" stroke="#0f172a" stroke-width="2"/>
        <line x1="106" y1="10" x2="106" y2="60" stroke="#0f172a" stroke-width="3"/>
        <text x="65" y="74" font-family="monospace" font-size="10" fill="#334155" text-anchor="middle">8 901234 567890</text>
      </g>
    ` : ''}

    <!-- Content fields -->
    <g transform="translate(10, 0)">
      ${linesSvg}
    </g>

    <!-- Official Stamp / Inspection boundary marker -->
    <rect x="28" y="420" width="544" height="24" fill="#f1f5f9" rx="4"/>
    <text x="36" y="436" font-family="Public Sans, sans-serif" font-size="11" font-weight="600" fill="#64748b">STATUTORY METROLOGY INSPECTION EVIDENCE — SIH26034 PROTOCOL</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_PACKAGES = {
  biscuits: {
    name: 'ABC Cream Biscuits 100g',
    barcode: '8901030948201',
    images: {
      front: createSamplePackageSvg('ABC Cream Biscuits', 'Front', [
        'ABC PREMIUM CREAM BISCUITS',
        'Rich Vanilla Creme Filled Crispy Biscuits',
        'Net Quantity: 100 g',
        'MRP ₹50.00 (Incl. of all taxes)',
        'Unit Sale Price: ₹0.50 per g',
        '100% Vegetarian — Green Dot Mark',
        'FSSAI Lic. No. 10014022003189'
      ], '#f0fdf4', '#166534'),
      back: createSamplePackageSvg('ABC Cream Biscuits', 'Back', [
        'MANUFACTURED & PACKED BY:',
        'ABC Foods Pvt. Ltd., Plot No. 42-B,',
        'Sector 18 Industrial Area, Gurugram, Haryana - 122015',
        'Consumer Care Cell:',
        'Toll Free: 1800-200-4567 | care@abcfoods.in',
        'Grievance Officer: Sameer Verma (Gurugram HQ)',
        'Country of Origin: India',
        'Storage: Store in a cool, hygienic and dry place'
      ], '#f8fafc', '#1e3a8a'),
      side: createSamplePackageSvg('ABC Cream Biscuits', 'Side', [
        'STATUTORY DATES & BATCH DETAILS',
        'Batch / Lot No: B-8429X',
        'Mfg. Date: 12/08/2026',
        'Best Before: 6 MONTHS FROM PACKAGING',
        'Package Material: 100% Recyclable BOPP film',
        'Thickness > 50 microns compliant'
      ], '#fefce8', '#854d0e'),
      additional: null
    }
  },
  milk: {
    name: 'FreshMilk 1L UHT Homogenized',
    barcode: '8902040182934',
    images: {
      front: createSamplePackageSvg('FreshMilk 1L', 'Front', [
        'FRESHMILK STANDARDIZED UHT MILK',
        'Fortified with Vitamin A & D',
        'Net Content: 1 L (1000 ml)',
        'MRP ₹68.00 (Incl. of all taxes)',
        'FSSAI Lic No: 10012011000213'
      ], '#eff6ff', '#1d4ed8'),
      back: createSamplePackageSvg('FreshMilk 1L', 'Back', [
        'PROCESSED AND PACKED BY:',
        'Haryana Dairy Cooperative Union Ltd.',
        'Milk Chilling Centre, Manesar Industrial Estate, Gurugram - 122051',
        'Customer Care: 1800-180-2222 | customercare@freshmilk.coop',
        'Country of Origin: India'
      ], '#f8fafc', '#1e3a8a'),
      side: createSamplePackageSvg('FreshMilk 1L', 'Side', [
        'LOT & EXPIRY CODING:',
        'Batch No: M-912',
        'Date of Packaging: 15/09/2026',
        'Use By: 15/12/2026',
        'Keep refrigerated after opening'
      ], '#f8fafc', '#475569'),
      additional: null
    }
  }
};

function createDemoFieldEvidence(
  key: string,
  side: 'Front' | 'Back' | 'Side' | 'Additional',
  imageId: string,
  pixelX: number,
  pixelY: number,
  pixelW: number,
  pixelH: number,
  snippet: string
) {
  const origW = 600;
  const origH = 480;
  const tokenId = `tok_${side.toLowerCase()}_${key}_01`;
  return {
    sourceImageId: imageId,
    evidenceTokenIds: [tokenId],
    evidenceBox: {
      x: pixelX,
      y: pixelY,
      width: pixelW,
      height: pixelH,
      originalWidth: origW,
      originalHeight: origH,
      imageId,
      sourceSide: side,
      sourceTokenIds: [tokenId],
      tokenIds: [tokenId],
      tokens: [
        {
          id: tokenId,
          text: snippet,
          bbox: { x: pixelX, y: pixelY, width: pixelW, height: pixelH },
          confidence: 0.95,
        },
      ],
    },
    evidence: [
      {
        id: `ev_${key}_${imageId}`,
        sourceImageId: imageId,
        sourceSide: side,
        x: Number((pixelX / origW).toFixed(4)),
        y: Number((pixelY / origH).toFixed(4)),
        width: Number((pixelW / origW).toFixed(4)),
        height: Number((pixelH / origH).toFixed(4)),
        pixelBbox: { x: pixelX, y: pixelY, width: pixelW, height: pixelH },
        snippet,
        confidence: 'HIGH' as const,
      },
    ],
  };
}

export const INITIAL_DEMO_INSPECTIONS: InspectionRecord[] = [
  {
    id: 'LL-2026-00142',
    productName: 'ABC Cream Biscuits',
    barcode: '8901030948201',
    inspector: CURRENT_INSPECTOR,
    createdAt: '2026-09-17T10:42:00Z',
    updatedAt: '2026-09-17T10:48:00Z',
    location: {
      latitude: 28.4595,
      longitude: 77.0266,
      accuracy: 25,
      placeName: 'Gurugram, Haryana',
      timestamp: '2026-09-17T10:42:15Z',
      locationSource: 'GPS',
    },
    images: SAMPLE_PACKAGES.biscuits.images,
    imageRecords: {
      front: {
        id: 'img_front_biscuits_001',
        imageId: 'img_front_biscuits_001',
        side: 'front',
        fileName: 'FRONT_biscuits.png',
        dataUrl: SAMPLE_PACKAGES.biscuits.images.front!,
        width: 600,
        height: 480,
        originalWidth: 600,
        originalHeight: 480,
      },
      back: {
        id: 'img_back_biscuits_002',
        imageId: 'img_back_biscuits_002',
        side: 'back',
        fileName: 'BACK_biscuits.png',
        dataUrl: SAMPLE_PACKAGES.biscuits.images.back!,
        width: 600,
        height: 480,
        originalWidth: 600,
        originalHeight: 480,
      },
      side: {
        id: 'img_side_biscuits_003',
        imageId: 'img_side_biscuits_003',
        side: 'side',
        fileName: 'SIDE_biscuits.png',
        dataUrl: SAMPLE_PACKAGES.biscuits.images.side!,
        width: 600,
        height: 480,
        originalWidth: 600,
        originalHeight: 480,
      },
      additional: null,
    },
    extractedFields: {
      productName: {
        key: 'productName',
        label: 'Product Name',
        extractedValue: 'ABC Cream Biscuits',
        verifiedValue: 'ABC Cream Biscuits',
        sourceImage: 'Front',
        confidence: 96,
        isManuallyVerified: false,
        isNotVisible: false,
        evidenceSnippet: 'ABC PREMIUM CREAM BISCUITS',
        locationDescription: 'Top center on front side',
        ...createDemoFieldEvidence('productName', 'Front', 'img_front_biscuits_001', 28, 104, 340, 24, 'ABC PREMIUM CREAM BISCUITS'),
      },
      mrp: {
        key: 'mrp',
        label: 'MRP',
        extractedValue: '₹50',
        verifiedValue: '₹55',
        sourceImage: 'Front',
        confidence: 94,
        isManuallyVerified: true,
        isNotVisible: false,
        evidenceSnippet: 'MRP ₹50.00 (Incl. of all taxes)',
        locationDescription: 'Mid front surface near Net Wt',
        ...createDemoFieldEvidence('mrp', 'Front', 'img_front_biscuits_001', 28, 182, 300, 24, 'MRP ₹50.00 (Incl. of all taxes)'),
        audit: {
          originalValue: '₹50',
          verifiedValue: '₹55',
          changedBy: 'INS-1042',
          timestamp: '2026-09-17T10:46:12Z',
        },
      },
      netQuantity: {
        key: 'netQuantity',
        label: 'Net Quantity',
        extractedValue: '100 g',
        verifiedValue: '100 g',
        sourceImage: 'Front',
        confidence: 91,
        isManuallyVerified: false,
        isNotVisible: false,
        evidenceSnippet: 'Net Quantity: 100 g',
        locationDescription: 'Lower left of front package',
        ...createDemoFieldEvidence('netQuantity', 'Front', 'img_front_biscuits_001', 28, 156, 200, 24, 'Net Quantity: 100 g'),
      },
      manufacturer: {
        key: 'manufacturer',
        label: 'Manufacturer / Packer',
        extractedValue: 'ABC Foods Pvt. Ltd.',
        verifiedValue: 'ABC Foods Pvt. Ltd.',
        sourceImage: 'Back',
        confidence: 87,
        isManuallyVerified: false,
        isNotVisible: false,
        evidenceSnippet: 'ABC Foods Pvt. Ltd., Plot No. 42-B',
        locationDescription: 'Top left of back statutory box',
        ...createDemoFieldEvidence('manufacturer', 'Back', 'img_back_biscuits_002', 28, 130, 360, 24, 'ABC Foods Pvt. Ltd., Plot No. 42-B'),
      },
      address: {
        key: 'address',
        label: 'Address',
        extractedValue: 'Plot No. 42-B, Sector 18 Industrial Area, Gurugram, Haryana - 122015',
        verifiedValue: 'Plot No. 42-B, Sector 18 Industrial Area, Gurugram, Haryana - 122015',
        sourceImage: 'Back',
        confidence: 85,
        isManuallyVerified: false,
        isNotVisible: false,
        evidenceSnippet: 'Sector 18 Industrial Area, Gurugram, Haryana - 122015',
        locationDescription: 'Directly beneath manufacturer title',
        ...createDemoFieldEvidence('address', 'Back', 'img_back_biscuits_002', 28, 156, 460, 24, 'Sector 18 Industrial Area, Gurugram, Haryana - 122015'),
      },
      dateInformation: {
        key: 'dateInformation',
        label: 'Manufacturing Date',
        extractedValue: '12/08/2026',
        verifiedValue: '12/08/2026',
        sourceImage: 'Side',
        confidence: 89,
        isManuallyVerified: false,
        isNotVisible: false,
        evidenceSnippet: 'Mfg. Date: 12/08/2026',
        locationDescription: 'Lateral seal crimp panel',
        ...createDemoFieldEvidence('dateInformation', 'Side', 'img_side_biscuits_003', 28, 156, 240, 24, 'Mfg. Date: 12/08/2026'),
      },
      bestBefore: {
        key: 'bestBefore',
        label: 'Best Before',
        extractedValue: '6 MONTHS FROM PACKAGING',
        verifiedValue: '6 MONTHS FROM PACKAGING',
        sourceImage: 'Side',
        confidence: 88,
        isManuallyVerified: false,
        isNotVisible: false,
        evidenceSnippet: 'Best Before: 6 MONTHS FROM PACKAGING',
        locationDescription: 'Lateral crimp panel below Mfg Date',
        ...createDemoFieldEvidence('bestBefore', 'Side', 'img_side_biscuits_003', 28, 182, 360, 24, 'Best Before: 6 MONTHS FROM PACKAGING'),
      },
      consumerCare: {
        key: 'consumerCare',
        label: 'Consumer Care',
        extractedValue: 'Toll Free: 1800-200-4567 | care@abcfoods.in',
        verifiedValue: 'Toll Free: 1800-200-4567 | care@abcfoods.in',
        sourceImage: 'Back',
        confidence: 84,
        isManuallyVerified: false,
        isNotVisible: false,
        evidenceSnippet: 'Toll Free: 1800-200-4567 | care@abcfoods.in',
        locationDescription: 'Middle back box',
        ...createDemoFieldEvidence('consumerCare', 'Back', 'img_back_biscuits_002', 28, 208, 400, 24, 'Toll Free: 1800-200-4567 | care@abcfoods.in'),
      },
      batchNumber: {
        key: 'batchNumber',
        label: 'Batch Number',
        extractedValue: 'B-8429X',
        verifiedValue: 'B-8429X',
        sourceImage: 'Side',
        confidence: 86,
        isManuallyVerified: false,
        isNotVisible: false,
        evidenceSnippet: 'Batch / Lot No: B-8429X',
        locationDescription: 'Side panel',
        ...createDemoFieldEvidence('batchNumber', 'Side', 'img_side_biscuits_003', 28, 130, 240, 24, 'Batch / Lot No: B-8429X'),
      },
      countryOfOrigin: {
        key: 'countryOfOrigin',
        label: 'Country of Origin',
        extractedValue: 'India',
        verifiedValue: 'India',
        sourceImage: 'Back',
        confidence: 93,
        isManuallyVerified: false,
        isNotVisible: false,
        evidenceSnippet: 'Country of Origin: India',
        locationDescription: 'Bottom of back box',
        ...createDemoFieldEvidence('countryOfOrigin', 'Back', 'img_back_biscuits_002', 28, 260, 240, 24, 'Country of Origin: India'),
      },
    },
    findings: [
      {
        ruleId: 'rule-lm-001',
        ruleCode: 'LM-001',
        requirement: 'MRP declaration should be visible',
        observedEvidence: '₹55 verified (original sticker ₹50 visible on Front)',
        status: 'POTENTIAL ISSUE — MANUAL VERIFICATION',
        evidenceImage: 'Front',
        extractedValue: '₹50',
        inspectorValue: '₹55',
        confidence: 94,
        notes: 'Price disparity between scanned sticker and distributor tag requires verification.',
      },
      {
        ruleId: 'rule-lm-002',
        ruleCode: 'LM-002',
        requirement: 'Net quantity declaration should be visible',
        observedEvidence: '100 g detected on Front image',
        status: 'DETECTED',
        evidenceImage: 'Front',
        extractedValue: '100 g',
        confidence: 91,
      },
      {
        ruleId: 'rule-lm-003',
        ruleCode: 'LM-003',
        requirement: 'Manufacturer / packer identification should be visible',
        observedEvidence: 'ABC Foods Pvt. Ltd. (Gurugram, Haryana) detected on Back image',
        status: 'DETECTED',
        evidenceImage: 'Back',
        extractedValue: 'ABC Foods Pvt. Ltd.',
        confidence: 87,
      },
      {
        ruleId: 'rule-lm-004',
        ruleCode: 'LM-004',
        requirement: 'Required date information should be visible where applicable',
        observedEvidence: 'Mfg 12/08/2026 | Best before 6 months visible on Side image',
        status: 'DETECTED',
        evidenceImage: 'Side',
        extractedValue: '12/08/2026',
        confidence: 89,
      },
      {
        ruleId: 'rule-lm-005',
        ruleCode: 'LM-005',
        requirement: 'Consumer care information should be visible where applicable',
        observedEvidence: '1800-200-4567 | care@abcfoods.in visible on Back image',
        status: 'DETECTED',
        evidenceImage: 'Back',
        extractedValue: '1800-200-4567',
        confidence: 84,
      },
    ],
    remarks: 'Discrepancy noted in distributor shelf price tag vs pre-printed MRP. Packaging declarations otherwise clearly visible on principal display surface.',
    status: 'Potential Issue — Manual Verification',
    activityLog: [
      { id: '1', timestamp: '2026-09-17T10:42:00Z', timeFormatted: '10:42 AM', action: 'Inspection created', actor: 'INS-1042', details: 'Location: Gurugram, Haryana' },
      { id: '2', timestamp: '2026-09-17T10:42:15Z', timeFormatted: '10:42 AM', action: 'Location captured', actor: 'System (GPS)', details: 'Lat: 28.4595, Long: 77.0266 (±25 m)' },
      { id: '3', timestamp: '2026-09-17T10:43:20Z', timeFormatted: '10:43 AM', action: 'Front image captured', actor: 'INS-1042', details: 'Resolution: 600x480' },
      { id: '4', timestamp: '2026-09-17T10:44:05Z', timeFormatted: '10:44 AM', action: 'Back image captured', actor: 'INS-1042', details: 'Resolution: 600x480' },
      { id: '5', timestamp: '2026-09-17T10:44:40Z', timeFormatted: '10:44 AM', action: 'Side image captured', actor: 'INS-1042', details: 'Resolution: 600x480' },
      { id: '6', timestamp: '2026-09-17T10:45:10Z', timeFormatted: '10:45 AM', action: 'OCR extraction completed', actor: 'System (OCR/AI)', details: '10 fields detected with high confidence' },
      { id: '7', timestamp: '2026-09-17T10:46:12Z', timeFormatted: '10:46 AM', action: 'Inspector corrected MRP', actor: 'INS-1042', details: 'Changed ₹50 to ₹55 due to retail markup sticker' },
      { id: '8', timestamp: '2026-09-17T10:47:30Z', timeFormatted: '10:47 AM', action: 'Findings reviewed', actor: 'INS-1042', details: 'Flagged Rule LM-001 for supervisor confirmation' },
    ],
    step: 5,
  },
  {
    id: 'LL-2026-00141',
    productName: 'FreshMilk 1L',
    barcode: '8902040182934',
    inspector: CURRENT_INSPECTOR,
    createdAt: '2026-09-17T09:58:00Z',
    updatedAt: '2026-09-17T10:05:00Z',
    location: {
      latitude: 28.3512,
      longitude: 76.9416,
      accuracy: 18,
      placeName: 'Manesar, Haryana',
      timestamp: '2026-09-17T09:58:10Z',
      locationSource: 'GPS',
    },
    images: SAMPLE_PACKAGES.milk.images,
    imageRecords: {
      front: {
        id: 'img_front_milk_001',
        imageId: 'img_front_milk_001',
        side: 'front',
        fileName: 'FRONT_milk.png',
        dataUrl: SAMPLE_PACKAGES.milk.images.front!,
        width: 600,
        height: 480,
        originalWidth: 600,
        originalHeight: 480,
      },
      back: {
        id: 'img_back_milk_002',
        imageId: 'img_back_milk_002',
        side: 'back',
        fileName: 'BACK_milk.png',
        dataUrl: SAMPLE_PACKAGES.milk.images.back!,
        width: 600,
        height: 480,
        originalWidth: 600,
        originalHeight: 480,
      },
      side: {
        id: 'img_side_milk_003',
        imageId: 'img_side_milk_003',
        side: 'side',
        fileName: 'SIDE_milk.png',
        dataUrl: SAMPLE_PACKAGES.milk.images.side!,
        width: 600,
        height: 480,
        originalWidth: 600,
        originalHeight: 480,
      },
      additional: null,
    },
    extractedFields: {
      productName: {
        key: 'productName',
        label: 'Product Name',
        extractedValue: 'FreshMilk 1L',
        verifiedValue: 'FreshMilk 1L',
        sourceImage: 'Front',
        confidence: 98,
        isManuallyVerified: false,
        isNotVisible: false,
        ...createDemoFieldEvidence('productName', 'Front', 'img_front_milk_001', 28, 104, 280, 24, 'FreshMilk Pasteurised Homogenised'),
      },
      mrp: {
        key: 'mrp',
        label: 'MRP',
        extractedValue: '₹68',
        verifiedValue: '₹68',
        sourceImage: 'Front',
        confidence: 95,
        isManuallyVerified: false,
        isNotVisible: false,
        ...createDemoFieldEvidence('mrp', 'Front', 'img_front_milk_001', 28, 182, 260, 24, 'MRP ₹68.00 (Incl. of all taxes)'),
      },
      netQuantity: {
        key: 'netQuantity',
        label: 'Net Quantity',
        extractedValue: '1 L',
        verifiedValue: '1 L',
        sourceImage: 'Front',
        confidence: 96,
        isManuallyVerified: false,
        isNotVisible: false,
        ...createDemoFieldEvidence('netQuantity', 'Front', 'img_front_milk_001', 28, 156, 180, 24, 'Net Volume: 1 L'),
      },
      manufacturer: {
        key: 'manufacturer',
        label: 'Manufacturer / Packer',
        extractedValue: 'Haryana Dairy Cooperative Union Ltd.',
        verifiedValue: 'Haryana Dairy Cooperative Union Ltd.',
        sourceImage: 'Back',
        confidence: 92,
        isManuallyVerified: false,
        isNotVisible: false,
        ...createDemoFieldEvidence('manufacturer', 'Back', 'img_back_milk_002', 28, 130, 420, 24, 'Haryana Dairy Cooperative Union Ltd.'),
      },
      address: {
        key: 'address',
        label: 'Address',
        extractedValue: 'Milk Chilling Centre, Manesar Industrial Estate, Gurugram - 122051',
        verifiedValue: 'Milk Chilling Centre, Manesar Industrial Estate, Gurugram - 122051',
        sourceImage: 'Back',
        confidence: 89,
        isManuallyVerified: false,
        isNotVisible: false,
        ...createDemoFieldEvidence('address', 'Back', 'img_back_milk_002', 28, 156, 480, 24, 'Milk Chilling Centre, Manesar Industrial Estate, Gurugram - 122051'),
      },
      dateInformation: {
        key: 'dateInformation',
        label: 'Packaging Date',
        extractedValue: '15/09/2026',
        verifiedValue: '15/09/2026',
        sourceImage: 'Side',
        confidence: 94,
        isManuallyVerified: false,
        isNotVisible: false,
        ...createDemoFieldEvidence('dateInformation', 'Side', 'img_side_milk_003', 28, 156, 260, 24, 'Date of Packaging: 15/09/2026'),
      },
      bestBefore: {
        key: 'bestBefore',
        label: 'Use By Date',
        extractedValue: '15/12/2026',
        verifiedValue: '15/12/2026',
        sourceImage: 'Side',
        confidence: 91,
        isManuallyVerified: false,
        isNotVisible: false,
        ...createDemoFieldEvidence('bestBefore', 'Side', 'img_side_milk_003', 28, 182, 220, 24, 'Use By: 15/12/2026'),
      },
      consumerCare: {
        key: 'consumerCare',
        label: 'Consumer Care',
        extractedValue: '1800-180-2222',
        verifiedValue: '1800-180-2222',
        sourceImage: 'Back',
        confidence: 88,
        isManuallyVerified: false,
        isNotVisible: false,
        ...createDemoFieldEvidence('consumerCare', 'Back', 'img_back_milk_002', 28, 208, 440, 24, 'Customer Care: 1800-180-2222 | customercare@freshmilk.coop'),
      },
    },
    findings: [
      {
        ruleId: 'rule-lm-001',
        ruleCode: 'LM-001',
        requirement: 'MRP declaration should be visible',
        observedEvidence: '₹68 visible on Front image',
        status: 'DETECTED',
        evidenceImage: 'Front',
        extractedValue: '₹68',
        confidence: 95,
      },
      {
        ruleId: 'rule-lm-002',
        ruleCode: 'LM-002',
        requirement: 'Net quantity declaration should be visible',
        observedEvidence: '1 L detected on Front image',
        status: 'DETECTED',
        evidenceImage: 'Front',
        extractedValue: '1 L',
        confidence: 96,
      },
      {
        ruleId: 'rule-lm-003',
        ruleCode: 'LM-003',
        requirement: 'Manufacturer / packer identification should be visible',
        observedEvidence: 'Haryana Dairy Cooperative Union Ltd. on Back image',
        status: 'DETECTED',
        evidenceImage: 'Back',
        extractedValue: 'Haryana Dairy Cooperative',
        confidence: 92,
      },
      {
        ruleId: 'rule-lm-004',
        ruleCode: 'LM-004',
        requirement: 'Required date information should be visible where applicable',
        observedEvidence: 'Packaging 15/09/2026 visible on Side image',
        status: 'DETECTED',
        evidenceImage: 'Side',
        extractedValue: '15/09/2026',
        confidence: 94,
      },
      {
        ruleId: 'rule-lm-005',
        ruleCode: 'LM-005',
        requirement: 'Consumer care information should be visible where applicable',
        observedEvidence: '1800-180-2222 visible on Back image',
        status: 'DETECTED',
        evidenceImage: 'Back',
        extractedValue: '1800-180-2222',
        confidence: 88,
      },
    ],
    remarks: 'Routine inspection at dairy retail counter. All mandatory statutory declarations detected and compliant with rule set.',
    status: 'Completed',
    activityLog: [
      { id: '1', timestamp: '2026-09-17T09:58:00Z', timeFormatted: '09:58 AM', action: 'Inspection created', actor: 'INS-1042', details: 'Location: Manesar, Haryana' },
      { id: '2', timestamp: '2026-09-17T10:01:00Z', timeFormatted: '10:01 AM', action: 'Images uploaded', actor: 'INS-1042', details: '3 sides uploaded' },
      { id: '3', timestamp: '2026-09-17T10:03:00Z', timeFormatted: '10:03 AM', action: 'Declarations extracted & verified', actor: 'System & INS-1042', details: 'All rules detected' },
      { id: '4', timestamp: '2026-09-17T10:05:00Z', timeFormatted: '10:05 AM', action: 'Inspection completed', actor: 'INS-1042', details: 'Report generated' },
    ],
    step: 5,
  },
  {
    id: 'LL-2026-00140',
    productName: 'SunPure Cooking Oil',
    barcode: '8903020491823',
    inspector: CURRENT_INSPECTOR,
    createdAt: '2026-09-16T16:15:00Z',
    updatedAt: '2026-09-16T16:25:00Z',
    location: {
      latitude: 28.4610,
      longitude: 77.0310,
      accuracy: 20,
      placeName: 'Gurugram, Haryana',
      timestamp: '2026-09-16T16:15:10Z',
      locationSource: 'GPS',
    },
    images: {
      front: createSamplePackageSvg('SunPure Cooking Oil', 'Front', [
        'SUNPURE REFINED SUNFLOWER OIL',
        'Net Volume: 1 Litre (910 g)',
        'MRP ₹145.00 (Incl. of all taxes)',
        'Rich in Natural Vitamin E',
      ], '#fffbeb', '#b45309'),
      back: createSamplePackageSvg('SunPure Cooking Oil', 'Back', [
        'PACKED BY: SunPure Agro Mills Ltd.',
        'Village Kherki Daula, NH-48, Gurugram 122004',
        'Customer Redressal: 1800-419-7865',
        'Country of Origin: India',
      ], '#f8fafc', '#1e3a8a'),
      side: createSamplePackageSvg('SunPure Cooking Oil', 'Side', [
        'BATCH NO: SO-541',
        'PACKING DATE: AUG 2026',
        'BEST BEFORE 9 MONTHS',
      ], '#f8fafc', '#475569'),
      additional: null,
    },
    extractedFields: {
      productName: { key: 'productName', label: 'Product Name', extractedValue: 'SunPure Cooking Oil', verifiedValue: 'SunPure Cooking Oil', sourceImage: 'Front', confidence: 97, isManuallyVerified: false, isNotVisible: false },
      mrp: { key: 'mrp', label: 'MRP', extractedValue: '₹145', verifiedValue: '₹145', sourceImage: 'Front', confidence: 96, isManuallyVerified: false, isNotVisible: false },
      netQuantity: { key: 'netQuantity', label: 'Net Quantity', extractedValue: '1 Litre', verifiedValue: '1 Litre', sourceImage: 'Front', confidence: 95, isManuallyVerified: false, isNotVisible: false },
      manufacturer: { key: 'manufacturer', label: 'Manufacturer', extractedValue: 'SunPure Agro Mills Ltd.', verifiedValue: 'SunPure Agro Mills Ltd.', sourceImage: 'Back', confidence: 90, isManuallyVerified: false, isNotVisible: false },
      address: { key: 'address', label: 'Address', extractedValue: 'Village Kherki Daula, NH-48, Gurugram 122004', verifiedValue: 'Village Kherki Daula, NH-48, Gurugram 122004', sourceImage: 'Back', confidence: 88, isManuallyVerified: false, isNotVisible: false },
      dateInformation: { key: 'dateInformation', label: 'Packing Date', extractedValue: 'AUG 2026', verifiedValue: 'AUG 2026', sourceImage: 'Side', confidence: 92, isManuallyVerified: false, isNotVisible: false },
      consumerCare: { key: 'consumerCare', label: 'Consumer Care', extractedValue: '1800-419-7865', verifiedValue: '1800-419-7865', sourceImage: 'Back', confidence: 86, isManuallyVerified: false, isNotVisible: false },
    },
    findings: [
      { ruleId: 'rule-lm-001', ruleCode: 'LM-001', requirement: 'MRP declaration should be visible', observedEvidence: '₹145 visible on Front image', status: 'DETECTED', evidenceImage: 'Front', extractedValue: '₹145', confidence: 96 },
      { ruleId: 'rule-lm-002', ruleCode: 'LM-002', requirement: 'Net quantity declaration should be visible', observedEvidence: '1 Litre (910 g) detected on Front image', status: 'DETECTED', evidenceImage: 'Front', extractedValue: '1 Litre', confidence: 95 },
      { ruleId: 'rule-lm-003', ruleCode: 'LM-003', requirement: 'Manufacturer / packer identification should be visible', observedEvidence: 'SunPure Agro Mills Ltd. on Back image', status: 'DETECTED', evidenceImage: 'Back', extractedValue: 'SunPure Agro Mills', confidence: 90 },
      { ruleId: 'rule-lm-004', ruleCode: 'LM-004', requirement: 'Required date information should be visible where applicable', observedEvidence: 'AUG 2026 on Side image', status: 'DETECTED', evidenceImage: 'Side', extractedValue: 'AUG 2026', confidence: 92 },
      { ruleId: 'rule-lm-005', ruleCode: 'LM-005', requirement: 'Consumer care information should be visible where applicable', observedEvidence: '1800-419-7865 on Back image', status: 'DETECTED', evidenceImage: 'Back', extractedValue: '1800-419-7865', confidence: 86 },
    ],
    remarks: 'Routine inspection at wholesale depot. Dual declaration of Volume (1 L) and Equivalent Weight (910 g) verified under First Schedule.',
    status: 'Completed',
    activityLog: [
      { id: '1', timestamp: '2026-09-16T16:15:00Z', timeFormatted: '04:15 PM', action: 'Inspection created', actor: 'INS-1042' },
      { id: '2', timestamp: '2026-09-16T16:25:00Z', timeFormatted: '04:25 PM', action: 'Inspection completed', actor: 'INS-1042' },
    ],
    step: 5,
  }
];
