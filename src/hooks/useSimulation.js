import { useMemo } from 'react';
import { calculateLighting } from '../utils/calculateLighting';
import { calculateUniformity } from '../utils/calculateUniformity';
import { calculateClimateAdjustment } from '../utils/calculateClimateAdjustment';
import { calculateUsageProfile } from '../utils/calculateUsageProfile';
import { calculateBudget } from '../utils/calculateBudget';

/**
 * useSimulation Hook
 * Centralizes the entire calculation pipeline to ensure consistency across the app.
 *
 * @param {Object} formData The global form data object
 * @returns {Object} All computed results (lighting, uniformity, climate, usage, budget)
 */
export function useSimulation(formData) {
  return useMemo(() => {
    if (!formData) return null;

    try {
      // 1. Photometric calculation (Base)
      const lighting = calculateLighting(formData);
      
      // 2. Uniformity and layout (Depends on lighting)
      const uniformity = calculateUniformity(formData, lighting);
      
      // 3. Climate adjustment (Depends on lighting + potentially cached solarData)
      const solarData = formData.results?.solarData || null;
      const climate = calculateClimateAdjustment(formData, lighting, solarData);
      
      // 4. Usage profile and real consumption (Depends on lighting + climate)
      const usage = calculateUsageProfile(formData, lighting, climate);
      
      // 5. Budget and financial analysis (Depends on lighting + formData inputs)
      const budget = calculateBudget(formData, lighting);

      return {
        lighting,
        uniformity,
        climate,
        usage,
        budget,
        // Combined natural light info for 3D/2D views
        naturalLight: climate.naturalLight || { solar: {}, hourlyProfile: {}, summary: {} },
        // Metadata
        timestamp: Date.now()
      };
    } catch (error) {
      console.error("Simulation pipeline failed:", error);
      return null;
    }
  }, [formData]);
}
