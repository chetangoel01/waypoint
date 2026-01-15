import OpenAI from 'openai';
import { SupabaseClient } from '@supabase/supabase-js';
import { createSettingsHelper } from './settings.js';
import {
  getProfile,
  getWorkExperience,
  getEducation,
  getSkills,
  getProjects,
  getStories,
} from './profile.js';
import * as applicationsService from './applications.js';
import { validationError } from '../middleware/response.js';

// Types for AI generation
export interface GenerateCoverLetterInput {
  applicationId: number;
  additionalContext?: string;
  tone?: 'professional' | 'conversational' | 'enthusiastic';
}

export interface GenerateCustomResponseInput {
  applicationId: number;
  question: string;
  additionalContext?: string;
  maxLength?: number;
}

export interface RefineContentInput {
  content: string;
  instruction: string;
}

export interface GenerationResult {
  content: string;
  promptUsed: string;
}

// Get OpenAI client
async function getOpenAIClient(supabase: SupabaseClient): Promise<OpenAI> {
  const settings = createSettingsHelper(supabase);
  const apiKey = await settings.getApiKey();
  if (!apiKey) {
    validationError('OpenAI API key not configured. Please add your API key in Settings.');
  }
  return new OpenAI({ apiKey });
}

// Build context about the applicant from their profile data
async function buildApplicantContext(supabase: SupabaseClient): Promise<string> {
  const profile = await getProfile(supabase);
  const experience = await getWorkExperience(supabase);
  const education = await getEducation(supabase);
  const skills = await getSkills(supabase);
  const projects = await getProjects(supabase);
  const stories = await getStories(supabase);

  let context = '## About the Applicant\n\n';

  if (profile) {
    if (profile.name) context += `**Name:** ${profile.name}\n`;
    if (profile.location) context += `**Location:** ${profile.location}\n`;
    if (profile.career_goals) context += `**Career Goals:** ${profile.career_goals}\n`;
    if (profile.preferences) context += `**Preferences:** ${profile.preferences}\n`;
    if (profile.additional_context)
      context += `**Additional Context:** ${profile.additional_context}\n`;
    context += '\n';

    // Include resume text if available
    if (profile.resume_text) {
      context += '### Resume Content\n';
      context += profile.resume_text + '\n\n';
    }
  }

  if (experience.length > 0) {
    context += '### Work Experience\n';
    experience.forEach((exp) => {
      context += `- **${exp.role}** at ${exp.company}`;
      if (exp.start_date) {
        context += ` (${exp.start_date}${exp.end_date ? ` - ${exp.end_date}` : ' - Present'})`;
      }
      context += '\n';
      if (exp.description) context += `  ${exp.description}\n`;
      if (exp.achievements) {
        context += `  Achievements: ${exp.achievements}\n`;
      }
    });
    context += '\n';
  }

  if (education.length > 0) {
    context += '### Education\n';
    education.forEach((edu) => {
      context += `- **${edu.degree}** in ${edu.field || 'N/A'} from ${edu.institution}`;
      if (edu.end_date) context += ` (${edu.end_date})`;
      if (edu.gpa) context += ` - GPA: ${edu.gpa}`;
      context += '\n';
    });
    context += '\n';
  }

  if (skills.length > 0) {
    context += '### Skills\n';
    // Group skills by category
    const grouped: Record<string, string[]> = {};
    skills.forEach((skill) => {
      if (!grouped[skill.category]) {
        grouped[skill.category] = [];
      }
      grouped[skill.category].push(skill.name);
    });
    for (const [category, names] of Object.entries(grouped)) {
      context += `- **${category}:** ${names.join(', ')}\n`;
    }
    context += '\n';
  }

  if (projects.length > 0) {
    context += '### Notable Projects\n';
    projects.forEach((proj) => {
      context += `- **${proj.name}**`;
      if (proj.technologies) context += ` (${proj.technologies})`;
      context += '\n';
      if (proj.description) context += `  ${proj.description}\n`;
      if (proj.outcomes) context += `  Outcomes: ${proj.outcomes}\n`;
    });
    context += '\n';
  }

  if (stories.length > 0) {
    context += '### Relevant Stories (STAR format experiences)\n';
    stories.slice(0, 3).forEach((story) => {
      context += `- **${story.title}**`;
      if (story.tags) context += ` [${story.tags}]`;
      context += '\n';
      if (story.situation) context += `  Situation: ${story.situation}\n`;
      if (story.action) context += `  Action: ${story.action}\n`;
      if (story.result) context += `  Result: ${story.result}\n`;
    });
    context += '\n';
  }

  return context;
}

// Build context about the job application
async function buildJobContext(
  supabase: SupabaseClient,
  applicationId: number
): Promise<string> {
  const app = await applicationsService.getById(supabase, applicationId);
  if (!app) {
    validationError('Application not found');
  }

  let context = '## About the Job\n\n';
  context += `**Company:** ${app.company}\n`;
  context += `**Role:** ${app.role}\n`;
  if (app.url) context += `**Job URL:** ${app.url}\n`;
  context += '\n';

  if (app.job_description) {
    context += '### Job Description\n';
    context += app.job_description + '\n\n';
  }

  if (app.notes) {
    context += '### Additional Notes\n';
    context += app.notes + '\n\n';
  }

  return context;
}

// Generate a cover letter
export async function generateCoverLetter(
  supabase: SupabaseClient,
  input: GenerateCoverLetterInput
): Promise<GenerationResult> {
  const openai = await getOpenAIClient(supabase);

  const applicantContext = await buildApplicantContext(supabase);
  const jobContext = await buildJobContext(supabase, input.applicationId);

  const toneInstructions = {
    professional: 'Use a formal, professional tone suitable for traditional industries.',
    conversational: 'Use a warm, conversational tone while remaining professional.',
    enthusiastic: 'Use an enthusiastic, energetic tone that shows genuine excitement.',
  };

  const tone = input.tone || 'professional';

  const systemPrompt = `You are an expert career coach and professional writer helping craft compelling cover letters.

Your task is to write a cover letter that:
1. Opens with a strong, specific hook that shows genuine interest in the company
2. Highlights relevant experience and skills that match the job requirements
3. Uses specific examples and achievements when possible
4. Shows enthusiasm for the role without being generic
5. Closes with a clear call to action

${toneInstructions[tone]}

Important guidelines:
- Keep it concise (250-400 words)
- Avoid clichés like "I am writing to express my interest"
- Don't repeat the resume verbatim; add context and personality
- Make it specific to this company and role
- Use active voice and strong verbs`;

  const userPrompt = `Please write a cover letter for the following opportunity:

${jobContext}

${applicantContext}

${input.additionalContext ? `Additional context from the applicant:\n${input.additionalContext}\n\n` : ''}

Write the cover letter now. Do not include any explanations or meta-commentary, just the cover letter text itself.`;

  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content || '';

  return {
    content,
    promptUsed: fullPrompt,
  };
}

// Generate a response to a custom question
export async function generateCustomResponse(
  supabase: SupabaseClient,
  input: GenerateCustomResponseInput
): Promise<GenerationResult> {
  const openai = await getOpenAIClient(supabase);

  const applicantContext = await buildApplicantContext(supabase);
  const jobContext = await buildJobContext(supabase, input.applicationId);

  const maxLength = input.maxLength || 500;

  const systemPrompt = `You are an expert career coach helping craft compelling responses to job application questions.

Your task is to write a response that:
1. Directly addresses the question asked
2. Uses specific examples from the applicant's background
3. Shows relevant skills and experience
4. Is authentic and personalized
5. Demonstrates fit for the role and company

Important guidelines:
- Keep the response under ${maxLength} words
- Be specific and use concrete examples
- Avoid generic or clichéd responses
- Show self-awareness and growth mindset when appropriate
- Match the tone to the question (behavioral, technical, motivational, etc.)`;

  const userPrompt = `Please write a response to this application question:

**Question:** ${input.question}

${jobContext}

${applicantContext}

${input.additionalContext ? `**Additional context from the applicant:**\n${input.additionalContext}\n\n` : ''}Write the response now. Do not include any explanations or meta-commentary, just the response text itself.`;

  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });

  const content = response.choices[0]?.message?.content || '';

  return {
    content,
    promptUsed: fullPrompt,
  };
}

// Refine existing content based on instructions
export async function refineContent(
  supabase: SupabaseClient,
  input: RefineContentInput
): Promise<GenerationResult> {
  const openai = await getOpenAIClient(supabase);

  const systemPrompt = `You are an expert editor helping refine job application content.

Your task is to improve the provided content based on the specific instruction given.
Maintain the original intent and key information while applying the requested changes.

Important guidelines:
- Preserve the author's voice where possible
- Only make changes relevant to the instruction
- Keep similar length unless asked to expand/shorten
- Maintain professionalism`;

  const userPrompt = `Please refine this content according to the instruction:

**Instruction:** ${input.instruction}

**Original Content:**
${input.content}

Write the refined content now. Do not include any explanations or meta-commentary, just the refined text itself.`;

  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content || '';

  return {
    content,
    promptUsed: fullPrompt,
  };
}

// Check if AI is configured
export async function isAiConfigured(supabase: SupabaseClient): Promise<boolean> {
  const settings = createSettingsHelper(supabase);
  const apiKey = await settings.getApiKey();
  return !!apiKey;
}

// Get the applicant context (for viewing in UI)
export async function getApplicantContext(supabase: SupabaseClient): Promise<string> {
  return buildApplicantContext(supabase);
}

// Types for parsed resume data
export interface ParsedResumeData {
  profile: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    portfolio_url: string | null;
    career_goals: string | null;
  };
  experience: Array<{
    company: string;
    role: string;
    start_date: string | null;
    end_date: string | null;
    description: string | null;
    achievements: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string | null;
    start_date: string | null;
    end_date: string | null;
    gpa: number | null;
  }>;
  skills: Array<{
    category: string;
    name: string;
    proficiency: string | null;
  }>;
  projects: Array<{
    name: string;
    description: string | null;
    technologies: string[];
    outcomes: string | null;
    url: string | null;
  }>;
}

// Parse resume text and extract structured data
export async function parseResume(
  supabase: SupabaseClient,
  resumeText: string
): Promise<ParsedResumeData> {
  const openai = await getOpenAIClient(supabase);

  const systemPrompt = `You are an expert resume parser. Your task is to extract structured information from resume text.

Extract the following information and return it as valid JSON:
1. Profile information (name, email, phone, location, linkedin URL, github URL, portfolio URL, career goals/summary)
2. Work experience (company, role, dates, description, achievements)
3. Education (institution, degree, field of study, dates, GPA if mentioned)
4. Skills (categorized by type like "Programming Languages", "Frameworks", "Tools", etc.)
5. Projects (name, description, technologies used, outcomes/impact, URL if any)

Guidelines:
- For dates, use format "YYYY-MM" or "YYYY" when only year is known. Use null if not specified.
- For achievements, extract specific bullet points or accomplishments.
- Infer skill categories from context (e.g., Python goes under "Programming Languages")
- If information is not present, use null for optional fields or empty arrays for lists.
- Be thorough but only extract information that is actually present in the resume.`;

  const userPrompt = `Please parse the following resume and extract structured data:

${resumeText}

Return the data as a JSON object with this exact structure:
{
  "profile": {
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin_url": "string or null",
    "github_url": "string or null",
    "portfolio_url": "string or null",
    "career_goals": "string or null (extract from summary/objective section)"
  },
  "experience": [
    {
      "company": "string",
      "role": "string",
      "start_date": "YYYY-MM or YYYY or null",
      "end_date": "YYYY-MM or YYYY or null (null if current)",
      "description": "string or null",
      "achievements": ["array of achievement strings"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string (e.g., Bachelor of Science, MBA)",
      "field": "string or null (e.g., Computer Science)",
      "start_date": "YYYY-MM or YYYY or null",
      "end_date": "YYYY-MM or YYYY or null",
      "gpa": number or null
    }
  ],
  "skills": [
    {
      "category": "string (e.g., Programming Languages, Frameworks, Tools)",
      "name": "string",
      "proficiency": "string or null (e.g., Expert, Intermediate, Beginner)"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string or null",
      "technologies": ["array of technology strings"],
      "outcomes": "string or null (quantifiable results if any)",
      "url": "string or null"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3, // Lower temperature for more consistent parsing
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(content) as ParsedResumeData;

    // Ensure all required fields have default values
    return {
      profile: {
        name: parsed.profile?.name ?? null,
        email: parsed.profile?.email ?? null,
        phone: parsed.profile?.phone ?? null,
        location: parsed.profile?.location ?? null,
        linkedin_url: parsed.profile?.linkedin_url ?? null,
        github_url: parsed.profile?.github_url ?? null,
        portfolio_url: parsed.profile?.portfolio_url ?? null,
        career_goals: parsed.profile?.career_goals ?? null,
      },
      experience: parsed.experience ?? [],
      education: parsed.education ?? [],
      skills: parsed.skills ?? [],
      projects: parsed.projects ?? [],
    };
  } catch {
    // Return empty structure if parsing fails
    return {
      profile: {
        name: null,
        email: null,
        phone: null,
        location: null,
        linkedin_url: null,
        github_url: null,
        portfolio_url: null,
        career_goals: null,
      },
      experience: [],
      education: [],
      skills: [],
      projects: [],
    };
  }
}
