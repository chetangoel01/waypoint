import OpenAI from 'openai';
import { Settings } from './settings.js';
import type {
  EmailClassification,
  ExtractedJobInfo,
  GmailMessage,
} from '../types/index.js';

// Get OpenAI client
async function getOpenAIClient(): Promise<OpenAI> {
  const apiKey = await Settings.getApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({ apiKey });
}

// Classify whether an email is job-related
export async function classifyEmail(
  email: GmailMessage
): Promise<EmailClassification> {
  const openai = await getOpenAIClient();

  const systemPrompt = `You are an expert at classifying emails. Your task is to determine if an email is related to a job application process.

Job-related emails include:
- Application confirmations ("We received your application")
- Interview invitations or scheduling
- Rejection notices
- Offer letters
- Status updates on applications
- Recruiter outreach about specific positions
- Follow-up requests from companies

NOT job-related:
- Marketing emails from job boards (weekly digests, "jobs you might like")
- General company newsletters
- Spam or promotional content
- Personal emails
- Transactional emails unrelated to job applications

Respond with a JSON object containing:
- isJobRelated: boolean
- confidence: number between 0 and 1
- reason: brief explanation (max 20 words)`;

  const userPrompt = `Classify this email:

From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}

Body (truncated to 1500 chars):
${email.body.slice(0, 1500)}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    return {
      isJobRelated: result.isJobRelated ?? false,
      confidence: result.confidence ?? 0,
      reason: result.reason ?? 'Unknown',
    };
  } catch (error) {
    console.error('Failed to classify email:', error);
    return {
      isJobRelated: false,
      confidence: 0,
      reason: 'Classification failed',
    };
  }
}

// Extract job information from a job-related email
export async function extractJobInfo(
  email: GmailMessage
): Promise<ExtractedJobInfo | null> {
  const openai = await getOpenAIClient();

  const systemPrompt = `You are an expert at extracting job application information from emails.

Extract the following information from the email:
- company: The company name (required)
- role: The job title/position (required, use "Unknown Role" if not found)
- status: One of: "applied", "phone_screen", "interview", "offer", "rejected" (infer from email content)
- url: Any job posting URL mentioned (optional)
- contactName: Name of recruiter/hiring manager if mentioned (optional)
- contactEmail: Email of recruiter/hiring manager if different from sender (optional)
- jobDescription: Brief summary of the role if mentioned (optional, max 200 chars)

Status inference guidelines:
- "applied": Application confirmation emails, "we received your application"
- "phone_screen": Initial call scheduling, phone interview requests
- "interview": On-site or video interview invitations
- "offer": Job offers, offer letters
- "rejected": Rejection notices, "we decided to move forward with other candidates"

Respond with a JSON object. If you cannot determine company name, return null.`;

  const userPrompt = `Extract job information from this email:

From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}

Body:
${email.body.slice(0, 3000)}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    // Validate required fields
    if (!result.company) {
      return null;
    }

    return {
      company: result.company,
      role: result.role || 'Unknown Role',
      status: result.status || 'applied',
      url: result.url || undefined,
      contactName: result.contactName || undefined,
      contactEmail: result.contactEmail || undefined,
      jobDescription: result.jobDescription || undefined,
    };
  } catch (error) {
    console.error('Failed to extract job info:', error);
    return null;
  }
}

// Process a single email: classify and extract info if job-related
export async function processEmail(
  email: GmailMessage
): Promise<{ classification: EmailClassification; jobInfo: ExtractedJobInfo | null }> {
  // First classify the email
  const classification = await classifyEmail(email);

  // If not job-related, skip extraction
  if (!classification.isJobRelated || classification.confidence < 0.6) {
    return { classification, jobInfo: null };
  }

  // Extract job info
  const jobInfo = await extractJobInfo(email);

  return { classification, jobInfo };
}
