import OpenAI from 'openai';
import { Settings } from './settings.js';
import { getProfile } from './profile.js';
import * as experienceService from './experience.js';
import * as educationService from './education.js';
import { getAllGrouped as getSkillsGrouped } from './skills.js';
import * as projectsService from './projects.js';
import * as storiesService from './stories.js';
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
function getOpenAIClient(): OpenAI {
  const apiKey = Settings.getApiKey();
  if (!apiKey) {
    validationError('OpenAI API key not configured. Please add your API key in Settings.');
  }
  return new OpenAI({ apiKey });
}

// Build context about the applicant from their profile data
async function buildApplicantContext(): Promise<string> {
  const profile = getProfile();
  const experience = experienceService.getAll();
  const education = educationService.getAll();
  const skills = getSkillsGrouped();
  const projects = projectsService.getAll();
  const stories = storiesService.getAll();

  let context = '## About the Applicant\n\n';

  if (profile) {
    if (profile.name) context += `**Name:** ${profile.name}\n`;
    if (profile.location) context += `**Location:** ${profile.location}\n`;
    if (profile.career_goals) context += `**Career Goals:** ${profile.career_goals}\n`;
    if (profile.preferences) context += `**Preferences:** ${profile.preferences}\n`;
    if (profile.additional_context) context += `**Additional Context:** ${profile.additional_context}\n`;
    context += '\n';
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
      if (exp.achievements?.length) {
        context += `  Achievements: ${exp.achievements.join('; ')}\n`;
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

  if (Object.keys(skills).length > 0) {
    context += '### Skills\n';
    for (const [category, categorySkills] of Object.entries(skills)) {
      const skillNames = categorySkills.map((s) => s.name).join(', ');
      context += `- **${category}:** ${skillNames}\n`;
    }
    context += '\n';
  }

  if (projects.length > 0) {
    context += '### Notable Projects\n';
    projects.forEach((proj) => {
      context += `- **${proj.name}**`;
      if (proj.technologies?.length) context += ` (${proj.technologies.join(', ')})`;
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
      if (story.tags?.length) context += ` [${story.tags.join(', ')}]`;
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
function buildJobContext(applicationId: number): string {
  const app = applicationsService.getById(applicationId);
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
export async function generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerationResult> {
  const openai = getOpenAIClient();

  const applicantContext = await buildApplicantContext();
  const jobContext = buildJobContext(input.applicationId);

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
export async function generateCustomResponse(input: GenerateCustomResponseInput): Promise<GenerationResult> {
  const openai = getOpenAIClient();

  const applicantContext = await buildApplicantContext();
  const jobContext = buildJobContext(input.applicationId);

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
export async function refineContent(input: RefineContentInput): Promise<GenerationResult> {
  const openai = getOpenAIClient();

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
export function isAiConfigured(): boolean {
  return !!Settings.getApiKey();
}
