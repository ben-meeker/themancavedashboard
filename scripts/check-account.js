#!/usr/bin/env node

/**
 * Check which Google account is authenticated
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkAccount() {
  console.log('👤 Checking authenticated Google account...\n');
  
  try {
    const tokenPath = path.join(__dirname, '..', 'token.json');
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    // Get user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.token}`,
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to get user info:', response.statusText);
      process.exit(1);
    }

    const userInfo = await response.json();
    
    console.log('✅ Authenticated as:');
    console.log(`   Name: ${userInfo.name}`);
    console.log(`   Email: ${userInfo.email}`);
    console.log(`   Google ID: ${userInfo.id}\n`);
    
    console.log('💡 Make sure this is the Google account that owns the photo album!');
    console.log('💡 The Photos API only shows albums YOU created (not auto-generated ones).\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAccount();

