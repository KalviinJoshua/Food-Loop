import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize Google Gen AI client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log('Gemini API Client initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini API Client:', error);
  }
} else {
  console.warn('GEMINI_API_KEY environment variable is not set. API will run in heuristic fallback mode.');
}

// Endpoint: AI-driven smart matching and allocation
app.post('/api/ai-matching', async (req, res) => {
  const { postDetails, candidates } = req.body;

  if (!postDetails || !candidates) {
    return res.status(400).json({ error: 'Missing postDetails or candidates' });
  }

  if (!ai) {
    return res.status(503).json({ error: 'Gemini service unavailable. Running frontend fallback.' });
  }

  try {
    const prompt = `
You are the Smart Match Engine for Remix FoodLoop, an intelligent food recovery platform.
Given the following food donation/waste post:
${JSON.stringify(postDetails, null, 2)}

And the following registered candidate receivers (NGOs / Waste Processors):
${JSON.stringify(candidates, null, 2)}

Task:
1. Evaluate and rank the top 3 candidate receivers based on proximity, quantity matched, transport compatibility, food type/dietary requirements, and reliability.
2. For each of the top 3 matches, calculate:
   - A distanceScore (0-40) based on distanceMiles (closer gets higher score).
   - A quantityMatch (0-25) based on how well their needs fit the available quantity.
   - A transportCompatibility (0-15) based on their transport fleet.
   - A foodTypeMatch (0-10) based on dietary requirements.
   - A reliabilityScore (0-10) based on their reliability % rating.
   - A totalScore (0-100) as the sum of the above.
   - Provide a professional, warm, 1-2 sentence "reasoning" explanation summarizing why they were matched and how the score reflects their compatibility.
3. Compute a Partial Allocation Plan:
   - Sequentially distribute the post's total quantity (e.g. quantityMeals) among the ranked candidates.
   - Keep track of needed, allocated, remainingBefore, and remainingAfter.

Return your response strictly as a raw JSON object matching the schema below. Do not wrap in markdown or backticks (no \`\`\`json). Just the raw JSON string:

{
  "matches": [
    {
      "receiverId": "string",
      "receiverName": "string",
      "receiverRole": "receiver" | "waste_processor",
      "matchPercentage": number, // totalScore
      "distanceMiles": number,
      "quantityRequired": number,
      "canCollect": "string",
      "reliability": number,
      "reasoning": "string", // AI explanation for the match
      "breakdown": {
        "distanceScore": number,
        "quantityMatch": number,
        "transportCompatibility": number,
        "foodTypeMatch": number,
        "reliabilityScore": number,
        "totalScore": number
      }
    }
  ],
  "allocations": [
    {
      "receiverId": "string",
      "receiverName": "string",
      "needed": number,
      "allocated": number,
      "remainingBefore": number,
      "remainingAfter": number,
      "matchScore": number // matching percentage
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const resultText = response.text || '{}';
    const jsonResult = JSON.parse(resultText.trim());

    res.json(jsonResult);
  } catch (error: any) {
    console.error('Error generating AI matches:', error);
    res.status(500).json({ error: error.message || 'Error executing AI model' });
  }
});

// Endpoint: AI Advisor chat chatbot
app.post('/api/ai-chat', async (req, res) => {
  const { messages, userRole, userName } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing or invalid messages' });
  }

  if (!ai) {
    return res.status(503).json({ error: 'Gemini service unavailable. Try again later.' });
  }

  try {
    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const systemInstruction = `
You are the FoodLoop AI Recovery Advisor, a smart copilot for food donors, receivers, and waste processors.
The current user is ${userName || 'a FoodLoop member'} acting as a ${userRole || 'participant'}.
Help them optimize food rescue, waste prevention, logistics, composting, compliance, and explain match scores.
Maintain a helpful, encouraging, and professional tone. Keep responses clear and formatted in markdown.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('Error in AI chat advisor:', error);
    res.status(500).json({ error: error.message || 'Error processing AI chat' });
  }
});

// Endpoint: Health status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    aiProvider: ai ? 'gemini-2.5-flash' : 'fallback-heuristic',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static assets in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (path.extname(req.path)) {
    res.status(404).send('Not Found');
  } else {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
