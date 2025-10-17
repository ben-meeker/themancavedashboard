import { useState, useEffect } from 'react';

export interface WidgetConfig {
  name: string;
  requiredParams: string[];
  icon: string;
  message: string;
  hint: string;
}

export interface WidgetConfigStatus {
  isConfigured: boolean;
  missingParams: string[];
  config: WidgetConfig | null;
}

/**
 * Hook for managing widget configuration status
 * @param config - Widget configuration definition
 * @param checkConfig - Function to check if widget is properly configured
 * @returns Configuration status and missing parameters
 */
export const useWidgetConfig = (
  config: WidgetConfig,
  checkConfig: () => Promise<boolean>
): WidgetConfigStatus => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [missingParams, setMissingParams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        setIsLoading(true);
        const configured = await checkConfig();
        setIsConfigured(configured);
        
        if (!configured) {
          // For now, we'll assume all required params are missing if not configured
          // In the future, this could be more granular
          setMissingParams(config.requiredParams);
        } else {
          setMissingParams([]);
        }
      } catch (error) {
        console.error(`[${config.name}] Configuration check failed:`, error);
        setIsConfigured(false);
        setMissingParams(config.requiredParams);
      } finally {
        setIsLoading(false);
      }
    };

    checkConfiguration();
  }, [config, checkConfig]);

  return {
    isConfigured,
    missingParams,
    config: isLoading ? null : config
  };
};
