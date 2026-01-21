import { describe, expect, it } from 'vitest';
import request from 'supertest';

const { default: app } = await import('../app.js');

describe('GET /api/health', () => {
  it('returns ok status payload', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.environment).toBeDefined();
  });
});
