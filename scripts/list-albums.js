#!/usr/bin/env node

/**
 * Helper script to list all Google Photos albums and their IDs
 * Run with: node scripts/list-albums.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getAccessToken() {
  const tokenPath = path.join(__dirname, '..', 'token.json');
  
  if (!fs.existsSync(tokenPath)) {
    console.error('❌ token.json not found. Please authorize first.');
    process.exit(1);
  }

  const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  
  // Check if token has Photos scope
  const hasPhotosScope = tokenData.scopes?.includes('https://www.googleapis.com/auth/photoslibrary.readonly') ||
                         tokenData.scopes?.includes('https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata');
  
  if (!hasPhotosScope) {
    console.error('❌ Token does not have Photos scope. Please re-authorize with Photos access.');
    process.exit(1);
  }

  // Check if token is expired
  if (tokenData.expiry) {
    const expiryTime = new Date(tokenData.expiry).getTime();
    if (Date.now() >= expiryTime - 5 * 60 * 1000) {
      console.log('🔄 Token expired or expiring soon, refreshing...');
      return await refreshAccessToken(tokenData);
    }
  }

  return tokenData.token;
}

async function refreshAccessToken(tokenData) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: tokenData.client_id,
      client_secret: tokenData.client_secret,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Update token.json with new access token
  tokenData.token = data.access_token;
  tokenData.expiry = new Date(Date.now() + data.expires_in * 1000).toISOString();
  
  const tokenPath = path.join(__dirname, '..', 'token.json');
  fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));
  
  console.log('✅ Token refreshed successfully\n');
  
  return data.access_token;
}

async function listAlbums() {
  console.log('📸 Fetching your Google Photos albums...\n');
  
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch albums:');
      console.error(`Status: ${response.status}`);
      console.error(`Response: ${errorText}`);
      
      if (response.status === 403) {
        console.error('\n💡 This usually means:');
        console.error('   1. The Photos Library API is not enabled in your Google Cloud project');
        console.error('   2. The photoslibrary.readonly scope is not configured in your OAuth Consent Screen');
        console.error('   3. You need to re-authorize after adding the scope');
      }
      
      process.exit(1);
    }

    const data = await response.json();

    if (!data.albums || data.albums.length === 0) {
      console.log('📭 No albums found in your Google Photos library.');
      return;
    }

    console.log(`✅ Found ${data.albums.length} album(s):\n`);
    console.log('─'.repeat(80));

    data.albums.forEach((album, index) => {
      console.log(`\n${index + 1}. ${album.title || 'Untitled Album'}`);
      console.log(`   ID: ${album.id}`);
      console.log(`   Items: ${album.mediaItemsCount || 0}`);
      console.log(`   URL: ${album.productUrl || 'N/A'}`);
      
      if (album.isWriteable !== undefined) {
        console.log(`   Owned by you: ${album.isWriteable ? 'Yes' : 'No (shared)'}`);
      }
    });

    console.log('\n' + '─'.repeat(80));
    console.log('\n💡 Copy the ID of the album you want to use and add it to your .env file:');
    console.log('   VITE_GOOGLE_PHOTOS_ALBUM_ID=<album-id-here>\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
listAlbums();

