import { useState, useEffect } from 'react';

export interface DevicePerformance {
  isMobile: boolean;
  isTablet: boolean;
  isLowEnd: boolean;
  maxDpr: number;
  enableWebGL: boolean;
}

export function useDevicePerformance(): DevicePerformance {
  const [perf, setPerf] = useState<DevicePerformance>({
    isMobile: false,
    isTablet: false,
    isLowEnd: false,
    maxDpr: 1.5,
    enableWebGL: true,
  });

  useEffect(() => {
    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const isLowEnd = hardwareConcurrency <= 2 || isMobile;

    // Check WebGL availability
    let enableWebGL = true;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) enableWebGL = false;
    } catch (e) {
      enableWebGL = false;
    }

    setPerf({
      isMobile,
      isTablet,
      isLowEnd,
      maxDpr: isMobile ? 1 : 1.5,
      enableWebGL,
    });
  }, []);

  return perf;
}
