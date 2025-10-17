interface TeslaStatus {
  batteryLevel: number;
  chargingState: string;
  isCharging: boolean;
  estimatedRange: number;
  chargeLimit: number;
  timeToFullCharge: number;
}

export const fetchTeslaStatus = async () => {
  try {
    const response = await fetch('/api/tesla');

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const data: TeslaStatus = await response.json();

    return {
      chargeLevel: data.batteryLevel,
      isCharging: data.isCharging,
    };
  } catch (error) {
    console.error('Error fetching Tesla status:', error);
    throw error; // Throw error so config check fails properly
  }
};

