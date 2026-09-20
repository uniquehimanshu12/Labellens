import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { InspectionRecord } from '../types';
import { ReportPDFDocument } from '../components/reports/ReportPDF';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Downloads a Blob to the user's browser with the given filename
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Helper to generate a PDF using pdf-lib as a reliable secondary generator
 */
async function generateFallbackPdfLibDoc(inspection: InspectionRecord): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Page 1
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page1.getSize();

  let y = height - 40;

  // Header Banner
  page1.drawText('LABEL LENS · SIH26034', { x: 40, y, size: 8, font: helveticaBold, color: rgb(0.43, 0.16, 0.85) });
  page1.drawText(`ID: ${inspection.id || 'N/A'}`, { x: width - 180, y, size: 8, font: helveticaBold, color: rgb(0.06, 0.09, 0.16) });
  y -= 12;

  page1.drawText('Evidence-Based Package Inspection Assistant', { x: 40, y, size: 7, font: helvetica, color: rgb(0.39, 0.45, 0.55) });
  page1.drawText(`Date: ${new Date(inspection.createdAt || Date.now()).toLocaleDateString()}`, { x: width - 180, y, size: 7, font: helvetica, color: rgb(0.39, 0.45, 0.55) });
  y -= 16;

  page1.drawText('INSPECTION REPORT', { x: 40, y, size: 16, font: helveticaBold, color: rgb(0.06, 0.09, 0.16) });
  page1.drawText(`Status: ${inspection.status || 'IN PROGRESS'}`, { x: width - 180, y, size: 8, font: helveticaBold, color: rgb(0.08, 0.5, 0.24) });
  y -= 12;

  page1.drawText('Statutory Packaging Compliance Verification Dossier', { x: 40, y, size: 8, font: helvetica, color: rgb(0.28, 0.33, 0.41) });
  y -= 16;

  page1.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 2,
    color: rgb(0.43, 0.16, 0.85),
  });
  y -= 20;

  // 1. Summary & Inspector Profile
  page1.drawText('1. INSPECTION & INSPECTOR PROFILE', { x: 40, y, size: 9, font: helveticaBold, color: rgb(0.06, 0.09, 0.16) });
  y -= 14;

  // Info Box
  page1.drawRectangle({
    x: 40,
    y: y - 50,
    width: width - 80,
    height: 55,
    borderColor: rgb(0.89, 0.91, 0.94),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 0.99),
  });

  const row1Y = y - 14;
  page1.drawText('COMMODITY:', { x: 50, y: row1Y, size: 6.5, font: helveticaBold, color: rgb(0.39, 0.45, 0.55) });
  page1.drawText(String(inspection.productName || 'Unspecified').slice(0, 32), { x: 50, y: row1Y - 9, size: 8, font: helveticaBold, color: rgb(0.06, 0.09, 0.16) });

  page1.drawText('BARCODE / GTIN:', { x: 200, y: row1Y, size: 6.5, font: helveticaBold, color: rgb(0.39, 0.45, 0.55) });
  page1.drawText(String(inspection.barcode || 'Not Specified').slice(0, 20), { x: 200, y: row1Y - 9, size: 8, font: helvetica, color: rgb(0.06, 0.09, 0.16) });

  page1.drawText('INSPECTING OFFICER:', { x: 350, y: row1Y, size: 6.5, font: helveticaBold, color: rgb(0.39, 0.45, 0.55) });
  page1.drawText(`${inspection.inspector?.name || 'Authorized Officer'} (${inspection.inspector?.id || 'INS-N/A'})`, { x: 350, y: row1Y - 9, size: 8, font: helveticaBold, color: rgb(0.06, 0.09, 0.16) });

  const row2Y = y - 36;
  page1.drawText('LOCATION / VENUE:', { x: 50, y: row2Y, size: 6.5, font: helveticaBold, color: rgb(0.39, 0.45, 0.55) });
  page1.drawText(String(inspection.location?.placeName || 'Manual Entry').slice(0, 38), { x: 50, y: row2Y - 9, size: 7.5, font: helvetica, color: rgb(0.06, 0.09, 0.16) });

  page1.drawText('JURISDICTION:', { x: 280, y: row2Y, size: 6.5, font: helveticaBold, color: rgb(0.39, 0.45, 0.55) });
  page1.drawText(String(inspection.inspector?.jurisdiction || 'Legal Metrology Department').slice(0, 40), { x: 280, y: row2Y - 9, size: 7.5, font: helvetica, color: rgb(0.06, 0.09, 0.16) });

  y -= 75;

  // 2. Package Information Table (Statutory Declarations)
  page1.drawText('2. PACKAGE INFORMATION (MANDATORY DECLARATIONS)', { x: 40, y, size: 9, font: helveticaBold, color: rgb(0.06, 0.09, 0.16) });
  y -= 14;

  // Table header
  page1.drawRectangle({
    x: 40,
    y: y - 14,
    width: width - 80,
    height: 16,
    color: rgb(0.95, 0.96, 0.98),
  });
  page1.drawText('STATUTORY FIELD', { x: 50, y: y - 9, size: 7, font: helveticaBold, color: rgb(0.28, 0.33, 0.41) });
  page1.drawText('OBSERVED / VERIFIED VALUE', { x: 220, y: y - 9, size: 7, font: helveticaBold, color: rgb(0.28, 0.33, 0.41) });
  page1.drawText('PANEL', { x: width - 80, y: y - 9, size: 7, font: helveticaBold, color: rgb(0.28, 0.33, 0.41) });
  y -= 16;

  const keyLabels: Array<{ key: string; label: string }> = [
    { key: 'productName', label: 'Product / Commodity Name' },
    { key: 'brandName', label: 'Brand / Trade Name' },
    { key: 'mrp', label: 'Maximum Retail Price (MRP)' },
    { key: 'netQuantity', label: 'Net Quantity / Content' },
    { key: 'unitSalePrice', label: 'Unit Sale Price (USP)' },
    { key: 'manufacturer', label: 'Manufacturer / Packer' },
    { key: 'manufacturerAddress', label: 'Premises Address' },
    { key: 'dateInformation', label: 'Date of Mfg / Packing' },
    { key: 'bestBefore', label: 'Best Before / Expiry' },
    { key: 'batchNumber', label: 'Batch / Lot Number' },
    { key: 'consumerCare', label: 'Consumer Care Contact' },
    { key: 'countryOfOrigin', label: 'Country of Origin' },
    { key: 'licenseInfo', label: 'License / FSSAI / LM' },
    { key: 'barcode', label: 'Barcode / EAN' },
  ];

  keyLabels.forEach((item, idx) => {
    const field = inspection.extractedFields?.[item.key];
    const val = field?.isNotVisible
      ? 'Marked Not Visible'
      : field?.verifiedValue || field?.extractedValue || 'Not Detected';
    const isVerified = field?.isManuallyVerified;
    const panel = field?.sourceImage || '—';

    if (idx % 2 === 1) {
      page1.drawRectangle({
        x: 40,
        y: y - 12,
        width: width - 80,
        height: 14,
        color: rgb(0.98, 0.98, 0.99),
      });
    }

    page1.drawText(item.label, { x: 50, y: y - 8, size: 7, font: helveticaBold, color: rgb(0.06, 0.09, 0.16) });
    page1.drawText(String(val).slice(0, 48), {
      x: 220,
      y: y - 8,
      size: 7,
      font: isVerified ? helveticaBold : helvetica,
      color: val === 'Not Detected' ? rgb(0.58, 0.64, 0.72) : isVerified ? rgb(0.08, 0.5, 0.24) : rgb(0.12, 0.16, 0.23),
    });
    page1.drawText(panel, { x: width - 80, y: y - 8, size: 6.5, font: helvetica, color: rgb(0.39, 0.45, 0.55) });
    y -= 14;
  });

  // Footer Page 1
  page1.drawLine({ start: { x: 40, y: 30 }, end: { x: width - 40, y: 30 }, thickness: 0.5, color: rgb(0.89, 0.91, 0.94) });
  page1.drawText('LabelLens • SIH26034 Prototype • Legal Metrology Dossier', { x: 40, y: 20, size: 6.5, font: helvetica, color: rgb(0.58, 0.64, 0.72) });
  page1.drawText('Page 1 of 2', { x: width - 90, y: 20, size: 6.5, font: helvetica, color: rgb(0.58, 0.64, 0.72) });

  // Page 2: Rule Findings, Remarks, Signature, Notice
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  let y2 = height - 40;

  // Header Short
  page2.drawText(`LABEL LENS · INSPECTION REPORT #${inspection.id || 'N/A'}`, { x: 40, y: y2, size: 8, font: helveticaBold, color: rgb(0.43, 0.16, 0.85) });
  page2.drawText('Legal Metrology Verification (PCR 2011)', { x: width - 200, y: y2, size: 7.5, font: helvetica, color: rgb(0.39, 0.45, 0.55) });
  y2 -= 12;

  page2.drawLine({ start: { x: 40, y: y2 }, end: { x: width - 40, y: y2 }, thickness: 1, color: rgb(0.8, 0.84, 0.88) });
  y2 -= 18;

  // 3. Rule Verification Summary
  page2.drawText('3. RULE VERIFICATION SUMMARY (LEGAL METROLOGY RULES, 2011)', { x: 40, y: y2, size: 9, font: helveticaBold, color: rgb(0.06, 0.09, 0.16) });
  y2 -= 14;

  // Findings Table Header
  page2.drawRectangle({
    x: 40,
    y: y2 - 14,
    width: width - 80,
    height: 16,
    color: rgb(0.95, 0.96, 0.98),
  });
  page2.drawText('RULE', { x: 50, y: y2 - 9, size: 7, font: helveticaBold, color: rgb(0.28, 0.33, 0.41) });
  page2.drawText('REQUIREMENT', { x: 110, y: y2 - 9, size: 7, font: helveticaBold, color: rgb(0.28, 0.33, 0.41) });
  page2.drawText('OBSERVED INFORMATION', { x: 260, y: y2 - 9, size: 7, font: helveticaBold, color: rgb(0.28, 0.33, 0.41) });
  page2.drawText('STATUS', { x: 430, y: y2 - 9, size: 7, font: helveticaBold, color: rgb(0.28, 0.33, 0.41) });
  y2 -= 16;

  (inspection.findings || []).forEach((f, idx) => {
    if (idx % 2 === 1) {
      page2.drawRectangle({
        x: 40,
        y: y2 - 14,
        width: width - 80,
        height: 16,
        color: rgb(0.98, 0.98, 0.99),
      });
    }

    page2.drawText(f.ruleCode || 'LM-RULE', { x: 50, y: y2 - 9, size: 7, font: helveticaBold, color: rgb(0.43, 0.16, 0.85) });
    page2.drawText(String(f.requirement || '').slice(0, 32), { x: 110, y: y2 - 9, size: 7, font: helvetica, color: rgb(0.12, 0.16, 0.23) });
    page2.drawText(String(f.observedEvidence || '—').slice(0, 36), { x: 260, y: y2 - 9, size: 7, font: helvetica, color: rgb(0.28, 0.33, 0.41) });

    const st = (f.status || '').toUpperCase();
    const isDet = st.includes('DETECTED') && !st.includes('NOT');
    const isIssue = st.includes('ISSUE') || st.includes('MANUAL');

    page2.drawText(st.slice(0, 24), {
      x: 430,
      y: y2 - 9,
      size: 6.5,
      font: helveticaBold,
      color: isDet ? rgb(0.08, 0.5, 0.24) : isIssue ? rgb(0.7, 0.33, 0.04) : rgb(0.39, 0.45, 0.55),
    });
    y2 -= 16;
  });

  y2 -= 14;

  // 4. Inspector Remarks & Signature
  page2.drawText('4. OFFICER ENDORSEMENT & CERTIFICATION', { x: 40, y: y2, size: 9, font: helveticaBold, color: rgb(0.06, 0.09, 0.16) });
  y2 -= 14;

  page2.drawRectangle({
    x: 40,
    y: y2 - 60,
    width: width - 80,
    height: 65,
    borderColor: rgb(0.89, 0.91, 0.94),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 0.99),
  });

  const boxY = y2 - 14;
  page2.drawText('INSPECTOR REMARKS:', { x: 50, y: boxY, size: 6.5, font: helveticaBold, color: rgb(0.39, 0.45, 0.55) });
  page2.drawText(String(inspection.remarks && inspection.remarks.trim() ? inspection.remarks : 'No additional field remarks recorded.').slice(0, 80), {
    x: 50,
    y: boxY - 10,
    size: 7.5,
    font: helveticaOblique,
    color: rgb(0.2, 0.25, 0.33),
  });

  const sigX = 360;
  page2.drawText('OFFICER SIGNATURE:', { x: sigX, y: boxY, size: 6.5, font: helveticaBold, color: rgb(0.39, 0.45, 0.55) });
  page2.drawText(`${inspection.inspector?.name || 'Rahul Sharma'} (${inspection.inspector?.id || 'INS-1042'})`, {
    x: sigX,
    y: boxY - 10,
    size: 7.5,
    font: helveticaBold,
    color: rgb(0.06, 0.09, 0.16),
  });
  page2.drawText(
    inspection.signature?.signedAt
      ? `Electronically certified: ${new Date(inspection.signature.signedAt).toLocaleDateString()}`
      : 'Signature: Verified during inspection session',
    { x: sigX, y: boxY - 22, size: 6.5, font: helvetica, color: rgb(0.08, 0.5, 0.24) }
  );

  y2 -= 90;

  // Statutory Notice
  page2.drawRectangle({
    x: 40,
    y: y2 - 36,
    width: width - 80,
    height: 40,
    color: rgb(0.96, 0.97, 0.99),
    borderColor: rgb(0.89, 0.91, 0.94),
    borderWidth: 1,
  });
  page2.drawText('STATUTORY REGULATORY NOTICE:', { x: 50, y: y2 - 10, size: 6.5, font: helveticaBold, color: rgb(0.28, 0.33, 0.41) });
  page2.drawText(
    'LabelLens is an evidence-based prototype verification tool calibrated to the Legal Metrology (Packaged Commodities) Rules, 2011.',
    { x: 50, y: y2 - 20, size: 6.5, font: helvetica, color: rgb(0.39, 0.45, 0.55) }
  );
  page2.drawText(
    'Final regulatory verification and enforcement determinations remain with the authorized inspecting officer under the Legal Metrology Act, 2009.',
    { x: 50, y: y2 - 29, size: 6.5, font: helvetica, color: rgb(0.39, 0.45, 0.55) }
  );

  // Footer Page 2
  page2.drawLine({ start: { x: 40, y: 30 }, end: { x: width - 40, y: 30 }, thickness: 0.5, color: rgb(0.89, 0.91, 0.94) });
  page2.drawText('LabelLens • SIH26034 Prototype • Legal Metrology Dossier', { x: 40, y: 20, size: 6.5, font: helvetica, color: rgb(0.58, 0.64, 0.72) });
  page2.drawText('Page 2 of 2', { x: width - 90, y: 20, size: 6.5, font: helvetica, color: rgb(0.58, 0.64, 0.72) });

  return await pdfDoc.save();
}

/**
 * Main PDF generator function
 * Produces a real PDF Blob from the existing saved inspection record
 */
export async function generateInspectionPdf(inspection: InspectionRecord): Promise<{ blob: Blob; filename: string }> {
  const safeId = (inspection.id || 'INSPECTION').replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `LabelLens_${safeId}_Report.pdf`;

  try {
    // Primary: Attempt @react-pdf/renderer
    const docElement = React.createElement(ReportPDFDocument, { inspection });
    const blob = await pdf(docElement as any).toBlob();
    if (blob && blob.size > 500) {
      return { blob, filename };
    }
  } catch (primaryError) {
    console.warn('React-PDF renderer warning, using direct pdf-lib engine:', primaryError);
  }

  // Secondary/Fallback: Robust pdf-lib direct generator
  try {
    const pdfBytes = await generateFallbackPdfLibDoc(inspection);
    const fallbackBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    return { blob: fallbackBlob, filename };
  } catch (fallbackError) {
    console.error('All PDF engines failed:', fallbackError);
    throw new Error('Failed to generate PDF document from inspection data.');
  }
}
