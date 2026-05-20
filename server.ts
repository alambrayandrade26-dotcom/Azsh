import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route for AI Responses
  app.post("/api/ai/respond", async (req, res) => {
    try {
      const { contactName, lastMessage, context } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
      }

      const systemInstruction = `Você é ${contactName} em uma conversa de WhatsApp em português. 
      Responda de forma curta, casual e amigável. 
      Use emojis como as pessoas fazem no WhatsApp. 
      Não seja excessivamente formal. 
      Se o usuário mandar um áudio (representado por [Áudio]), você pode responder comentando que ouviu ou algo do tipo. 
      Se o usuário mandar uma foto (representado por [Foto]), comente sobre a foto.`;

      // Simple retry logic for 503/504 errors
      const maxRetries = 3;
      let lastError: any;
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [
                { role: "user", parts: [{ text: `Histórico da conversa: ${context.join("\n")}\nÚltima mensagem do usuário: ${lastMessage}` }] }
            ],
            config: {
              systemInstruction,
              temperature: 1,
              topP: 0.95,
            },
          });

          return res.json({ response: response.text });
        } catch (error: any) {
          lastError = error;
          const status = error.status || (error.message?.includes("503") ? 503 : error.message?.includes("504") ? 504 : null);
          
          if (status === 503 || status === 504) {
            console.warn(`[SERVER] Gemini API transient error (${status}), retrying ${i + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
            continue;
          }
          break; // Not a transient error, stop retrying
        }
      }

      throw lastError; // If we exhausted retries or hit a non-transient error
    } catch (error: any) {
      console.error("Gemini API Error Detail:", error.message || error);
      
      // Check for rate limits or quota issues
      if (error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED") || error.status === 429) {
        return res.status(429).json({ 
          error: "API_QUOTA_EXCEEDED", 
          message: "O limite diário de respostas da IA foi atingido ou o serviço está sobrecarregado. Tente novamente em breve." 
        });
      }

      if (error.status === 503 || error.message?.includes("503")) {
        return res.status(503).json({
          error: "SERVICE_UNAVAILABLE",
          message: "A IA está muito ocupada no momento. Por favor, tente novamente em alguns segundos."
        });
      }

      if (error.status === 404 || error.message?.includes("404")) {
        return res.status(404).json({
          error: "MODEL_NOT_FOUND",
          message: "O modelo de IA configurado não foi encontrado."
        });
      }
      
      res.status(500).json({ error: "API_FAILED", message: "Não foi possível obter uma resposta da IA no momento." });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Ready at http://0.0.0.0:${PORT}`);
    console.log(`[SERVER] Environment: ${process.env.NODE_ENV}`);
  });
}

startServer();
