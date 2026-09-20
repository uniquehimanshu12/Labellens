import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { InspectionRecord, ExtractedField, ManualCorrectionItem, ImageSide } from '../../types';

// Define PDF styles matching the official A4 dossier design
const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#6d28d9',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'column',
    maxWidth: '65%',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: '35%',
  },
  brandText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6d28d9',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  subBrandText: {
    fontSize: 7,
    color: '#64748b',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  docSubtitle: {
    fontSize: 8,
    color: '#475569',
    marginTop: 2,
  },
  metaItem: {
    fontSize: 8,
    color: '#334155',
    marginBottom: 2,
  },
  metaLabel: {
    color: '#64748b',
  },
  metaValueBold: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 'bold',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  statusCompleted: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
  },
  sectionContainer: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    borderBottomStyle: 'solid',
    paddingBottom: 3,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 7,
    color: '#64748b',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
  },
  infoCol: {
    width: '25%',
    padding: 3,
  },
  infoCol3: {
    width: '33.33%',
    padding: 3,
  },
  infoCol2: {
    width: '50%',
    padding: 3,
  },
  infoLabel: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 8,
    color: '#0f172a',
  },
  infoValueBold: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  imageCard: {
    width: '23.5%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 4,
    alignItems: 'center',
  },
  imageCardTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  imageCardSub: {
    fontSize: 5.5,
    color: '#64748b',
    marginBottom: 3,
    textAlign: 'center',
  },
  packageImg: {
    width: '100%',
    height: 70,
    objectFit: 'contain',
    borderRadius: 2,
    backgroundColor: '#0f172a',
  },
  noImagePlaceholder: {
    width: '100%',
    height: 70,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 6.5,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  thText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tdText: {
    fontSize: 7.5,
    color: '#334155',
  },
  tdTextBold: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  tdTextMono: {
    fontSize: 7,
    color: '#1e293b',
  },
  tagVerified: {
    fontSize: 6,
    color: '#15803d',
    fontWeight: 'bold',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  tagDetected: {
    fontSize: 6,
    color: '#15803d',
    fontWeight: 'bold',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  tagIssue: {
    fontSize: 6,
    color: '#b45309',
    fontWeight: 'bold',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  tagNotDetected: {
    fontSize: 6,
    color: '#64748b',
    fontWeight: 'bold',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  tagNotApplicable: {
    fontSize: 6,
    color: '#475569',
    fontWeight: 'bold',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  remarksBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
    fontSize: 7.5,
    color: '#334155',
    lineHeight: 1.3,
  },
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 8,
  },
  sigLeft: {
    width: '55%',
  },
  sigRight: {
    width: '40%',
    alignItems: 'flex-end',
  },
  signatureImg: {
    width: 100,
    height: 36,
    objectFit: 'contain',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 2,
    marginBottom: 3,
  },
  disclaimerBox: {
    marginTop: 10,
    padding: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  disclaimerText: {
    fontSize: 6.5,
    color: '#64748b',
    lineHeight: 1.3,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 4,
    fontSize: 6.5,
    color: '#94a3b8',
  },
});

interface ReportPDFProps {
  inspection: InspectionRecord;
}

export const ReportPDFDocument: React.FC<ReportPDFProps> = ({ inspection }) => {
  // Helper for priority display
  const getFieldDisplay = (field?: ExtractedField) => {
    if (!field) return { display: 'Not Detected', isVerified: false };
    if (field.isNotVisible) return { display: 'Marked Not Visible', isVerified: true };
    if (field.verifiedValue && field.verifiedValue.trim()) {
      return { display: field.verifiedValue, isVerified: Boolean(field.isManuallyVerified) };
    }
    if (field.extractedValue && field.extractedValue.trim()) {
      return { display: field.extractedValue, isVerified: false };
    }
    return { display: 'Not Detected', isVerified: false };
  };

  // Structured fields list
  const structuredFields = [
    { key: 'productName', label: 'Product / Commodity Name' },
    { key: 'brandName', label: 'Brand / Trade Name' },
    { key: 'productVariant', label: 'Product Variant / Type' },
    { key: 'mrp', label: 'Maximum Retail Price (MRP)' },
    { key: 'netQuantity', label: 'Net Quantity / Content' },
    { key: 'unitSalePrice', label: 'Unit Sale Price (USP)' },
    { key: 'manufacturer', label: 'Manufacturer / Packer Name' },
    { key: 'manufacturerAddress', label: 'Manufacturer Address' },
    { key: 'dateInformation', label: 'Date of Mfg / Packing' },
    { key: 'bestBefore', label: 'Best Before / Expiry' },
    { key: 'batchNumber', label: 'Batch / Lot Number' },
    { key: 'consumerCare', label: 'Consumer Care Helpline' },
    { key: 'countryOfOrigin', label: 'Country of Origin' },
    { key: 'licenseInfo', label: 'License / Registration (FSSAI/LM)' },
    { key: 'barcode', label: 'Barcode / GTIN' },
    { key: 'ingredients', label: 'Ingredients / Composition' },
    { key: 'nutritionalInfo', label: 'Nutritional Info' },
    { key: 'storageInstructions', label: 'Storage Instructions' },
    { key: 'warnings', label: 'Warnings / Precautionary' },
  ];

  // Manual corrections
  const manualCorrections: ManualCorrectionItem[] = React.useMemo(() => {
    if (inspection.manualCorrections && inspection.manualCorrections.length > 0) {
      return inspection.manualCorrections;
    }
    const list: ManualCorrectionItem[] = [];
    Object.values(inspection.extractedFields || {}).forEach((f) => {
      if (f.isManuallyVerified || f.audit) {
        list.push({
          fieldKey: f.key,
          fieldLabel: f.label,
          originalValue: f.audit?.originalValue || f.extractedValue || 'Not Detected',
          verifiedValue: f.isNotVisible ? 'Marked Not Visible' : f.verifiedValue || f.extractedValue || 'Verified',
          changedBy: f.audit?.changedBy || inspection.inspector?.id || 'Inspector',
          timestamp: f.audit?.timestamp
            ? new Date(f.audit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'During Review',
        });
      }
    });
    return list;
  }, [inspection]);

  // Detected text by surface
  const textBySurface: Record<string, string[]> = React.useMemo(() => {
    const grouped: Record<string, string[]> = { Front: [], Back: [], Side: [], Additional: [] };
    if (inspection.allDetectedText) {
      const surfaceKeys: Array<'Front' | 'Back' | 'Side' | 'Additional'> = ['Front', 'Back', 'Side', 'Additional'];
      surfaceKeys.forEach((side) => {
        const textArr = inspection.allDetectedText?.[side];
        if (Array.isArray(textArr)) {
          grouped[side] = [...textArr];
        }
      });
    }
    if (inspection.detectedTexts && inspection.detectedTexts.length > 0) {
      inspection.detectedTexts.forEach((dt) => {
        const s = dt.sourceSide || 'Front';
        if (grouped[s] && dt.text && !grouped[s].includes(dt.text)) {
          grouped[s].push(dt.text);
        }
      });
    }
    return grouped;
  }, [inspection]);

  const imagePanels: Array<{ side: ImageSide; label: string; src: string | null; sub: string }> = [
    { side: 'front', label: 'FRONT', src: inspection.images?.front || null, sub: 'Principal Display Panel' },
    { side: 'back', label: 'BACK', src: inspection.images?.back || null, sub: 'Manufacturer & Care' },
    { side: 'side', label: 'SIDE', src: inspection.images?.side || null, sub: 'MRP, Dates & Batch' },
    { side: 'additional', label: 'ADDITIONAL', src: inspection.images?.additional || null, sub: 'Flap / Auxiliary' },
  ];

  const renderStatusTag = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s.includes('DETECTED') && !s.includes('NOT')) {
      return <Text style={styles.tagDetected}>DETECTED</Text>;
    }
    if (s.includes('ISSUE') || s.includes('MANUAL')) {
      return <Text style={styles.tagIssue}>MANUAL VERIFICATION</Text>;
    }
    if (s.includes('NOT APPLICABLE')) {
      return <Text style={styles.tagNotApplicable}>NOT APPLICABLE</Text>;
    }
    return <Text style={styles.tagNotDetected}>NOT DETECTED</Text>;
  };

  return (
    <Document title={`LabelLens_${inspection.id}_Report`} author="LabelLens Legal Metrology">
      {/* PAGE 1: Summary, Inspector, Physical Images, Package Declarations */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandText}>LABEL LENS · SIH26034</Text>
            <Text style={styles.subBrandText}>Evidence-Based Package Inspection Assistant</Text>
            <Text style={styles.titleText}>INSPECTION REPORT</Text>
            <Text style={styles.docSubtitle}>Statutory Packaging Compliance Verification Dossier</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>ID: </Text>
              <Text style={styles.metaValueBold}>{inspection.id || 'N/A'}</Text>
            </Text>
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date: </Text>
              <Text>{new Date(inspection.createdAt || Date.now()).toLocaleDateString()}</Text>
            </Text>
            <Text style={styles.metaItem}>
              <Text style={styles.metaLabel}>Time: </Text>
              <Text>{new Date(inspection.createdAt || Date.now()).toLocaleTimeString()}</Text>
            </Text>
            <Text
              style={[
                styles.statusBadge,
                inspection.status?.toLowerCase().includes('completed')
                  ? styles.statusCompleted
                  : styles.statusPending,
              ]}
            >
              {inspection.status || 'IN PROGRESS'}
            </Text>
          </View>
        </View>

        {/* 1. Inspection Summary & Inspector Info */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Inspection & Inspector Profile</Text>
            <Text style={styles.sectionSub}>Authority Identification</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Commodity</Text>
              <Text style={styles.infoValueBold}>{inspection.productName || 'Unspecified'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Barcode / GTIN</Text>
              <Text style={styles.infoValue}>{inspection.barcode || 'Not Specified'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Inspector</Text>
              <Text style={styles.infoValueBold}>{inspection.inspector?.name || 'Authorized Officer'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Officer ID</Text>
              <Text style={styles.infoValue}>{inspection.inspector?.id || 'INS-N/A'}</Text>
            </View>
            <View style={styles.infoCol2}>
              <Text style={styles.infoLabel}>Location / Venue</Text>
              <Text style={styles.infoValue}>
                {inspection.location?.placeName || 'Manual Entry'}
                {inspection.location?.latitude ? ` (${inspection.location.latitude.toFixed(4)}°N, ${inspection.location.longitude?.toFixed(4)}°E)` : ''}
              </Text>
            </View>
            <View style={styles.infoCol2}>
              <Text style={styles.infoLabel}>Jurisdiction / Dept</Text>
              <Text style={styles.infoValue}>{inspection.inspector?.jurisdiction || 'Legal Metrology Department'}</Text>
            </View>
          </View>
        </View>

        {/* 2. Submitted Package Images */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. Submitted Package Images</Text>
            <Text style={styles.sectionSub}>Physical Packaging Evidence</Text>
          </View>
          <View style={styles.imageGrid}>
            {imagePanels.map((panel) => (
              <View key={panel.side} style={styles.imageCard}>
                <Text style={styles.imageCardTitle}>{panel.label}</Text>
                <Text style={styles.imageCardSub}>{panel.sub}</Text>
                {panel.src ? (
                  <Image src={panel.src} style={styles.packageImg} />
                ) : (
                  <View style={styles.noImagePlaceholder}>
                    <Text style={styles.noImageText}>Panel not submitted</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* 3. Package Information (Mandatory Declarations) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3. Package Information</Text>
            <Text style={styles.sectionSub}>Mandatory Declarations (Level A)</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, { width: '35%' }]}>Statutory Field</Text>
              <Text style={[styles.thText, { width: '45%' }]}>Observed / Verified Value</Text>
              <Text style={[styles.thText, { width: '20%', textAlign: 'right' }]}>Source Panel</Text>
            </View>
            {structuredFields.map((item, idx) => {
              const field = inspection.extractedFields?.[item.key];
              const val = getFieldDisplay(field);
              const isDetected = val.display !== 'Not Detected';

              return (
                <View key={item.key} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tdTextBold, { width: '35%' }]}>{item.label}</Text>
                  <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={[styles.tdText, !isDetected ? { color: '#94a3b8', fontStyle: 'italic' } : {}]}>
                      {val.display}
                    </Text>
                    {val.isVerified && <Text style={styles.tagVerified}>[Verified]</Text>}
                  </View>
                  <Text style={[styles.tdText, { width: '20%', textAlign: 'right', color: '#64748b' }]}>
                    {field?.sourceImage ? `${field.sourceImage}` : '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Footer Page 1 */}
        <View style={styles.footer} fixed>
          <Text>LabelLens • SIH26034 Prototype • Legal Metrology Dossier</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* PAGE 2: Detected Text, Field Evidence, Rule Findings, Corrections, Signature & Timeline */}
      <Page size="A4" style={styles.page}>
        {/* Header Short */}
        <View style={[styles.headerContainer, { paddingBottom: 6, marginBottom: 10 }]}>
          <Text style={styles.brandText}>LABEL LENS · INSPECTION REPORT #{inspection.id || 'N/A'}</Text>
          <Text style={styles.metaItem}>Legal Metrology Verification (PCR 2011)</Text>
        </View>

        {/* 4. Complete Detected Package Text */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>4. Complete Detected Package Text</Text>
            <Text style={styles.sectionSub}>OCR Text Lines by Surface</Text>
          </View>
          <View style={styles.infoGrid}>
            {(['Front', 'Back', 'Side', 'Additional'] as const).map((side) => {
              const lines = textBySurface[side] || [];
              return (
                <View key={side} style={styles.infoCol2}>
                  <Text style={styles.infoLabel}>{side} Surface ({lines.length} lines)</Text>
                  <Text style={[styles.infoValue, { fontSize: 6.5, color: lines.length ? '#334155' : '#94a3b8' }]}>
                    {lines.length > 0 ? lines.slice(0, 4).join(' · ') + (lines.length > 4 ? ` (+${lines.length - 4} more)` : '') : 'No text lines detected'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 5. Rule Verification Summary */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>5. Rule Verification Summary</Text>
            <Text style={styles.sectionSub}>Legal Metrology (Packaged Commodities) Rules, 2011</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, { width: '15%' }]}>Rule</Text>
              <Text style={[styles.thText, { width: '28%' }]}>Requirement</Text>
              <Text style={[styles.thText, { width: '27%' }]}>Observed Information</Text>
              <Text style={[styles.thText, { width: '18%', textAlign: 'center' }]}>Status</Text>
              <Text style={[styles.thText, { width: '12%', textAlign: 'right' }]}>Evidence</Text>
            </View>
            {(inspection.findings || []).map((f, idx) => (
              <View key={f.ruleCode || idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tdTextBold, { width: '15%', color: '#6d28d9' }]}>{f.ruleCode}</Text>
                <Text style={[styles.tdText, { width: '28%' }]}>{f.requirement}</Text>
                <Text style={[styles.tdText, { width: '27%' }]}>{f.observedEvidence || '—'}</Text>
                <View style={{ width: '18%', alignItems: 'center' }}>
                  {renderStatusTag(f.status)}
                </View>
                <Text style={[styles.tdText, { width: '12%', textAlign: 'right', color: '#64748b' }]}>
                  {f.evidenceImage ? `${f.evidenceImage}` : 'Submitted'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. Manual Corrections & Remarks */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>6. Inspector Corrections & Remarks</Text>
            <Text style={styles.sectionSub}>Audit History & Field Notes</Text>
          </View>
          {manualCorrections.length > 0 ? (
            <View style={[styles.table, { marginBottom: 6 }]}>
              <View style={styles.tableHeader}>
                <Text style={[styles.thText, { width: '30%' }]}>Field</Text>
                <Text style={[styles.thText, { width: '30%' }]}>Original</Text>
                <Text style={[styles.thText, { width: '25%' }]}>Verified Value</Text>
                <Text style={[styles.thText, { width: '15%', textAlign: 'right' }]}>Time</Text>
              </View>
              {manualCorrections.map((c, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tdTextBold, { width: '30%' }]}>{c.fieldLabel}</Text>
                  <Text style={[styles.tdText, { width: '30%', color: '#94a3b8', textDecoration: 'line-through' }]}>{c.originalValue}</Text>
                  <Text style={[styles.tdTextBold, { width: '25%', color: '#15803d' }]}>{c.verifiedValue}</Text>
                  <Text style={[styles.tdText, { width: '15%', textAlign: 'right', color: '#64748b' }]}>{c.timestamp}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.remarksBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 2, color: '#0f172a' }}>Inspector Remarks: </Text>
            <Text>{inspection.remarks && inspection.remarks.trim() ? inspection.remarks : 'No additional inspector remarks recorded.'}</Text>
          </View>
        </View>

        {/* 7. Inspector Signature & Certification */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>7. Officer Endorsement & Activity Log</Text>
            <Text style={styles.sectionSub}>Digital Signature Certification</Text>
          </View>
          <View style={styles.signatureContainer}>
            <View style={styles.sigLeft}>
              <Text style={styles.infoLabel}>Inspecting Official</Text>
              <Text style={styles.infoValueBold}>{inspection.inspector?.name || 'Rahul Sharma'}</Text>
              <Text style={styles.infoValue}>Officer ID: {inspection.inspector?.id || 'INS-1042'}</Text>
              <Text style={[styles.infoValue, { color: '#64748b', fontSize: 7 }]}>
                Jurisdiction: {inspection.inspector?.jurisdiction || 'Northern Zone, Legal Metrology'}
              </Text>
              <Text style={[styles.infoValue, { color: '#64748b', fontSize: 6.5, marginTop: 4 }]}>
                Activity Count: {(inspection.activityLog || []).length} log events recorded
              </Text>
            </View>
            <View style={styles.sigRight}>
              <Text style={[styles.infoLabel, { textAlign: 'right' }]}>Digital Signature Record</Text>
              {inspection.signature?.signatureDataUrl ? (
                <Image src={inspection.signature.signatureDataUrl} style={styles.signatureImg} />
              ) : (
                <Text style={{ fontSize: 7, color: '#94a3b8', fontStyle: 'italic', marginVertical: 8 }}>
                  Not signed electronically
                </Text>
              )}
              <Text style={[styles.infoValue, { fontSize: 6.5, color: '#15803d', fontWeight: 'bold' }]}>
                {inspection.signature?.signedAt ? `Signed: ${new Date(inspection.signature.signedAt).toLocaleString()}` : 'Pending signature'}
              </Text>
            </View>
          </View>
        </View>

        {/* Disclaimer Notice */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            <Text style={{ fontWeight: 'bold' }}>Regulatory Reference Note: </Text>
            LabelLens is an evidence-based prototype verification tool calibrated to the Legal Metrology (Packaged Commodities) Rules, 2011. Final regulatory verification and enforcement determinations remain with the authorized inspecting officer under the Legal Metrology Act, 2009.
          </Text>
        </View>

        {/* Footer Page 2 */}
        <View style={styles.footer} fixed>
          <Text>LabelLens • SIH26034 Prototype • Legal Metrology Dossier</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
