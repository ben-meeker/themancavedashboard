// Google Photos API service
export interface Photo {
  id: string;
  baseUrl: string;
  filename: string;
  mimeType: string;
}

interface TokenData {
  token?: string;
  refresh_token: string;
  client_id: string;
  client_secret: string;
  token_uri?: string;
  expiry?: string;
  scopes?: string[];
}

let tokenCache: TokenData | null = null;
let tokenCacheTime: number = 0;

// Load token from token.json file (shared with calendar)
async function loadToken(): Promise<TokenData | null> {
  if (tokenCache && Date.now() - tokenCacheTime < 5 * 60 * 1000) {
    return tokenCache;
  }

  try {
    const response = await fetch('/token.json');
    if (!response.ok) {
      console.warn('token.json not found.');
      return null;
    }
    
    const data = await response.json();
    tokenCache = data;
    tokenCacheTime = Date.now();
    return data;
  } catch (error) {
    console.warn('Could not load token.json:', error);
    return null;
  }
}

// OAuth2 token refresh
async function getAccessToken(): Promise<string | null> {
  const tokenData = await loadToken();
  
  if (!tokenData) {
    return null;
  }

  // Check if current token is still valid
  if (tokenData.token && tokenData.expiry) {
    const expiryTime = new Date(tokenData.expiry).getTime();
    if (Date.now() < expiryTime - 5 * 60 * 1000) {
      return tokenData.token;
    }
  }

  // Refresh the token
  try {
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
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return tokenData.token || null;
  }
}

export async function isPhotosConnected(): Promise<boolean> {
  const token = await loadToken();
  const albumId = import.meta.env.VITE_GOOGLE_PHOTOS_ALBUM_ID;
  const hasPhotosScope = token?.scopes?.some(scope => scope.includes('photoslibrary.readonly'));
  return token !== null && !!albumId && !!hasPhotosScope;
}

export const fetchPhotosFromAlbum = async (): Promise<Photo[]> => {
  const albumId = import.meta.env.VITE_GOOGLE_PHOTOS_ALBUM_ID;

  if (!albumId) {
    console.warn('VITE_GOOGLE_PHOTOS_ALBUM_ID not configured.');
    return getPlaceholderPhotos();
  }

  const accessToken = await getAccessToken();

  if (!accessToken) {
    console.warn('Google Photos OAuth credentials not configured.');
    return getPlaceholderPhotos();
  }

  try {
    console.log('Fetching photos from album:', albumId);
    console.log('Using access token:', accessToken?.substring(0, 20) + '...');
    
    // Search for media items in the album
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        albumId: albumId,
        pageSize: 50, // Get up to 50 photos
      }),
    });

    console.log('Photos API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Photos API error response:', errorText);
      throw new Error(`Google Photos API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.mediaItems || data.mediaItems.length === 0) {
      console.warn('No photos found in album');
      return getPlaceholderPhotos();
    }

    return data.mediaItems.map((item: any) => ({
      id: item.id,
      baseUrl: item.baseUrl,
      filename: item.filename,
      mimeType: item.mimeType,
    }));
  } catch (error) {
    console.error('Error fetching Google Photos:', error);
    return getPlaceholderPhotos();
  }
};

const getPlaceholderPhotos = (): Photo[] => {
  return [
    {
      id: '1',
      baseUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      filename: 'placeholder1.jpg',
      mimeType: 'image/jpeg',
    },
    {
      id: '2',
      baseUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
      filename: 'placeholder2.jpg',
      mimeType: 'image/jpeg',
    },
    {
      id: '3',
      baseUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
      filename: 'placeholder3.jpg',
      mimeType: 'image/jpeg',
    },
  ];
};

