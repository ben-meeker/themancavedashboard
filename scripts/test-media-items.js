#!/usr/bin/env node

/**
 * Test fetching media items directly (without album)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMediaItems() {
  console.log('📸 Testing direct media items access...\n');
  
  try {
    const tokenPath = path.join(__dirname, '..', 'token.json');
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    // Try to get media items without specifying an album
    console.log('Attempting to fetch recent photos...');
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.token}`,
      },
    });

    console.log('Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed:');
      console.error(errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Success!');
    console.log(`Found ${data.mediaItems?.length || 0} recent photos\n`);

    if (data.mediaItems && data.mediaItems.length > 0) {
      console.log('First few photos:');
      data.mediaItems.slice(0, 5).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.filename}`);
        console.log(`     ID: ${item.id}`);
        console.log(`     URL: ${item.productUrl?.substring(0, 50)}...`);
      });
      
      console.log('\n✅ Good news! We can access your photos directly.');
      console.log('💡 We can update the app to show recent photos instead of album-specific ones.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMediaItems();

