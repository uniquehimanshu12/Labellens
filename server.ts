import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { executeGroundedPipeline, runGoldenTest } from "./server/groundedOcr";

const currentFilePath = process.cwd();
const currentDirPath = process.cwd();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS — allow the deployed Vercel frontend and local development
  app.use(
    cors({
      origin: [
        "https://labellens-rouge.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Increase payload limit for base64 captured package images
  app.use(express.json({ limit: "35mb" }));
  app.use(express.urlencoded({ extended: true, limit: "35mb" }));

  // Helper to get GoogleGenAI client safely
  function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      aiAvailable: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Diagnostic Golden Test endpoint
  app.get("/api/ocr/golden-test", async (req, res) => {
    try {
      const client = getGeminiClient();
      const testResult = await runGoldenTest(client);
      return res.json(testResult);
    } catch (err: any) {
      console.error("Golden test failed:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to execute golden test",
      });
    }
  });

  // Single-image analysis endpoint (Using grounded OCR + pixel boxes)
  app.post("/api/ocr/analyze-single-image", async (req, res) => {
    try {
      const { inspectionId, image, demoMode } = req.body;

      if (!image || !image.dataUrl) {
        return res.status(400).json({ success: false, error: "No image provided for single-image analysis." });
      }

      const client = getGeminiClient();
      if (!client && !demoMode) {
        return res.status(503).json({
          success: false,
          error: "AI extraction failed: GEMINI_API_KEY is not configured on the server.",
        });
      }

      const pipelineResult = await executeGroundedPipeline([image], client);
      const fields = pipelineResult.body.fields || {};
      const ocrTokens = pipelineResult.body.ocrTokens || [];

      const evidenceItems = Object.values<any>(fields).map((f: any) => ({
        field: f.key,
        value: f.extractedValue || null,
        imageId: f.sourceImageId || image.imageId,
        boundingBox: f.evidenceBox ? [f.evidenceBox.y, f.evidenceBox.x, f.evidenceBox.y + f.evidenceBox.height, f.evidenceBox.x + f.evidenceBox.width] : null,
        pixelBox: f.evidenceBox ? { x: f.evidenceBox.x, y: f.evidenceBox.y, width: f.evidenceBox.width, height: f.evidenceBox.height } : undefined,
      }));

      return res.json({
        success: true,
        inspectionId: inspectionId || "single",
        imageId: image.imageId || image.id,
        fileName: image.fileName || "surface.png",
        width: image.width || 800,
        height: image.height || 600,
        modelUsed: pipelineResult.body.modelUsed || "tesseract-ocr+gemini",
        extractionMode: demoMode ? "DEMO MODE" : "LIVE AI ANALYSIS",
        timestamp: new Date().toISOString(),
        rawResponse: JSON.stringify(pipelineResult.body.geminiMapping || {}),
        parsedResult: pipelineResult.body.geminiMapping || {},
        evidenceItems,
        fields,
        ocrTokens,
      });
    } catch (err: any) {
      console.error("analyze-single-image error:", err);
      return res.status(500).json({
        success: false,
        error: "Single image analysis failed: " + (err.message || "Unknown error"),
      });
    }
  });

  // Multimodal AI Extraction Endpoint for All Submitted Package Images (Strict Grounded Pipeline)
  app.post("/api/ocr/extract", async (req, res) => {
    try {
      const { images, imageRecords, inspectionId, demoMode } = req.body;

      if (!images || Object.keys(images).length === 0) {
        return res.status(400).json({ success: false, error: "No images provided for extraction." });
      }

      if (demoMode) {
        return res.json({
          success: false,
          fallbackReason: "Demo mode requested",
          useClientFallback: true,
        });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.status(503).json({
          success: false,
          error: "AI extraction failed: GEMINI_API_KEY is not configured on the server.",
          useClientFallback: false,
        });
      }

      // Execute Grounded OCR pipeline
      const pipelineResult = await executeGroundedPipeline(
        { images, imageRecords },
        client
      );

      return res.status(pipelineResult.status).json(pipelineResult.body);
    } catch (err: any) {
      console.error("AI extraction error:", err);
      return res.status(500).json({
        success: false,
        error: "AI extraction failed: " + (err.message || "Execution error"),
        useClientFallback: false,
      });
    }
  });

  // Multi-Turn Gemini Chatbot Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, model, contextData, systemInstruction } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Messages array is required.",
        });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.status(503).json({
          success: false,
          error: "Gemini API key is not configured on the server.",
        });
      }

      // Model routing per skill instructions
      // gemini-3.1-pro-preview for complex tasks, gemini-3.5-flash for general, gemini-3.1-flash-lite for fast
      let selectedModel = "gemini-3.5-flash";
      if (model === "gemini-3.1-pro-preview" || model === "pro") {
        selectedModel = "gemini-3.1-pro-preview";
      } else if (model === "gemini-3.1-flash-lite" || model === "lite") {
        selectedModel = "gemini-3.1-flash-lite";
      } else if (model) {
        selectedModel = model;
      }

      const defaultSystemInstruction =
        "You are the Senior Legal Metrology & FSSAI Compliance Inspector AI Assistant for LabelLens. " +
        "You are an expert on the Legal Metrology (Packaged Commodities) Rules, 2011 (PCR 2011), the Legal Metrology Act 2009, " +
        "FSSAI (Labelling and Display) Regulations 2020, and Indian consumer protection packaging standards. " +
        "Provide direct, authoritative, structured, and legally accurate answers. " +
        "Cite specific rules (e.g., Rule 6(1)(a)-(f), Rule 9 minimum font heights, Second/Third Schedules, Sec 36/49 penalties) " +
        "and give actionable step-by-step remediation guidance. Format responses with clean Markdown bullet points and bold highlights.";

      // Format message history for @google/genai
      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content || m.text || "" }],
      }));

      // If context data (e.g. current inspection) is provided, append it to the context
      let enrichedSystemInstruction = systemInstruction || defaultSystemInstruction;
      if (contextData) {
        enrichedSystemInstruction += `\n\nActive Inspection Context:\n${JSON.stringify(contextData, null, 2)}`;
      }

      const response = await client.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: enrichedSystemInstruction,
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      });

      const replyText = response.text || "No response generated.";

      return res.json({
        success: true,
        reply: replyText,
        modelUsed: selectedModel,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Chat API error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to generate chat response.",
      });
    }
  });

  // Voice / Speech endpoint for live conversational compliance inquiries
  app.post("/api/chat/voice", async (req, res) => {
    try {
      const { userAudioTranscript, userText, model, contextData } = req.body;
      const query = userAudioTranscript || userText;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: "Transcript or text query is required.",
        });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.status(503).json({
          success: false,
          error: "Gemini API key is not configured.",
        });
      }

      const promptModel = model === "gemini-3.8-live" ? "gemini-3.5-flash" : (model || "gemini-3.5-flash");

      const systemInstruction =
        "You are the Senior Compliance Officer speaking in a concise, authoritative voice conversation. " +
        "Keep your response spoken, clear, direct, and under 3-4 sentences without complex markdown tables.";

      const response = await client.models.generateContent({
        model: promptModel,
        contents: [{ role: "user", parts: [{ text: query }] }],
        config: {
          systemInstruction: contextData
            ? `${systemInstruction}\nContext: ${JSON.stringify(contextData)}`
            : systemInstruction,
          temperature: 0.4,
          maxOutputTokens: 500,
        },
      });

      return res.json({
        success: true,
        reply: response.text || "Compliance check completed.",
        modelUsed: promptModel,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Voice Chat API error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Voice processing failed.",
      });
    }
  });

  // Grounded OCR Extraction endpoint alias
  app.post("/api/ocr/grounded-extract", async (req, res) => {
    try {
      const { images, imageRecords, demoMode } = req.body;

      if (!images || Object.keys(images).length === 0) {
        return res.status(400).json({
          success: false,
          error: "No package images provided for extraction.",
        });
      }

      const client = getGeminiClient();
      if (!client || demoMode) {
        return res.json({
          success: false,
          fallbackReason: !client ? "GEMINI_API_KEY not configured on server" : "Demo mode requested",
          useClientFallback: true,
        });
      }

      const pipelineResult = await executeGroundedPipeline({ images, imageRecords }, client);
      return res.status(pipelineResult.status).json(pipelineResult.body);
    } catch (err: any) {
      console.error("Grounded OCR Pipeline error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to execute grounded OCR pipeline",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LabelLens server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
