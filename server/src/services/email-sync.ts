import supabase from '../db/index.js';
import { Settings } from './settings.js';
import { fetchRecentEmails } from './gmail.js';
import { processEmail } from './email-processor.js';
import * as applicationsService from './applications.js';
import type {
  SyncResult,
  ProcessedEmail,
  GmailMessage,
  ExtractedJobInfo,
  SyncProgress,
} from '../types/index.js';

// Check if an email has already been processed
async function isEmailProcessed(emailId: string): Promise<boolean> {
  const { data } = await supabase
    .from('processed_emails')
    .select('id')
    .eq('email_id', emailId)
    .single();

  return !!data;
}

// Save a processed email record
async function saveProcessedEmail(
  emailId: string,
  isJobRelated: boolean,
  applicationId: number | null,
  email: GmailMessage
): Promise<void> {
  const { error } = await supabase.from('processed_emails').insert({
    email_id: emailId,
    is_job_related: isJobRelated,
    application_id: applicationId,
    email_from: email.from,
    email_subject: email.subject,
    email_date: email.date,
  });

  if (error) {
    throw new Error(`Failed to save processed email: ${error.message}`);
  }
}

// Find existing application that might match this job info
async function findMatchingApplication(
  jobInfo: ExtractedJobInfo
): Promise<{ id: number } | null> {
  // Try to find by company and role (case-insensitive)
  const { data: row } = await supabase
    .from('applications')
    .select('id')
    .ilike('company', jobInfo.company)
    .ilike('role', jobInfo.role)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (row) return row;

  // Try to find by just company name if role is generic
  if (jobInfo.role === 'Unknown Role') {
    const { data: companyRow } = await supabase
      .from('applications')
      .select('id')
      .ilike('company', jobInfo.company)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return companyRow || null;
  }

  return null;
}

// Parse email date string to YYYY-MM-DD format
function parseEmailDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Create a new application from email job info
async function createApplicationFromEmail(
  jobInfo: ExtractedJobInfo,
  email: GmailMessage
): Promise<number> {
  const contacts = jobInfo.contactName
    ? [
        {
          name: jobInfo.contactName,
          email: jobInfo.contactEmail,
        },
      ]
    : null;

  // Use email date for date_applied, not current date
  const emailDate = parseEmailDate(email.date);

  const { data, error } = await supabase
    .from('applications')
    .insert({
      company: jobInfo.company,
      role: jobInfo.role,
      url: jobInfo.url || null,
      job_description: jobInfo.jobDescription || null,
      status: jobInfo.status,
      date_applied: emailDate,
      date_saved: emailDate,
      contacts: contacts,
      email_id: email.id,
      email_subject: email.subject,
      email_date: email.date,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create application from email: ${error.message}`);
  }

  return data.id;
}

// Update an existing application with new status from email
async function updateApplicationFromEmail(
  applicationId: number,
  jobInfo: ExtractedJobInfo,
  email: GmailMessage
): Promise<void> {
  // Get current application
  const app = await applicationsService.getById(applicationId);
  if (!app) return;

  // Determine if we should update status
  const statusPriority: Record<string, number> = {
    saved: 0,
    applied: 1,
    phone_screen: 2,
    interview: 3,
    offer: 4,
    rejected: 5,
    withdrawn: 6,
  };

  const currentPriority = statusPriority[app.status] ?? 0;
  const newPriority = statusPriority[jobInfo.status] ?? 0;

  // Update if new status is higher priority or rejection
  if (newPriority > currentPriority || jobInfo.status === 'rejected') {
    await supabase
      .from('applications')
      .update({
        status: jobInfo.status,
        email_id: email.id,
        email_subject: email.subject,
        email_date: email.date,
      })
      .eq('id', applicationId);
  }

  // Update contact info if provided and not already present
  if (jobInfo.contactName && !app.contacts?.length) {
    const contacts = [
      {
        name: jobInfo.contactName,
        email: jobInfo.contactEmail,
      },
    ];
    await supabase.from('applications').update({ contacts }).eq('id', applicationId);
  }

  // Update job description if not already present
  if (jobInfo.jobDescription && !app.job_description) {
    await supabase
      .from('applications')
      .update({ job_description: jobInfo.jobDescription })
      .eq('id', applicationId);
  }
}

// Progress callback type
export type ProgressCallback = (progress: SyncProgress) => void;

// Main sync function with optional progress callback
export async function syncEmails(onProgress?: ProgressCallback): Promise<SyncResult> {
  const result: SyncResult = {
    processedCount: 0,
    newApplications: 0,
    updatedApplications: 0,
    skipped: 0,
    errors: [],
  };

  const sendProgress = (progress: SyncProgress) => {
    if (onProgress) {
      onProgress(progress);
    }
  };

  try {
    // Get last sync date, default to 7 days ago for first sync
    const lastSync = await Settings.getLastSyncDate();
    const afterDate = lastSync || getDateDaysAgo(7);

    sendProgress({
      stage: 'fetching',
      message: 'Fetching emails from Gmail...',
      current: 0,
      total: 0,
    });

    // Fetch recent emails
    const emails = await fetchRecentEmails(100, afterDate);

    // Filter out already processed emails
    const emailsToProcess: GmailMessage[] = [];
    for (const email of emails) {
      const processed = await isEmailProcessed(email.id);
      if (!processed) {
        emailsToProcess.push(email);
      }
    }

    const alreadyProcessed = emails.length - emailsToProcess.length;
    result.skipped = alreadyProcessed;

    sendProgress({
      stage: 'processing',
      message: `Found ${emails.length} emails (${alreadyProcessed} already processed)`,
      current: 0,
      total: emailsToProcess.length,
    });

    for (let i = 0; i < emailsToProcess.length; i++) {
      const email = emailsToProcess[i];

      sendProgress({
        stage: 'processing',
        message: `Analyzing email ${i + 1} of ${emailsToProcess.length}`,
        current: i + 1,
        total: emailsToProcess.length,
        emailSubject: email.subject.slice(0, 50) + (email.subject.length > 50 ? '...' : ''),
      });

      try {
        // Process the email
        const { classification, jobInfo } = await processEmail(email);
        result.processedCount++;

        if (!classification.isJobRelated || !jobInfo) {
          // Save as non-job-related
          await saveProcessedEmail(email.id, false, null, email);
          continue;
        }

        sendProgress({
          stage: 'saving',
          message: `Found job email: ${jobInfo.company} - ${jobInfo.role}`,
          current: i + 1,
          total: emailsToProcess.length,
          emailSubject: email.subject.slice(0, 50),
        });

        // Check for existing application
        const existingApp = await findMatchingApplication(jobInfo);

        let applicationId: number;

        if (existingApp) {
          // Update existing application
          await updateApplicationFromEmail(existingApp.id, jobInfo, email);
          applicationId = existingApp.id;
          result.updatedApplications++;
        } else {
          // Create new application
          applicationId = await createApplicationFromEmail(jobInfo, email);
          result.newApplications++;
        }

        // Save processed email record
        await saveProcessedEmail(email.id, true, applicationId, email);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Email ${email.id}: ${errorMessage}`);
      }
    }

    // Update last sync date
    await Settings.setLastSyncDate(new Date().toISOString());

    sendProgress({
      stage: 'complete',
      message: `Done! Created ${result.newApplications} new, updated ${result.updatedApplications}`,
      current: emailsToProcess.length,
      total: emailsToProcess.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Sync failed: ${errorMessage}`);

    sendProgress({
      stage: 'error',
      message: errorMessage,
      current: 0,
      total: 0,
    });
  }

  return result;
}

// Get processed emails for display
export async function getProcessedEmails(limit: number = 50): Promise<ProcessedEmail[]> {
  const { data, error } = await supabase
    .from('processed_emails')
    .select('*')
    .order('processed_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get processed emails: ${error.message}`);
  }

  return data || [];
}

// Helper to get date N days ago
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}
