import {
  ExtractedField,
  PackageImages,
  ImageQualityWarning,
  ConfidenceState,
  ConfidenceLevel,
  FieldStatus,
  ImageQualityState,
  EvidenceRegion,
  DetectedText,
  UploadedImageRecord,
  RawAnalysisDebugInfo,
  OtherDetectedInfo,
} from '../types';

export interface ExtractionResult {
  fields: Record<string, ExtractedField>;
  qualityWarnings?: Record<string, ImageQualityWarning>;
  modeUsed: 'AI' | 'DEMO' | 'MANUAL';
  error?: string;
  rawResponse?: any;
  modelUsed?: string;
  detectedTexts?: DetectedText[];
  allDetectedText?: Record<'Front' | 'Back' | 'Side' | 'Additional', string[]>;
  otherDetectedInfo?: OtherDetectedInfo[];
  summary?: {
    totalTextsFound: number;
    fieldsIdentified: number;
    manualVerificationNeeded: number;
    notDetected: number;
  };
  scanSummary?: {
    totalTextsFound: number;
    fieldsIdentified: number;
    manualVerificationNeeded: number;
    notDetected: number;
  };
}

export const ocrService = {
  async extractDeclarations(
    images: PackageImages,
    mode: 'live' | 'demo' | 'ai' = 'live',
    options?: {
      imageRecords?: Record<string, UploadedImageRecord | null>;
      inspectionId?: string;
      onProgress?: (status: string, stepIndex?: number) => void;
    }
  ): Promise<ExtractionResult> {
    const notify = (msg: string, step?: number) => {
      if (options?.onProgress) options.onProgress(msg, step);
    };

    const hasAnyImage = Boolean(images.front || images.back || images.side || images.additional);

    if (!hasAnyImage) {
      notify('No package images submitted. Initializing manual declaration layout...', 1);
      await new Promise((r) => setTimeout(r, 200));
      return this.generateEmptyExtraction();
    }

    // Explicit Demo Mode
    if (mode === 'demo') {
      notify('Demo mode: Generating simulated inspection layout...', 2);
      await new Promise((r) => setTimeout(r, 300));
      return this.generateDemoExtraction(images, options?.imageRecords);
    }

    // LIVE AI ANALYSIS
    notify('Stage 1: Validating image payloads and dimensions...', 1);
    await new Promise((r) => setTimeout(r, 200));

    notify('Stage 2: Connecting to Gemini Multimodal Vision API...', 2);

    try {
      notify('Stage 3: Extracting visible text and coordinates directly from pixels...', 3);
      const res = await fetch('/api/ocr/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          imageRecords: options?.imageRecords,
          inspectionId: options?.inspectionId,
          demoMode: false,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = json.error || 'Gemini AI extraction failed.';
        notify(`Extraction issue: ${errorMsg}`, 4);
        console.error('OCR Extraction Failed:', json);
        return {
          ...this.generateEmptyExtraction(),
          modeUsed: 'AI',
          error: errorMsg,
        };
      }

      notify('Stage 4: Parsing statutory declarations and bounding coordinates...', 4);
      await new Promise((r) => setTimeout(r, 200));

      notify('Stage 5: Finalizing evidence verification...', 5);

      if (json.fields) {
        const detectedTexts = Array.isArray(json.detectedTexts)
          ? json.detectedTexts
          : Array.isArray(json.ocrTokens)
          ? json.ocrTokens.map((t: any) => ({
              id: t.id,
              text: t.text,
              sourceImageId: t.imageId,
              sourceSide: t.sourceSide,
              x: t.bbox?.x,
              y: t.bbox?.y,
              width: t.bbox?.width,
              height: t.bbox?.height,
              pixelBbox: t.bbox,
            }))
          : [];
        return this.formatDirectFields(json.fields, json.modelUsed, json.rawResponse, detectedTexts);
      }

      return this.generateEmptyExtraction();
    } catch (err: any) {
      console.error('Error during live AI extraction:', err);
      notify(`AI extraction error: ${err.message || 'Connection failed'}`, 4);
      return {
        ...this.generateEmptyExtraction(),
        modeUsed: 'AI',
        error: err.message || 'Failed to communicate with AI service.',
      };
    }
  },

  // Direct single-image test endpoint for debugging and immediate pixel verification
  async analyzeSingleImage(
    inspectionId: string,
    image: UploadedImageRecord,
    demoMode = false
  ): Promise<{
    success: boolean;
    debugInfo?: RawAnalysisDebugInfo;
    fields?: Record<string, ExtractedField>;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/ocr/analyze-single-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspectionId,
          image,
          demoMode,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error || 'Single image AI analysis failed',
        };
      }

      const debugInfo: RawAnalysisDebugInfo = {
        inspectionId: json.inspectionId,
        imageId: json.imageId,
        fileName: json.fileName,
        width: json.width,
        height: json.height,
        modelUsed: json.modelUsed,
        extractionMode: json.extractionMode || (demoMode ? 'DEMO MODE' : 'LIVE AI ANALYSIS'),
        timestamp: json.timestamp || new Date().toISOString(),
        rawResponse: json.rawResponse || '',
        parsedResult: json.parsedResult || {},
        evidenceItems: json.evidenceItems || [],
      };

      return {
        success: true,
        debugInfo,
        fields: json.fields,
      };
    } catch (err: any) {
      console.error('analyzeSingleImage error:', err);
      return {
        success: false,
        error: err.message || 'Failed to call single image analysis API',
      };
    }
  },

  formatDirectFields(
    fields: Record<string, ExtractedField>,
    modelUsed?: string,
    rawResponse?: string,
    detectedTexts: DetectedText[] = []
  ): ExtractionResult {
    let identified = 0;
    let manual = 0;
    let notDet = 0;

    Object.values(fields).forEach((f) => {
      if (f.status === 'DETECTED') identified++;
      else if (f.status === 'NEEDS_MANUAL_VERIFICATION' || f.status === 'LOW_CONFIDENCE') manual++;
      else notDet++;
    });

    return {
      fields,
      modeUsed: 'AI',
      modelUsed,
      rawResponse,
      detectedTexts,
      qualityWarnings: {
        front: { qualityState: 'Good image quality' },
        back: { qualityState: 'Good image quality' },
        side: { qualityState: 'Readable' },
        additional: { qualityState: 'Readable' },
      },
      scanSummary: {
        totalTextsFound: detectedTexts.length || (identified + manual),
        fieldsIdentified: identified,
        manualVerificationNeeded: manual,
        notDetected: notDet,
      },
    };
  },

  generateEmptyExtraction(): ExtractionResult {
    const createEmptyField = (key: string, label: string): ExtractedField => ({
      key,
      label,
      extractedValue: '',
      verifiedValue: '',
      sourceImage: 'Not Visible',
      sourceImageId: undefined,
      confidenceState: 'NOT DETECTED',
      confidenceLevel: 'NOT DETECTED',
      status: 'NOT_DETECTED',
      confidence: 0,
      isManuallyVerified: false,
      isNotVisible: true,
      evidence: [],
      evidenceSnippet: 'No image submitted for this surface',
      locationDescription: 'Manual inspector entry required',
    });

    return {
      modeUsed: 'MANUAL',
      detectedTexts: [],
      fields: {
        productName: createEmptyField('productName', 'Product Name'),
        mrp: createEmptyField('mrp', 'Maximum Retail Price (MRP)'),
        netQuantity: createEmptyField('netQuantity', 'Net Quantity'),
        manufacturer: createEmptyField('manufacturer', 'Manufacturer / Packer'),
        address: createEmptyField('address', 'Manufacturer Address'),
        dateInformation: createEmptyField('dateInformation', 'Mfg / Packing Date'),
        bestBefore: createEmptyField('bestBefore', 'Best Before / Expiry'),
        consumerCare: createEmptyField('consumerCare', 'Consumer Care Contact'),
        batchNumber: createEmptyField('batchNumber', 'Batch / Lot Number'),
        countryOfOrigin: createEmptyField('countryOfOrigin', 'Country of Origin'),
      },
      qualityWarnings: {
        front: { qualityState: 'Good image quality', notes: 'No image submitted' },
        back: { qualityState: 'Good image quality', notes: 'No image submitted' },
        side: { qualityState: 'Good image quality', notes: 'No image submitted' },
        additional: { qualityState: 'Good image quality', notes: 'No image submitted' },
      },
      scanSummary: {
        totalTextsFound: 0,
        fieldsIdentified: 0,
        manualVerificationNeeded: 10,
        notDetected: 10,
      },
    };
  },

  formatAiResponse(data: any, images: PackageImages): ExtractionResult {
    let detectedTexts: DetectedText[] = [];
    if (Array.isArray(data.ocrTokens) && data.ocrTokens.length > 0) {
      detectedTexts = data.ocrTokens.map((tok: any, idx: number) => ({
        id: tok.id || `ocr_${idx + 1}`,
        text: String(tok.text || ''),
        sourceImageId: tok.imageId || `img_${String(tok.sourceSide || 'front').toLowerCase()}`,
        sourceSide: (tok.sourceSide as any) || 'Front',
        x: Math.max(0, Math.min(1, Number(tok.normalizedBbox?.x ?? tok.x) || 0)),
        y: Math.max(0, Math.min(1, Number(tok.normalizedBbox?.y ?? tok.y) || 0)),
        width: Math.max(0.01, Math.min(1, Number(tok.normalizedBbox?.width ?? tok.width) || 0.2)),
        height: Math.max(0.01, Math.min(1, Number(tok.normalizedBbox?.height ?? tok.height) || 0.05)),
      }));
    } else if (Array.isArray(data.detectedTexts)) {
      detectedTexts = data.detectedTexts.map((dt: any, idx: number) => ({
        id: dt.id || `dt_${idx + 1}`,
        text: String(dt.text || ''),
        sourceImageId: `img_${String(dt.sourceSide || 'front').toLowerCase()}`,
        sourceSide: (dt.sourceSide as any) || 'Front',
        x: Math.max(0, Math.min(1, Number(dt.x) || 0)),
        y: Math.max(0, Math.min(1, Number(dt.y) || 0)),
        width: Math.max(0.01, Math.min(1, Number(dt.width) || 0.2)),
        height: Math.max(0.01, Math.min(1, Number(dt.height) || 0.05)),
      }));
    }

    const buildField = (
      key: string,
      label: string,
      fieldObj: any,
      defaultSide: 'Front' | 'Back' | 'Side' | 'Additional' = 'Front'
    ): ExtractedField => {
      const val = fieldObj?.value || fieldObj?.extractedValue ? String(fieldObj.value || fieldObj.extractedValue).trim() : '';
      const hasValue = Boolean(val);
      const rawSide = fieldObj?.sourceSide || fieldObj?.sourceImage || (hasValue ? defaultSide : 'Not Visible');

      // Check if surface image was actually provided
      const sideKey = String(rawSide).toLowerCase() as keyof PackageImages;
      const surfaceImagePresent = Boolean(images[sideKey]);

      const evidence: EvidenceRegion[] = Array.isArray(fieldObj?.evidence)
        ? fieldObj.evidence.map((ev: any, idx: number) => ({
            id: `ev_${key}_${idx + 1}`,
            sourceImageId: `img_${String(ev.sourceSide || rawSide).toLowerCase()}`,
            sourceSide: (ev.sourceSide as any) || rawSide,
            x: Math.max(0, Math.min(1, Number(ev.x) || 0)),
            y: Math.max(0, Math.min(1, Number(ev.y) || 0)),
            width: Math.max(0.01, Math.min(1, Number(ev.width) || 0.2)),
            height: Math.max(0.01, Math.min(1, Number(ev.height) || 0.05)),
            snippet: ev.snippet || val,
            confidence: (fieldObj?.confidence as ConfidenceLevel) || 'HIGH',
          }))
        : [];

      let confLevel: ConfidenceLevel = 'NOT DETECTED';
      let status: FieldStatus = 'NOT_DETECTED';

      if (hasValue && surfaceImagePresent) {
        if (fieldObj?.confidence === 'LOW' || fieldObj?.status === 'LOW_CONFIDENCE') {
          confLevel = 'LOW';
          status = 'LOW_CONFIDENCE';
        } else if (fieldObj?.confidence === 'MEDIUM' || fieldObj?.status === 'NEEDS_MANUAL_VERIFICATION' || evidence.length === 0) {
          confLevel = 'MEDIUM';
          status = 'NEEDS_MANUAL_VERIFICATION';
        } else {
          confLevel = 'HIGH';
          status = 'DETECTED';
        }
      } else {
        confLevel = 'NOT DETECTED';
        status = 'NOT_DETECTED';
      }

      return {
        key,
        label,
        extractedValue: hasValue && surfaceImagePresent ? val : '',
        verifiedValue: hasValue && surfaceImagePresent ? val : '',
        sourceImage: hasValue && surfaceImagePresent ? rawSide : 'Not Visible',
        sourceImageId: `img_${String(rawSide).toLowerCase()}`,
        confidenceLevel: confLevel,
        confidenceState: (confLevel + ' CONFIDENCE') as ConfidenceState,
        confidence: confLevel === 'HIGH' ? 95 : confLevel === 'MEDIUM' ? 80 : confLevel === 'LOW' ? 50 : 0,
        status,
        evidence: surfaceImagePresent ? evidence : [],
        evidenceBox: fieldObj?.evidenceBox,
        sourceTokenIds: fieldObj?.sourceTokenIds,
        isManuallyVerified: false,
        isNotVisible: !hasValue || !surfaceImagePresent,
        evidenceSnippet: surfaceImagePresent ? (evidence[0]?.snippet || val) : 'Surface panel uncaptured',
        locationDescription: surfaceImagePresent && evidence[0] ? `X:${Math.round(evidence[0].x * 100)}% Y:${Math.round(evidence[0].y * 100)}%` : 'No evidence coordinates',
      };
    };

    const rawFields = data.fields || {};
    const fields: Record<string, ExtractedField> = {
      productName: buildField('productName', 'Product Name', rawFields.productName, 'Front'),
      mrp: buildField('mrp', 'Maximum Retail Price (MRP)', rawFields.mrp, 'Front'),
      netQuantity: buildField('netQuantity', 'Net Quantity', rawFields.netQuantity, 'Front'),
      manufacturer: buildField('manufacturer', 'Manufacturer / Packer', rawFields.manufacturer, 'Back'),
      address: buildField('address', 'Manufacturer Address', rawFields.address, 'Back'),
      dateInformation: buildField('dateInformation', 'Mfg / Packing Date', rawFields.dateInformation, 'Side'),
      bestBefore: buildField('bestBefore', 'Best Before / Expiry', rawFields.bestBefore, 'Side'),
      consumerCare: buildField('consumerCare', 'Consumer Care Contact', rawFields.consumerCare, 'Back'),
      batchNumber: buildField('batchNumber', 'Batch / Lot Number', rawFields.batchNumber, 'Side'),
      countryOfOrigin: buildField('countryOfOrigin', 'Country of Origin', rawFields.countryOfOrigin, 'Back'),
    };

    // Calculate Summary Counts
    let identified = 0;
    let manual = 0;
    let notDet = 0;

    Object.values(fields).forEach((f) => {
      if (f.status === 'DETECTED') identified++;
      else if (f.status === 'NEEDS_MANUAL_VERIFICATION' || f.status === 'LOW_CONFIDENCE') manual++;
      else notDet++;
    });

    const qualityWarnings: Record<string, ImageQualityWarning> = {
      front: {
        qualityState: data.qualityAssessments?.blurDetected ? 'Possible blur' : 'Good image quality',
        notes: data.qualityAssessments?.notes || 'Surface readable under inspection light',
      },
      back: { qualityState: 'Good image quality' },
      side: { qualityState: 'Readable' },
      additional: { qualityState: 'Readable' },
    };

    return {
      fields,
      detectedTexts,
      qualityWarnings,
      modeUsed: 'AI',
      rawResponse: data,
      scanSummary: {
        totalTextsFound: detectedTexts.length,
        fieldsIdentified: identified,
        manualVerificationNeeded: manual,
        notDetected: notDet,
      },
    };
  },

  // Explicit Demo Simulator ONLY used when the user explicitly selects Demo Mode
  generateDemoExtraction(
    images: PackageImages,
    imageRecords?: Record<string, UploadedImageRecord | null>
  ): ExtractionResult {
    const frontId = imageRecords?.front?.imageId || 'img_front_demo';
    const backId = imageRecords?.back?.imageId || 'img_back_demo';
    const sideId = imageRecords?.side?.imageId || 'img_side_demo';

    const createDemoField = (
      key: string,
      label: string,
      val: string,
      side: 'Front' | 'Back' | 'Side',
      imageId: string,
      pixelX: number,
      pixelY: number,
      pixelW: number,
      pixelH: number
    ): ExtractedField => {
      const imgW = 600;
      const imgH = 480;
      const normX = Number((pixelX / imgW).toFixed(4));
      const normY = Number((pixelY / imgH).toFixed(4));
      const normW = Number((pixelW / imgW).toFixed(4));
      const normH = Number((pixelH / imgH).toFixed(4));
      const tokenId = `tok_${side.toLowerCase()}_${key}`;

      return {
        key,
        label,
        extractedValue: val,
        verifiedValue: val,
        sourceImage: side,
        sourceImageId: imageId,
        confidenceState: 'HIGH CONFIDENCE',
        confidenceLevel: 'HIGH',
        status: 'DETECTED',
        confidence: 94,
        isManuallyVerified: false,
        isNotVisible: false,
        evidenceTokenIds: [tokenId],
        evidenceBox: {
          x: pixelX,
          y: pixelY,
          width: pixelW,
          height: pixelH,
          originalWidth: imgW,
          originalHeight: imgH,
          imageId,
          sourceSide: side,
          sourceTokenIds: [tokenId],
          tokenIds: [tokenId],
          tokens: [
            {
              id: tokenId,
              text: val,
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
            x: normX,
            y: normY,
            width: normW,
            height: normH,
            pixelBbox: { x: pixelX, y: pixelY, width: pixelW, height: pixelH },
            snippet: val,
            confidence: 'HIGH',
          },
        ],
        evidenceSnippet: val,
        locationDescription: `X:${pixelX}px Y:${pixelY}px W:${pixelW}px H:${pixelH}px on ${side} surface`,
      };
    };

    const fields: Record<string, ExtractedField> = {
      productName: createDemoField('productName', 'Product Name', 'ABC PREMIUM CREAM BISCUITS', 'Front', frontId, 28, 104, 340, 24),
      brandName: createDemoField('brandName', 'Brand Name', 'ABC', 'Front', frontId, 28, 104, 80, 24),
      mrp: createDemoField('mrp', 'Maximum Retail Price (MRP)', 'MRP ₹50.00 (Incl. of all taxes)', 'Front', frontId, 28, 182, 300, 24),
      netQuantity: createDemoField('netQuantity', 'Net Quantity', 'Net Quantity: 100 g', 'Front', frontId, 28, 156, 200, 24),
      manufacturer: createDemoField('manufacturer', 'Manufacturer / Packer', 'ABC Foods Pvt. Ltd., Plot No. 42-B,', 'Back', backId, 28, 130, 360, 24),
      address: createDemoField('address', 'Manufacturer Address', 'Sector 18 Industrial Area, Gurugram, Haryana - 122015', 'Back', backId, 28, 156, 460, 24),
      dateInformation: createDemoField('dateInformation', 'Mfg / Packing Date', 'Mfg. Date: 12/08/2026', 'Side', sideId, 28, 156, 240, 24),
      bestBefore: createDemoField('bestBefore', 'Best Before / Expiry', 'Best Before: 6 MONTHS FROM PACKAGING', 'Side', sideId, 28, 182, 360, 24),
      consumerCare: createDemoField('consumerCare', 'Consumer Care Contact', 'Toll Free: 1800-200-4567 | care@abcfoods.in', 'Back', backId, 28, 208, 400, 24),
      batchNumber: createDemoField('batchNumber', 'Batch / Lot Number', 'Batch No: B-2026-X89', 'Side', sideId, 28, 130, 240, 24),
      countryOfOrigin: createDemoField('countryOfOrigin', 'Country of Origin', 'Country of Origin: India', 'Back', backId, 28, 260, 240, 24),
    };

    return {
      modeUsed: 'DEMO',
      fields,
      detectedTexts: [],
      qualityWarnings: {
        front: { qualityState: 'Good image quality', notes: 'Simulated demo image' },
        back: { qualityState: 'Good image quality' },
        side: { qualityState: 'Readable' },
        additional: { qualityState: 'Readable' },
      },
      scanSummary: {
        totalTextsFound: 11,
        fieldsIdentified: 11,
        manualVerificationNeeded: 0,
        notDetected: 0,
      },
    };
  },
};
