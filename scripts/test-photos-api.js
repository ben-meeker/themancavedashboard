#!/usr/bin/env node

/**
 * Test Google Photos API access
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPhotosAPI() {
  console.log('🧪 Testing Google Photos API access...\n');
  
  try {
    // Load token
    const tokenPath = path.join(__dirname, '..', 'token.json');
    if (!fs.existsSync(tokenPath)) {
      console.error('❌ token.json not found');
      process.exit(1);
    }

    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    console.log('✅ Token loaded');
    console.log('📋 Scopes:', tokenData.scopes);
    console.log('🔑 Token (first 30 chars):', tokenData.token?.substring(0, 30) + '...\n');

    // Test 1: List albums (this should work if API access is correct)
    console.log('📸 Test 1: Listing albums...');
    const albumsResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${tokenData.token}`,
      },
    });

    console.log('Status:', albumsResponse.status, albumsResponse.statusText);
    
    if (!albumsResponse.ok) {
      const errorText = await albumsResponse.text();
      console.error('❌ Albums API failed:');
      console.error(errorText);
      
      if (albumsResponse.status === 403) {
        console.error('\n💡 403 Forbidden - Possible causes:');
        console.error('   1. Photos Library API not enabled in Google Cloud Console');
        console.error('   2. Scope not properly configured in OAuth Consent Screen');
        console.error('   3. Token was issued before scope was added to consent screen');
        console.error('   4. Wrong Google Cloud project');
      }
      
      return;
    }

    const albumsData = await albumsResponse.json();
    console.log('✅ Albums API works!');
    console.log(`Found ${albumsData.albums?.length || 0} albums\n`);

    if (albumsData.albums && albumsData.albums.length > 0) {
      console.log('First few albums:');
      albumsData.albums.slice(0, 3).forEach((album, i) => {
        console.log(`  ${i + 1}. ${album.title} (${album.id})`);
      });
    }

    // Test 2: Try to search for media items in a specific album
    const testAlbumId = process.env.VITE_GOOGLE_PHOTOS_ALBUM_ID || 'AF1QipNX4MzTodbommd3OK1PzVuqQ6ucILPV3Fl5L-w6Lo4ID5n6Xc2aQcdGOw0e8H_DBA';
    console.log(`\n📸 Test 2: Searching media items in album: ${testAlbumId.substring(0, 30)}...`);
    
    const searchResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        albumId: testAlbumId,
        pageSize: 10,
      }),
    });

    console.log('Status:', searchResponse.status, searchResponse.statusText);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ Search API failed:');
      console.error(errorText);
      
      if (searchResponse.status === 403) {
        console.error('\n💡 If albums API worked but this failed:');
        console.error('   - The album ID might be invalid or from a different account');
        console.error('   - Try using an album ID from the list above');
      }
    } else {
      const searchData = await searchResponse.json();
      console.log('✅ Search API works!');
      console.log(`Found ${searchData.mediaItems?.length || 0} photos in album`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testPhotosAPI();

