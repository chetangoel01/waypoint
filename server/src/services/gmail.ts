import { getGmailClient } from './gmail-oauth.js';
import type { GmailMessage } from '../types/index.js';

// Fetch recent emails from Gmail
export async function fetchRecentEmails(
  maxResults: number = 50,
  afterDate?: string
): Promise<GmailMessage[]> {
  const gmail = await getGmailClient();

  // Build query - get emails after a certain date if specified
  let query = '';
  if (afterDate) {
    // Gmail uses format: after:YYYY/MM/DD
    const date = new Date(afterDate);
    const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    query = `after:${formattedDate}`;
  }

  // List messages
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: query,
  });

  const messages = listResponse.data.messages || [];
  const emails: GmailMessage[] = [];

  // Fetch full content for each message
  for (const msg of messages) {
    if (!msg.id) continue;

    try {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const email = parseGmailMessage(msg.id, fullMessage.data);
      if (email) {
        emails.push(email);
      }
    } catch (error) {
      console.error(`Failed to fetch message ${msg.id}:`, error);
    }
  }

  return emails;
}

// Parse a Gmail message into our format
function parseGmailMessage(
  messageId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
): GmailMessage | null {
  const headers = data.payload?.headers || [];

  const getHeader = (name: string): string => {
    const header = headers.find(
      (h: { name: string; value: string }) =>
        h.name.toLowerCase() === name.toLowerCase()
    );
    return header?.value || '';
  };

  const from = getHeader('From');
  const subject = getHeader('Subject');
  const date = getHeader('Date');

  // Extract body
  const body = extractBody(data.payload);

  if (!from || !subject) {
    return null;
  }

  return {
    id: messageId,
    threadId: data.threadId || '',
    from,
    subject,
    date,
    body,
  };
}

// Extract plain text body from Gmail message payload
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBody(payload: any): string {
  if (!payload) return '';

  // If the body is directly available
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // If there are parts, look for text/plain
  if (payload.parts) {
    // First try to find text/plain
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }

    // If no text/plain, try text/html and strip tags
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = decodeBase64(part.body.data);
        return stripHtml(html);
      }
    }

    // Recursively check nested parts
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }

  return '';
}

// Decode base64url encoded string
function decodeBase64(data: string): string {
  // Gmail uses URL-safe base64
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString('utf-8');
}

// Strip HTML tags and decode entities
function stripHtml(html: string): string {
  return html
    // Remove style and script tags with content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}
