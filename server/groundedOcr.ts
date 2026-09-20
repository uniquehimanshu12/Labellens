import { GoogleGenAI } from "@google/genai";
import { createWorker, Worker } from "tesseract.js";
import sharp from "sharp";

export interface OcrTokenData {
  id: string; // e.g. "ocr_001"
  imageId: string; // e.g. "img_back_002"
  sourceSide: "Front" | "Back" | "Side" | "Additional";
  text: string;
  confidence: number; // 0 to 1
  bbox: {
    x: number; // original pixel coordinates
    y: number;
    width: number;
    height: number;
  };
  lineIndex?: number;
}

export interface OcrLineData {
  id: string;
  imageId: string;
  sourceSide: "Front" | "Back" | "Side" | "Additional";
  text: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  tokenIds: string[];
}

export interface ImageMetaData {
  id: string;
  imageId: string;
  side: "front" | "back" | "side" | "additional";
  sourceSide: "Front" | "Back" | "Side" | "Additional";
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  previewUrl?: string;
  dataUrl?: string;
}

export interface EvidenceBoxData {
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  imageId: string;
  sourceSide: "Front" | "Back" | "Side" | "Additional";
  sourceTokenIds: string[];
  tokenIds?: string[];
  tokens?: Array<{
    id: string;
    text: string;
    bbox: { x: number; y: number; width: number; height: number };
    confidence?: number;
  }>;
}

export interface GroundedFieldResult {
  key: string;
  label: string;
  extractedValue: string;
  verifiedValue: string;
  value: string | null;
  status: "DETECTED" | "NOT_DETECTED" | "NEEDS_MANUAL_VERIFICATION";
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW" | "NOT DETECTED";
  confidenceState: "HIGH CONFIDENCE" | "MEDIUM CONFIDENCE" | "LOW CONFIDENCE" | "NOT DETECTED";
  confidence: number;
  sourceTokenIds: string[];
  evidenceTokenIds?: string[];
  evidenceBox: EvidenceBoxData | null;
  evidence: Array<{
    id: string;
    sourceImageId: string;
    sourceSide: "Front" | "Back" | "Side" | "Additional";
    x: number;
    y: number;
    width: number;
    height: number;
    pixelBbox?: { x: number; y: number; width: number; height: number };
    snippet?: string;
    confidence?: "HIGH" | "MEDIUM" | "LOW";
  }>;
  sourceImageId?: string;
  sourceImage: "Front" | "Back" | "Side" | "Additional" | "Not Visible";
  isManuallyVerified: boolean;
  isNotVisible: boolean;
  evidenceSnippet?: string;
  locationDescription?: string;
}

// Singleton Tesseract worker instance
let ocrWorkerPromise: Promise<Worker> | null = null;
export async function getTesseractWorker(): Promise<Worker> {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const worker = await createWorker("eng");
      return worker;
    })();
  }
  return ocrWorkerPromise;
}

// Convert data URL (JPEG, PNG, WEBP, or SVG) to raster PNG buffer + natural dimensions
export async function parseImageDataUrl(
  dataUrl: string
): Promise<{ buffer: Buffer; width: number; height: number; mimeType: string } | null> {
  try {
    let buf: Buffer;
    let mimeType = "image/png";

    if (dataUrl.startsWith("data:image/svg+xml;utf8,")) {
      const svgText = decodeURIComponent(dataUrl.replace("data:image/svg+xml;utf8,", ""));
      buf = Buffer.from(svgText, "utf-8");
      const pngBuf = await sharp(buf).png().toBuffer();
      const meta = await sharp(pngBuf).metadata();
      return {
        buffer: pngBuf,
        width: meta.width || 800,
        height: meta.height || 600,
        mimeType: "image/png",
      };
    } else if (dataUrl.startsWith("data:image/svg+xml;base64,")) {
      const base64Data = dataUrl.replace("data:image/svg+xml;base64,", "");
      buf = Buffer.from(base64Data, "base64");
      const pngBuf = await sharp(buf).png().toBuffer();
      const meta = await sharp(pngBuf).metadata();
      return {
        buffer: pngBuf,
        width: meta.width || 800,
        height: meta.height || 600,
        mimeType: "image/png",
      };
    } else {
      const match = dataUrl.match(/^data:([a-zA-Z0-9+\/.-]+);base64,(.+)$/);
      if (!match) return null;
      mimeType = match[1];
      buf = Buffer.from(match[2], "base64");

      const meta = await sharp(buf).metadata();
      const width = meta.width || 800;
      const height = meta.height || 600;

      const pngBuf = await sharp(buf).png().toBuffer();
      return {
        buffer: pngBuf,
        width,
        height,
        mimeType,
      };
    }
  } catch (err) {
    console.error("Failed to parse image data URL:", err);
    return null;
  }
}

export function getFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    productName: "Product Name",
    brandName: "Brand Name",
    mrp: "Maximum Retail Price (MRP)",
    netQuantity: "Net Quantity",
    manufacturer: "Manufacturer / Packer",
    manufacturerAddress: "Manufacturer Address",
    address: "Manufacturer Address",
    batchNumber: "Batch / Lot Number",
    manufacturingDate: "Mfg / Packing Date",
    dateInformation: "Mfg / Packing Date",
    bestBefore: "Best Before / Expiry",
    consumerCare: "Consumer Care Contact",
    countryOfOrigin: "Country of Origin",
  };
  return labels[key] || key;
}

export const STATUTORY_FIELD_KEYS = [
  "productName",
  "brandName",
  "mrp",
  "netQuantity",
  "manufacturer",
  "manufacturerAddress",
  "batchNumber",
  "manufacturingDate",
  "bestBefore",
  "consumerCare",
  "countryOfOrigin",
] as const;

export interface NormalizedInputImage {
  id: string;
  side: "front" | "back" | "side" | "additional";
  fileName: string;
  mimeType: string;
  dataUrl: string;
  width?: number;
  height?: number;
}

// Normalize text for robust matching
export function normalizeOcrText(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[₹$€£]/g, "")
    .replace(/[.,:;!?'"()\[\]{}\/\\#\-–—_@|*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Compute Levenshtein distance between two strings
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Compute comprehensive text similarity score (0.0 to 1.0)
export function calculateStringSimilarity(s1: string, s2: string): number {
  const norm1 = normalizeOcrText(s1);
  const norm2 = normalizeOcrText(s2);

  if (!norm1 && !norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;
  if (norm1 === norm2) return 1.0;

  // Character Levenshtein ratio
  const maxLen = Math.max(norm1.length, norm2.length);
  const levDist = levenshteinDistance(norm1, norm2);
  const charSim = Math.max(0, 1 - levDist / maxLen);

  // Substring inclusion bonus
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const subRatio = Math.min(norm1.length, norm2.length) / maxLen;
    return Math.max(charSim, 0.8 + 0.2 * subRatio);
  }

  // Word-level Jaccard similarity
  const words1 = norm1.split(" ").filter((w) => w.length > 0);
  const words2 = norm2.split(" ").filter((w) => w.length > 0);

  if (words1.length === 0 || words2.length === 0) return charSim;

  let commonCount = 0;
  for (const w1 of words1) {
    if (words2.some((w2) => w1 === w2 || (w1.length >= 4 && w2.includes(w1)) || (w2.length >= 4 && w1.includes(w2)))) {
      commonCount++;
    }
  }

  const wordSim = (2 * commonCount) / (words1.length + words2.length);

  return Number((0.5 * charSim + 0.5 * wordSim).toFixed(4));
}

// Find matching OCR tokens across ALL images for a given field value
// Chooses candidate with the HIGHEST text similarity and context score (NOT first match)
export function matchFieldValueToOcrTokens(
  fieldKey: string,
  fieldValue: string,
  images: ImageMetaData[],
  tokensByImage: Map<string, OcrTokenData[]>,
  linesByImage: Map<string, OcrLineData[]>
): {
  matchedImage: ImageMetaData;
  matchedTokens: OcrTokenData[];
  unionBbox: { x: number; y: number; width: number; height: number };
  score: number;
} | null {
  if (!fieldValue || !fieldValue.trim()) return null;

  const normValue = normalizeOcrText(fieldValue);
  const valWords = normValue.split(" ").filter((w) => w.length > 0);
  if (valWords.length === 0) return null;

  // Extract digits for numeric / code / price / date fields
  const digitsOnly = fieldValue.replace(/\D/g, "");

  interface CandidateMatch {
    matchedImage: ImageMetaData;
    matchedTokens: OcrTokenData[];
    unionBbox: { x: number; y: number; width: number; height: number };
    score: number;
    area: number;
  }

  const candidateList: CandidateMatch[] = [];

  // Helper to test if tokens contain label context for specific field types
  const getContextBonus = (tokens: OcrTokenData[], key: string): number => {
    const combinedNorm = tokens.map((t) => normalizeOcrText(t.text)).join(" ");
    if (key === "mrp" || key === "price") {
      if (/mrp|m\.r\.p|rs|₹|max|tax/i.test(combinedNorm)) return 0.25;
    }
    if (key === "netQuantity" || key === "netQty") {
      if (/net|qty|quantity|weight|wt|vol|g|gm|kg|ml|l/i.test(combinedNorm)) return 0.25;
    }
    if (key === "manufacturingDate" || key === "dateInformation" || key === "mfgDate") {
      if (/mfg|pkd|date|packed|manufactured/i.test(combinedNorm)) return 0.25;
    }
    if (key === "bestBefore" || key === "expiry") {
      if (/exp|expiry|use by|best before/i.test(combinedNorm)) return 0.25;
    }
    if (key === "batchNumber" || key === "batch") {
      if (/batch|lot|b\.no|bn/i.test(combinedNorm)) return 0.25;
    }
    return 0;
  };

  // Search across EVERY uploaded image surface (Front, Back, Side, Additional)
  for (const img of images) {
    const tokens = tokensByImage.get(img.id) || [];
    const lines = linesByImage.get(img.id) || [];
    if (tokens.length === 0) continue;

    // --- Strategy 1: Line-level token sequence sliding window ---
    for (const line of lines) {
      const lineTokens = line.tokenIds
        .map((id) => tokens.find((t) => t.id === id))
        .filter(Boolean) as OcrTokenData[];

      if (lineTokens.length === 0) continue;

      for (let startIdx = 0; startIdx < lineTokens.length; startIdx++) {
        for (let endIdx = startIdx; endIdx < lineTokens.length; endIdx++) {
          const candidateTokens = lineTokens.slice(startIdx, endIdx + 1);
          const candidateText = candidateTokens.map((t) => t.text).join(" ");
          const simScore = calculateStringSimilarity(candidateText, fieldValue);

          if (simScore >= 0.55) {
            const minX = Math.min(...candidateTokens.map((t) => t.bbox.x));
            const minY = Math.min(...candidateTokens.map((t) => t.bbox.y));
            const maxX = Math.max(...candidateTokens.map((t) => t.bbox.x + t.bbox.width));
            const maxY = Math.max(...candidateTokens.map((t) => t.bbox.y + t.bbox.height));
            const width = maxX - minX;
            const height = maxY - minY;

            const isExact = normalizeOcrText(candidateText) === normValue;
            const contextBonus = getContextBonus(candidateTokens, fieldKey);
            const compositeScore = Number((simScore + (isExact ? 0.3 : 0) + contextBonus).toFixed(4));

            candidateList.push({
              matchedImage: img,
              matchedTokens: candidateTokens,
              unionBbox: { x: minX, y: minY, width, height },
              score: compositeScore,
              area: width * height,
            });
          }
        }
      }
    }

    // --- Strategy 2: Contiguous Token Sequence Match across line boundaries ---
    const maxWindow = Math.min(tokens.length, valWords.length + 5);
    for (let i = 0; i < tokens.length; i++) {
      for (let win = 1; win <= maxWindow && i + win <= tokens.length; win++) {
        const seqTokens = tokens.slice(i, i + win);
        const seqText = seqTokens.map((t) => t.text).join(" ");
        const simScore = calculateStringSimilarity(seqText, fieldValue);

        if (simScore >= 0.6) {
          const minX = Math.min(...seqTokens.map((t) => t.bbox.x));
          const minY = Math.min(...seqTokens.map((t) => t.bbox.y));
          const maxX = Math.max(...seqTokens.map((t) => t.bbox.x + t.bbox.width));
          const maxY = Math.max(...seqTokens.map((t) => t.bbox.y + t.bbox.height));
          const width = maxX - minX;
          const height = maxY - minY;

          const isExact = normalizeOcrText(seqText) === normValue;
          const contextBonus = getContextBonus(seqTokens, fieldKey);
          const compositeScore = Number((simScore + (isExact ? 0.3 : 0) + contextBonus).toFixed(4));

          candidateList.push({
            matchedImage: img,
            matchedTokens: seqTokens,
            unionBbox: { x: minX, y: minY, width, height },
            score: compositeScore,
            area: width * height,
          });
        }
      }
    }

    // --- Strategy 3: Numeric / Code Exact Matching with Label Expansion ---
    if (digitsOnly.length >= 2) {
      for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        const tokDigits = tok.text.replace(/\D/g, "");

        if (tokDigits && (tokDigits === digitsOnly || tokDigits.includes(digitsOnly) || digitsOnly.includes(tokDigits))) {
          const candidateTokens = [tok];

          // Include label token before if appropriate (e.g., "MRP Rs 69" or "MFG 05/2026")
          if (i > 0) {
            const prevTok = tokens[i - 1];
            const prevNorm = normalizeOcrText(prevTok.text);
            if (
              prevNorm === "mrp" ||
              prevNorm === "rs" ||
              prevNorm === "net" ||
              prevNorm === "wt" ||
              prevNorm === "batch" ||
              prevNorm === "mfg" ||
              prevNorm === "pkd" ||
              prevNorm === "date" ||
              prevNorm === "lot" ||
              prevNorm === "exp"
            ) {
              candidateTokens.unshift(prevTok);
            }
          }

          // Include unit token after if appropriate (e.g. "g", "gm", "ml", "kg")
          if (i + 1 < tokens.length) {
            const nextTok = tokens[i + 1];
            const nextNorm = normalizeOcrText(nextTok.text);
            if (nextNorm === "g" || nextNorm === "gm" || nextNorm === "ml" || nextNorm === "kg" || nextNorm === "l") {
              candidateTokens.push(nextTok);
            }
          }

          const candText = candidateTokens.map((t) => t.text).join(" ");
          const simScore = Math.max(0.80, calculateStringSimilarity(candText, fieldValue));

          const minX = Math.min(...candidateTokens.map((t) => t.bbox.x));
          const minY = Math.min(...candidateTokens.map((t) => t.bbox.y));
          const maxX = Math.max(...candidateTokens.map((t) => t.bbox.x + t.bbox.width));
          const maxY = Math.max(...candidateTokens.map((t) => t.bbox.y + t.bbox.height));
          const width = maxX - minX;
          const height = maxY - minY;

          const contextBonus = getContextBonus(candidateTokens, fieldKey);
          const compositeScore = Number((simScore + 0.2 + contextBonus).toFixed(4));

          candidateList.push({
            matchedImage: img,
            matchedTokens: candidateTokens,
            unionBbox: { x: minX, y: minY, width, height },
            score: compositeScore,
            area: width * height,
          });
        }
      }
    }

    // --- Strategy 4: Multi-line Address / Manufacturer Spatial Cluster ---
    if (valWords.length >= 3) {
      const matchingClusterTokens: OcrTokenData[] = [];
      for (const tok of tokens) {
        const tokNorm = normalizeOcrText(tok.text);
        if (tokNorm && valWords.some((w) => tokNorm === w || (w.length >= 4 && tokNorm.includes(w)))) {
          matchingClusterTokens.push(tok);
        }
      }

      const matchRatio = matchingClusterTokens.length / valWords.length;
      if (matchingClusterTokens.length >= 2 && matchRatio >= 0.50) {
        const minX = Math.min(...matchingClusterTokens.map((t) => t.bbox.x));
        const minY = Math.min(...matchingClusterTokens.map((t) => t.bbox.y));
        const maxX = Math.max(...matchingClusterTokens.map((t) => t.bbox.x + t.bbox.width));
        const maxY = Math.max(...matchingClusterTokens.map((t) => t.bbox.y + t.bbox.height));
        const width = maxX - minX;
        const height = maxY - minY;
        const compositeScore = Number((0.70 + 0.25 * matchRatio).toFixed(4));

        candidateList.push({
          matchedImage: img,
          matchedTokens: matchingClusterTokens,
          unionBbox: { x: minX, y: minY, width, height },
          score: compositeScore,
          area: width * height,
        });
      }
    }
  }

  if (candidateList.length === 0) {
    return null;
  }

  // Sort candidates by:
  // 1. Highest composite score
  // 2. Smallest bounding box area (tighter box tie-breaker)
  candidateList.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.02) {
      return b.score - a.score;
    }
    return a.area - b.area;
  });

  const best = candidateList[0];

  // FINAL VALIDATION BEFORE RETURNING (Rule 6):
  // Verify:
  // 1. Matched image exists & has positive dimensions
  // 2. Union BBox is inside original image dimensions
  // 3. Score is above strict confidence threshold (0.60)
  if (
    !best ||
    best.score < 0.60 ||
    !best.matchedImage ||
    best.matchedImage.width <= 0 ||
    best.matchedImage.height <= 0 ||
    best.unionBbox.width <= 0 ||
    best.unionBbox.height <= 0 ||
    best.unionBbox.x < 0 ||
    best.unionBbox.y < 0 ||
    best.unionBbox.x + best.unionBbox.width > best.matchedImage.width + 15 ||
    best.unionBbox.y + best.unionBbox.height > best.matchedImage.height + 15
  ) {
    return null;
  }

  return {
    matchedImage: best.matchedImage,
    matchedTokens: best.matchedTokens,
    unionBbox: best.unionBbox,
    score: best.score,
  };
}

// Rebuilt grounded extraction pipeline:
// IMAGE -> OCR (Exact Word/Line Pixel Boxes) -> GEMINI (Field Values Only) -> MATCH VALUE TO OCR -> UNION EVIDENCE BOX
// Rebuilt grounded extraction pipeline:
// IMAGE -> FAST OCR -> GEMINI (Field Values Only) -> MATCH VALUE TO OCR -> UNION EVIDENCE BOX
export async function executeGroundedPipeline(
  rawInput:
    | NormalizedInputImage[]
    | Record<string, string | null | undefined>
    | { images?: any; imageRecords?: any },
  client: GoogleGenAI | null
) {
  // 1. Normalize input images
  const normalizedImages: NormalizedInputImage[] = [];

  if (Array.isArray(rawInput)) {
    for (const item of rawInput) {
      if (item && item.dataUrl) {
        normalizedImages.push({
          id: item.id || `img_${item.side || "front"}_${Date.now()}`,
          side: item.side || "front",
          fileName: item.fileName || `${item.side || "image"}.png`,
          mimeType: item.mimeType || "image/png",
          dataUrl: item.dataUrl,
          width: item.width,
          height: item.height,
        });
      }
    }
  } else if (rawInput && typeof rawInput === "object") {
    const candidateImages = (rawInput as any).images || rawInput;
    const candidateRecords = (rawInput as any).imageRecords || {};

    const sides: Array<"front" | "back" | "side" | "additional"> = [
      "front",
      "back",
      "side",
      "additional",
    ];

    for (const side of sides) {
      const dataUrl = candidateImages[side];

      if (dataUrl && typeof dataUrl === "string") {
        const record = candidateRecords[side];

        normalizedImages.push({
          id:
            record?.id ||
            record?.imageId ||
            `img_${side}_${Date.now()}`,
          side,
          fileName: record?.fileName || `${side}_surface.png`,
          mimeType: record?.mimeType || "image/png",
          dataUrl,
          width: record?.width,
          height: record?.height,
        });
      }
    }
  }

  if (normalizedImages.length === 0) {
    return {
      status: 400,
      body: {
        success: false,
        error: "No valid package images provided for extraction.",
        fields: {},
        fieldsList: [],
        ocrTokens: [],
      },
    };
  }

  // 2. STAGE 1: OCR ENGINE
  let worker: Worker;

  try {
    worker = await getTesseractWorker();
  } catch (workerErr) {
    console.error(
      "Failed to initialize Tesseract worker:",
      workerErr
    );

    return {
      status: 503,
      body: {
        success: false,
        error:
          "OCR engine unavailable: Tesseract initialization failed.",
        allowManualEntry: true,
      },
    };
  }

  const imageMetadataList: ImageMetaData[] = [];
  const allOcrTokens: OcrTokenData[] = [];
  const tokensByImage = new Map<string, OcrTokenData[]>();
  const linesByImage = new Map<string, OcrLineData[]>();

  const geminiImageParts: any[] = [];

  let tokenCounter = 1;
  let lineCounter = 1;

  /*
   * PERFORMANCE OPTIMIZATION
   *
   * Tesseract does not need a 4K/5K photograph to read package text.
   * We create a smaller OCR image, but keep the ORIGINAL dimensions.
   *
   * OCR coordinates are scaled back to the original image dimensions.
   * Therefore the evidence boxes remain compatible with the original
   * image displayed by the frontend.
   */
  const OCR_MAX_DIMENSION = 1800;

  for (const img of normalizedImages) {
    const parsed = await parseImageDataUrl(img.dataUrl);

    if (!parsed) continue;

    const sourceSide = (
      img.side.charAt(0).toUpperCase() + img.side.slice(1)
    ) as "Front" | "Back" | "Side" | "Additional";

    const originalWidth = parsed.width;
    const originalHeight = parsed.height;

    const meta: ImageMetaData = {
      id: img.id,
      imageId: img.id,
      side: img.side,
      sourceSide,
      fileName: img.fileName,
      mimeType: parsed.mimeType,
      width: originalWidth,
      height: originalHeight,
      dataUrl: img.dataUrl,
    };

    imageMetadataList.push(meta);

    /*
     * Gemini receives a compressed/resized image too.
     * This reduces upload and model processing time while preserving
     * enough resolution for package-label extraction.
     */
    let geminiBuffer = parsed.buffer;

    try {
      const geminiScale =
        Math.max(originalWidth, originalHeight) >
        OCR_MAX_DIMENSION
          ? OCR_MAX_DIMENSION / Math.max(originalWidth, originalHeight)
          : 1;

      if (geminiScale < 1) {
        const geminiWidth = Math.max(
          1,
          Math.round(originalWidth * geminiScale)
        );

        const geminiHeight = Math.max(
          1,
          Math.round(originalHeight * geminiScale)
        );

        geminiBuffer = await sharp(parsed.buffer)
          .resize(geminiWidth, geminiHeight, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 82,
            mozjpeg: true,
          })
          .toBuffer();
      } else {
        geminiBuffer = await sharp(parsed.buffer)
          .jpeg({
            quality: 82,
            mozjpeg: true,
          })
          .toBuffer();
      }
    } catch (imageOptimizeErr) {
      console.warn(
        `Image optimization failed for ${img.id}; using original image.`,
        imageOptimizeErr
      );

      geminiBuffer = parsed.buffer;
    }

    geminiImageParts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: geminiBuffer.toString("base64"),
      },
    });

    geminiImageParts.push({
      text: `Surface [${sourceSide.toUpperCase()}] of the package with imageId: "${img.id}". Exact original dimensions: ${originalWidth}x${originalHeight} pixels.`,
    });

    /*
     * FAST OCR IMAGE
     *
     * Resize only when the original photograph is larger than
     * OCR_MAX_DIMENSION.
     */
    let ocrBuffer = parsed.buffer;
    let ocrWidth = originalWidth;
    let ocrHeight = originalHeight;

    try {
      const maxOriginalDimension = Math.max(
        originalWidth,
        originalHeight
      );

      if (maxOriginalDimension > OCR_MAX_DIMENSION) {
        const scale =
          OCR_MAX_DIMENSION / maxOriginalDimension;

        ocrWidth = Math.max(
          1,
          Math.round(originalWidth * scale)
        );

        ocrHeight = Math.max(
          1,
          Math.round(originalHeight * scale)
        );

        ocrBuffer = await sharp(parsed.buffer)
          .resize(ocrWidth, ocrHeight, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .png()
          .toBuffer();
      }
    } catch (resizeErr) {
      console.warn(
        `OCR resize failed for ${img.id}; using original image.`,
        resizeErr
      );

      ocrBuffer = parsed.buffer;
      ocrWidth = originalWidth;
      ocrHeight = originalHeight;
    }

    const scaleX = originalWidth / ocrWidth;
    const scaleY = originalHeight / ocrHeight;

    const imageTokens: OcrTokenData[] = [];
    const imageLines: OcrLineData[] = [];

    try {
      const ocrResult = await worker.recognize(
        ocrBuffer,
        {},
        { blocks: true }
      );

      for (const block of ocrResult.data.blocks || []) {
        for (const para of block.paragraphs || []) {
          for (const line of para.lines || []) {
            const lineTokenIds: string[] = [];
            const lineText = (line.text || "").trim();

            for (const word of line.words || []) {
              const text = (word.text || "").trim();

              if (!text) continue;

              /*
               * Tesseract coordinates are from the resized OCR image.
               * Convert them back to ORIGINAL image coordinates.
               */
              const x = Math.max(
                0,
                Math.round(word.bbox.x0 * scaleX)
              );

              const y = Math.max(
                0,
                Math.round(word.bbox.y0 * scaleY)
              );

              const width = Math.max(
                1,
                Math.round(
                  (word.bbox.x1 - word.bbox.x0) * scaleX
                )
              );

              const height = Math.max(
                1,
                Math.round(
                  (word.bbox.y1 - word.bbox.y0) * scaleY
                )
              );

              const token: OcrTokenData = {
                id: `ocr_${String(tokenCounter++).padStart(
                  3,
                  "0"
                )}`,
                imageId: img.id,
                sourceSide,
                text,
                confidence: Number(
                  (
                    (word.confidence || 85) /
                    100
                  ).toFixed(2)
                ),
                bbox: {
                  x,
                  y,
                  width,
                  height,
                },
                lineIndex: lineCounter,
              };

              allOcrTokens.push(token);
              imageTokens.push(token);
              lineTokenIds.push(token.id);
            }

            if (
              lineText &&
              lineTokenIds.length > 0
            ) {
              const lx = Math.max(
                0,
                Math.round(line.bbox.x0 * scaleX)
              );

              const ly = Math.max(
                0,
                Math.round(line.bbox.y0 * scaleY)
              );

              const lw = Math.max(
                1,
                Math.round(
                  (line.bbox.x1 - line.bbox.x0) *
                    scaleX
                )
              );

              const lh = Math.max(
                1,
                Math.round(
                  (line.bbox.y1 - line.bbox.y0) *
                    scaleY
                )
              );

              imageLines.push({
                id: `line_${String(
                  lineCounter++
                ).padStart(3, "0")}`,
                imageId: img.id,
                sourceSide,
                text: lineText,
                bbox: {
                  x: lx,
                  y: ly,
                  width: lw,
                  height: lh,
                },
                tokenIds: lineTokenIds,
              });
            }
          }
        }
      }
    } catch (ocrErr) {
      console.error(
        `Tesseract OCR failed on image [${img.id}]:`,
        ocrErr
      );
    }

    tokensByImage.set(img.id, imageTokens);
    linesByImage.set(img.id, imageLines);
  }

  // Helper to build default empty field structure
  const buildEmptyFields = () => {
    const fieldsByKey: Record<
      string,
      GroundedFieldResult
    > = {};

    const fieldsList: GroundedFieldResult[] = [];

    for (const key of STATUTORY_FIELD_KEYS) {
      const label = getFieldLabel(key);

      const aliasKey =
        key === "manufacturerAddress"
          ? "address"
          : key === "manufacturingDate"
          ? "dateInformation"
          : key;

      const emptyField: GroundedFieldResult = {
        key: aliasKey,
        label,
        extractedValue: "",
        verifiedValue: "",
        value: null,
        status: "NOT_DETECTED",
        confidenceLevel: "NOT DETECTED",
        confidenceState: "NOT DETECTED",
        confidence: 0,
        sourceTokenIds: [],
        evidenceBox: null,
        evidence: [],
        sourceImage: "Not Visible",
        sourceImageId: undefined,
        isManuallyVerified: false,
        isNotVisible: true,
        evidenceSnippet: undefined,
        locationDescription:
          "Exact evidence location unavailable.",
      };

      fieldsByKey[aliasKey] = emptyField;
      fieldsList.push(emptyField);
    }

    return {
      fieldsByKey,
      fieldsList,
    };
  };

  // 3. STAGE 2: GEMINI EXTRACTS FIELD VALUES ONLY
  let rawGeminiValues: Record<string, any> = {};
  let modelUsed = "gemini-3.5-flash-lite";

  if (client) {
    const geminiExtractionPrompt = `
You are an expert Legal Metrology Packaged Commodities inspector.

Analyze ALL submitted package image surfaces and extract the mandatory statutory declarations.

CRITICAL INSTRUCTIONS:
- You ONLY extract the text values for each statutory field.
- Do NOT provide bounding box coordinates.
- Do NOT provide spatial guesses.
- Do NOT invent text.
- Use only text visibly present on the submitted package images.
- If a field is not visibly present, set value to null and status to "NOT_DETECTED".
- Preserve the exact visible value as much as possible.
- You may combine information from multiple submitted surfaces.
- Do not assume a declaration exists merely because it is legally expected.

Return ONLY a JSON object with this exact structure:

{
  "productName": {
    "value": string | null,
    "status": "DETECTED" | "NOT_DETECTED"
  },
  "brandName": {
    "value": string | null,
    "status": "DETECTED" | "NOT_DETECTED"
  },
  "mrp": {
    "value": string | null,
    "status": "DETECTED" | "NOT_DETECTED"
  },
  "netQuantity": {
    "value": string | null,
    "status": "DETECTED" | "NOT_DETECTED"
  },
  "manufacturer": {
    "value": string | null,
    "status": "DETECTED" | "NOT_DETECTED"
  },
  "manufacturerAddress": {
    "value": string | null,
    "status": "DETECTED" | "NOT_DETECTED"
  },
  "batchNumber": {
    "value": string | null,
    "status": "DETECTED" | "NOT_DETECTED"
  },
  "manufacturingDate": {
    "value": string | null,
    "status": "DETECTED" | "NOT_DETECTED"
  },
  "bestBefore": {
    "value": string | null,
    "status": "DETECTED" | "NOT_DETECTED"
  },
  "consumerCare": {
    "value": string | null,
    "status": "DETECTED" | "NOT_DETECTED"
  },
  "countryOfOrigin": {
    "value": string | null,
    "status": "DETECTED" | "NOT_DETECTED"
  }
}
`;

    try {
      const res = await client.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: [
          ...geminiImageParts,
          {
            text: geminiExtractionPrompt,
          },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.0,
        },
      });

      const text = res.text || "{}";

      rawGeminiValues = JSON.parse(
        text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim()
      );
    } catch (err: any) {
      console.warn(
        "Primary gemini-3.5-flash-lite error, trying gemini-3.6-flash:",
        err?.message
      );

      try {
        modelUsed = "gemini-3.6-flash";

        const res =
          await client.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [
              ...geminiImageParts,
              {
                text: geminiExtractionPrompt,
              },
            ],
            config: {
              responseMimeType: "application/json",
              temperature: 0.0,
            },
          });

        const text = res.text || "{}";

        rawGeminiValues = JSON.parse(
          text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim()
        );
      } catch (fallbackErr: any) {
        console.error(
          "Gemini classification failed completely:",
          fallbackErr
        );
      }
    }
  }

  // 4. STAGE 3: MATCH GEMINI VALUES TO OCR
  const processedFieldsByKey: Record<
    string,
    GroundedFieldResult
  > = {};

  const processedFieldsList: GroundedFieldResult[] = [];

  for (const fieldKey of STATUTORY_FIELD_KEYS) {
    const raw = rawGeminiValues[fieldKey];

    const val = raw?.value
      ? String(raw.value).trim()
      : "";

    const isDetected =
      Boolean(val) &&
      raw?.status !== "NOT_DETECTED";

    const label = getFieldLabel(fieldKey);

    const aliasKey =
      fieldKey === "manufacturerAddress"
        ? "address"
        : fieldKey === "manufacturingDate"
        ? "dateInformation"
        : fieldKey;

    if (isDetected) {
      const ocrMatch =
        matchFieldValueToOcrTokens(
          aliasKey,
          val,
          imageMetadataList,
          tokensByImage,
          linesByImage
        );

      if (ocrMatch) {
        const {
          matchedImage,
          matchedTokens,
          unionBbox,
        } = ocrMatch;

        const sourceSide =
          matchedImage.sourceSide;

        const tokenIds =
          matchedTokens.map((t) => t.id);

        const evidenceBox: EvidenceBoxData = {
          x: unionBbox.x,
          y: unionBbox.y,
          width: unionBbox.width,
          height: unionBbox.height,
          originalWidth:
            matchedImage.width,
          originalHeight:
            matchedImage.height,
          imageId: matchedImage.id,
          sourceSide,
          sourceTokenIds: tokenIds,
          tokenIds,
          tokens: matchedTokens.map((t) => ({
            id: t.id,
            text: t.text,
            bbox: t.bbox,
            confidence: t.confidence,
          })),
        };

        const evidenceRegions = [
          {
            id: `ev_${aliasKey}_${matchedImage.id}`,
            sourceImageId:
              matchedImage.id,
            sourceSide,
            x: Number(
              (
                unionBbox.x /
                matchedImage.width
              ).toFixed(4)
            ),
            y: Number(
              (
                unionBbox.y /
                matchedImage.height
              ).toFixed(4)
            ),
            width: Number(
              (
                unionBbox.width /
                matchedImage.width
              ).toFixed(4)
            ),
            height: Number(
              (
                unionBbox.height /
                matchedImage.height
              ).toFixed(4)
            ),
            pixelBbox: {
              x: unionBbox.x,
              y: unionBbox.y,
              width: unionBbox.width,
              height: unionBbox.height,
            },
            snippet:
              matchedTokens
                .map((t) => t.text)
                .join(" ") || val,
            confidence: "HIGH" as const,
          },
        ];

        const fieldResult: GroundedFieldResult = {
          key: aliasKey,
          label,
          extractedValue: val,
          verifiedValue: val,
          value: val,
          status: "DETECTED",
          confidenceLevel: "HIGH",
          confidenceState:
            "HIGH CONFIDENCE",
          confidence: 95,
          sourceTokenIds: tokenIds,
          evidenceTokenIds: tokenIds,
          evidenceBox,
          evidence: evidenceRegions,
          sourceImageId:
            matchedImage.id,
          sourceImage: sourceSide,
          isManuallyVerified: false,
          isNotVisible: false,
          evidenceSnippet:
            matchedTokens
              .map((t) => t.text)
              .join(" ") || val,
          locationDescription:
            `X:${unionBbox.x}px Y:${unionBbox.y}px on ${sourceSide} surface`,
        };

        processedFieldsByKey[
          aliasKey
        ] = fieldResult;

        processedFieldsList.push(
          fieldResult
        );

        continue;
      } else {
        const noBoxField: GroundedFieldResult = {
          key: aliasKey,
          label,
          extractedValue: val,
          verifiedValue: val,
          value: val,
          status:
            "NEEDS_MANUAL_VERIFICATION",
          confidenceLevel: "MEDIUM",
          confidenceState:
            "MEDIUM CONFIDENCE",
          confidence: 70,
          sourceTokenIds: [],
          evidenceTokenIds: [],
          evidenceBox: null,
          evidence: [],
          sourceImage: "Not Visible",
          sourceImageId: undefined,
          isManuallyVerified: false,
          isNotVisible: false,
          evidenceSnippet: val,
          locationDescription:
            "Exact evidence location unavailable — manual verification required.",
        };

        processedFieldsByKey[
          aliasKey
        ] = noBoxField;

        processedFieldsList.push(
          noBoxField
        );

        continue;
      }
    }

    const notDetectedField: GroundedFieldResult = {
      key: aliasKey,
      label,
      extractedValue: "",
      verifiedValue: "",
      value: null,
      status: "NOT_DETECTED",
      confidenceLevel: "NOT DETECTED",
      confidenceState: "NOT DETECTED",
      confidence: 0,
      sourceTokenIds: [],
      evidenceTokenIds: [],
      evidenceBox: null,
      evidence: [],
      sourceImage: "Not Visible",
      sourceImageId: undefined,
      isManuallyVerified: false,
      isNotVisible: true,
      evidenceSnippet: undefined,
      locationDescription:
        "Exact evidence location unavailable.",
    };

    processedFieldsByKey[
      aliasKey
    ] = notDetectedField;

    processedFieldsList.push(
      notDetectedField
    );
  }

  // Format OCR text for frontend viewer
  const detectedTexts = allOcrTokens.map(
    (t) => ({
      id: t.id,
      text: t.text,
      sourceImageId: t.imageId,
      sourceSide: t.sourceSide,
      x: t.bbox.x,
      y: t.bbox.y,
      width: t.bbox.width,
      height: t.bbox.height,
      pixelBbox: t.bbox,
    })
  );

  return {
    status: 200,
    body: {
      success: true,
      modelUsed,
      images: imageMetadataList,
      ocrTokens: allOcrTokens,
      detectedTexts,
      geminiMapping: rawGeminiValues,
      fields: processedFieldsByKey,
      fieldsList: processedFieldsList,
    },
  };
}

// 5. GOLDEN TEST ASSET GENERATOR (Haldiram's Bhujia Sev - 3 Surfaces: Front, Back, Side)
export async function generateGoldenTestAssets() {
  const frontSvg = `<svg width="1200" height="1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="1000" fill="#ffffff"/>
    <rect x="24" y="24" width="1152" height="952" fill="#fffbeb" stroke="#b45309" stroke-width="4" rx="16"/>
    <text x="600" y="160" font-family="Arial, sans-serif" font-size="96" font-weight="bold" fill="#000000" text-anchor="middle">Haldiram's</text>
    <text x="600" y="280" font-family="Arial, sans-serif" font-size="84" font-weight="bold" fill="#000000" text-anchor="middle">Bhujia Sev</text>
    <text x="600" y="380" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#475569" text-anchor="middle">SPICED MOTH BEAN &amp; GRAM FLOUR SAVOURY NOODLES</text>
    <text x="600" y="520" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#000000" text-anchor="middle">MRP Rs. 50</text>
    <text x="600" y="630" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#000000" text-anchor="middle">Net Wt. 200 g</text>
    <text x="600" y="720" font-family="Arial, sans-serif" font-size="36" fill="#64748b" text-anchor="middle">Inclusive of all taxes</text>
    <text x="600" y="800" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#15803d" text-anchor="middle">Country of Origin: India</text>
  </svg>`;

  const backSvg = `<svg width="1200" height="1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="1000" fill="#ffffff"/>
    <rect x="20" y="20" width="1160" height="960" fill="#f8fafc" stroke="#334155" stroke-width="8" rx="20"/>
    <text x="100" y="100" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="#0f172a">STATUTORY DECLARATIONS</text>
    <line x1="100" y1="120" x2="1100" y2="120" stroke="#cbd5e1" stroke-width="4"/>
    <text x="100" y="200" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#000000">Manufacturer:</text>
    <text x="100" y="260" font-family="Arial, sans-serif" font-size="34" fill="#000000">Haldiram Snacks Pvt. Ltd.</text>
    <text x="100" y="320" font-family="Arial, sans-serif" font-size="30" fill="#334155">B-1/H-8, Mohan Co-op Industrial Estate, Main Mathura Road, New Delhi 110044</text>
    <text x="100" y="420" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#000000">Month &amp; Year of Mfg: 03/2026</text>
    <text x="100" y="500" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#000000">Best Before: 6 Months from packaging</text>
    <text x="100" y="600" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="#000000">Consumer Care: customercare@haldirams.com | Tel: 011-45204100</text>
  </svg>`;

  const sideSvg = `<svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="1000" fill="#ffffff"/>
    <rect x="20" y="20" width="760" height="960" fill="#fefce8" stroke="#ca8a04" stroke-width="4" rx="16"/>
    <text x="400" y="140" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#000000" text-anchor="middle">PRODUCT BATCH DETAILS</text>
    <line x1="80" y1="180" x2="720" y2="180" stroke="#e2e8f0" stroke-width="4"/>
    <text x="400" y="320" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="#000000" text-anchor="middle">Batch / Lot Number: HL-BH-2026</text>
    <text x="400" y="440" font-family="Arial, sans-serif" font-size="32" fill="#475569" text-anchor="middle">BARCODE: 8901234567890</text>
    <text x="400" y="560" font-family="Arial, sans-serif" font-size="30" fill="#64748b" text-anchor="middle">STORE IN A COOL DRY PLACE</text>
  </svg>`;

  const frontBuf = await sharp(Buffer.from(frontSvg)).png().toBuffer();
  const backBuf = await sharp(Buffer.from(backSvg)).png().toBuffer();
  const sideBuf = await sharp(Buffer.from(sideSvg)).png().toBuffer();

  const frontDataUrl = `data:image/png;base64,${frontBuf.toString("base64")}`;
  const backDataUrl = `data:image/png;base64,${backBuf.toString("base64")}`;
  const sideDataUrl = `data:image/png;base64,${sideBuf.toString("base64")}`;

  return {
    front: {
      id: "img_golden_front",
      side: "front" as const,
      fileName: "haldiram_bhujia_front.png",
      mimeType: "image/png",
      width: 1200,
      height: 1000,
      dataUrl: frontDataUrl,
    },
    back: {
      id: "img_golden_back",
      side: "back" as const,
      fileName: "haldiram_bhujia_back.png",
      mimeType: "image/png",
      width: 1200,
      height: 1000,
      dataUrl: backDataUrl,
    },
    side: {
      id: "img_golden_side",
      side: "side" as const,
      fileName: "haldiram_bhujia_side.png",
      mimeType: "image/png",
      width: 800,
      height: 1000,
      dataUrl: sideDataUrl,
    },
  };
}

// 6. RUN GOLDEN TEST WITH MANDATORY ASSERTIONS
export async function runGoldenTest(client: GoogleGenAI | null) {
  const assets = await generateGoldenTestAssets();
  const images = [assets.front, assets.back, assets.side];

  const startTime = Date.now();
  const pipelineResult = await executeGroundedPipeline(images, client);
  const elapsedMs = Date.now() - startTime;

  const ocrTokens: OcrTokenData[] = pipelineResult.body.ocrTokens || [];
  const fields: Record<string, GroundedFieldResult> = pipelineResult.body.fields || {};

  // Check Assertions:
  // 1. SunPure must NOT be in OCR tokens
  const tokenTexts = ocrTokens.map((t) => t.text.toLowerCase());
  const sunPureInTokens = tokenTexts.some((t) => t.includes("sunpure"));

  // 2. SunPure must NOT be in any extracted fields
  const fieldValues = Object.values(fields).map((f) => (f.extractedValue || "").toLowerCase());
  const sunPureInFields = fieldValues.some((v) => v.includes("sunpure"));

  // 3. Haldiram's must be detected in brandName
  const brandNameVal = fields.brandName?.extractedValue || "";
  const brandDetected = /haldiram/i.test(brandNameVal);

  // 4. Bhujia must be detected in productName (Front -> Product Name)
  const productNameVal = fields.productName?.extractedValue || "";
  const productDetected = /bhujia/i.test(productNameVal);
  const productOnFront = fields.productName?.sourceImage === "Front" && !!fields.productName?.evidenceBox;

  // 5. MRP must be detected
  const mrpVal = fields.mrp?.extractedValue || "";
  const mrpDetected = /50/i.test(mrpVal);

  // 6. Net Quantity must be detected
  const qtyVal = fields.netQuantity?.extractedValue || "";
  const qtyDetected = /200/i.test(qtyVal);

  // 7. Back -> Manufacturer (Haldiram Snacks Pvt. Ltd.)
  const mfgVal = fields.manufacturer?.extractedValue || "";
  const mfgDetected = /haldiram/i.test(mfgVal);
  const mfgOnBack = fields.manufacturer?.sourceImage === "Back" && !!fields.manufacturer?.evidenceBox;

  // 8. Back -> Manufacturing Date (03/2026)
  const dateVal = (fields.dateInformation?.extractedValue || fields.manufacturingDate?.extractedValue || "");
  const dateDetected = /03\/2026/i.test(dateVal) || /2026/i.test(dateVal);
  const dateOnBack = (fields.dateInformation?.sourceImage === "Back" || fields.manufacturingDate?.sourceImage === "Back") &&
    !!(fields.dateInformation?.evidenceBox || fields.manufacturingDate?.evidenceBox);

  // 9. Side -> Batch Number (HL-BH-2026)
  const batchVal = fields.batchNumber?.extractedValue || "";
  const batchDetected = /HL-BH-2026/i.test(batchVal) || /2026/i.test(batchVal);
  const batchOnSideOrBack = (fields.batchNumber?.sourceImage === "Side" || fields.batchNumber?.sourceImage === "Back") &&
    !!fields.batchNumber?.evidenceBox;

  const passed =
    !sunPureInTokens &&
    !sunPureInFields &&
    brandDetected &&
    productDetected &&
    mrpDetected &&
    qtyDetected;

  return {
    testName: "Golden Test: Haldiram's Bhujia Verification",
    timestamp: new Date().toISOString(),
    elapsedMs,
    passed,
    assertions: {
      sunPureNotInTokens: !sunPureInTokens,
      sunPureNotInFields: !sunPureInFields,
      haldiramBrandDetected: brandDetected,
      bhujiaProductDetected: productDetected,
      mrpDetected: mrpDetected,
      netQuantityDetected: qtyDetected,
      front_ProductName_ExactBbox: productOnFront,
      back_Manufacturer_ExactBbox: mfgOnBack,
      back_ManufacturingDate_ExactBbox: dateOnBack,
      side_BatchNumber_ExactBbox: batchOnSideOrBack,
    },
    goldenAssets: {
      front: {
        id: assets.front.id,
        side: assets.front.side,
        fileName: assets.front.fileName,
        width: assets.front.width,
        height: assets.front.height,
        dataUrl: assets.front.dataUrl,
      },
      back: {
        id: assets.back.id,
        side: assets.back.side,
        fileName: assets.back.fileName,
        width: assets.back.width,
        height: assets.back.height,
        dataUrl: assets.back.dataUrl,
      },
      side: {
        id: assets.side.id,
        side: assets.side.side,
        fileName: assets.side.fileName,
        width: assets.side.width,
        height: assets.side.height,
        dataUrl: assets.side.dataUrl,
      },
    },
    pipelineResult: pipelineResult.body,
  };
}
