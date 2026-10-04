import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} environment variable is required`,
    );
  }

  return value;
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      'PORT environment variable must be an integer between 1 and 65535',
    );
  }

  return port;
}

export const env = {
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  openaiApiKey: requireEnv('OPENAI_API_KEY'),
  corsOrigin:
    process.env['CORS_ORIGIN']?.trim() ??
    'http://localhost:3000',
  port: parsePort(process.env['PORT']),
};