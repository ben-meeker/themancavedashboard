// Ecowitt API integration - calls backend

export interface SoilMoistureSensor {
  channel: string;
  name: string;
  moisture: number; // percentage 0-100
  battery: number; // 0-5 scale
  location?: string;
  min_moisture: number; // ideal minimum moisture
  max_moisture: number; // ideal maximum moisture
}

export interface IndoorSensor {
  temperature: number; // Fahrenheit
  humidity: number; // percentage
  pressure: number; // inHg
}

export interface EcowittDeviceData {
  sensors: SoilMoistureSensor[];
  indoor?: IndoorSensor;
  lastUpdate?: string;
}

/**
 * Fetch real-time device data from backend
 */
export async function fetchEcowittData(): Promise<EcowittDeviceData> {
  try {
    const response = await fetch('/api/ecowitt');
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      sensors: data.sensors || [],
      indoor: data.indoor,
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Ecowitt] Error fetching data:', error);
    return getPlaceholderData();
  }
}

function getPlaceholderData(): EcowittDeviceData {
  return {
    sensors: [],
    lastUpdate: new Date().toISOString(),
  };
}

/**
 * Check if Ecowitt is configured
 */
export function isEcowittConnected(): boolean {
  // We'll check this by attempting to fetch from the backend
  // For now, return true and let the API call handle connectivity
  return true;
}

/**
 * Get moisture status based on percentage
 */
export function getMoistureStatus(moisture: number): 'good' | 'medium' | 'low' | 'critical' {
  // Adjusted for Fiddle-Leaf Fig (ideal 30-40%)
  if (moisture >= 30 && moisture <= 50) return 'good';
  if (moisture >= 20 && moisture < 30) return 'medium';
  if (moisture >= 10 && moisture < 20) return 'low';
  return 'critical';
}

/**
 * Get battery status
 */
export function getBatteryStatus(battery: number): 'good' | 'low' {
  return battery >= 3 ? 'good' : 'low';
}

export type { SoilMoistureSensor as default };
