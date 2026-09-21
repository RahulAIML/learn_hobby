import { defineConfig } from 'vitest/config';
import path from 'path';
import fs from 'fs';

/** Minimal .env.local loader (no dotenv dependency) so tests that make a real Gemini call can read GEMINI_API_KEY. */
function loadDotEnvLocal(): Record<string, string> {
  const envPath = path.resolve(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const vars: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) vars[match[1]] = match[2].trim();
  }
  return vars;
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 20000,
    env: {
      ...loadDotEnvLocal(),
      SESSION_SECRET: 'test-session-secret-do-not-use-in-production',
      USE_MOCK_ASSESSMENT_EVALUATION: 'true',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
