import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import {
  ExtractedField,
  PackageImages,
  UploadedImageRecord,
  DetectedText,
  ImageSide,
} from '../../types';
import {
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Camera,
  Image as ImageIcon,
  Edit3,
} from 'lucide-react';

export interface EvidenceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: ExtractedField | null;
  images: PackageImages;
  imageRecords?: Record<string, UploadedImageRecord | null> | UploadedImageRecord[];
  allOcrTokens?: DetectedText[];
  onEditField?: (field: ExtractedField) => void;
}

interface ImageCatalogItem {
  id: string;
  side: ImageSide;
  label: string;
  dataUrl: string;
  fileName: string;
  width: number;
  height: number;
}

export interface ResolvedEvidence {
  imageId: string | null;
  imageUrl: string | null;
  source: string;
  matchedText: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  confidence: number;
  method:
    | '1_explicit_field_token'
    | '2_explicit_field_source'
    | '3_exact_ocr_token'
    | '4_exact_text_in_known_source'
    | '5_single_image_fallback'
    | '6_no_evidence';
  coordinateSystem: 'pixel' | 'normalized_0_1' | 'normalized_0_1000' | 'none';
  tokenId?: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

export function normalizeSide(str?: string | null): ImageSide | null {
  if (!str) return null;
  const lower = str.toLowerCase().trim();
  if (lower === 'not visible' || lower === 'none' || lower === 'uncaptured' || lower === 'null') return null;
  if (lower.includes('front') || lower.includes('image 1') || lower.includes('img_1') || lower === '0') return 'front';
  if (lower.includes('back') || lower.includes('image 2') || lower.includes('img_2') || lower === '1') return 'back';
  if (lower.includes('side') || lower.includes('image 3') || lower.includes('img_3') || lower === '2') return 'side';
  if (lower.includes('add') || lower.includes('image 4') || lower.includes('img_4') || lower === '3') return 'additional';
  return null;
}

export function matchCatalogItem(
  catalog: ImageCatalogItem[],
  imageId?: string | null,
  sideStr?: string | null
): ImageCatalogItem | null {
  if (!catalog || catalog.length === 0) return null;

  // 1. Exact ID match
  if (imageId) {
    const exact = catalog.find((c) => c.id === imageId);
    if (exact) return exact;
  }

  // 2. Partial ID match
  if (imageId) {
    const normReq = imageId.toLowerCase();
    const partial = catalog.find(
      (c) => c.id.toLowerCase().includes(normReq) || normReq.includes(c.id.toLowerCase())
    );
    if (partial) return partial;
  }

  // 3. Side match derived from sideStr or imageId
  const targetSide = normalizeSide(sideStr) || normalizeSide(imageId);
  if (targetSide) {
    const sideMatch = catalog.find((c) => c.side === targetSide);
    if (sideMatch) return sideMatch;
  }

  return null;
}

function parseRawBbox(
  raw: any,
  field?: ExtractedField | null
): { x: number; y: number; width: number; height: number; origW?: number; origH?: number } | null {
  if (!raw) return null;

  let x = 0;
  let y = 0;
  let w = 0;
  let h = 0;

  let origW: number | undefined =
    raw.originalWidth || raw.imageWidth || raw.origW || field?.evidenceBox?.originalWidth;
  let origH: number | undefined =
    raw.originalHeight || raw.imageHeight || raw.origH || field?.evidenceBox?.originalHeight;

  if (typeof raw.x === 'number' && typeof raw.width === 'number') {
    x = raw.x;
    y = raw.y;
    w = raw.width;
    h = raw.height;
  } else if (typeof raw.left === 'number' && typeof raw.width === 'number') {
    x = raw.left;
    y = raw.top;
    w = raw.width;
    h = raw.height;
  } else if (typeof raw.xMin === 'number' && typeof raw.xMax === 'number') {
    x = raw.xMin;
    y = raw.yMin;
    w = raw.xMax - raw.xMin;
    h = raw.yMax - raw.yMin;
  } else if (typeof raw.xmin === 'number' && typeof raw.xmax === 'number') {
    x = raw.xmin;
    y = raw.ymin;
    w = raw.xmax - raw.xmin;
    h = raw.ymax - raw.ymin;
  } else if (Array.isArray(raw) && raw.length === 4 && typeof raw[0] === 'number') {
    if (raw[2] > raw[0] && raw[3] > raw[1] && raw[2] <= 1000 && raw[3] <= 1000) {
      x = raw[1];
      y = raw[0];
      w = raw[3] - raw[1];
      h = raw[2] - raw[0];
    } else {
      x = raw[0];
      y = raw[1];
      w = raw[2];
      h = raw[3];
    }
  } else if (Array.isArray(raw) && raw.length >= 3 && typeof raw[0] === 'object') {
    const xs = raw.map((p: any) => (p.x !== undefined ? p.x : p[0] ?? 0));
    const ys = raw.map((p: any) => (p.y !== undefined ? p.y : p[1] ?? 0));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    x = minX;
    y = minY;
    w = maxX - minX;
    h = maxY - minY;
  } else {
    return null;
  }

  if (w <= 0 || h <= 0) return null;

  // Infer standard 600x480 coordinate space for absolute pixel boxes without explicitly passed origW
  if (!origW && x > 1 && x <= 600 && w <= 600) {
    origW = 600;
  }
  if (!origH && y > 1 && y <= 480 && h <= 480) {
    origH = 480;
  }

  return { x, y, width: w, height: h, origW, origH };
}

function convertBboxToNaturalPixels(
  parsed: { x: number; y: number; width: number; height: number; origW?: number; origH?: number },
  naturalWidth: number,
  naturalHeight: number
): { bbox: { x: number; y: number; width: number; height: number }; coordSystem: 'pixel' | 'normalized_0_1' | 'normalized_0_1000' } {
  const { x, y, width, height, origW, origH } = parsed;

  let coordSystem: 'pixel' | 'normalized_0_1' | 'normalized_0_1000' = 'pixel';
  let pixelX = x;
  let pixelY = y;
  let pixelW = width;
  let pixelH = height;

  const isNormalized01 = width <= 1.0 && height <= 1.0 && x <= 1.0 && y <= 1.0;
  const isNormalized1000 =
    !isNormalized01 &&
    x + width <= 1000 &&
    y + height <= 1000 &&
    (origW === 1000 || (naturalWidth > 1000 && (!origW || origW === 1000)));

  if (isNormalized01) {
    coordSystem = 'normalized_0_1';
    pixelX = x * naturalWidth;
    pixelY = y * naturalHeight;
    pixelW = width * naturalWidth;
    pixelH = height * naturalHeight;
  } else if (isNormalized1000) {
    coordSystem = 'normalized_0_1000';
    pixelX = (x / 1000) * naturalWidth;
    pixelY = (y / 1000) * naturalHeight;
    pixelW = (width / 1000) * naturalWidth;
    pixelH = (height / 1000) * naturalHeight;
  } else {
    coordSystem = 'pixel';
    const refW = origW && origW > 0 ? origW : (naturalWidth < 800 && x <= 600 ? 600 : naturalWidth);
    const refH = origH && origH > 0 ? origH : (naturalHeight < 800 && y <= 480 ? 480 : naturalHeight);

    if (refW !== naturalWidth || refH !== naturalHeight) {
      const scaleX = naturalWidth / refW;
      const scaleY = naturalHeight / refH;
      pixelX = x * scaleX;
      pixelY = y * scaleY;
      pixelW = width * scaleX;
      pixelH = height * scaleY;
    }
  }

  const clampedX = Math.max(0, Math.min(naturalWidth - 1, Math.round(pixelX)));
  const clampedY = Math.max(0, Math.min(naturalHeight - 1, Math.round(pixelY)));
  const clampedW = Math.max(1, Math.min(naturalWidth - clampedX, Math.round(pixelW)));
  const clampedH = Math.max(1, Math.min(naturalHeight - clampedY, Math.round(pixelH)));

  return {
    bbox: { x: clampedX, y: clampedY, width: clampedW, height: clampedH },
    coordSystem,
  };
}

export function resolveEvidence(
  field: ExtractedField | null,
  imageCatalog: ImageCatalogItem[],
  allOcrTokens: DetectedText[] = []
): ResolvedEvidence {
  if (!field || imageCatalog.length === 0) {
    return {
      imageId: null,
      imageUrl: null,
      source: field?.sourceImage || 'Not Visible',
      matchedText: field?.extractedValue || '',
      bbox: null,
      confidence: 0,
      method: '6_no_evidence',
      coordinateSystem: 'none',
    };
  }

  const fieldSourceSide =
    normalizeSide(field.sourceImage) ||
    normalizeSide(field.evidenceBox?.sourceSide) ||
    normalizeSide(field.evidence?.[0]?.sourceSide);

  const fieldSourceImageId =
    field.sourceImageId ||
    field.evidenceBox?.imageId ||
    field.evidence?.[0]?.sourceImageId;

  const targetCatalogItem = matchCatalogItem(imageCatalog, fieldSourceImageId, fieldSourceSide);

  // Priority 1: Explicit field evidence/token reference
  const tokenIds =
    field.evidenceTokenIds ||
    field.sourceTokenIds ||
    field.evidenceBox?.tokenIds ||
    field.evidenceBox?.sourceTokenIds ||
    [];

  if (tokenIds.length > 0 && allOcrTokens.length > 0) {
    const targetToken = allOcrTokens.find((t) => tokenIds.includes(t.id));
    if (targetToken) {
      const tokenSide = normalizeSide(targetToken.sourceSide) || normalizeSide(targetToken.sourceImageId);
      const imgItem = matchCatalogItem(imageCatalog, targetToken.sourceImageId, tokenSide) || targetCatalogItem;

      if (imgItem) {
        const rawBox = targetToken.pixelBbox || {
          x: targetToken.x,
          y: targetToken.y,
          width: targetToken.width,
          height: targetToken.height,
        };
        const parsed = parseRawBbox(rawBox, field);
        if (parsed) {
          const { bbox, coordSystem } = convertBboxToNaturalPixels(parsed, imgItem.width, imgItem.height);
          return {
            imageId: imgItem.id,
            imageUrl: imgItem.dataUrl,
            source: imgItem.side.charAt(0).toUpperCase() + imgItem.side.slice(1),
            matchedText: targetToken.text || field.extractedValue,
            bbox,
            confidence: 0.95,
            method: '1_explicit_field_token',
            coordinateSystem: coordSystem,
            tokenId: targetToken.id,
            naturalWidth: imgItem.width,
            naturalHeight: imgItem.height,
          };
        }
      }
    }
  }

  // Priority 2: Explicit field image/source + matching OCR evidence box
  if (targetCatalogItem) {
    let rawBox: any = null;
    if (field.evidenceBox && (field.evidenceBox.width > 0 || field.evidenceBox.height > 0)) {
      rawBox = field.evidenceBox;
    } else if (field.evidence && field.evidence.length > 0) {
      const ev = field.evidence[0];
      rawBox = ev.pixelBbox || ev;
    }

    if (rawBox) {
      const parsed = parseRawBbox(rawBox, field);
      if (parsed) {
        const { bbox, coordSystem } = convertBboxToNaturalPixels(parsed, targetCatalogItem.width, targetCatalogItem.height);
        return {
          imageId: targetCatalogItem.id,
          imageUrl: targetCatalogItem.dataUrl,
          source: targetCatalogItem.side.charAt(0).toUpperCase() + targetCatalogItem.side.slice(1),
          matchedText: field.evidenceSnippet || field.extractedValue,
          bbox,
          confidence: 0.9,
          method: '2_explicit_field_source',
          coordinateSystem: coordSystem,
          naturalWidth: targetCatalogItem.width,
          naturalHeight: targetCatalogItem.height,
        };
      }
    }
  }

  // Priority 3: Exact OCR token association stored on field.ocrTokens
  if (field.ocrTokens && field.ocrTokens.length > 0) {
    for (const tok of field.ocrTokens) {
      const tokSide = normalizeSide((tok as any).sourceSide || (tok as any).side);
      const imgItem = matchCatalogItem(imageCatalog, tok.imageId, tokSide) || targetCatalogItem;
      if (imgItem) {
        const parsed = parseRawBbox(tok.bbox || tok, field);
        if (parsed) {
          const { bbox, coordSystem } = convertBboxToNaturalPixels(parsed, imgItem.width, imgItem.height);
          return {
            imageId: imgItem.id,
            imageUrl: imgItem.dataUrl,
            source: imgItem.side.charAt(0).toUpperCase() + imgItem.side.slice(1),
            matchedText: tok.text || field.extractedValue,
            bbox,
            confidence: 0.85,
            method: '3_exact_ocr_token',
            coordinateSystem: coordSystem,
            tokenId: tok.id,
            naturalWidth: imgItem.width,
            naturalHeight: imgItem.height,
          };
        }
      }
    }
  }

  // Priority 4: Exact text match inside known source image ONLY
  if (targetCatalogItem && field.extractedValue && allOcrTokens.length > 0) {
    const normValue = field.extractedValue.toLowerCase().trim();
    if (normValue.length > 1) {
      const sourceTokens = allOcrTokens.filter((t) => {
        const tSide = normalizeSide(t.sourceSide) || normalizeSide(t.sourceImageId);
        return t.sourceImageId === targetCatalogItem.id || (tSide && tSide === targetCatalogItem.side);
      });

      const matchingToken = sourceTokens.find(
        (t) => t.text.toLowerCase().includes(normValue) || normValue.includes(t.text.toLowerCase())
      );
      if (matchingToken) {
        const rawBox = matchingToken.pixelBbox || {
          x: matchingToken.x,
          y: matchingToken.y,
          width: matchingToken.width,
          height: matchingToken.height,
        };
        const parsed = parseRawBbox(rawBox, field);
        if (parsed) {
          const { bbox, coordSystem } = convertBboxToNaturalPixels(parsed, targetCatalogItem.width, targetCatalogItem.height);
          return {
            imageId: targetCatalogItem.id,
            imageUrl: targetCatalogItem.dataUrl,
            source: targetCatalogItem.side.charAt(0).toUpperCase() + targetCatalogItem.side.slice(1),
            matchedText: matchingToken.text,
            bbox,
            confidence: 0.8,
            method: '4_exact_text_in_known_source',
            coordinateSystem: coordSystem,
            tokenId: matchingToken.id,
            naturalWidth: targetCatalogItem.width,
            naturalHeight: targetCatalogItem.height,
          };
        }
      }
    }
  }

  // Priority 5: Single-image fallback ONLY when exactly ONE image exists in catalog
  if (imageCatalog.length === 1) {
    const singleImg = imageCatalog[0];
    let rawBox: any = null;
    if (field.evidenceBox && (field.evidenceBox.width > 0 || field.evidenceBox.height > 0)) {
      rawBox = field.evidenceBox;
    } else if (field.evidence && field.evidence.length > 0) {
      rawBox = field.evidence[0].pixelBbox || field.evidence[0];
    }

    if (rawBox) {
      const parsed = parseRawBbox(rawBox, field);
      if (parsed) {
        const { bbox, coordSystem } = convertBboxToNaturalPixels(parsed, singleImg.width, singleImg.height);
        return {
          imageId: singleImg.id,
          imageUrl: singleImg.dataUrl,
          source: singleImg.side.charAt(0).toUpperCase() + singleImg.side.slice(1),
          matchedText: field.extractedValue,
          bbox,
          confidence: 0.7,
          method: '5_single_image_fallback',
          coordinateSystem: coordSystem,
          naturalWidth: singleImg.width,
          naturalHeight: singleImg.height,
        };
      }
    }
  }

  // Priority 6: Otherwise NO evidence box (DO NOT invent image, DO NOT assign randomly to Front)
  return {
    imageId: targetCatalogItem?.id || null,
    imageUrl: targetCatalogItem?.dataUrl || null,
    source: targetCatalogItem
      ? targetCatalogItem.side.charAt(0).toUpperCase() + targetCatalogItem.side.slice(1)
      : field.sourceImage || 'Not Visible',
    matchedText: field.extractedValue,
    bbox: null,
    confidence: 0,
    method: '6_no_evidence',
    coordinateSystem: 'none',
  };
}

export const EvidenceViewerModal: React.FC<EvidenceViewerModalProps> = ({
  isOpen,
  onClose,
  field,
  images,
  imageRecords,
  allOcrTokens = [],
  onEditField,
}) => {
  // Image selection state
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Full source image zoom/pan state
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Crop status, generated data URL, and bounding box overlay coordinates
  const [cropDataUrl, setCropDataUrl] = useState<string | null>(null);
  const [isGeneratingCrop, setIsGeneratingCrop] = useState<boolean>(false);
  const [cropStatus, setCropStatus] = useState<'success' | 'unavailable' | 'loading'>('loading');
  const [, setImageLoaded] = useState<boolean>(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const [boxCoordinates, setBoxCoordinates] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    percentX: number;
    percentY: number;
    percentW: number;
    percentH: number;
  } | null>(null);
  const [, setCropMetadata] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    sourceSurface: string;
    tokensCount: number;
  } | null>(null);

  // 1. Build authoritative Image Catalog from images + imageRecords
  const imageCatalog: ImageCatalogItem[] = useMemo(() => {
    const list: ImageCatalogItem[] = [];
    const sides: ImageSide[] = ['front', 'back', 'side', 'additional'];

    const recordsMap: Partial<Record<ImageSide, UploadedImageRecord>> = {};
    if (imageRecords) {
      if (Array.isArray(imageRecords)) {
        imageRecords.forEach((rec) => {
          if (rec && rec.side) recordsMap[rec.side] = rec;
        });
      } else {
        Object.entries(imageRecords).forEach(([sideKey, rec]) => {
          if (rec) recordsMap[sideKey as ImageSide] = rec;
        });
      }
    }

    sides.forEach((side) => {
      const rec = recordsMap[side];
      const dataUrl = rec?.dataUrl || (images ? images[side] : null);

      if (dataUrl) {
        const id = rec?.id || (rec as any)?.imageId || `img_${side}_surface`;
        const fileName = rec?.fileName || `${side.toUpperCase()}_surface.jpg`;
        const width = rec?.width || (rec as any)?.originalWidth || 1200;
        const height = rec?.height || (rec as any)?.originalHeight || 1000;
        const sideCapitalized = side.charAt(0).toUpperCase() + side.slice(1);

        list.push({
          id,
          side,
          label: `${sideCapitalized} Image`,
          dataUrl,
          fileName,
          width,
          height,
        });
      }
    });

    return list;
  }, [images, imageRecords]);

  // 2. Resolve Evidence using strict priority chain
  const resolvedEvidence = useMemo<ResolvedEvidence>(() => {
    return resolveEvidence(field, imageCatalog, allOcrTokens);
  }, [field, imageCatalog, allOcrTokens]);

  const fieldSourceItem = useMemo<ImageCatalogItem | null>(() => {
    if (resolvedEvidence.imageId) {
      const found = imageCatalog.find((img) => img.id === resolvedEvidence.imageId);
      if (found) return found;
    }
    return matchCatalogItem(imageCatalog, field?.sourceImageId, field?.sourceImage);
  }, [resolvedEvidence, imageCatalog, field]);

  // Active image for the full source preview
  const activeImage = useMemo<ImageCatalogItem | null>(() => {
    if (selectedImageId) {
      const found = imageCatalog.find((img) => img.id === selectedImageId);
      if (found) return found;
    }
    return fieldSourceItem;
  }, [selectedImageId, imageCatalog, fieldSourceItem]);

  // Handle image load on active displayed image
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageLoaded(true);
    const imgEl = e.currentTarget;
    console.log('[EVIDENCE LOGGER] Displayed UI image element loaded:', {
      sourceImageId: activeImage?.id || 'N/A',
      side: activeImage?.side || 'N/A',
      naturalWidth: imgEl.naturalWidth,
      naturalHeight: imgEl.naturalHeight,
      renderedClientWidth: imgEl.clientWidth,
      renderedClientHeight: imgEl.clientHeight,
    });
  };

  // 3. Extract Stored Evidence Bounding Box & Render Relative to Displayed Image Element
  useEffect(() => {
    if (!isOpen || !field) {
      setCropDataUrl(null);
      setCropStatus('loading');
      setCropMetadata(null);
      setBoxCoordinates(null);
      return;
    }

    if (!fieldSourceItem || !fieldSourceItem.dataUrl) {
      setCropDataUrl(null);
      setCropStatus('unavailable');
      setCropMetadata(null);
      setBoxCoordinates(null);
      return;
    }

    setIsGeneratingCrop(true);
    setCropStatus('loading');

    // Load original source image to compute exact pixel crop and percentage box using natural dimensions
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const natW = img.naturalWidth;
        const natH = img.naturalHeight;

        if (natW <= 0 || natH <= 0) {
          setCropDataUrl(null);
          setCropStatus('unavailable');
          setBoxCoordinates(null);
          return;
        }

        const catalogWithNaturalDimensions = imageCatalog.map((item) =>
          item.id === fieldSourceItem.id ? { ...item, width: natW, height: natH } : item
        );

        const currentResolved = resolveEvidence(field, catalogWithNaturalDimensions, allOcrTokens);

        // MANDATORY DEBUG LOGGING REQUIREMENT
        console.log(
          `[LABEL LENS EVIDENCE]\n` +
            `field: ${field.label || field.key}\n` +
            `field value: ${field.extractedValue || 'N/A'}\n` +
            `selected image: ${currentResolved.source} (${currentResolved.imageId || 'NONE'})\n` +
            `matched OCR text: ${currentResolved.matchedText || 'N/A'}\n` +
            `OCR token id: ${currentResolved.tokenId || 'N/A'}\n` +
            `bbox: ${currentResolved.bbox ? JSON.stringify(currentResolved.bbox) : 'NO_BOX'}\n` +
            `image dimensions: ${natW}x${natH}\n` +
            `coordinate system: ${currentResolved.coordinateSystem}\n` +
            `resolution method: ${currentResolved.method}`
        );

        if (!currentResolved.bbox) {
          setCropDataUrl(null);
          setCropStatus('unavailable');
          setBoxCoordinates(null);
          setIsGeneratingCrop(false);
          return;
        }

        const boxX = currentResolved.bbox.x;
        const boxY = currentResolved.bbox.y;
        const boxW = currentResolved.bbox.width;
        const boxH = currentResolved.bbox.height;

        const percentX = (boxX / natW) * 100;
        const percentY = (boxY / natH) * 100;
        const percentW = (boxW / natW) * 100;
        const percentH = (boxH / natH) * 100;

        setBoxCoordinates({
          x: boxX,
          y: boxY,
          width: boxW,
          height: boxH,
          percentX,
          percentY,
          percentW,
          percentH,
        });

        // Context padding for crop preview (12% horizontal, 22% vertical)
        const padX = Math.round(boxW * 0.12);
        const padY = Math.round(boxH * 0.22);

        const sx = Math.max(0, boxX - padX);
        const sy = Math.max(0, boxY - padY);
        const sw = Math.min(natW - sx, boxW + padX * 2);
        const sh = Math.min(natH - sy, boxH + padY * 2);

        if (sw > 0 && sh > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = sw;
          canvas.height = sh;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
            setCropDataUrl(canvas.toDataURL('image/png'));
            setCropStatus('success');
            setCropMetadata({
              x: boxX,
              y: boxY,
              width: boxW,
              height: boxH,
              sourceSurface: fieldSourceItem.label,
              tokensCount: field.evidenceTokenIds?.length || 1,
            });
          }
        }
      } catch (err) {
        console.error('Evidence crop generation error:', err);
        setCropDataUrl(null);
        setCropStatus('unavailable');
        setBoxCoordinates(null);
      } finally {
        setIsGeneratingCrop(false);
      }
    };

    img.onerror = () => {
      setCropDataUrl(null);
      setCropStatus('unavailable');
      setBoxCoordinates(null);
      setIsGeneratingCrop(false);
    };

    img.src = fieldSourceItem.dataUrl;
  }, [isOpen, field, fieldSourceItem, imageCatalog, allOcrTokens]);

  // Reset viewport zoom/pan and active surface selection on open
  useEffect(() => {
    if (isOpen) {
      if (fieldSourceItem) {
        setSelectedImageId(fieldSourceItem.id);
      } else {
        setSelectedImageId(null);
      }
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setImageLoaded(false);
    }
  }, [isOpen, fieldSourceItem]);

  // Mouse pan handlers for full source image
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen || !field) return null;

  const showOverlayBox = activeImage?.id === fieldSourceItem?.id;
  const sourceImageLabel = activeImage ? activeImage.side : field.sourceImage || 'UNKNOWN';

  // Confidence & Verification Metadata
  const confidenceScore = field.confidence || (field.confidenceLevel === 'HIGH' ? 95 : field.confidenceLevel === 'MEDIUM' ? 70 : 40);
  const isInspectorVerified = field.isManuallyVerified || field.status === 'VERIFIED_BY_INSPECTOR';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evidence Viewer & Location Inspector"
      subtitle={`Exact source verification for statutory declaration: ${field.label || field.key}`}
      maxWidth="4xl"
    >
      {/* MAIN VIEWPORT GRID */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#0D0917]">
        {/* LEFT / TOP MAIN VIEW: FULL SOURCE IMAGE WITH BOUNDING BOX */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-2">
          {/* Viewport Control Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#120D24] border border-[#2D2350] rounded-lg">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                FULL ORIGINAL SOURCE IMAGE
              </h3>
              <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded">
                PRIMARY VIEW
              </span>
            </div>

            {/* Surface Switcher & Zoom Controls */}
            <div className="flex items-center gap-2">
              {/* Surface Switcher */}
              {imageCatalog.length > 1 && (
                <div className="flex items-center bg-[#0C081A] p-0.5 rounded-lg border border-[#2D2350]">
                  {imageCatalog.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedImageId(item.id);
                        setZoomScale(1);
                        setPanPosition({ x: 0, y: 0 });
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                        activeImage?.id === item.id
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.side.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-[#0C081A] p-0.5 rounded-lg border border-[#2D2350]">
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(0.6, prev - 0.25))}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-slate-300 px-1">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.min(3.5, prev + 0.25))}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomScale(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                  title="Reset View"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Source Image Viewport */}
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`relative bg-[#090610] h-[460px] overflow-hidden flex items-center justify-center select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {activeImage ? (
              <div
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
                }}
                className="flex items-center justify-center p-3 max-w-full max-h-full"
              >
                {/* Exact image bounding wrapper */}
                <div className="relative inline-block max-w-full">
                  <img
                    ref={imgRef}
                    src={activeImage.dataUrl}
                    alt={activeImage.label}
                    onLoad={handleImageLoad}
                    draggable={false}
                    className="max-h-[430px] max-w-full w-auto h-auto block rounded shadow-2xl pointer-events-none select-none"
                  />

                  {/* Stored Evidence Rectangle drawn directly on exact source image */}
                  {showOverlayBox && boxCoordinates && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${boxCoordinates.percentX}%`,
                        top: `${boxCoordinates.percentY}%`,
                        width: `${boxCoordinates.percentW}%`,
                        height: `${boxCoordinates.percentH}%`,
                      }}
                      className="border-2 border-emerald-400 bg-emerald-400/25 shadow-[0_0_15px_rgba(52,211,153,0.6)] rounded-xs pointer-events-none z-10"
                    >
                      <span className="absolute -top-5 left-0 bg-emerald-500 text-black font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-t shadow-md whitespace-nowrap">
                        {field.label || field.key}
                      </span>
                      <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                      <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                      <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400">
                <ShieldAlert className="w-7 h-7 mx-auto mb-2 text-rose-400" />
                <p className="text-xs font-semibold text-slate-200">No Source Image Available</p>
              </div>
            )}

            {/* Bottom info banner */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none gap-2">
              <div className="bg-[#0D0917]/85 border border-[#2D2448] text-slate-300 text-[10px] font-mono px-2.5 py-1 rounded backdrop-blur-sm">
                SOURCE: <strong className="text-white">{activeImage?.label || 'UNKNOWN'}</strong>
                {showOverlayBox && boxCoordinates && (
                  <span className="text-emerald-400 ml-2">&bull; Evidence Bounding Box Active</span>
                )}
              </div>
              <div className="bg-[#0D0917]/85 border border-[#2D2448] text-slate-400 text-[10px] font-mono px-2 py-1 rounded backdrop-blur-sm hidden sm:block">
                Drag to Pan &bull; Zoom Controls Top-Right
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: FIELD DETAILS & SECONDARY EVIDENCE CROP */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4">
          {/* Field Details Card */}
          <div className="bg-[#120D24] border border-[#2D2350] rounded-lg p-4 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D2350]">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-300">
                FIELD DETAILS
              </span>
              {onEditField && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditField(field);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-[#1D1633] hover:bg-[#2D2350] text-slate-200 border border-[#35295C] transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-violet-400" />
                  Edit Value
                </button>
              )}
            </div>

            {/* Field Name */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Field</span>
              <span className="text-base font-bold text-white block mt-0.5">
                {field.label || field.key}
              </span>
            </div>

            {/* Observed Value */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Observed Value</span>
              <div className="mt-1 text-sm font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded break-words">
                {field.extractedValue || field.verifiedValue || (
                  <span className="text-slate-500 italic">No value recorded</span>
                )}
              </div>
            </div>

            {/* Source Image */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Source Image</span>
              <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-200 bg-[#181130] border border-[#2D2350] px-2.5 py-1.5 rounded">
                <Camera className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span>SOURCE: {sourceImageLabel.toUpperCase()}</span>
              </div>
            </div>

            {/* Verification Status & Evidence Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase mb-1">
                  Verification Status
                </span>
                {isInspectorVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-violet-950/80 border border-violet-600 text-violet-300 w-full justify-center">
                    <CheckCircle className="w-3 h-3 text-violet-400 shrink-0" />
                    Inspector Verified
                  </span>
                ) : confidenceScore >= 80 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-emerald-950/80 border border-emerald-600 text-emerald-300 w-full justify-center">
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    {confidenceScore}% High Confidence
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-amber-950/80 border border-amber-600 text-amber-300 w-full justify-center">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    {confidenceScore}% Check Needed
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 block uppercase mb-1">
                  Evidence Location
                </span>
                {cropStatus === 'success' && boxCoordinates ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-emerald-950/80 border border-emerald-600 text-emerald-300 w-full justify-center">
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    Exact
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-amber-950/80 border border-amber-600 text-amber-300 w-full justify-center">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    Unavailable
                  </span>
                )}
              </div>
            </div>

            {/* DEVELOPER DEBUG DISPLAY */}
            <div className="bg-[#0C081A] border border-[#2D2350] rounded-lg p-3 space-y-2 text-[11px] font-mono mt-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#2D2350] text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                <span>DEVELOPER EVIDENCE DEBUG</span>
                <span className="bg-amber-950/80 border border-amber-800/60 text-amber-300 text-[9px] px-1.5 py-0.5 rounded">
                  STORED OCR DATA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Field</span>
                  <span className="font-bold text-white truncate block">{field.label || field.key}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Value</span>
                  <span className="font-bold text-emerald-300 truncate block">{field.extractedValue || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Source Image</span>
                  <span className="font-bold text-violet-300 truncate block">
                    {fieldSourceItem ? `${fieldSourceItem.side.toUpperCase()} (${fieldSourceItem.id})` : 'UNAVAILABLE'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Matched OCR Text</span>
                  <span className="font-bold text-slate-200 truncate block">
                    {resolvedEvidence.matchedText || (boxCoordinates ? 'Matched from OCR' : 'N/A')}
                  </span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-[#1F1738]">
                <span className="text-slate-500 block text-[9px] uppercase mb-1">OCR Bounding Box</span>
                {boxCoordinates ? (
                  <div className="grid grid-cols-4 gap-1 text-center bg-[#150F2B] p-1.5 rounded border border-[#2B204D] text-emerald-400 font-bold text-[10px]">
                    <div>
                      <span className="text-slate-500 text-[8px] block">X</span>
                      {boxCoordinates.x}
                    </div>
                    <div>
                      <span className="text-slate-500 text-[8px] block">Y</span>
                      {boxCoordinates.y}
                    </div>
                    <div>
                      <span className="text-slate-500 text-[8px] block">WIDTH</span>
                      {boxCoordinates.width}
                    </div>
                    <div>
                      <span className="text-slate-500 text-[8px] block">HEIGHT</span>
                      {boxCoordinates.height}
                    </div>
                  </div>
                ) : (
                  <span className="text-amber-300 text-[10px] font-sans font-medium block bg-amber-950/40 p-1.5 rounded border border-amber-900/50">
                    Evidence location unavailable
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECONDARY VIEW: EVIDENCE CROP */}
          <div className="bg-[#120D24] border border-[#2D2350] rounded-lg overflow-hidden shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#181130] border-b border-[#2D2350]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  EVIDENCE CROP
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">SECONDARY VIEW</span>
            </div>

            <div className="p-3.5 flex-1 flex items-center justify-center bg-[#090610] min-h-[150px]">
              {isGeneratingCrop ? (
                <div className="text-center py-4 text-slate-400">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-mono">Generating crop...</p>
                </div>
              ) : cropStatus === 'success' && cropDataUrl ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="relative border-2 border-violet-500 rounded-lg overflow-hidden shadow-2xl bg-black max-w-full">
                    <img
                      src={cropDataUrl}
                      alt={`Evidence crop for ${field.label}`}
                      className="max-h-[170px] max-w-full object-contain rounded"
                    />
                    <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-violet-400" />
                    <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-violet-400" />
                    <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-violet-400" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-violet-400" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 text-center">
                    Exact crop from source rectangle coordinates
                  </span>
                </div>
              ) : (
                <div className="text-center py-4 px-3 max-w-xs">
                  <ShieldAlert className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-amber-200">
                    Evidence location unavailable
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
