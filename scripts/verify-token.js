#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

// Read token.json
const tokenData = JSON.parse(fs.readFileSync('./token.json', 'utf8'));

console.log('🔍 Verifying Google OAuth Token...\n');

// Verify the token with Google
const options = {
  hostname: 'oauth2.googleapis.com',
  path: `/tokeninfo?access_token=${tokenData.token}`,
  method: 'GET',
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const tokenInfo = JSON.parse(data);
      
      if (tokenInfo.error) {
        console.error('❌ Token Error:', tokenInfo.error_description);
        console.log('\n💡 Your token may be expired. Try re-authorizing.\n');
        return;
      }

      console.log('✅ Token is valid!\n');
      console.log('📋 Token Info:');
      console.log('   Client ID:', tokenInfo.azp);
      console.log('   Expires in:', tokenInfo.expires_in, 'seconds');
      console.log('\n📦 Authorized Scopes:');
      
      if (tokenInfo.scope) {
        const scopes = tokenInfo.scope.split(' ');
        scopes.forEach(scope => {
          const isCalendar = scope.includes('calendar');
          const isPhotos = scope.includes('photoslibrary');
          const icon = (isCalendar || isPhotos) ? '✅' : '  ';
          console.log(`   ${icon} ${scope}`);
        });

        const hasCalendar = scopes.some(s => s.includes('calendar'));
        const hasPhotos = scopes.some(s => s.includes('photoslibrary'));

        console.log('\n🎯 Required Scopes:');
        console.log(`   ${hasCalendar ? '✅' : '❌'} Calendar API`);
        console.log(`   ${hasPhotos ? '✅' : '❌'} Photos Library API`);

        if (!hasPhotos) {
          console.log('\n⚠️  PROBLEM FOUND:');
          console.log('   Your token does NOT have Google Photos access!');
          console.log('\n💡 Solution:');
          console.log('   1. Delete token.json');
          console.log('   2. Make sure Photos Library API is enabled in Google Cloud');
          console.log('   3. Re-authorize through the dashboard');
        }
      }
    } catch (error) {
      console.error('❌ Failed to parse token info:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();

