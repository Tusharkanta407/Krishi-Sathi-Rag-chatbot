import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI and Pinecone
const ai = new GoogleGenAI({});
const History = [];

// Store conversation history per session (simple in-memory store)
const sessionHistories = new Map();

// Helper function to get or create session history
function getSessionHistory(sessionId) {
  if (!sessionHistories.has(sessionId)) {
    sessionHistories.set(sessionId, []);
  }
  return sessionHistories.get(sessionId);
}

async function transformQuery(question, sessionId) {
  const sessionHistory = getSessionHistory(sessionId);
  
  sessionHistory.push({
    role: 'user',
    parts: [{ text: question }]
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: sessionHistory,
    config: {
      systemInstruction: `You are a query rewriting expert. Based on the provided chat history, rephrase the "Follow Up user Question" into a complete, standalone question that can be understood without the chat history.
      Only output the rewritten question and nothing else.`,
    },
  });

  sessionHistory.pop();
  return response.text;
}

async function chatting(question, sessionId) {
  try {
    // Convert question into vector
    const queries = await transformQuery(question, sessionId);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'text-embedding-004',
    });

    const queryVector = await embeddings.embedQuery(queries);

    // Make connection with Pinecone
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    const searchResults = await pineconeIndex.query({
      topK: 10,
      vector: queryVector,
      includeMetadata: true,
    });

    const context = searchResults.matches
      .map(match => match.metadata.text)
      .join("\n\n---\n\n");

    const sessionHistory = getSessionHistory(sessionId);
    
    sessionHistory.push({
      role: 'user',
      parts: [{ text: queries }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: sessionHistory,
      config: {
        systemInstruction: `You have to behave like a Kerala Agriculture Expert.
        You will be given a context of relevant information and a user question.
        Your task is to answer the user's question based ONLY on the provided context.
        If the answer is not in the context, you must say "Please contact to nearest Krishi Bhavan"
        Keep your answers clear, concise, and educational.
        Reply in the same language as the question.
        
        Context: ${context}`,
      },
    });

    sessionHistory.push({
      role: 'model',
      parts: [{ text: response.text }]
    });

    return {
      success: true,
      answer: response.text,
      sessionId: sessionId
    };

  } catch (error) {
    console.error('Error in chatting function:', error);
    return {
      success: false,
      error: 'Sorry, I encountered an error while processing your question. Please try again.',
      sessionId: sessionId
    };
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Kerala Agriculture RAG Chatbot API',
    status: 'running',
    endpoints: {
      chat: 'POST /api/chat',
      health: 'GET /api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { question, sessionId = 'default' } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    const result = await chatting(question, sessionId);
    res.json(result);

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Clear session history endpoint
app.delete('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  sessionHistories.delete(sessionId);
  res.json({
    success: true,
    message: 'Session history cleared'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Kerala Agriculture RAG Chatbot server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
});
