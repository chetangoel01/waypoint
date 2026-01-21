import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from 'pg';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '../.env') });

const dbUrl = process.env.DATABASE_URL;
const describeDb = dbUrl ? describe : describe.skip;

const tables = [
  'applications',
  'document_versions',
  'documents',
  'education',
  'oauth_tokens',
  'processed_emails',
  'profile',
  'projects',
  'settings',
  'skills',
  'stories',
  'work_experience',
];

const expectedDocumentTypes = [
  'cover_letter',
  'custom_question',
  'resume_points',
  'interview_prep',
];

describeDb('database schema', () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({ connectionString: dbUrl });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it('includes user_id columns on all multi-user tables', async () => {
    const { rows } = await client.query<{ table_name: string }>(
      `
        select table_name
        from information_schema.columns
        where table_schema = 'public'
          and column_name = 'user_id'
          and table_name = any($1::text[])
      `,
      [tables]
    );

    const tablesWithUserId = new Set(rows.map((row: { table_name: string }) => row.table_name));
    const missing = tables.filter((table) => !tablesWithUserId.has(table));

    expect(missing).toEqual([]);
  });

  it('uses (user_id, key) as the settings primary key', async () => {
    const { rows } = await client.query<{ attname: string }>(
      `
        select a.attname
        from pg_index i
        join pg_class c on c.oid = i.indrelid
        join pg_attribute a on a.attrelid = c.oid and a.attnum = any(i.indkey)
        where c.relname = 'settings' and i.indisprimary = true
      `
    );

    const pkColumns = rows.map((row: { attname: string }) => row.attname).sort();
    expect(pkColumns).toEqual(['key', 'user_id']);
  });

  it('enforces per-user uniqueness for processed_emails', async () => {
    const { rows } = await client.query<{ indexdef: string }>(
      `
        select indexdef
        from pg_indexes
        where schemaname = 'public'
          and tablename = 'processed_emails'
      `
    );

    const hasCompositeUnique = rows.some((row: { indexdef: string }) => {
      const indexDef = row.indexdef.toLowerCase();
      return indexDef.includes('unique') && indexDef.includes('(user_id, email_id)');
    });

    expect(hasCompositeUnique).toBe(true);
  });

  it('enables row level security on all public tables', async () => {
    const { rows } = await client.query<{ relname: string; relrowsecurity: boolean }>(
      `
        select c.relname, c.relrowsecurity
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relkind = 'r'
          and c.relname = any($1::text[])
      `,
      [tables]
    );

    const rlsByTable = new Map(
      rows.map((row: { relname: string; relrowsecurity: boolean }) => [row.relname, row.relrowsecurity])
    );
    const missing = tables.filter((table) => !rlsByTable.get(table));

    expect(missing).toEqual([]);
  });

  it('enforces auth.uid() ownership policies on all tables', async () => {
    const { rows } = await client.query<{
      tablename: string;
      cmd: string;
      qual: string | null;
      with_check: string | null;
    }>(
      `
        select tablename, cmd, qual, with_check
        from pg_policies
        where schemaname = 'public'
          and tablename = any($1::text[])
      `,
      [tables]
    );

    const policiesByTable = new Map<string, typeof rows>();
    for (const row of rows) {
      const existing = policiesByTable.get(row.tablename) ?? [];
      existing.push(row);
      policiesByTable.set(row.tablename, existing);
    }

    const requiredCommands = ['select', 'insert', 'update', 'delete'];
    const failures: string[] = [];

    for (const table of tables) {
      const policies = policiesByTable.get(table) ?? [];
      const normalized = policies.map((policy: { cmd: string; qual: string | null; with_check: string | null }) => ({
        cmd: policy.cmd.toLowerCase(),
        rule: `${policy.qual ?? ''} ${policy.with_check ?? ''}`.trim(),
      }));

      for (const command of requiredCommands) {
        const hasPolicy = normalized.some((policy: { cmd: string; rule: string }) => {
          if (policy.cmd !== command && policy.cmd !== 'all') return false;
          return policy.rule.includes('auth.uid() = user_id');
        });

        if (!hasPolicy) {
          failures.push(`${table}:${command}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('keeps the documents type constraint aligned with supported types', async () => {
    const { rows } = await client.query<{ def: string }>(
      `
        select pg_get_constraintdef(oid) as def
        from pg_constraint
        where conrelid = 'public.documents'::regclass
          and contype = 'c'
      `
    );

    const constraint = rows.map((row: { def: string }) => row.def).join(' ');
    for (const docType of expectedDocumentTypes) {
      expect(constraint.includes(`'${docType}'`)).toBe(true);
    }
  });
});
