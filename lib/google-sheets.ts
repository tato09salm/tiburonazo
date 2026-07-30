import path from 'path';
import fs from 'fs';

interface GoogleCredentials {
  clientEmail: string;
  privateKey: string;
  projectId?: string;
}

/**
 * Loads the Google Sheets credentials from either:
 * 1. Individual environment variables (GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY)
 * 2. The JSON credentials file at GOOGLE_SHEETS_CREDENTIALS_PATH or the default fallback path.
 */
export function getGoogleCredentials(): GoogleCredentials {
  // 1. Try loading from a stringified JSON environment variable
  if (process.env.GOOGLE_SHEETS_CREDENTIALS) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS);
      if (credentials.client_email && credentials.private_key) {
        return {
          clientEmail: credentials.client_email,
          privateKey: credentials.private_key.replace(/\\n/g, '\n'),
          projectId: credentials.project_id,
        };
      }
    } catch (error) {
      console.error('Error parsing GOOGLE_SHEETS_CREDENTIALS environment variable:', error);
    }
  }

  // 2. Try loading from individual environment variables
  if (process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
    return {
      clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      projectId: process.env.GOOGLE_SHEETS_PROJECT_ID,
    };
  }


  // 2. Try loading from the JSON credentials file
  const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || 'prisma/apysheet/tiburonazo-3583d43fdd7d.json';
  const absolutePath = path.resolve(process.cwd(), credentialsPath);

  if (fs.existsSync(absolutePath)) {
    try {
      const fileContent = fs.readFileSync(absolutePath, 'utf8');
      const credentials = JSON.parse(fileContent);
      
      if (!credentials.client_email || !credentials.private_key) {
        throw new Error('JSON credentials file is missing client_email or private_key.');
      }

      return {
        clientEmail: credentials.client_email,
        privateKey: credentials.private_key,
        projectId: credentials.project_id,
      };
    } catch (error) {
      console.error('Error parsing Google Sheets credentials JSON file:', error);
      throw error;
    }
  }

  throw new Error(
    `Google Sheets credentials not configured. Please define GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY in your .env file, or place the credentials JSON file at ${credentialsPath}`
  );
}
