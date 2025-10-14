import React, { useState, useEffect } from 'react';
import './AuthPrompt.css';

const AuthPrompt: React.FC = () => {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [authUrl, setAuthUrl] = useState<string>('');

  useEffect(() => {
    checkScopes();
  }, []);

  const checkScopes = async () => {
    try {
      console.log('Checking Google Calendar authorization...');
      
      // Check token status from backend API
      const response = await fetch('/api/google/token-status');
      
      if (!response.ok) {
        console.log('Token not found or invalid, needs auth');
        setNeedsAuth(true);
        generateAuthUrlFromEnv();
        return;
      }

      const data = await response.json();
      
      if (!data.valid) {
        console.log('Token invalid, needs re-auth');
        setNeedsAuth(true);
        generateAuthUrlFromEnv();
      } else {
        console.log('Token valid, no auth needed');
      }
    } catch (error) {
      console.error('Error checking token status:', error);
      setNeedsAuth(true);
      generateAuthUrlFromEnv();
    }
  };

  const generateAuthUrlFromEnv = async () => {
    // Try to get client ID from backend first (credentials.json)
    let clientId = '';
    
    try {
      const response = await fetch('/api/google/client-id');
      if (response.ok) {
        const data = await response.json();
        clientId = data.client_id;
        console.log('Got client ID from backend (credentials.json):', clientId);
      }
    } catch (error) {
      console.log('Could not fetch client ID from backend, trying env vars:', error);
    }

    // Fallback to environment variable
    if (!clientId) {
      clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      console.log('Using client ID from env vars:', clientId);
    }
    
    if (!clientId) {
      console.error('Google client ID not found in backend or environment variables!');
      console.error('Please provide credentials.json or set VITE_GOOGLE_CLIENT_ID');
      return;
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly'
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/oauth/callback`,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('Generated auth URL:', url);
    setAuthUrl(url);
  };

  const handleAuthorize = () => {
    console.log('Authorize clicked, authUrl:', authUrl);
    
    if (!authUrl) {
      alert('Auth URL not ready. Please check console and .env configuration.');
      console.error('Missing authUrl. Check VITE_GOOGLE_CLIENT_ID in .env');
      return;
    }
    
    // Open OAuth in a popup window
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      authUrl,
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      alert('Popup blocked! Please allow popups for this site and try again.\n\nOr copy this URL and open it manually:\n\n' + authUrl);
      console.log('Auth URL:', authUrl);
    } else {
      console.log('Popup opened successfully');
    }
  };

  const handleDismiss = () => {
    setNeedsAuth(false);
  };

  if (!needsAuth) {
    return null;
  }

  return (
    <div className="auth-prompt-overlay">
      <div className="auth-prompt-modal">
        <div className="auth-prompt-header">
          <span className="auth-icon">🔐</span>
          <h2>Additional Authorization Required</h2>
        </div>
        
        <div className="auth-prompt-body">
          <p>
            The dashboard needs permission to access your Google Calendar.
          </p>
          <ul>
            <li>📅 Google Calendar (read-only access)</li>
          </ul>
          <p className="auth-note">
            After authorizing, you'll receive an authorization code. Follow the instructions
            to update your <code>token.json</code> file.
          </p>
        </div>

        <div className="auth-prompt-actions">
          <button className="auth-button primary" onClick={handleAuthorize}>
            Authorize Google Calendar
          </button>
          <button className="auth-button secondary" onClick={handleDismiss}>
            Dismiss
          </button>
        </div>

        <div className="auth-instructions">
          <h3>After Authorization:</h3>
          <ol>
            <li>You'll receive an authorization code</li>
            <li>Use the provided script or manual process to exchange it for a refresh token</li>
            <li>Update your <code>token.json</code> with the new token data</li>
            <li>Refresh the dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AuthPrompt;

