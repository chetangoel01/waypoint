import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processEmail } from './email-processor.js';

// Mock the dependencies
const mockChatCreate = vi.fn();

vi.mock('openai', () => {
  return {
    default: class OpenAI {
      chat = {
        completions: {
          create: mockChatCreate,
        },
      };
    },
  };
});

// Mock settings helper
vi.mock('./settings.js', () => ({
  createSettingsHelper: () => ({
    getApiKey: async () => 'mock-api-key',
  }),
}));

// Mock logger to avoid cluttering test output
vi.mock('../utils/logger.js', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Email Processor Service', () => {
  const mockSupabase = {} as any; // We don't need a real client since we mocked settings

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process a job-related email correctly', async () => {
    // Mock successful classification
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isJobRelated: true,
              confidence: 0.9,
              reason: 'Clearly a job offer',
            }),
          },
        },
      ],
    });

    // Mock successful extraction
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              company: 'Tech Corp',
              role: 'Senior Engineer',
              status: 'offer',
            }),
          },
        },
      ],
    });

    const email = {
      id: '123',
      threadId: '456',
      from: 'recruiter@techcorp.com',
      subject: 'Job Offer',
      date: '2023-01-01',
      body: 'We are pleased to offer you the position.',
    };

    const result = await processEmail(mockSupabase, email);

    expect(result.classification.isJobRelated).toBe(true);
    expect(result.jobInfo).not.toBeNull();
    expect(result.jobInfo?.company).toBe('Tech Corp');
    expect(result.jobInfo?.status).toBe('offer');
    expect(mockChatCreate).toHaveBeenCalledTimes(2);
  });

  it('should skip extraction for non-job emails', async () => {
    // Mock non-job classification
    mockChatCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isJobRelated: false,
              confidence: 0.1,
              reason: 'Spam',
            }),
          },
        },
      ],
    });

    const email = {
      id: '999',
      threadId: '888',
      from: 'newsletter@spam.com',
      subject: 'Weekly Digest',
      date: '2023-01-01',
      body: 'Here are the top stories...',
    };

    const result = await processEmail(mockSupabase, email);

    expect(result.classification.isJobRelated).toBe(false);
    expect(result.jobInfo).toBeNull();
    expect(mockChatCreate).toHaveBeenCalledTimes(1); // Only classification, no extraction
  });
});
