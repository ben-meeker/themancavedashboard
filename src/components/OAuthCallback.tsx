import React, { useEffect, useState } from 'react';
import './OAuthCallback.css';

const OAuthCallback: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [exchanging, setExchanging] = useState(false);
  const [newToken, setNewToken] = useState<string>('');

  useEffect(() => {
    // Get authorization code from URL
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get('code');
    const authError = params.get('error');

    if (authError) {
      setError(`Authorization failed: ${authError}`);
    } else if (authCode) {
      setCode(authCode);
    }
  }, []);

  const handleExchange = async () => {
    setExchanging(true);
    setError('');

    try {
      // Get client credentials from environment variables
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Missing VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_CLIENT_SECRET in .env');
      }

      // Exchange code for tokens
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: `${window.location.origin}/oauth/callback`,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
      }

      const data = await response.json();

      // Create updated token.json content
      const updatedToken = {
        token: data.access_token,
        refresh_token: data.refresh_token || '',
        client_id: clientId,
        client_secret: clientSecret,
        token_uri: 'https://oauth2.googleapis.com/token',
        scopes: data.scope.split(' '),
        expiry: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      };

      setNewToken(JSON.stringify(updatedToken, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setExchanging(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newToken);
    alert('Token copied to clipboard!');
  };

  if (error) {
    return (
      <div className="oauth-callback">
        <div className="callback-card error">
          <div className="callback-icon">❌</div>
          <h1>Authorization Failed</h1>
          <p>{error}</p>
          <button onClick={() => window.close()}>Close Window</button>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="oauth-callback">
        <div className="callback-card">
          <div className="callback-icon">⏳</div>
          <h1>Processing...</h1>
          <p>Waiting for authorization code...</p>
        </div>
      </div>
    );
  }

  if (newToken) {
    return (
      <div className="oauth-callback">
        <div className="callback-card success">
          <div className="callback-icon">✅</div>
          <h1>Authorization Successful!</h1>
          <p>Copy the token below and replace your <code>token.json</code> file:</p>
          
          <div className="token-container">
            <pre className="token-content">{newToken}</pre>
            <button className="copy-button" onClick={copyToClipboard}>
              📋 Copy to Clipboard
            </button>
          </div>

          <div className="instructions">
            <h3>Next Steps:</h3>
            <ol>
              <li>Copy the token above (or click the button)</li>
              <li>Replace the contents of <code>token.json</code> in your project root</li>
              <li>Refresh your dashboard</li>
              <li>You can close this window</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="oauth-callback">
      <div className="callback-card">
        <div className="callback-icon">🔐</div>
        <h1>Authorization Code Received</h1>
        <p>Click the button below to exchange it for access tokens:</p>
        
        <div className="code-display">
          <code>{code.substring(0, 20)}...</code>
        </div>

        <button 
          className="exchange-button" 
          onClick={handleExchange}
          disabled={exchanging}
        >
          {exchanging ? 'Exchanging...' : 'Exchange for Token'}
        </button>

        <p className="help-text">
          This will generate a new token.json for you to copy.
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;

