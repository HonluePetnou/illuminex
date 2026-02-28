import React, { useState, useEffect } from 'react';

export function UIController() {
  const [fps, setFps] = useState(60);
  const [objectCount, setObjectCount] = useState(2);
  const [coordinates, setCoordinates] = useState({ x: 0.0, y: 0.0, z: 0.0 });
  const [calculations, setCalculations] = useState({
    totalLuminosity: 850,
    averageIlluminance: 320,
    powerConsumption: 12.5
  });

  useEffect(() => {
    // FPS Counter
    let lastTime = performance.now();
    let frameCount = 0;
    
    const updateFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(updateFPS);
    };
    
    const fpsRequest = requestAnimationFrame(updateFPS);
    
    return () => cancelAnimationFrame(fpsRequest);
  }, []);

  useEffect(() => {
    // Update UI elements
    const fpsElement = document.getElementById('fps');
    const objectCountElement = document.getElementById('objectCount');
    const coordinatesElement = document.getElementById('coordinates');
    
    if (fpsElement) fpsElement.textContent = fps;
    if (objectCountElement) objectCountElement.textContent = objectCount;
    if (coordinatesElement) {
      coordinatesElement.textContent = `X: ${coordinates.x.toFixed(1)}, Y: ${coordinates.y.toFixed(1)}, Z: ${coordinates.z.toFixed(1)}`;
    }
    
    // Update calculation displays
    const calcElements = document.querySelectorAll('.calc-value');
    if (calcElements[0]) calcElements[0].textContent = `${calculations.totalLuminosity} lm`;
    if (calcElements[1]) calcElements[1].textContent = `${calculations.averageIlluminance} lux`;
    if (calcElements[2]) calcElements[2].textContent = `${calculations.powerConsumption} W`;
  }, [fps, objectCount, coordinates, calculations]);

  // Listen for coordinate updates from 3D scene
  useEffect(() => {
    const handleMouseMove = (event) => {
      // This would be connected to the 3D scene's raycasting
      // For now, we'll simulate coordinate updates
      setCoordinates({
        x: (Math.random() - 0.5) * 10,
        y: Math.random() * 5,
        z: (Math.random() - 0.5) * 10
      });
    };

    const canvas = document.getElementById('threejs-canvas');
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Listen for calculation updates
  useEffect(() => {
    const handleCalculationUpdate = (event) => {
      const { type, value } = event.detail;
      setCalculations(prev => ({
        ...prev,
        [type]: value
      }));
    };

    window.addEventListener('calculationUpdate', handleCalculationUpdate);
    return () => window.removeEventListener('calculationUpdate', handleCalculationUpdate);
  }, []);

  return null; // This component doesn't render anything, it just manages state
}

export function useUIController() {
  const updateCalculations = (intensity, distance, color) => {
    // Simple lighting calculations
    const luminosity = Math.round(intensity * 1000);
    const illuminance = Math.round((luminosity / (4 * Math.PI * distance * distance)) * 100);
    const power = Math.round(intensity * 12.5 * 10) / 10;

    window.dispatchEvent(new CustomEvent('calculationUpdate', {
      detail: {
        type: 'totalLuminosity',
        value: luminosity
      }
    }));

    window.dispatchEvent(new CustomEvent('calculationUpdate', {
      detail: {
        type: 'averageIlluminance',
        value: illuminance
      }
    }));

    window.dispatchEvent(new CustomEvent('calculationUpdate', {
      detail: {
        type: 'powerConsumption',
        value: power
      }
    }));
  };

  return { updateCalculations };
}
