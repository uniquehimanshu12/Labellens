import { GoogleGenAI } from "@google/genai";
import { createWorker, Worker } from "tesseract.js";
import sharp from "sharp";

export interface OcrTokenData {
  id: string;
  imageId: string;
  sourceSide: "Front" | "Back" | "Side" | "Additional";
  text: string;
  confidence: number;
  bbox: {
    x: number;
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
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    confidence?: number;
  }>;
}

export interface GroundedFieldResult {
  key: string;
  label: string;
  extractedValue: string;
  verifiedValue: string;
  value: string | null;
  status:
    | "DETECTED"
    | "NOT_DETECTED"
    | "NEEDS_MANUAL_VERIFICATION";
  confidenceLevel:
    | "HIGH"
    | "MEDIUM"
    | "LOW"
    | "NOT DETECTED";
  confidenceState:
    | "HIGH CONFIDENCE"
    | "MEDIUM CONFIDENCE"
    | "LOW CONFIDENCE"
    | "NOT DETECTED";
  confidence: number;
  sourceTokenIds: string[];
  evidenceTokenIds?: string[];
  evidenceBox: EvidenceBoxData | null;
  evidence: Array<{
    id: string;
    sourceImageId: string;
    sourceSide:
      | "Front"
      | "Back"
      | "Side"
      | "Additional";
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
    snippet?: string;
    confidence?: "HIGH" | "MEDIUM" | "LOW";
  }>;
  sourceImageId?: string;
  sourceImage:
    | "Front"
    | "Back"
    | "Side"
    | "Additional"
    | "Not Visible";
  isManuallyVerified: boolean;
  isNotVisible: boolean;
  evidenceSnippet?: string;
  locationDescription?: string;
}

// ============================================================
// TESSERACT SINGLETON
// ============================================================

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

// ============================================================
// IMAGE PARSER
// ============================================================

export async function parseImageDataUrl(
  dataUrl: string
): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: string;
} | null> {
  try {
    let buf: Buffer;
    let mimeType = "image/png";

    if (dataUrl.startsWith("data:image/svg+xml;utf8,")) {
      const svgText = decodeURIComponent(
        dataUrl.replace("data:image/svg+xml;utf8,", "")
      );

      buf = Buffer.from(svgText, "utf-8");

      const pngBuf = await sharp(buf)
        .png()
        .toBuffer();

      const meta = await sharp(pngBuf).metadata();

      return {
        buffer: pngBuf,
        width: meta.width || 800,
        height: meta.height || 600,
        mimeType: "image/png",
      };
    }

    if (dataUrl.startsWith("data:image/svg+xml;base64,")) {
      const base64Data = dataUrl.replace(
        "data:image/svg+xml;base64,",
        ""
      );

      buf = Buffer.from(base64Data, "base64");

      const pngBuf = await sharp(buf)
        .png()
        .toBuffer();

      const meta = await sharp(pngBuf).metadata();

      return {
        buffer: pngBuf,
        width: meta.width || 800,
        height: meta.height || 600,
        mimeType: "image/png",
      };
    }

    const match = dataUrl.match(
      /^data:([a-zA-Z0-9+\/.-]+);base64,(.+)$/
    );

    if (!match) return null;

    mimeType = match[1];
    buf = Buffer.from(match[2], "base64");

    const meta = await sharp(buf).metadata();

    const width = meta.width || 800;
    const height = meta.height || 600;

    const pngBuf = await sharp(buf)
      .png()
      .toBuffer();

    return {
      buffer: pngBuf,
      width,
      height,
      mimeType,
    };
  } catch (err) {
    console.error(
      "Failed to parse image data URL:",
      err
    );

    return null;
  }
}

// ============================================================
// FIELD LABELS
// ============================================================

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
  side:
    | "front"
    | "back"
    | "side"
    | "additional";
  fileName: string;
  mimeType: string;
  dataUrl: string;
  width?: number;
  height?: number;
}

// ============================================================
// TEXT NORMALIZATION
// ============================================================

export function normalizeOcrText(
  str: string
): string {
  if (!str) return "";

  return str
    .toLowerCase()
    .replace(/[₹$€£]/g, "")
    .replace(
      /[.,:;!?'"()\[\]{}\/\\#\-–—_@|*]/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// LEVENSHTEIN
// ============================================================

export function levenshteinDistance(
  a: string,
  b: string
): number {
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
      if (
        b.charAt(i - 1) ===
        a.charAt(j - 1)
      ) {
        matrix[i][j] =
          matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// ============================================================
// STRING SIMILARITY
// ============================================================

export function calculateStringSimilarity(
  s1: string,
  s2: string
): number {
  const norm1 = normalizeOcrText(s1);
  const norm2 = normalizeOcrText(s2);

  if (!norm1 && !norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;
  if (norm1 === norm2) return 1.0;

  const maxLen = Math.max(
    norm1.length,
    norm2.length
  );

  const levDist = levenshteinDistance(
    norm1,
    norm2
  );

  const charSim = Math.max(
    0,
    1 - levDist / maxLen
  );

  if (
    norm1.includes(norm2) ||
    norm2.includes(norm1)
  ) {
    const subRatio =
      Math.min(
        norm1.length,
        norm2.length
      ) / maxLen;

    return Math.max(
      charSim,
      0.8 + 0.2 * subRatio
    );
  }

  const words1 = norm1
    .split(" ")
    .filter((w) => w.length > 0);

  const words2 = norm2
    .split(" ")
    .filter((w) => w.length > 0);

  if (
    words1.length === 0 ||
    words2.length === 0
  ) {
    return charSim;
  }

  let commonCount = 0;

  for (const w1 of words1) {
    if (
      words2.some(
        (w2) =>
          w1 === w2 ||
          (w1.length >= 4 &&
            w2.includes(w1)) ||
          (w2.length >= 4 &&
            w1.includes(w2))
      )
    ) {
      commonCount++;
    }
  }

  const wordSim =
    (2 * commonCount) /
    (words1.length + words2.length);

  return Number(
    (
      0.5 * charSim +
      0.5 * wordSim
    ).toFixed(4)
  );
}

// ============================================================
// OCR EVIDENCE MATCHING
// ============================================================

export function matchFieldValueToOcrTokens(
  fieldKey: string,
  fieldValue: string,
  images: ImageMetaData[],
  tokensByImage: Map<
    string,
    OcrTokenData[]
  >,
  linesByImage: Map<
    string,
    OcrLineData[]
  >
): {
  matchedImage: ImageMetaData;
  matchedTokens: OcrTokenData[];
  unionBbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score: number;
} | null {
  if (
    !fieldValue ||
    !fieldValue.trim()
  ) {
    return null;
  }

  const normValue =
    normalizeOcrText(fieldValue);

  const valWords = normValue
    .split(" ")
    .filter((w) => w.length > 0);

  if (valWords.length === 0) {
    return null;
  }

  const digitsOnly =
    fieldValue.replace(/\D/g, "");

  interface CandidateMatch {
    matchedImage: ImageMetaData;
    matchedTokens: OcrTokenData[];
    unionBbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    score: number;
    area: number;
  }

  const candidateList: CandidateMatch[] =
    [];

  const getContextBonus = (
    tokens: OcrTokenData[],
    key: string
  ): number => {
    const combinedNorm = tokens
      .map((t) =>
        normalizeOcrText(t.text)
      )
      .join(" ");

    if (
      key === "mrp" ||
      key === "price"
    ) {
      if (
        /mrp|m\.r\.p|rs|₹|max|tax/i.test(
          combinedNorm
        )
      ) {
        return 0.25;
      }
    }

    if (
      key === "netQuantity" ||
      key === "netQty"
    ) {
      if (
        /net|qty|quantity|weight|wt|vol|g|gm|kg|ml|l/i.test(
          combinedNorm
        )
      ) {
        return 0.25;
      }
    }

    if (
      key === "manufacturingDate" ||
      key === "dateInformation" ||
      key === "mfgDate"
    ) {
      if (
        /mfg|pkd|date|packed|manufactured/i.test(
          combinedNorm
        )
      ) {
        return 0.25;
      }
    }

    if (
      key === "bestBefore" ||
      key === "expiry"
    ) {
      if (
        /exp|expiry|use by|best before/i.test(
          combinedNorm
        )
      ) {
        return 0.25;
      }
    }

    if (
      key === "batchNumber" ||
      key === "batch"
    ) {
      if (
        /batch|lot|b\.no|bn/i.test(
          combinedNorm
        )
      ) {
        return 0.25;
      }
    }

    return 0;
  };

  // Search ALL uploaded surfaces.
  for (const img of images) {
    const tokens =
      tokensByImage.get(img.id) || [];

    const lines =
      linesByImage.get(img.id) || [];

    if (tokens.length === 0) continue;

    // --------------------------------------------------------
    // Strategy 1: line-level matching
    // --------------------------------------------------------

    for (const line of lines) {
      const lineTokens = line.tokenIds
        .map((id) =>
          tokens.find(
            (t) => t.id === id
          )
        )
        .filter(Boolean) as OcrTokenData[];

      if (lineTokens.length === 0) {
        continue;
      }

      for (
        let startIdx = 0;
        startIdx < lineTokens.length;
        startIdx++
      ) {
        for (
          let endIdx = startIdx;
          endIdx < lineTokens.length;
          endIdx++
        ) {
          const candidateTokens =
            lineTokens.slice(
              startIdx,
              endIdx + 1
            );

          const candidateText =
            candidateTokens
              .map((t) => t.text)
              .join(" ");

          const simScore =
            calculateStringSimilarity(
              candidateText,
              fieldValue
            );

          if (simScore >= 0.55) {
            const minX = Math.min(
              ...candidateTokens.map(
                (t) => t.bbox.x
              )
            );

            const minY = Math.min(
              ...candidateTokens.map(
                (t) => t.bbox.y
              )
            );

            const maxX = Math.max(
              ...candidateTokens.map(
                (t) =>
                  t.bbox.x +
                  t.bbox.width
              )
            );

            const maxY = Math.max(
              ...candidateTokens.map(
                (t) =>
                  t.bbox.y +
                  t.bbox.height
              )
            );

            const width =
              maxX - minX;

            const height =
              maxY - minY;

            const isExact =
              normalizeOcrText(
                candidateText
              ) === normValue;

            const contextBonus =
              getContextBonus(
                candidateTokens,
                fieldKey
              );

            const compositeScore =
              Number(
                (
                  simScore +
                  (isExact
                    ? 0.3
                    : 0) +
                  contextBonus
                ).toFixed(4)
              );

            candidateList.push({
              matchedImage: img,
              matchedTokens:
                candidateTokens,
              unionBbox: {
                x: minX,
                y: minY,
                width,
                height,
              },
              score: compositeScore,
              area:
                width * height,
            });
          }
        }
      }
    }

    // --------------------------------------------------------
    // Strategy 2: contiguous token sequence
    // --------------------------------------------------------

    const maxWindow = Math.min(
      tokens.length,
      valWords.length + 5
    );

    for (
      let i = 0;
      i < tokens.length;
      i++
    ) {
      for (
        let win = 1;
        win <= maxWindow &&
        i + win <= tokens.length;
        win++
      ) {
        const seqTokens =
          tokens.slice(
            i,
            i + win
          );

        const seqText =
          seqTokens
            .map((t) => t.text)
            .join(" ");

        const simScore =
          calculateStringSimilarity(
            seqText,
            fieldValue
          );

        if (simScore >= 0.6) {
          const minX = Math.min(
            ...seqTokens.map(
              (t) => t.bbox.x
            )
          );

          const minY = Math.min(
            ...seqTokens.map(
              (t) => t.bbox.y
            )
          );

          const maxX = Math.max(
            ...seqTokens.map(
              (t) =>
                t.bbox.x +
                t.bbox.width
            )
          );

          const maxY = Math.max(
            ...seqTokens.map(
              (t) =>
                t.bbox.y +
                t.bbox.height
            )
          );

          const width =
            maxX - minX;

          const height =
            maxY - minY;

          const isExact =
            normalizeOcrText(
              seqText
            ) === normValue;

          const contextBonus =
            getContextBonus(
              seqTokens,
              fieldKey
            );

          const compositeScore =
            Number(
              (
                simScore +
                (isExact
                  ? 0.3
                  : 0) +
                contextBonus
              ).toFixed(4)
            );

          candidateList.push({
            matchedImage: img,
            matchedTokens:
              seqTokens,
            unionBbox: {
              x: minX,
              y: minY,
              width,
              height,
            },
            score: compositeScore,
            area:
              width * height,
          });
        }
      }
    }

    // --------------------------------------------------------
    // Strategy 3: numeric / code matching
    // --------------------------------------------------------

    if (digitsOnly.length >= 2) {
      for (
        let i = 0;
        i < tokens.length;
        i++
      ) {
        const tok = tokens[i];

        const tokDigits =
          tok.text.replace(
            /\D/g,
            ""
          );

        if (
          tokDigits &&
          (
            tokDigits === digitsOnly ||
            tokDigits.includes(
              digitsOnly
            ) ||
            digitsOnly.includes(
              tokDigits
            )
          )
        ) {
          const candidateTokens =
            [tok];

          if (i > 0) {
            const prevTok =
              tokens[i - 1];

            const prevNorm =
              normalizeOcrText(
                prevTok.text
              );

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
              candidateTokens.unshift(
                prevTok
              );
            }
          }

          if (
            i + 1 <
            tokens.length
          ) {
            const nextTok =
              tokens[i + 1];

            const nextNorm =
              normalizeOcrText(
                nextTok.text
              );

            if (
              nextNorm === "g" ||
              nextNorm === "gm" ||
              nextNorm === "ml" ||
              nextNorm === "kg" ||
              nextNorm === "l"
            ) {
              candidateTokens.push(
                nextTok
              );
            }
          }

          const candText =
            candidateTokens
              .map((t) => t.text)
              .join(" ");

          const simScore =
            Math.max(
              0.8,
              calculateStringSimilarity(
                candText,
                fieldValue
              )
            );

          const minX = Math.min(
            ...candidateTokens.map(
              (t) => t.bbox.x
            )
          );

          const minY = Math.min(
            ...candidateTokens.map(
              (t) => t.bbox.y
            )
          );

          const maxX = Math.max(
            ...candidateTokens.map(
              (t) =>
                t.bbox.x +
                t.bbox.width
            )
          );

          const maxY = Math.max(
            ...candidateTokens.map(
              (t) =>
                t.bbox.y +
                t.bbox.height
            )
          );

          const width =
            maxX - minX;

          const height =
            maxY - minY;

          const contextBonus =
            getContextBonus(
              candidateTokens,
              fieldKey
            );

          const compositeScore =
            Number(
              (
                simScore +
                0.2 +
                contextBonus
              ).toFixed(4)
            );

          candidateList.push({
            matchedImage: img,
            matchedTokens:
              candidateTokens,
            unionBbox: {
              x: minX,
              y: minY,
              width,
              height,
            },
            score: compositeScore,
            area:
              width * height,
          });
        }
      }
    }

    // --------------------------------------------------------
    // Strategy 4: address / manufacturer clusters
    // --------------------------------------------------------

    if (valWords.length >= 3) {
      const matchingClusterTokens: OcrTokenData[] =
        [];

      for (const tok of tokens) {
        const tokNorm =
          normalizeOcrText(
            tok.text
          );

        if (
          tokNorm &&
          valWords.some(
            (w) =>
              tokNorm === w ||
              (
                w.length >= 4 &&
                tokNorm.includes(w)
              )
          )
        ) {
          matchingClusterTokens.push(
            tok
          );
        }
      }

      const matchRatio =
        matchingClusterTokens.length /
        valWords.length;

      if (
        matchingClusterTokens.length >=
          2 &&
        matchRatio >= 0.5
      ) {
        const minX = Math.min(
          ...matchingClusterTokens.map(
            (t) => t.bbox.x
          )
        );

        const minY = Math.min(
          ...matchingClusterTokens.map(
            (t) => t.bbox.y
          )
        );

        const maxX = Math.max(
          ...matchingClusterTokens.map(
            (t) =>
              t.bbox.x +
              t.bbox.width
          )
        );

        const maxY = Math.max(
          ...matchingClusterTokens.map(
            (t) =>
              t.bbox.y +
              t.bbox.height
          )
        );

        const width =
          maxX - minX;

        const height =
          maxY - minY;

        const compositeScore =
          Number(
            (
              0.7 +
              0.25 * matchRatio
            ).toFixed(4)
          );

        candidateList.push({
          matchedImage: img,
          matchedTokens:
            matchingClusterTokens,
          unionBbox: {
            x: minX,
            y: minY,
            width,
            height,
          },
          score: compositeScore,
          area:
            width * height,
        });
      }
    }
  }

  if (
    candidateList.length === 0
  ) {
    return null;
  }

  candidateList.sort(
    (a, b) => {
      if (
        Math.abs(
          b.score - a.score
        ) > 0.02
      ) {
        return b.score - a.score;
      }

      return a.area - b.area;
    }
  );

  const best =
    candidateList[0];

  if (
    !best ||
    best.score < 0.6 ||
    !best.matchedImage ||
    best.matchedImage.width <= 0 ||
    best.matchedImage.height <= 0 ||
    best.unionBbox.width <= 0 ||
    best.unionBbox.height <= 0 ||
    best.unionBbox.x < 0 ||
    best.unionBbox.y < 0 ||
    best.unionBbox.x +
      best.unionBbox.width >
      best.matchedImage.width + 15 ||
    best.unionBbox.y +
      best.unionBbox.height >
      best.matchedImage.height + 15
  ) {
    return null;
  }

  return {
    matchedImage:
      best.matchedImage,
    matchedTokens:
      best.matchedTokens,
    unionBbox:
      best.unionBbox,
    score: best.score,
  };
}

// ============================================================
// GEMINI RETRY HELPER
// ============================================================

function sleep(
  ms: number
): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

function isRetryableGeminiError(
  err: any
): boolean {
  const message =
    String(
      err?.message ||
        err ||
        ""
    ).toLowerCase();

  const status =
    err?.status ||
    err?.code ||
    err?.error?.code;

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    message.includes(
      "503"
    ) ||
    message.includes(
      "unavailable"
    ) ||
    message.includes(
      "high demand"
    ) ||
    message.includes(
      "overloaded"
    ) ||
    message.includes(
      "rate limit"
    ) ||
    message.includes(
      "temporarily"
    )
  );
}

async function generateGeminiWithRetry(
  client: GoogleGenAI,
  model: string,
  contents: any[],
  attempts = 3
): Promise<any> {
  let lastError: any = null;

  for (
    let attempt = 1;
    attempt <= attempts;
    attempt++
  ) {
    try {
      console.log(
        `[LabelLens] Gemini request: model=${model}, attempt=${attempt}/${attempts}`
      );

      const response =
        await client.models.generateContent(
          {
            model,
            contents,
            config: {
              responseMimeType:
                "application/json",
              temperature: 0,
            },
          }
        );

      console.log(
        `[LabelLens] Gemini success: model=${model}, attempt=${attempt}`
      );

      return response;
    } catch (err: any) {
      lastError = err;

      console.warn(
        `[LabelLens] Gemini error: model=${model}, attempt=${attempt}/${attempts}`,
        err?.message ||
          err
      );

      if (
        !isRetryableGeminiError(
          err
        ) ||
        attempt >= attempts
      ) {
        throw err;
      }

      const delay =
        attempt === 1
          ? 1500
          : attempt === 2
          ? 3500
          : 6000;

      console.warn(
        `[LabelLens] Retrying Gemini in ${delay}ms...`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

// ============================================================
// MAIN GROUNDED PIPELINE
// ============================================================

export async function executeGroundedPipeline(
  rawInput:
    | NormalizedInputImage[]
    | Record<
        string,
        string | null | undefined
      >
    | {
        images?: any;
        imageRecords?: any;
      },
  client: GoogleGenAI | null
) {
  // ==========================================================
  // 1. NORMALIZE INPUT IMAGES
  // ==========================================================

  const normalizedImages: NormalizedInputImage[] =
    [];

  if (Array.isArray(rawInput)) {
    for (const item of rawInput) {
      if (
        item &&
        item.dataUrl
      ) {
        normalizedImages.push({
          id:
            item.id ||
            `img_${
              item.side ||
              "front"
            }_${Date.now()}`,
          side:
            item.side ||
            "front",
          fileName:
            item.fileName ||
            `${
              item.side ||
              "image"
            }.png`,
          mimeType:
            item.mimeType ||
            "image/png",
          dataUrl:
            item.dataUrl,
          width:
            item.width,
          height:
            item.height,
        });
      }
    }
  } else if (
    rawInput &&
    typeof rawInput === "object"
  ) {
    const candidateImages =
      (rawInput as any).images ||
      rawInput;

    const candidateRecords =
      (rawInput as any)
        .imageRecords || {};

    const sides: Array<
      | "front"
      | "back"
      | "side"
      | "additional"
    > = [
      "front",
      "back",
      "side",
      "additional",
    ];

    for (const side of sides) {
      const dataUrl =
        candidateImages[side];

      if (
        dataUrl &&
        typeof dataUrl ===
          "string"
      ) {
        const record =
          candidateRecords[
            side
          ];

        normalizedImages.push({
          id:
            record?.id ||
            record?.imageId ||
            `img_${side}_${Date.now()}`,
          side,
          fileName:
            record?.fileName ||
            `${side}_surface.png`,
          mimeType:
            record?.mimeType ||
            "image/png",
          dataUrl,
          width:
            record?.width,
          height:
            record?.height,
        });
      }
    }
  }

  if (
    normalizedImages.length ===
    0
  ) {
    return {
      status: 400,
      body: {
        success: false,
        error:
          "No valid package images provided for extraction.",
        fields: {},
        fieldsList: [],
        ocrTokens: [],
      },
    };
  }

  console.log(
    `[LabelLens] Starting grounded pipeline with ${normalizedImages.length} image surface(s).`
  );

  // ==========================================================
  // 2. TESSERACT OCR
  // ==========================================================

  let worker: Worker;

  try {
    worker =
      await getTesseractWorker();
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

  const imageMetadataList: ImageMetaData[] =
    [];

  const allOcrTokens: OcrTokenData[] =
    [];

  const tokensByImage =
    new Map<
      string,
      OcrTokenData[]
    >();

  const linesByImage =
    new Map<
      string,
      OcrLineData[]
    >();

  const geminiImageParts: any[] =
    [];

  let tokenCounter = 1;
  let lineCounter = 1;

  const OCR_MAX_DIMENSION = 1800;

  for (const img of normalizedImages) {
    const parsed =
      await parseImageDataUrl(
        img.dataUrl
      );

    if (!parsed) {
      console.warn(
        `[LabelLens] Could not parse image ${img.id}`
      );
      continue;
    }

    const sourceSide = (
      img.side
        .charAt(0)
        .toUpperCase() +
      img.side.slice(1)
    ) as
      | "Front"
      | "Back"
      | "Side"
      | "Additional";

    const originalWidth =
      parsed.width;

    const originalHeight =
      parsed.height;

    const meta: ImageMetaData =
      {
        id: img.id,
        imageId: img.id,
        side: img.side,
        sourceSide,
        fileName:
          img.fileName,
        mimeType:
          parsed.mimeType,
        width:
          originalWidth,
        height:
          originalHeight,
        dataUrl:
          img.dataUrl,
      };

    imageMetadataList.push(
      meta
    );

    // ========================================================
    // GEMINI IMAGE OPTIMIZATION
    // ========================================================

    let geminiBuffer =
      parsed.buffer;

    try {
      const geminiScale =
        Math.max(
          originalWidth,
          originalHeight
        ) >
        OCR_MAX_DIMENSION
          ? OCR_MAX_DIMENSION /
            Math.max(
              originalWidth,
              originalHeight
            )
          : 1;

      if (
        geminiScale < 1
      ) {
        const geminiWidth =
          Math.max(
            1,
            Math.round(
              originalWidth *
                geminiScale
            )
          );

        const geminiHeight =
          Math.max(
            1,
            Math.round(
              originalHeight *
                geminiScale
            )
          );

        geminiBuffer =
          await sharp(
            parsed.buffer
          )
            .resize(
              geminiWidth,
              geminiHeight,
              {
                fit: "inside",
                withoutEnlargement:
                  true,
              }
            )
            .jpeg({
              quality: 82,
              mozjpeg: true,
            })
            .toBuffer();
      } else {
        geminiBuffer =
          await sharp(
            parsed.buffer
          )
            .jpeg({
              quality: 82,
              mozjpeg: true,
            })
            .toBuffer();
      }
    } catch (
      imageOptimizeErr
    ) {
      console.warn(
        `[LabelLens] Image optimization failed for ${img.id}; using original.`,
        imageOptimizeErr
      );

      geminiBuffer =
        parsed.buffer;
    }

    geminiImageParts.push({
      inlineData: {
        mimeType:
          "image/jpeg",
        data:
          geminiBuffer.toString(
            "base64"
          ),
      },
    });

    geminiImageParts.push({
      text: `Surface [${sourceSide.toUpperCase()}] of the package with imageId: "${img.id}". Exact original dimensions: ${originalWidth}x${originalHeight} pixels.`,
    });

    // ========================================================
    // OCR IMAGE RESIZE
    // ========================================================

    let ocrBuffer =
      parsed.buffer;

    let ocrWidth =
      originalWidth;

    let ocrHeight =
      originalHeight;

    try {
      const maxOriginalDimension =
        Math.max(
          originalWidth,
          originalHeight
        );

      if (
        maxOriginalDimension >
        OCR_MAX_DIMENSION
      ) {
        const scale =
          OCR_MAX_DIMENSION /
          maxOriginalDimension;

        ocrWidth =
          Math.max(
            1,
            Math.round(
              originalWidth *
                scale
            )
          );

        ocrHeight =
          Math.max(
            1,
            Math.round(
              originalHeight *
                scale
            )
          );

        ocrBuffer =
          await sharp(
            parsed.buffer
          )
            .resize(
              ocrWidth,
              ocrHeight,
              {
                fit: "inside",
                withoutEnlargement:
                  true,
              }
            )
            .png()
            .toBuffer();
      }
    } catch (resizeErr) {
      console.warn(
        `[LabelLens] OCR resize failed for ${img.id}; using original.`,
        resizeErr
      );

      ocrBuffer =
        parsed.buffer;

      ocrWidth =
        originalWidth;

      ocrHeight =
        originalHeight;
    }

    const scaleX =
      originalWidth /
      ocrWidth;

    const scaleY =
      originalHeight /
      ocrHeight;

    const imageTokens: OcrTokenData[] =
      [];

    const imageLines: OcrLineData[] =
      [];

    // ========================================================
    // TESSERACT RECOGNITION
    // ========================================================

    try {
      const ocrStartTime =
        Date.now();

      console.log(
  `[LabelLens] Starting Tesseract recognition for ${img.id}`
);

const ocrResult = await Promise.race([
  worker.recognize(
    ocrBuffer,
    {},
    { blocks: true }
  ),
  new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            `Tesseract timeout after 30 seconds for ${img.id}`
          )
        ),
      30000
    )
  ),
]);

console.log(
  `[LabelLens] Tesseract recognition completed for ${img.id}`
);
      console.log(
        `[LabelLens] Tesseract OCR for ${img.id}: ${
          Date.now() -
          ocrStartTime
        } ms`
      );

      for (const block of
        ocrResult.data
          .blocks || []) {
        for (const para of
          block.paragraphs ||
          []) {
          for (const line of
            para.lines || []) {
            const lineTokenIds: string[] =
              [];

            const lineText =
              (
                line.text ||
                ""
              ).trim();

            for (const word of
              line.words || []) {
              const text =
                (
                  word.text ||
                  ""
                ).trim();

              if (!text) continue;

              const x =
                Math.max(
                  0,
                  Math.round(
                    word.bbox.x0 *
                      scaleX
                  )
                );

              const y =
                Math.max(
                  0,
                  Math.round(
                    word.bbox.y0 *
                      scaleY
                  )
                );

              const width =
                Math.max(
                  1,
                  Math.round(
                    (
                      word.bbox.x1 -
                      word.bbox.x0
                    ) *
                      scaleX
                  )
                );

              const height =
                Math.max(
                  1,
                  Math.round(
                    (
                      word.bbox.y1 -
                      word.bbox.y0
                    ) *
                      scaleY
                  )
                );

              const token: OcrTokenData =
                {
                  id: `ocr_${String(
                    tokenCounter++
                  ).padStart(
                    3,
                    "0"
                  )}`,
                  imageId:
                    img.id,
                  sourceSide,
                  text,
                  confidence:
                    Number(
                      (
                        (word.confidence ||
                          85) /
                        100
                      ).toFixed(
                        2
                      )
                    ),
                  bbox: {
                    x,
                    y,
                    width,
                    height,
                  },
                  lineIndex:
                    lineCounter,
                };

              allOcrTokens.push(
                token
              );

              imageTokens.push(
                token
              );

              lineTokenIds.push(
                token.id
              );
            }

            if (
              lineText &&
              lineTokenIds.length >
                0
            ) {
              const lx =
                Math.max(
                  0,
                  Math.round(
                    line.bbox.x0 *
                      scaleX
                  )
                );

              const ly =
                Math.max(
                  0,
                  Math.round(
                    line.bbox.y0 *
                      scaleY
                  )
                );

              const lw =
                Math.max(
                  1,
                  Math.round(
                    (
                      line.bbox.x1 -
                      line.bbox.x0
                    ) *
                      scaleX
                  )
                );

              const lh =
                Math.max(
                  1,
                  Math.round(
                    (
                      line.bbox.y1 -
                      line.bbox.y0
                    ) *
                      scaleY
                  )
                );

              imageLines.push({
                id: `line_${String(
                  lineCounter++
                ).padStart(
                  3,
                  "0"
                )}`,
                imageId:
                  img.id,
                sourceSide,
                text: lineText,
                bbox: {
                  x: lx,
                  y: ly,
                  width: lw,
                  height: lh,
                },
                tokenIds:
                  lineTokenIds,
              });
            }
          }
        }
      }
    } catch (ocrErr) {
      console.error(
        `[LabelLens] Tesseract OCR failed on image [${img.id}]:`,
        ocrErr
      );
    }

    tokensByImage.set(
      img.id,
      imageTokens
    );

    linesByImage.set(
      img.id,
      imageLines
    );

    console.log(
      `[LabelLens] ${img.id}: ${imageTokens.length} OCR tokens, ${imageLines.length} OCR lines`
    );
  }

  // ==========================================================
  // EMPTY FIELD HELPER
  // ==========================================================

  const buildEmptyFields =
    () => {
      const fieldsByKey: Record<
        string,
        GroundedFieldResult
      > = {};

      const fieldsList: GroundedFieldResult[] =
        [];

      for (const key of
        STATUTORY_FIELD_KEYS) {
        const label =
          getFieldLabel(key);

        const aliasKey =
          key ===
          "manufacturerAddress"
            ? "address"
            : key ===
              "manufacturingDate"
            ? "dateInformation"
            : key;

        const emptyField: GroundedFieldResult =
          {
            key: aliasKey,
            label,
            extractedValue:
              "",
            verifiedValue:
              "",
            value: null,
            status:
              "NOT_DETECTED",
            confidenceLevel:
              "NOT DETECTED",
            confidenceState:
              "NOT DETECTED",
            confidence: 0,
            sourceTokenIds:
              [],
            evidenceBox:
              null,
            evidence: [],
            sourceImage:
              "Not Visible",
            sourceImageId:
              undefined,
            isManuallyVerified:
              false,
            isNotVisible:
              true,
            evidenceSnippet:
              undefined,
            locationDescription:
              "Exact evidence location unavailable.",
          };

        fieldsByKey[
          aliasKey
        ] = emptyField;

        fieldsList.push(
          emptyField
        );
      }

      return {
        fieldsByKey,
        fieldsList,
      };
    };

  // ==========================================================
  // 3. GEMINI EXTRACTION
  // ==========================================================

  let rawGeminiValues: Record<
    string,
    any
  > = {};

  let modelUsed =
    "gemini-2.5-flash";

  let geminiSucceeded =
    false;

  if (client) {
    const geminiExtractionPrompt = `
You are an expert Legal Metrology Packaged Commodities inspector.

Analyze ALL submitted package image surfaces together.

Your task is to extract ONLY the statutory declaration values that are visibly present on the submitted package images.

IMPORTANT:
- Analyze FRONT, BACK, SIDE and ADDITIONAL images together.
- Do not restrict yourself to the first image.
- A declaration may appear on any surface.
- Use only information visibly present in the images.
- Do NOT invent missing information.
- Do NOT infer a value because it is legally expected.
- If a field cannot be clearly seen, return null.
- Preserve the visible wording and value as closely as possible.
- Do NOT generate bounding boxes.
- Do NOT generate coordinates.
- Do NOT guess the image location.
- Do NOT mark a field as detected merely because another field suggests it exists.
- You may combine information from multiple package surfaces when necessary.
- Product name should be the actual product name visible on the package.
- Brand name should be the visible brand.
- MRP should preserve the visible price.
- Net quantity should preserve the visible quantity and unit.
- Manufacturer should contain the visible manufacturer/packer name.
- Manufacturer address should contain the visible address.
- Batch number should contain the visible batch/lot identifier.
- Manufacturing date should contain the visible manufacturing/packing date.
- Best before should contain the visible best-before/expiry information.
- Consumer care should contain visible consumer contact information.
- Country of origin should contain the visible country declaration.

Return ONLY valid JSON.

Use exactly this structure:

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

    const geminiContents = [
      ...geminiImageParts,
      {
        text: geminiExtractionPrompt,
      },
    ];

    // --------------------------------------------------------
    // PRIMARY: GEMINI 2.5 FLASH
    // --------------------------------------------------------

    try {
      console.log(
        `[LabelLens] Starting primary Gemini extraction with gemini-2.5-flash`
      );

      const res =
        await generateGeminiWithRetry(
          client,
          "gemini-2.5-flash",
          geminiContents,
          3
        );

      const text =
        res?.text || "{}";

      console.log(
        `[LabelLens] Gemini 2.5 raw response length: ${text.length}`
      );

      rawGeminiValues =
        JSON.parse(
          text
            .replace(
              /```json/g,
              ""
            )
            .replace(
              /```/g,
              ""
            )
            .trim()
        );

      geminiSucceeded = true;
      modelUsed =
        "gemini-2.5-flash";

      console.log(
        `[LabelLens] Primary Gemini extraction succeeded.`
      );
    } catch (
      primaryErr: any
    ) {
      console.error(
        `[LabelLens] Primary Gemini 2.5 Flash failed:`,
        primaryErr?.message ||
          primaryErr
      );

      // ------------------------------------------------------
      // FALLBACK: GEMINI 3.5 FLASH
      // ------------------------------------------------------

      try {
        console.log(
          `[LabelLens] Switching to fallback gemini-3.5-flash`
        );

        const res =
          await generateGeminiWithRetry(
            client,
            "gemini-3.5-flash",
            geminiContents,
            3
          );

        const text =
          res?.text || "{}";

        console.log(
          `[LabelLens] Gemini 3.5 raw response length: ${text.length}`
        );

        rawGeminiValues =
          JSON.parse(
            text
              .replace(
                /```json/g,
                ""
              )
              .replace(
                /```/g,
                ""
              )
              .trim()
          );

        geminiSucceeded = true;
        modelUsed =
          "gemini-3.5-flash";

        console.log(
          `[LabelLens] Fallback Gemini extraction succeeded.`
        );
      } catch (
        fallbackErr: any
      ) {
        console.error(
          `[LabelLens] Gemini extraction failed on both models.`,
          fallbackErr?.message ||
            fallbackErr
        );

        rawGeminiValues = {};
        geminiSucceeded =
          false;
      }
    }
  } else {
    console.warn(
      `[LabelLens] Gemini client unavailable.`
    );
  }

  // ==========================================================
  // 4. MATCH GEMINI VALUES TO OCR
  // ==========================================================

  const processedFieldsByKey: Record<
    string,
    GroundedFieldResult
  > = {};

  const processedFieldsList: GroundedFieldResult[] =
    [];

  for (const fieldKey of
    STATUTORY_FIELD_KEYS) {
    const raw =
      rawGeminiValues[
        fieldKey
      ];

    const val =
      raw?.value
        ? String(
            raw.value
          ).trim()
        : "";

    const isDetected =
      Boolean(val) &&
      raw?.status !==
        "NOT_DETECTED";

    const label =
      getFieldLabel(
        fieldKey
      );

    const aliasKey =
      fieldKey ===
      "manufacturerAddress"
        ? "address"
        : fieldKey ===
          "manufacturingDate"
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
          matchedTokens.map(
            (t) => t.id
          );

        const evidenceBox: EvidenceBoxData =
          {
            x: unionBbox.x,
            y: unionBbox.y,
            width:
              unionBbox.width,
            height:
              unionBbox.height,
            originalWidth:
              matchedImage.width,
            originalHeight:
              matchedImage.height,
            imageId:
              matchedImage.id,
            sourceSide,
            sourceTokenIds:
              tokenIds,
            tokenIds,
            tokens:
              matchedTokens.map(
                (t) => ({
                  id: t.id,
                  text: t.text,
                  bbox:
                    t.bbox,
                  confidence:
                    t.confidence,
                })
              ),
          };

        const evidenceRegions =
          [
            {
              id: `ev_${aliasKey}_${matchedImage.id}`,
              sourceImageId:
                matchedImage.id,
              sourceSide,
              x: Number(
                (
                  unionBbox.x /
                  matchedImage.width
                ).toFixed(
                  4
                )
              ),
              y: Number(
                (
                  unionBbox.y /
                  matchedImage.height
                ).toFixed(
                  4
                )
              ),
              width: Number(
                (
                  unionBbox.width /
                  matchedImage.width
                ).toFixed(
                  4
                )
              ),
              height: Number(
                (
                  unionBbox.height /
                  matchedImage.height
                ).toFixed(
                  4
                )
              ),
              pixelBbox: {
                x: unionBbox.x,
                y: unionBbox.y,
                width:
                  unionBbox.width,
                height:
                  unionBbox.height,
              },
              snippet:
                matchedTokens
                  .map(
                    (t) =>
                      t.text
                  )
                  .join(
                    " "
                  ) || val,
              confidence:
                "HIGH" as const,
            },
          ];

        const fieldResult: GroundedFieldResult =
          {
            key: aliasKey,
            label,
            extractedValue:
              val,
            verifiedValue:
              val,
            value: val,
            status:
              "DETECTED",
            confidenceLevel:
              "HIGH",
            confidenceState:
              "HIGH CONFIDENCE",
            confidence: 95,
            sourceTokenIds:
              tokenIds,
            evidenceTokenIds:
              tokenIds,
            evidenceBox,
            evidence:
              evidenceRegions,
            sourceImageId:
              matchedImage.id,
            sourceImage:
              sourceSide,
            isManuallyVerified:
              false,
            isNotVisible:
              false,
            evidenceSnippet:
              matchedTokens
                .map(
                  (t) =>
                    t.text
                )
                .join(
                  " "
                ) || val,
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
      }

      // Gemini detected value,
      // but OCR could not find exact evidence.
      const noBoxField: GroundedFieldResult =
        {
          key: aliasKey,
          label,
          extractedValue:
            val,
          verifiedValue:
            val,
          value: val,
          status:
            "NEEDS_MANUAL_VERIFICATION",
          confidenceLevel:
            "MEDIUM",
          confidenceState:
            "MEDIUM CONFIDENCE",
          confidence: 70,
          sourceTokenIds:
            [],
          evidenceTokenIds:
            [],
          evidenceBox:
            null,
          evidence: [],
          sourceImage:
            "Not Visible",
          sourceImageId:
            undefined,
          isManuallyVerified:
            false,
          isNotVisible:
            false,
          evidenceSnippet:
            val,
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

    // --------------------------------------------------------
    // NOT DETECTED
    // --------------------------------------------------------

    const notDetectedField: GroundedFieldResult =
      {
        key: aliasKey,
        label,
        extractedValue:
          "",
        verifiedValue:
          "",
        value: null,
        status:
          "NOT_DETECTED",
        confidenceLevel:
          "NOT DETECTED",
        confidenceState:
          "NOT DETECTED",
        confidence: 0,
        sourceTokenIds:
          [],
        evidenceTokenIds:
          [],
        evidenceBox:
          null,
        evidence: [],
        sourceImage:
          "Not Visible",
        sourceImageId:
          undefined,
        isManuallyVerified:
          false,
        isNotVisible:
          true,
        evidenceSnippet:
          undefined,
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

  // ==========================================================
  // 5. FORMAT OCR DATA FOR FRONTEND
  // ==========================================================

  const detectedTexts =
    allOcrTokens.map(
      (t) => ({
        id: t.id,
        text: t.text,
        sourceImageId:
          t.imageId,
        sourceSide:
          t.sourceSide,
        x: t.bbox.x,
        y: t.bbox.y,
        width:
          t.bbox.width,
        height:
          t.bbox.height,
        pixelBbox:
          t.bbox,
      })
    );

  console.log(
    `[LabelLens] Pipeline complete. Gemini=${geminiSucceeded ? "SUCCESS" : "FAILED"}, model=${modelUsed}, OCR tokens=${allOcrTokens.length}, fields=${processedFieldsList.length}`
  );

  return {
    status: 200,
    body: {
      success: true,
      modelUsed,
      images:
        imageMetadataList,
      ocrTokens:
        allOcrTokens,
      detectedTexts,
      geminiMapping:
        rawGeminiValues,
      fields:
        processedFieldsByKey,
      fieldsList:
        processedFieldsList,
    },
  };
}

// ============================================================
// GOLDEN TEST ASSET GENERATOR
// ============================================================

export async function generateGoldenTestAssets() {
  const frontSvg = `
  <svg width="1200" height="1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="1000" fill="#ffffff"/>
    <rect x="24" y="24" width="1152" height="952"
      fill="#fffbeb" stroke="#b45309"
      stroke-width="4" rx="16"/>

    <text x="600" y="160"
      font-family="Arial, sans-serif"
      font-size="96"
      font-weight="bold"
      fill="#000000"
      text-anchor="middle">
      Haldiram's
    </text>

    <text x="600" y="280"
      font-family="Arial, sans-serif"
      font-size="84"
      font-weight="bold"
      fill="#000000"
      text-anchor="middle">
      Bhujia Sev
    </text>

    <text x="600" y="380"
      font-family="Arial, sans-serif"
      font-size="34"
      font-weight="bold"
      fill="#475569"
      text-anchor="middle">
      SPICED MOTH BEAN &amp; GRAM FLOUR SAVOURY NOODLES
    </text>

    <text x="600" y="520"
      font-family="Arial, sans-serif"
      font-size="64"
      font-weight="bold"
      fill="#000000"
      text-anchor="middle">
      MRP Rs. 50
    </text>

    <text x="600" y="630"
      font-family="Arial, sans-serif"
      font-size="56"
      font-weight="bold"
      fill="#000000"
      text-anchor="middle">
      Net Wt. 200 g
    </text>

    <text x="600" y="720"
      font-family="Arial, sans-serif"
      font-size="36"
      fill="#64748b"
      text-anchor="middle">
      Inclusive of all taxes
    </text>

    <text x="600" y="800"
      font-family="Arial, sans-serif"
      font-size="36"
      font-weight="bold"
      fill="#15803d"
      text-anchor="middle">
      Country of Origin: India
    </text>
  </svg>`;

  const backSvg = `
  <svg width="1200" height="1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="1000" fill="#ffffff"/>

    <rect x="20" y="20"
      width="1160" height="960"
      fill="#f8fafc"
      stroke="#334155"
      stroke-width="8"
      rx="20"/>

    <text x="100" y="100"
      font-family="Arial, sans-serif"
      font-size="44"
      font-weight="bold"
      fill="#0f172a">
      STATUTORY DECLARATIONS
    </text>

    <line x1="100" y1="120"
      x2="1100" y2="120"
      stroke="#cbd5e1"
      stroke-width="4"/>

    <text x="100" y="200"
      font-family="Arial, sans-serif"
      font-size="36"
      font-weight="bold"
      fill="#000000">
      Manufacturer:
    </text>

    <text x="100" y="260"
      font-family="Arial, sans-serif"
      font-size="34"
      fill="#000000">
      Haldiram Snacks Pvt. Ltd.
    </text>

    <text x="100" y="320"
      font-family="Arial, sans-serif"
      font-size="30"
      fill="#334155">
      B-1/H-8, Mohan Co-op Industrial Estate, Main Mathura Road, New Delhi 110044
    </text>

    <text x="100" y="420"
      font-family="Arial, sans-serif"
      font-size="36"
      font-weight="bold"
      fill="#000000">
      Month &amp; Year of Mfg: 03/2026
    </text>

    <text x="100" y="500"
      font-family="Arial, sans-serif"
      font-size="36"
      font-weight="bold"
      fill="#000000">
      Best Before: 6 Months from packaging
    </text>

    <text x="100" y="600"
      font-family="Arial, sans-serif"
      font-size="34"
      font-weight="bold"
      fill="#000000">
      Consumer Care: customercare@haldirams.com | Tel: 011-45204100
    </text>
  </svg>`;

  const sideSvg = `
  <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="1000" fill="#ffffff"/>

    <rect x="20" y="20"
      width="760" height="960"
      fill="#fefce8"
      stroke="#ca8a04"
      stroke-width="4"
      rx="16"/>

    <text x="400" y="140"
      font-family="Arial, sans-serif"
      font-size="40"
      font-weight="bold"
      fill="#000000"
      text-anchor="middle">
      PRODUCT BATCH DETAILS
    </text>

    <line x1="80" y1="180"
      x2="720" y2="180"
      stroke="#e2e8f0"
      stroke-width="4"/>

    <text x="400" y="320"
      font-family="Arial, sans-serif"
      font-size="44"
      font-weight="bold"
      fill="#000000"
      text-anchor="middle">
      Batch / Lot Number: HL-BH-2026
    </text>

    <text x="400" y="440"
      font-family="Arial, sans-serif"
      font-size="32"
      fill="#475569"
      text-anchor="middle">
      BARCODE: 8901234567890
    </text>

    <text x="400" y="560"
      font-family="Arial, sans-serif"
      font-size="30"
      fill="#64748b"
      text-anchor="middle">
      STORE IN A COOL DRY PLACE
    </text>
  </svg>`;

  const frontBuf =
    await sharp(
      Buffer.from(frontSvg)
    )
      .png()
      .toBuffer();

  const backBuf =
    await sharp(
      Buffer.from(backSvg)
    )
      .png()
      .toBuffer();

  const sideBuf =
    await sharp(
      Buffer.from(sideSvg)
    )
      .png()
      .toBuffer();

  const frontDataUrl =
    `data:image/png;base64,${frontBuf.toString(
      "base64"
    )}`;

  const backDataUrl =
    `data:image/png;base64,${backBuf.toString(
      "base64"
    )}`;

  const sideDataUrl =
    `data:image/png;base64,${sideBuf.toString(
      "base64"
    )}`;

  return {
    front: {
      id: "img_golden_front",
      side: "front" as const,
      fileName:
        "haldiram_bhujia_front.png",
      mimeType:
        "image/png",
      width: 1200,
      height: 1000,
      dataUrl:
        frontDataUrl,
    },

    back: {
      id: "img_golden_back",
      side: "back" as const,
      fileName:
        "haldiram_bhujia_back.png",
      mimeType:
        "image/png",
      width: 1200,
      height: 1000,
      dataUrl:
        backDataUrl,
    },

    side: {
      id: "img_golden_side",
      side: "side" as const,
      fileName:
        "haldiram_bhujia_side.png",
      mimeType:
        "image/png",
      width: 800,
      height: 1000,
      dataUrl:
        sideDataUrl,
    },
  };
}

// ============================================================
// GOLDEN TEST
// ============================================================

export async function runGoldenTest(
  client: GoogleGenAI | null
) {
  const assets =
    await generateGoldenTestAssets();

  const images = [
    assets.front,
    assets.back,
    assets.side,
  ];

  const startTime =
    Date.now();

  const pipelineResult =
    await executeGroundedPipeline(
      images,
      client
    );

  const elapsedMs =
    Date.now() -
    startTime;

  const ocrTokens: OcrTokenData[] =
    pipelineResult.body
      .ocrTokens || [];

  const fields: Record<
    string,
    GroundedFieldResult
  > =
    pipelineResult.body
      .fields || {};

  // 1. SunPure must NOT be in OCR tokens
  const tokenTexts =
    ocrTokens.map(
      (t) =>
        t.text.toLowerCase()
    );

  const sunPureInTokens =
    tokenTexts.some(
      (t) =>
        t.includes(
          "sunpure"
        )
    );

  // 2. SunPure must NOT be in fields
  const fieldValues =
    Object.values(fields).map(
      (f) =>
        (
          f.extractedValue ||
          ""
        ).toLowerCase()
    );

  const sunPureInFields =
    fieldValues.some(
      (v) =>
        v.includes(
          "sunpure"
        )
    );

  // 3. Haldiram brand
  const brandNameVal =
    fields.brandName
      ?.extractedValue ||
    "";

  const brandDetected =
    /haldiram/i.test(
      brandNameVal
    );

  // 4. Bhujia product
  const productNameVal =
    fields.productName
      ?.extractedValue ||
    "";

  const productDetected =
    /bhujia/i.test(
      productNameVal
    );

  const productOnFront =
    fields.productName
      ?.sourceImage ===
      "Front" &&
    !!fields.productName
      ?.evidenceBox;

  // 5. MRP
  const mrpVal =
    fields.mrp
      ?.extractedValue ||
    "";

  const mrpDetected =
    /50/i.test(
      mrpVal
    );

  // 6. Net quantity
  const qtyVal =
    fields.netQuantity
      ?.extractedValue ||
    "";

  const qtyDetected =
    /200/i.test(
      qtyVal
    );

  // 7. Manufacturer
  const mfgVal =
    fields.manufacturer
      ?.extractedValue ||
    "";

  const mfgDetected =
    /haldiram/i.test(
      mfgVal
    );

  const mfgOnBack =
    fields.manufacturer
      ?.sourceImage ===
      "Back" &&
    !!fields.manufacturer
      ?.evidenceBox;

  // 8. Manufacturing date
  const dateVal =
    fields.dateInformation
      ?.extractedValue ||
    fields.manufacturingDate
      ?.extractedValue ||
    "";

  const dateDetected =
    /03\/2026/i.test(
      dateVal
    ) ||
    /2026/i.test(
      dateVal
    );

  const dateOnBack =
    (
      fields.dateInformation
        ?.sourceImage ===
        "Back" ||
      fields.manufacturingDate
        ?.sourceImage ===
        "Back"
    ) &&
    !!(
      fields.dateInformation
        ?.evidenceBox ||
      fields.manufacturingDate
        ?.evidenceBox
    );

  // 9. Batch number
  const batchVal =
    fields.batchNumber
      ?.extractedValue ||
    "";

  const batchDetected =
    /HL-BH-2026/i.test(
      batchVal
    ) ||
    /2026/i.test(
      batchVal
    );

  const batchOnSideOrBack =
    (
      fields.batchNumber
        ?.sourceImage ===
        "Side" ||
      fields.batchNumber
        ?.sourceImage ===
        "Back"
    ) &&
    !!fields.batchNumber
      ?.evidenceBox;

  const passed =
    !sunPureInTokens &&
    !sunPureInFields &&
    brandDetected &&
    productDetected &&
    mrpDetected &&
    qtyDetected;

  return {
    testName:
      "Golden Test: Haldiram's Bhujia Verification",

    timestamp:
      new Date().toISOString(),

    elapsedMs,

    passed,

    assertions: {
      sunPureNotInTokens:
        !sunPureInTokens,

      sunPureNotInFields:
        !sunPureInFields,

      haldiramBrandDetected:
        brandDetected,

      bhujiaProductDetected:
        productDetected,

      mrpDetected:
        mrpDetected,

      netQuantityDetected:
        qtyDetected,

      front_ProductName_ExactBbox:
        productOnFront,

      back_Manufacturer_ExactBbox:
        mfgOnBack,

      back_ManufacturingDate_ExactBbox:
        dateOnBack,

      side_BatchNumber_ExactBbox:
        batchOnSideOrBack,
    },

    goldenAssets: {
      front: {
        id: assets.front.id,
        side:
          assets.front.side,
        fileName:
          assets.front.fileName,
        width:
          assets.front.width,
        height:
          assets.front.height,
        dataUrl:
          assets.front.dataUrl,
      },

      back: {
        id: assets.back.id,
        side:
          assets.back.side,
        fileName:
          assets.back.fileName,
        width:
          assets.back.width,
        height:
          assets.back.height,
        dataUrl:
          assets.back.dataUrl,
      },

      side: {
        id: assets.side.id,
        side:
          assets.side.side,
        fileName:
          assets.side.fileName,
        width:
          assets.side.width,
        height:
          assets.side.height,
        dataUrl:
          assets.side.dataUrl,
      },
    },

    pipelineResult:
      pipelineResult.body,
  };
}