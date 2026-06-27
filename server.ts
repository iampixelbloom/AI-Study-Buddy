import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Robust fallback model content generation to handle high-demand/rate limit/503 errors seamlessly
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
) {
  const models = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of models) {
    let attempts = 3;
    let delay = 500; // ms
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        console.log(`[Gemini API] Requesting generation using model: ${model} (attempt ${attempt}/${attempts})`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        const errStr = typeof error === "object" && error !== null ? JSON.stringify(error) : String(error);
        const isTransient = 
          errStr.includes("503") || 
          errStr.includes("UNAVAILABLE") || 
          errStr.includes("429") || 
          errStr.includes("RESOURCE_EXHAUSTED") ||
          (error.status && (error.status === "UNAVAILABLE" || error.status === "RESOURCE_EXHAUSTED")) ||
          (error.code && (error.code === 503 || error.code === 429));

        if (isTransient && attempt < attempts) {
          console.log(`[Gemini API] Model ${model} returned transient code. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          // Keep logging quiet as a standard console.log so it does not register as a system-breaking warning/error in the environment logs
          console.log(`[Gemini API] Model ${model} is busy or returned ${error.code || error.status || "status"}. Transitioning to fallback model...`);
          break; // Move to the next fallback model in the list
        }
      }
    }
  }

  throw lastError || new Error("All model generation fallback attempts failed.");
}

// 1. Interactive Study Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, mode } = req.body;
    const ai = getAIClient();

    let systemInstruction = "You are a friendly, encouraging, and highly knowledgeable AI Study Buddy. " +
      "Your goal is to help students learn effectively. Answer queries clearly, structure key concepts using bullets or bold text, and use markdown. " +
      "Always include brief, practical examples where possible to make abstract concepts concrete.";

    if (mode === "simplify") {
      systemInstruction += " EXTREMELY IMPORTANT: Explain the requested topic in incredibly simple, layman terms, as if explaining to a 10-year-old (ELI5 mode). Use fun, everyday analogies.";
    } else if (mode === "analogy") {
      systemInstruction += " EXTREMELY IMPORTANT: Focus heavily on explaining the topic using a creative and vivid analogy. Relate the mechanics of the subject directly to a common real-world system (like baking, traffic, sports, etc.).";
    } else if (mode === "test") {
      systemInstruction += " EXTREMELY IMPORTANT: Instead of just answering the question, briefly explain the concept in 1-2 sentences, then challenge the user with a single relevant question to test their understanding. Keep it interactive!";
    }

    // Format chat history for gemini-3.5-flash
    const formattedContents = [];
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        formattedContents.push({
          role: turn.role,
          parts: [{ text: turn.text }],
        });
      }
    }
    formattedContents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await generateContentWithFallback(ai, {
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "An error occurred with your study buddy." });
  }
});

// 2. Generate Flashcards Endpoint
app.post("/api/generate-cards", async (req, res) => {
  try {
    const { topic, material } = req.body;
    if (!topic && !material) {
      return res.status(400).json({ error: "Please provide a topic or material." });
    }

    const ai = getAIClient();
    const prompt = `Create a comprehensive set of 8 high-quality educational flashcards based on the following:
Topic: ${topic || "N/A"}
Study Material: ${material || "N/A"}

Focus on key terms, core concepts, formulas, rules, or processes. Ensure the front is clear and challenging, and the back is precise, comprehensive, and helpful.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are an educational designer. You extract core concepts and structure them into beautiful front-and-back study flashcards.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: {
                type: Type.STRING,
                description: "The term, question, formula, or concept on the front of the card.",
              },
              back: {
                type: Type.STRING,
                description: "The detailed explanation, definition, answer, or memory aid on the back of the card.",
              },
            },
            required: ["front", "back"],
          },
        },
      },
    });

    const cards = JSON.parse(response.text || "[]");
    res.json({ cards });
  } catch (error: any) {
    console.error("Flashcards generation error:", error);
    res.status(500).json({ error: error.message || "Could not generate flashcards." });
  }
});

// 3. Generate Smart Quiz Endpoint
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { topic, material, count = 5 } = req.body;
    if (!topic && !material) {
      return res.status(400).json({ error: "Please provide a topic or material." });
    }

    const ai = getAIClient();
    const prompt = `Generate a challenging and educational multiple-choice quiz with exactly ${count} questions based on the following:
Topic: ${topic || "N/A"}
Study Material: ${material || "N/A"}

Ensure each question has 4 distinct options. The correct answer must be one of the options. Provide a high-quality explanation of the answer, explaining why it's correct and why the others are wrong.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are a professional examiner. Create engaging, high-quality multiple choice questions to test real comprehension rather than simple rote memorization.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "The quiz question.",
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 4 multiple-choice options.",
              },
              correctAnswer: {
                type: Type.STRING,
                description: "The exact matching string of the correct answer from the options array.",
              },
              explanation: {
                type: Type.STRING,
                description: "Detailed step-by-step explanation of why this answer is correct and others are incorrect.",
              },
            },
            required: ["question", "options", "correctAnswer", "explanation"],
          },
        },
      },
    });

    const quiz = JSON.parse(response.text || "[]");
    res.json({ quiz });
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    res.status(500).json({ error: error.message || "Could not generate quiz." });
  }
});

// 4. Summarize and Extract Document Endpoint
app.post("/api/summarize", async (req, res) => {
  try {
    const { content, fileName } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "No study document text provided." });
    }

    const ai = getAIClient();
    const prompt = `Please summarize and extract key educational concepts from the following material.
Document Name: ${fileName || "Uploaded Material"}
Content:
${content}

Ensure you provide a clear, scholarly title, a concise overview paragraph, key concepts divided into descriptive headers and bullets, and a neat AI insight box outlining potential study tips or memory triggers.`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are an elite academic processor. Summarize materials with crisp structures, clear bullet points, and highly readable explanations.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Scholarly, precise title for the summarized material.",
            },
            overview: {
              type: Type.STRING,
              description: "A solid, high-level summary paragraph of 2-3 sentences explaining the core theme.",
            },
            keyConcepts: {
              type: Type.ARRAY,
              description: "The primary learning points or core concepts.",
              items: {
                type: Type.OBJECT,
                properties: {
                  conceptName: {
                    type: Type.STRING,
                    description: "Name of the key concept (e.g., 'Primary Somatosensory Cortex').",
                  },
                  description: {
                    type: Type.STRING,
                    description: "A short sentence or description.",
                  },
                  bullets: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Key bullet points, formulas, or facts related to this concept.",
                  },
                },
                required: ["conceptName", "description", "bullets"],
              },
            },
            aiInsight: {
              type: Type.STRING,
              description: "A customized study recommendation, memory tip, or warning from the AI buddy.",
            },
          },
          required: ["title", "overview", "keyConcepts", "aiInsight"],
        },
      },
    });

    const summaryData = JSON.parse(response.text || "{}");
    res.json({ summary: summaryData });
  } catch (error: any) {
    console.error("Summarization error:", error);
    res.status(500).json({ error: error.message || "Failed to process and summarize document." });
  }
});

// Vite & Static file handler setup
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
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
  console.log(`AI Study Buddy server running on port ${PORT}`);
});
