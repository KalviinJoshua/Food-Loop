import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import os from 'os';
import fs from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

type FssaiVerificationStatus = 'verified' | 'pending_review' | 'invalid' | 'expired' | 'document_unreadable';

interface FssaiExtractedData {
  fssaiNumber?: string;
  organizationName?: string;
  address?: string;
  licenseType?: string;
  issueDate?: string;
  expiryDate?: string;
}

interface FssaiVerificationResult {
  success: boolean;
  verificationStatus: FssaiVerificationStatus;
  extractedData: FssaiExtractedData;
  checks: {
    fssaiNumberMatch: boolean;
    organizationNameMatch: boolean;
    documentReadable: boolean;
    certificateValid: boolean;
  };
  message?: string;
  verifiedAt?: string;
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const uploadDir = path.join(os.tmpdir(), 'foodloop-fssai-uploads');

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error as Error, uploadDir);
      }
    },
    filename: (_req, file, cb) => {
      const safeExt = ALLOWED_EXTENSIONS.has(path.extname(file.originalname).toLowerCase())
        ? path.extname(file.originalname).toLowerCase()
        : '';
      cb(null, `fssai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
    },
  }),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
      cb(new Error('Invalid file type. Please upload a PDF, JPG, JPEG, or PNG certificate.'));
      return;
    }
    cb(null, true);
  },
});

const normalizeDigits = (value = '') => value.replace(/\D/g, '');

const normalizeName = (value = '') =>
  value
    .toLowerCase()
    .replace(/\b(private|pvt|limited|ltd|llp|inc|company|co)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const getNameTokens = (value: string) => normalizeName(value).split(' ').filter((part) => part.length > 2);

const isLikelySameOrganization = (registeredName: string, extractedName?: string, fullText = '') => {
  const registeredTokens = getNameTokens(registeredName);
  if (registeredTokens.length === 0) return false;

  const compareText = normalizeName(`${extractedName || ''} ${fullText}`);
  const matched = registeredTokens.filter((token) => compareText.includes(token)).length;
  return matched / registeredTokens.length >= 0.6;
};

const normalizeDate = (value: string) => {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  const slashMatch = cleaned.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/);
  if (slashMatch) {
    const [, day, month, yearPart] = slashMatch;
    const year = yearPart.length === 2 ? `20${yearPart}` : yearPart;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return undefined;
};

const extractDateNearLabels = (text: string, labels: string[]) => {
  const datePattern = '(\\d{1,2}[\\/.\\-]\\d{1,2}[\\/.\\-]\\d{2,4}|\\d{1,2}\\s+[A-Za-z]{3,9}\\s+\\d{4}|[A-Za-z]{3,9}\\s+\\d{1,2},?\\s+\\d{4})';
  for (const label of labels) {
    const regex = new RegExp(`${label}[^\\n\\r]{0,60}?${datePattern}`, 'i');
    const match = text.match(regex);
    if (match?.[1]) return normalizeDate(match[1]);
  }
  return undefined;
};

const extractFssaiNumber = (text: string) => {
  const labelPattern = /(fssai|license\s*(?:no|number)?|licence\s*(?:no|number)?|registration\s*(?:no|number)?)[^\d]{0,40}((?:\d[\s\-\.]*){14})/gi;
  const labelled: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = labelPattern.exec(text))) {
    const normalized = normalizeDigits(match[2]);
    if (normalized.length === 14) labelled.push(normalized);
  }
  if (labelled.length > 0) return labelled[0];

  const fallback = text.match(/\b\d{14}\b/);
  return fallback?.[0];
};

const extractOrganizationName = (text: string) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const labelRegexes = [
    /(?:name\s+of\s+(?:business|licensee|applicant)|business\s+name|company\s+name|firm\s+name|licensee\s+name)\s*[:\-]?\s*(.+)$/i,
    /(?:issued\s+to|granted\s+to)\s*[:\-]?\s*(.+)$/i,
  ];
  for (const line of lines) {
    for (const regex of labelRegexes) {
      const match = line.match(regex);
      if (match?.[1] && match[1].length > 2) return match[1].trim();
    }
  }
  return undefined;
};

const extractAddress = (text: string) => {
  const match = text.match(/(?:address|premises)\s*[:\-]?\s*([^\n\r]+(?:\n[^\n\r]+){0,2})/i);
  return match?.[1]?.replace(/\s+/g, ' ').trim();
};

const extractLicenseType = (text: string) => {
  const match = text.match(/(?:license|licence|registration)\s+type\s*[:\-]?\s*([^\n\r]+)/i);
  return match?.[1]?.trim();
};

const extractFssaiData = (text: string): FssaiExtractedData => ({
  fssaiNumber: extractFssaiNumber(text),
  organizationName: extractOrganizationName(text),
  address: extractAddress(text),
  licenseType: extractLicenseType(text),
  issueDate: extractDateNearLabels(text, ['issue\\s+date', 'date\\s+of\\s+issue', 'issued\\s+on', 'valid\\s+from']),
  expiryDate: extractDateNearLabels(text, ['expiry\\s+date', 'valid\\s+upto', 'valid\\s+up\\s+to', 'valid\\s+till', 'validity\\s+up\\s+to']),
});

const verifyFssaiText = (text: string, registration: { organizationName: string; fssaiNumber: string }): FssaiVerificationResult => {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  const documentReadable = cleanText.length >= 30;
  if (!documentReadable) {
    return {
      success: true,
      verificationStatus: 'document_unreadable',
      extractedData: {},
      checks: {
        fssaiNumberMatch: false,
        organizationNameMatch: false,
        documentReadable: false,
        certificateValid: false,
      },
      message: 'The document could not be read confidently.',
      verifiedAt: new Date().toISOString(),
    };
  }

  const extractedData = extractFssaiData(text);
  const registeredFssai = normalizeDigits(registration.fssaiNumber);
  const extractedFssai = normalizeDigits(extractedData.fssaiNumber);
  const fssaiNumberMatch = !!registeredFssai && !!extractedFssai && registeredFssai === extractedFssai;
  const organizationNameMatch = isLikelySameOrganization(registration.organizationName, extractedData.organizationName, text);

  const expiryTime = extractedData.expiryDate ? new Date(`${extractedData.expiryDate}T23:59:59`).getTime() : undefined;
  const isExpired = typeof expiryTime === 'number' && !Number.isNaN(expiryTime) && expiryTime < Date.now();
  const certificateValid = !isExpired;

  let verificationStatus: FssaiVerificationStatus = 'pending_review';
  if (isExpired) {
    verificationStatus = 'expired';
  } else if (extractedFssai && registeredFssai && !fssaiNumberMatch) {
    verificationStatus = 'invalid';
  } else if (fssaiNumberMatch && organizationNameMatch && certificateValid) {
    verificationStatus = 'verified';
  }

  return {
    success: true,
    verificationStatus,
    extractedData,
    checks: {
      fssaiNumberMatch,
      organizationNameMatch,
      documentReadable,
      certificateValid,
    },
    message: verificationStatus === 'verified' ? 'FSSAI certificate verified successfully.' : 'FSSAI certificate requires review or did not pass validation.',
    verifiedAt: new Date().toISOString(),
  };
};

const extractTextFromFile = async (filePath: string, mimetype: string) => {
  if (mimetype === 'application/pdf') {
    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return parsed.text || '';
    } finally {
      await parser.destroy();
    }
  }

  const worker = await createWorker('eng');
  try {
    const result = await worker.recognize(filePath);
    return result.data.text || '';
  } finally {
    await worker.terminate();
  }
};

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

// Endpoint: FSSAI document upload, text extraction, and deterministic verification
app.post('/api/verify-fssai', (req, res) => {
  upload.single('certificate')(req, res, async (uploadError) => {
    const uploadedFile = req.file;

    try {
      if (uploadError) {
        return res.status(400).json({ error: uploadError.message || 'Invalid upload' });
      }

      const organizationName = String(req.body.organizationName || '').trim();
      const fssaiNumber = String(req.body.fssaiNumber || '').trim();

      if (!organizationName || !fssaiNumber) {
        return res.status(400).json({ error: 'Missing organization name or FSSAI number' });
      }

      if (!uploadedFile) {
        return res.status(400).json({ error: 'No certificate file uploaded' });
      }

      if (uploadedFile.size <= 0) {
        return res.status(400).json({ error: 'Uploaded certificate is empty' });
      }

      const ext = path.extname(uploadedFile.originalname).toLowerCase();
      if (!ALLOWED_MIME_TYPES.has(uploadedFile.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
        return res.status(400).json({ error: 'Invalid file type. Please upload a PDF, JPG, JPEG, or PNG certificate.' });
      }

      const extractedText = await extractTextFromFile(uploadedFile.path, uploadedFile.mimetype);
      const verification = verifyFssaiText(extractedText, { organizationName, fssaiNumber });
      res.json(verification);
    } catch (error: unknown) {
      console.error('FSSAI verification failed:', error);
      const fallback: FssaiVerificationResult = {
        success: false,
        verificationStatus: 'document_unreadable',
        extractedData: {},
        checks: {
          fssaiNumberMatch: false,
          organizationNameMatch: false,
          documentReadable: false,
          certificateValid: false,
        },
        message: error instanceof Error ? error.message : 'Unable to process uploaded certificate',
        verifiedAt: new Date().toISOString(),
      };
      res.status(500).json(fallback);
    } finally {
      if (uploadedFile?.path) {
        fs.unlink(uploadedFile.path).catch(() => undefined);
      }
    }
  });
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
