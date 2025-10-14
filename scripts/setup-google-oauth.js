#!/usr/bin/env node

/**
 * Google Calendar OAuth2 Setup Script
 * 
 * This script helps you generate a refresh token for Google Calendar API access.
 * Run: node scripts/setup-google-oauth.js
 */

import { createInterface } from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => readline.question(query, resolve));

async function main() {
  console.log('\n🔐 Google Calendar OAuth2 Setup\n');
  console.log('This script will help you generate OAuth2 credentials for Google Calendar.\n');

  // Get credentials
  console.log('Step 1: Enter your OAuth2 credentials from Google Cloud Console');
  const clientId = await question('Client ID: ');
  const clientSecret = await question('Client Secret: ');

  // Generate auth URL
  const redirectUri = 'http://localhost:3000';
  const scope = 'https://www.googleapis.com/auth/calendar.readonly';
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  console.log('\n\nStep 2: Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n');

  // Try to open the URL automatically
  try {
    if (process.platform === 'darwin') {
      await execAsync(`open "${authUrl}"`);
    } else if (process.platform === 'win32') {
      await execAsync(`start "${authUrl}"`);
    } else {
      await execAsync(`xdg-open "${authUrl}"`);
    }
    console.log('✓ Browser opened automatically\n');
  } catch (error) {
    console.log('⚠ Could not open browser automatically. Please copy the URL above.\n');
  }

  // Get authorization code
  console.log('After authorizing, you will be redirected to localhost.');
  console.log('Copy the "code" parameter from the URL.\n');
  const authCode = await question('Enter the authorization code: ');

  // Exchange code for tokens
  console.log('\nExchanging code for tokens...');
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: authCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokens = await tokenResponse.json();

    console.log('\n✅ Success! Add these to your .env file:\n');
    console.log('VITE_GOOGLE_CLIENT_ID=' + clientId);
    console.log('VITE_GOOGLE_CLIENT_SECRET=' + clientSecret);
    console.log('VITE_GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('VITE_GOOGLE_CALENDAR_ID=primary  # or your specific calendar ID\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nPlease try again or check your credentials.\n');
  }

  readline.close();
}

main().catch(console.error);

