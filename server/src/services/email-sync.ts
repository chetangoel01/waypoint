import db from '../db/index.js';
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
function isEmailProcessed(emailId: string): boolean {
  const row = db
    .prepare('SELECT id FROM processed_emails WHERE email_id = ?')
    .get(emailId);
  return !!row;
}

// Save a processed email record
function saveProcessedEmail(
  emailId: string,
  isJobRelated: boolean,
  applicationId: number | null,
  email: GmailMessage
): void {
  db.prepare(
    `INSERT INTO processed_emails
     (email_id, is_job_related, application_id, email_from, email_subject, email_date)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    emailId,
    isJobRelated ? 1 : 0,
    applicationId,
    email.from,
    email.subject,
    email.date
  );
}

// Find existing application that might match this job info
function findMatchingApplication(
  jobInfo: ExtractedJobInfo
): { id: number } | null {
  // Try to find by company and role (case-insensitive)
  const row = db
    .prepare(
      `SELECT id FROM applications
       WHERE LOWER(company) = LOWER(?)
       AND LOWER(role) = LOWER(?)
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(jobInfo.company, jobInfo.role) as { id: number } | undefined;

  if (row) return row;

  // Try to find by just company name if role is generic
  if (jobInfo.role === 'Unknown Role') {
    const companyRow = db
      .prepare(
        `SELECT id FROM applications
         WHERE LOWER(company) = LOWER(?)
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .get(jobInfo.company) as { id: number } | undefined;

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
function createApplicationFromEmail(
  jobInfo: ExtractedJobInfo,
  email: GmailMessage
): number {
  const contacts = jobInfo.contactName
    ? JSON.stringify([
        {
          name: jobInfo.contactName,
          email: jobInfo.contactEmail,
        },
      ])
    : null;

  // Use email date for date_applied, not current date
  const emailDate = parseEmailDate(email.date);

  const result = db
    .prepare(
      `INSERT INTO applications
       (company, role, url, job_description, status, date_applied, date_saved, contacts, email_id, email_subject, email_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      jobInfo.company,
      jobInfo.role,
      jobInfo.url || null,
      jobInfo.jobDescription || null,
      jobInfo.status,
      emailDate,
      emailDate,
      contacts,
      email.id,
      email.subject,
      email.date
    );

  return Number(result.lastInsertRowid);
}

// Update an existing application with new status from email
function updateApplicationFromEmail(
  applicationId: number,
  jobInfo: ExtractedJobInfo,
  email: GmailMessage
): void {
  // Get current application
  const app = applicationsService.getById(applicationId);
  if (!app) return;

  // Determine if we should update status
  // Only update if the new status represents progression or rejection
  const statusPriority: Record<string, number> = {
    saved: 0,
    applied: 1,
    phone_screen: 2,
    interview: 3,
    offer: 4,
    rejected: 5, // Always show rejection
    withdrawn: 6,
  };

  const currentPriority = statusPriority[app.status] ?? 0;
  const newPriority = statusPriority[jobInfo.status] ?? 0;

  // Update if new status is higher priority (progression) or rejection
  if (newPriority > currentPriority || jobInfo.status === 'rejected') {
    db.prepare(
      `UPDATE applications
       SET status = ?, email_id = ?, email_subject = ?, email_date = ?
       WHERE id = ?`
    ).run(jobInfo.status, email.id, email.subject, email.date, applicationId);
  }

  // Update contact info if provided and not already present
  if (jobInfo.contactName && !app.contacts?.length) {
    const contacts = JSON.stringify([
      {
        name: jobInfo.contactName,
        email: jobInfo.contactEmail,
      },
    ]);
    db.prepare('UPDATE applications SET contacts = ? WHERE id = ?').run(
      contacts,
      applicationId
    );
  }

  // Update job description if not already present
  if (jobInfo.jobDescription && !app.job_description) {
    db.prepare('UPDATE applications SET job_description = ? WHERE id = ?').run(
      jobInfo.jobDescription,
      applicationId
    );
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
    const lastSync = Settings.getLastSyncDate();
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
    const emailsToProcess = emails.filter(email => !isEmailProcessed(email.id));
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
          saveProcessedEmail(email.id, false, null, email);
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
        const existingApp = findMatchingApplication(jobInfo);

        let applicationId: number;

        if (existingApp) {
          // Update existing application
          updateApplicationFromEmail(existingApp.id, jobInfo, email);
          applicationId = existingApp.id;
          result.updatedApplications++;
        } else {
          // Create new application
          applicationId = createApplicationFromEmail(jobInfo, email);
          result.newApplications++;
        }

        // Save processed email record
        saveProcessedEmail(email.id, true, applicationId, email);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Email ${email.id}: ${errorMessage}`);
      }
    }

    // Update last sync date
    Settings.setLastSyncDate(new Date().toISOString());

    sendProgress({
      stage: 'complete',
      message: `Done! Created ${result.newApplications} new, updated ${result.updatedApplications}`,
      current: emailsToProcess.length,
      total: emailsToProcess.length,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
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
export function getProcessedEmails(limit: number = 50): ProcessedEmail[] {
  return db
    .prepare(
      `SELECT * FROM processed_emails
       ORDER BY processed_at DESC
       LIMIT ?`
    )
    .all(limit) as ProcessedEmail[];
}

// Helper to get date N days ago
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}
