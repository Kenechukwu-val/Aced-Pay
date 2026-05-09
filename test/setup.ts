import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

beforeAll(() => {
  const dbPath = join(__dirname, '..', 'dev.db');
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
  execSync('npx prisma db push', { stdio: 'inherit' });
});
