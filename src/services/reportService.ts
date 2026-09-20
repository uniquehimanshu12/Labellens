import { InspectionRecord } from '../types';
import { generateInspectionPdf, triggerBlobDownload } from './pdfReportGenerator';

export const reportService = {
  /**
   * Triggers browser print dialog
   */
  printReport(inspectionId?: string): void {
    if (inspectionId && typeof window !== 'undefined') {
      // If we are in an iframe and need full standalone page print
      const isIframe = window.self !== window.top;
      if (isIframe) {
        // Support hash route for direct printing
        const printUrl = `${window.location.origin}${window.location.pathname}#print-report/${inspectionId}`;
        const printWindow = window.open(printUrl, '_blank');
        if (printWindow) {
          return;
        }
      }
    }
    window.print();
  },

  /**
   * Generates and downloads a real .pdf file from the existing saved inspection data
   */
  async downloadPdf(inspection: InspectionRecord): Promise<{ success: boolean; filename: string }> {
    try {
      const { blob, filename } = await generateInspectionPdf(inspection);
      triggerBlobDownload(blob, filename);
      return { success: true, filename };
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      throw error;
    }
  },

  generateReportSummary(record: InspectionRecord) {
    const totalRules = record.findings?.length || 0;
    const detected = (record.findings || []).filter((f) => f.status === 'DETECTED').length;
    const potentialIssues = (record.findings || []).filter(
      (f) => f.status === 'POTENTIAL ISSUE — MANUAL VERIFICATION'
    ).length;
    const notDetected = (record.findings || []).filter(
      (f) => f.status === 'NOT DETECTED IN SUBMITTED IMAGES'
    ).length;

    const manualCorrections = Object.values(record.extractedFields || {}).filter(
      (f) => f.isManuallyVerified
    );

    return {
      totalRules,
      detected,
      potentialIssues,
      notDetected,
      manualCorrectionsCount: manualCorrections.length,
      manualCorrections,
    };
  },
};
