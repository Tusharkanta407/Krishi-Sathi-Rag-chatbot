# Kerala Agriculture RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot specifically designed for Kerala Agriculture queries. This chatbot uses Google Gemini AI and Pinecone vector database to provide expert agricultural advice based on indexed PDF documents.

## Features

- 🤖 AI-powered agricultural advice using Google Gemini
- 📚 RAG system with Pinecone vector database
- 🌾 Specialized for Kerala agriculture
- 💬 RESTful API for easy integration
- 🔄 Session-based conversation history
- 🌐 CORS enabled for web integration

## API Endpoints

### Health Check
```
GET /api/health
```

### Chat with the Bot
```
POST /api/chat
Content-Type: application/json

{
  "question": "Your agriculture question here",
  "sessionId": "optional-session-id"
}
```

### Clear Session History
```
DELETE /api/session/{sessionId}
```

## Environment Variables

Create a `.env` file with the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name
NODE_ENV=production
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file

3. Run the server:
```bash
npm start
```

4. The server will start on `http://localhost:3000`

## Deployment on Render

1. Push your code to GitHub
2. Connect your repository to Render
3. Set the environment variables in Render dashboard:
   - `GEMINI_API_KEY`
   - `PINECONE_API_KEY` 
   - `PINECONE_INDEX_NAME`
4. Deploy!

## Usage Example

```javascript
// Chat with the bot
const response = await fetch('https://your-app.onrender.com/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    question: "What are the best practices for rice cultivation in Kerala?",
    sessionId: "user123"
  })
});

const data = await response.json();
console.log(data.answer);
```

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server
- `npm run index` - Run the PDF indexing script

## Requirements

- Node.js 18+
- Google Gemini API key
- Pinecone account and API key
- PDF documents for indexing (use `index.js` script)
