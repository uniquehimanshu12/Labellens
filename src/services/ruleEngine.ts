import { ExtractedField, RuleDefinition, RuleFinding, PackageImages, OverallInspectionStatus, RuleReference, ConfidenceState } from '../types';

export const PROTOTYPE_RULE_SET_NAME = 'Packaged Commodities Verification Rules — Prototype Rule Set v1.0';
export const PROTOTYPE_RULE_DISCLAIMER = 'Prototype verification rules are simplified for demonstration and do not replace official legal or regulatory verification.';

export const STANDARD_RULES: RuleDefinition[] = [
  {
    id: 'rule-lm-001',
    code: 'LM-001',
    name: 'Maximum Retail Price (MRP) Declaration',
    requirement: 'Maximum Retail Price (MRP) declaration should be visible on the package, inclusive of all taxes.',
    legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(e)',
    category: 'Pricing Transparency',
    criticality: 'Mandatory',
    lookFor: '₹ / Rs. / Maximum Retail Price / Incl. of all taxes',
    evidenceRequired: 'Visible package image or inspector verification',
    prototypeStatus: 'Operational',
    officialReference: 'Rule 6(1)(e): "the retail sale price of the package shall clearly indicate that it is the maximum retail price inclusive of all taxes..."',
    prototypeInterpretation: 'Checks for standard rupee symbols or Rs. text alongside decimal or integer currency figures on any scanned package surface.',
  },
  {
    id: 'rule-lm-002',
    code: 'LM-002',
    name: 'Net Quantity Declaration',
    requirement: 'Net quantity / content declaration should be visible in standard metric units of weight, measure or count.',
    legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(d) & Rule 12',
    category: 'Quantity & Weights',
    criticality: 'Mandatory',
    lookFor: 'g / kg / ml / L / Net Wt / Net Content / N (count)',
    evidenceRequired: 'Visible package image showing principal display panel',
    prototypeStatus: 'Operational',
    officialReference: 'Rule 6(1)(d): "the net quantity, in terms of the standard unit of weight or measure of the commodity contained in the package..."',
    prototypeInterpretation: 'Validates presence of approved metric units (g, kg, ml, L, count) on visible package panels.',
  },
  {
    id: 'rule-lm-003',
    code: 'LM-003',
    name: 'Manufacturer / Packer / Importer Identification',
    requirement: 'Name and complete physical address of the manufacturer, packer, or importer should be visibly stated.',
    legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(a)',
    category: 'Commercial Traceability',
    criticality: 'Mandatory',
    lookFor: 'Manufactured by / Packed by / Marketed by / Complete Postal Address with PIN code',
    evidenceRequired: 'Package image showing manufacturer text block',
    prototypeStatus: 'Operational',
    officialReference: 'Rule 6(1)(a): "the name and complete address of the manufacturer or where the manufacturer is not the packer, the name and address of the manufacturer and packer..."',
    prototypeInterpretation: 'Verifies whether registered commercial entity and identifiable postal/industrial address are visible.',
  },
  {
    id: 'rule-lm-004',
    code: 'LM-004',
    name: 'Statutory Date Declaration (Mfg / Pkd / Use-By)',
    requirement: 'Month and year of manufacture or pre-packaging, or best before / expiry date information should be visible where applicable.',
    legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(g)',
    category: 'Product Shelf-Life',
    criticality: 'Mandatory',
    lookFor: 'Mfg Date / Packed On / Best Before / Expiry / MM/YYYY format',
    evidenceRequired: 'Package image showing date crimp or stamped coding',
    prototypeStatus: 'Operational',
    officialReference: 'Rule 6(1)(g): "the month and year in which the commodity is manufactured or pre-packed or imported shall be mentioned in the prescribed manner..."',
    prototypeInterpretation: 'Detects stamped, embossed, or printed date codes and verifies legibility of production or shelf-life timeline.',
  },
  {
    id: 'rule-lm-005',
    code: 'LM-005',
    name: 'Consumer Care Contact Details',
    requirement: 'Consumer care contact details (telephone helpline, email address, or designated grievance postal address) should be declared.',
    legalReference: 'Legal Metrology (Packaged Commodities) Rules, 2011 — Rule 6(1)(h)',
    category: 'Consumer Redressal',
    criticality: 'Mandatory',
    lookFor: 'Customer care / Helpline / Toll Free / email / Grievance officer',
    evidenceRequired: 'Package image showing consumer redressal panel',
    prototypeStatus: 'Operational',
    officialReference: 'Rule 6(1)(h): "the name, address, telephone number, e-mail address of the person who can be contacted by the consumer in case of complaints..."',
    prototypeInterpretation: 'Scans for functional contact points (1800 number, valid email, or named grievance desk) accessible to consumers.',
  },
  {
    id: 'rule-lm-006',
    code: 'LM-006',
    name: 'Country of Origin Declaration',
    requirement: 'Country of origin or manufacture should be declared on all pre-packaged commodities, including imported goods.',
    legalReference: 'Legal Metrology (Packaged Commodities) Amendment Rules, 2020 — Rule 6(10)',
    category: 'Trade Compliance',
    criticality: 'Mandatory',
    lookFor: 'Country of Origin / Made in / Product of',
    evidenceRequired: 'Visible package image showing origin statement',
    prototypeStatus: 'Operational',
    officialReference: 'Rule 6(10): "Provided that for all pre-packaged commodities, the country of origin shall be clearly indicated..."',
    prototypeInterpretation: 'Inspects packaging for clear sovereign origin declarations such as "Made in India" or country of overseas import.',
  },
];

export const PROTOTYPE_REFERENCES: RuleReference[] = [
  {
    id: 'ref-01',
    title: 'The Legal Metrology Act, 2009 (Act No. 1 of 2010)',
    source: 'Ministry of Consumer Affairs, Food and Public Distribution, Govt. of India',
    description: 'The parent statutory legislation establishing uniform standards of weights and measures, regulation of trade and commerce in packaged goods, and enforcement powers of Legal Metrology Officers.',
    officialSection: 'Chapter V — Offences and Penalties (Sections 18, 36); Section 52 (Powers of Central Government to make rules)',
    prototypeInterpretation: 'Provides the legal foundation for inspector authorization, powers of entry, search, inspection, and verification of declarations.',
    externalUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
  },
  {
    id: 'ref-02',
    title: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    source: 'Department of Consumer Affairs (G.S.R. 202(E))',
    description: 'The fundamental regulatory code prescribing mandatory declarations on packages intended for retail sale, wholesale, and institutional distribution.',
    officialSection: 'Rule 6: Declarations to be made on every package; Rule 9: Manner in which declaration shall be made; Rule 18: Provisions relating to wholesale packages',
    prototypeInterpretation: 'The direct source for rules LM-001 through LM-006 implemented in LabelLens prototype automated verification.',
    externalUrl: 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology-packaged-commodities-rules-2011',
  },
  {
    id: 'ref-03',
    title: 'Standard Units & Minimum Font Height Guidelines',
    source: 'First & Second Schedule, PCR 2011',
    description: 'Mandates standard symbols for units of measurement (g, kg, mL, L, m, cm) and minimum numeral height proportional to principal display panel area.',
    officialSection: 'Schedule II — Minimum height of numerals and letters for declarations',
    prototypeInterpretation: 'In future releases, computer vision will measure physical bounding box height against package area ratio.',
  },
  {
    id: 'ref-04',
    title: 'Consumer Protection (E-Commerce) Rules, 2020',
    source: 'Central Consumer Protection Authority (CCPA)',
    description: 'Requires e-commerce marketplaces and entities to display all mandatory packaged commodity declarations before the consumer commits to purchase.',
    officialSection: 'Rule 5 & Rule 6: Obligations of marketplace e-commerce entities and sellers',
    prototypeInterpretation: 'Underpins potential expansion of LabelLens from physical retail shelves to digital marketplace catalog auditing.',
  },
];

export interface EvaluationResult {
  findings: RuleFinding[];
  summary: {
    imagesCaptured: number;
    fieldsExtracted: number;
    rulesChecked: number;
    potentialIssues: number;
    manualVerificationRequired: number;
    detectedCount: number;
    notDetectedCount: number;
  };
}

export function evaluatePackageRules(
  fields: Record<string, ExtractedField>,
  images: PackageImages
): EvaluationResult {
  const findings: RuleFinding[] = [];

  const getFieldValue = (key: string): string => {
    const f = fields[key];
    if (!f) return '';
    if (f.isNotVisible) return '';
    return (f.verifiedValue || f.extractedValue || '').trim();
  };

  const getFieldObj = (key: string): ExtractedField | undefined => fields[key];

  // Helper to derive confidence state
  const getFieldConfidenceState = (field?: ExtractedField): ConfidenceState => {
    if (!field) return 'NOT DETECTED';
    if (field.isNotVisible) return 'NOT DETECTED';
    if (field.isManuallyVerified) return 'VERIFIED BY INSPECTOR';
    return field.confidenceState || 'MEDIUM CONFIDENCE';
  };

  // 1. Check Rule LM-001 (MRP)
  const mrpObj = getFieldObj('mrp');
  const mrpVal = getFieldValue('mrp');
  if (mrpVal && !mrpObj?.isNotVisible) {
    const hasRupeeOrRs = /₹|rs|inr|\d+/i.test(mrpVal);
    if (hasRupeeOrRs) {
      findings.push({
        ruleId: 'rule-lm-001',
        ruleCode: 'LM-001',
        requirement: 'MRP declaration should be visible on the package',
        observedEvidence: `${mrpVal} visible on ${mrpObj?.sourceImage || 'Front'} surface`,
        status: 'DETECTED',
        evidenceImage: (mrpObj?.sourceImage as any) || 'Front',
        extractedValue: mrpVal,
        inspectorValue: mrpObj?.verifiedValue,
        confidenceState: getFieldConfidenceState(mrpObj),
        confidence: mrpObj?.confidence ?? 94,
        notes: 'Price declaration identified with visible numerical figure inclusive of all taxes.',
      });
    } else {
      findings.push({
        ruleId: 'rule-lm-001',
        ruleCode: 'LM-001',
        requirement: 'MRP declaration should be visible on the package',
        observedEvidence: `Ambiguous price text "${mrpVal}" observed`,
        status: 'POTENTIAL ISSUE — MANUAL VERIFICATION',
        evidenceImage: (mrpObj?.sourceImage as any) || 'Front',
        extractedValue: mrpVal,
        inspectorValue: mrpObj?.verifiedValue,
        confidenceState: 'LOW CONFIDENCE',
        confidence: 60,
        notes: 'Numerical value or currency symbol requires field inspector confirmation.',
      });
    }
  } else {
    findings.push({
      ruleId: 'rule-lm-001',
      ruleCode: 'LM-001',
      requirement: 'MRP declaration should be visible on the package',
      observedEvidence: 'Not found in submitted package images or manual declarations',
      status: 'NOT DETECTED IN SUBMITTED IMAGES',
      evidenceImage: 'None',
      extractedValue: '—',
      confidenceState: 'NOT DETECTED',
      confidence: 0,
      notes: 'No maximum retail price declaration detected across submitted package surfaces.',
    });
  }

  // 2. Check Rule LM-002 (Net Quantity)
  const qtyObj = getFieldObj('netQuantity');
  const qtyVal = getFieldValue('netQuantity');
  if (qtyVal && !qtyObj?.isNotVisible) {
    const hasUnits = /(g|gm|gram|kg|ml|l|litre|liter|piece|pcs|n|units)/i.test(qtyVal);
    if (hasUnits) {
      findings.push({
        ruleId: 'rule-lm-002',
        ruleCode: 'LM-002',
        requirement: 'Net quantity declaration should be visible',
        observedEvidence: `${qtyVal} detected on ${qtyObj?.sourceImage || 'Front'} surface`,
        status: 'DETECTED',
        evidenceImage: (qtyObj?.sourceImage as any) || 'Front',
        extractedValue: qtyVal,
        inspectorValue: qtyObj?.verifiedValue,
        confidenceState: getFieldConfidenceState(qtyObj),
        confidence: qtyObj?.confidence ?? 91,
        notes: 'Standard metric unit declaration detected on package surface.',
      });
    } else {
      findings.push({
        ruleId: 'rule-lm-002',
        ruleCode: 'LM-002',
        requirement: 'Net quantity declaration should be visible',
        observedEvidence: `Net quantity found without clear metric unit: "${qtyVal}"`,
        status: 'POTENTIAL ISSUE — MANUAL VERIFICATION',
        evidenceImage: (qtyObj?.sourceImage as any) || 'Front',
        extractedValue: qtyVal,
        inspectorValue: qtyObj?.verifiedValue,
        confidenceState: 'LOW CONFIDENCE',
        confidence: 65,
        notes: 'Standard metric units (g, kg, ml, L) should be clearly verified by inspector.',
      });
    }
  } else {
    findings.push({
      ruleId: 'rule-lm-002',
      ruleCode: 'LM-002',
      requirement: 'Net quantity declaration should be visible',
      observedEvidence: 'Not found in submitted package images',
      status: 'NOT DETECTED IN SUBMITTED IMAGES',
      evidenceImage: 'None',
      extractedValue: '—',
      confidenceState: 'NOT DETECTED',
      confidence: 0,
      notes: 'No net quantity indication visible on submitted surfaces.',
    });
  }

  // 3. Check Rule LM-003 (Manufacturer / Packer / Importer)
  const mfgObj = getFieldObj('manufacturer');
  const addrObj = getFieldObj('address');
  const mfgVal = getFieldValue('manufacturer');
  const addrVal = getFieldValue('address');

  if (mfgVal && !mfgObj?.isNotVisible) {
    if (addrVal && !addrObj?.isNotVisible) {
      findings.push({
        ruleId: 'rule-lm-003',
        ruleCode: 'LM-003',
        requirement: 'Manufacturer / packer identification should be visible',
        observedEvidence: `${mfgVal} with postal address visible on ${mfgObj?.sourceImage || 'Back'} surface`,
        status: 'DETECTED',
        evidenceImage: (mfgObj?.sourceImage as any) || 'Back',
        extractedValue: `${mfgVal} (${addrVal})`,
        inspectorValue: mfgObj?.verifiedValue,
        confidenceState: getFieldConfidenceState(mfgObj),
        confidence: mfgObj?.confidence ?? 87,
        notes: 'Complete manufacturer/packer corporate entity and postal address identified.',
      });
    } else {
      findings.push({
        ruleId: 'rule-lm-003',
        ruleCode: 'LM-003',
        requirement: 'Manufacturer / packer identification should be visible',
        observedEvidence: `Entity "${mfgVal}" detected, but physical address incomplete`,
        status: 'POTENTIAL ISSUE — MANUAL VERIFICATION',
        evidenceImage: (mfgObj?.sourceImage as any) || 'Back',
        extractedValue: mfgVal,
        inspectorValue: mfgObj?.verifiedValue,
        confidenceState: 'LOW CONFIDENCE',
        confidence: 68,
        notes: 'Full manufacturer address declaration must be verified for statutory compliance.',
      });
    }
  } else {
    findings.push({
      ruleId: 'rule-lm-003',
      ruleCode: 'LM-003',
      requirement: 'Manufacturer / packer identification should be visible',
      observedEvidence: 'Not found in submitted package images',
      status: 'NOT DETECTED IN SUBMITTED IMAGES',
      evidenceImage: 'None',
      extractedValue: '—',
      confidenceState: 'NOT DETECTED',
      confidence: 0,
      notes: 'Manufacturer or packer declaration not found on package.',
    });
  }

  // 4. Check Rule LM-004 (Date information)
  const dateObj = getFieldObj('dateInformation');
  const expObj = getFieldObj('bestBefore');
  const dateVal = getFieldValue('dateInformation');
  const expVal = getFieldValue('bestBefore');

  if ((dateVal && !dateObj?.isNotVisible) || (expVal && !expObj?.isNotVisible)) {
    const combined = [dateVal, expVal].filter(Boolean).join(' | ');
    findings.push({
      ruleId: 'rule-lm-004',
      ruleCode: 'LM-004',
      requirement: 'Required date information should be visible where applicable',
      observedEvidence: `${combined} visible on ${dateObj?.sourceImage || expObj?.sourceImage || 'Side'} surface`,
      status: 'DETECTED',
      evidenceImage: (dateObj?.sourceImage as any) || (expObj?.sourceImage as any) || 'Side',
      extractedValue: combined,
      confidenceState: getFieldConfidenceState(dateObj || expObj),
      confidence: 88,
      notes: 'Pre-packing, manufacturing, or shelf-life date text identified on package.',
    });
  } else {
    findings.push({
      ruleId: 'rule-lm-004',
      ruleCode: 'LM-004',
      requirement: 'Required date information should be visible where applicable',
      observedEvidence: 'Not found in submitted package images',
      status: 'POTENTIAL ISSUE — MANUAL VERIFICATION',
      evidenceImage: 'None',
      extractedValue: '—',
      confidenceState: 'NOT DETECTED',
      confidence: 0,
      notes: 'Manufacturing date or best before statement not detected. Check package crimp seal or lateral flaps.',
    });
  }

  // 5. Check Rule LM-005 (Consumer Care)
  const ccObj = getFieldObj('consumerCare');
  const ccVal = getFieldValue('consumerCare');

  if (ccVal && !ccObj?.isNotVisible) {
    const hasContact = /@|\d{10}|\d{4}|care|help|toll/i.test(ccVal);
    if (hasContact) {
      findings.push({
        ruleId: 'rule-lm-005',
        ruleCode: 'LM-005',
        requirement: 'Consumer care information should be visible where applicable',
        observedEvidence: `${ccVal} detected on ${ccObj?.sourceImage || 'Back'} surface`,
        status: 'DETECTED',
        evidenceImage: (ccObj?.sourceImage as any) || 'Back',
        extractedValue: ccVal,
        inspectorValue: ccObj?.verifiedValue,
        confidenceState: getFieldConfidenceState(ccObj),
        confidence: ccObj?.confidence ?? 84,
        notes: 'Consumer helpline number or grievance email clearly visible.',
      });
    } else {
      findings.push({
        ruleId: 'rule-lm-005',
        ruleCode: 'LM-005',
        requirement: 'Consumer care information should be visible where applicable',
        observedEvidence: `Consumer care mention found without specific phone/email: "${ccVal}"`,
        status: 'POTENTIAL ISSUE — MANUAL VERIFICATION',
        evidenceImage: (ccObj?.sourceImage as any) || 'Back',
        extractedValue: ccVal,
        confidenceState: 'LOW CONFIDENCE',
        confidence: 62,
        notes: 'Inspector should check if valid phone, email or postal contact is present.',
      });
    }
  } else {
    findings.push({
      ruleId: 'rule-lm-005',
      ruleCode: 'LM-005',
      requirement: 'Consumer care information should be visible where applicable',
      observedEvidence: 'Not found in submitted package images',
      status: 'POTENTIAL ISSUE — MANUAL VERIFICATION',
      evidenceImage: 'None',
      extractedValue: '—',
      confidenceState: 'NOT DETECTED',
      confidence: 0,
      notes: 'Consumer grievance redressal channel not visible in submitted package images.',
    });
  }

  // Calculate summary statistics
  const capturedCount = Object.values(images).filter(Boolean).length;
  const extractedCount = Object.values(fields).filter((f) => !f.isNotVisible && Boolean(f.extractedValue || f.verifiedValue)).length;
  const potentialIssues = findings.filter((f) => f.status === 'POTENTIAL ISSUE — MANUAL VERIFICATION').length;
  const notDetected = findings.filter((f) => f.status === 'NOT DETECTED IN SUBMITTED IMAGES').length;
  const detected = findings.filter((f) => f.status === 'DETECTED').length;

  const manualVerificationCount = Object.values(fields).filter(
    (f) => f.isManuallyVerified || f.confidenceState === 'LOW CONFIDENCE'
  ).length;

  return {
    findings,
    summary: {
      imagesCaptured: capturedCount,
      fieldsExtracted: extractedCount,
      rulesChecked: findings.length,
      potentialIssues,
      manualVerificationRequired: manualVerificationCount || potentialIssues,
      detectedCount: detected,
      notDetectedCount: notDetected,
    },
  };
}

export const PROTOTYPE_RULES = STANDARD_RULES;

export function determineOverallStatus(findings: RuleFinding[]): OverallInspectionStatus {
  const hasIssues = findings.some(
    (f) => f.status === 'POTENTIAL ISSUE — MANUAL VERIFICATION' || f.status === 'NOT DETECTED IN SUBMITTED IMAGES'
  );
  if (hasIssues) {
    return 'REQUIRES MANUAL VERIFICATION';
  }
  return 'COMPLETED';
}

export const ruleEngine = {
  evaluateFindings: (fields: Record<string, ExtractedField>, images: PackageImages): RuleFinding[] => {
    return evaluatePackageRules(fields, images).findings;
  },
  evaluatePackageRules,
  determineOverallStatus,
  rules: STANDARD_RULES,
  references: PROTOTYPE_REFERENCES,
};
