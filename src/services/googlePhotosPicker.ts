/**
 * Google Photos Picker API integration
 * https://developers.google.com/photos/picker/guides
 */

export interface PickedPhoto {
  id: string;
  url: string;
  filename: string;
  pickedAt: string;
}

const STORAGE_KEY = 'google_photos_picked';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Load Google Picker API script
let pickerApiLoaded = false;
let pickerInited = false;

export function loadPickerApi(): Promise<void> {
  if (pickerApiLoaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      pickerApiLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export function initPicker(): Promise<void> {
  if (pickerInited) return Promise.resolve();

  return new Promise((resolve) => {
    (window as any).gapi.load('picker', () => {
      pickerInited = true;
      resolve();
    });
  });
}

export async function openPhotoPicker(accessToken: string): Promise<PickedPhoto[]> {
  await loadPickerApi();
  await initPicker();

  return new Promise((resolve, reject) => {
    try {
      // Create a photo view
      const view = new (window as any).google.picker.PhotosView();
      view.setType((window as any).google.picker.PhotosView.Type.FLAT);
      
      const picker = new (window as any).google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setAppId(CLIENT_ID)
        .setCallback((data: any) => {
          if (data.action === (window as any).google.picker.Action.PICKED) {
            const photos: PickedPhoto[] = data.docs.map((doc: any) => ({
              id: doc.id,
              url: doc.url || doc.thumbnails?.[0]?.url || '',
              filename: doc.name,
              pickedAt: new Date().toISOString(),
            }));
            
            console.log('Picked photos:', photos);
            
            // Save to localStorage
            savePickedPhotos(photos);
            resolve(photos);
          } else if (data.action === (window as any).google.picker.Action.CANCEL) {
            resolve([]);
          }
        })
        .build();

      picker.setVisible(true);
    } catch (error) {
      console.error('Error creating picker:', error);
      reject(error);
    }
  });
}

export function savePickedPhotos(photos: PickedPhoto[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

export function getPickedPhotos(): PickedPhoto[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function clearPickedPhotos(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasPickedPhotos(): boolean {
  return getPickedPhotos().length > 0;
}

