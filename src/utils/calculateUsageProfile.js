/**
 * Usage Profile Engine (Pure JavaScript)
 * Models real energy consumption based on Benin usage habits, intermittence, 
 * and estimated power cuts.
 * 
 * @param {Object} formData User inputs from the form
 * @param {Object} lightingResult Results from the calculateLighting function (N, E_real, S, CU, MF)
 * @param {Object} climateResult Results from the calculateClimateAdjustment function
 * @returns {Object} Real consumption profile, costs (FCFA), savings and hourly timeline
 */
export function calculateUsageProfile(formData, lightingResult, climateResult) {
  try {
    // Safely extract inputs
    const buildingType = formData?.occupation?.buildingType || '';
    const hoursPerDay = parseFloat(formData?.occupation?.hoursPerDay) || 0;
    const daysPerWeek = parseFloat(formData?.occupation?.daysPerWeek) || 0;
    const occupants = parseFloat(formData?.occupation?.occupants) || 1;
    
    const powerPerUnit = parseFloat(formData?.luminaire?.powerPerUnit) || 0;
    const zone = formData?.location?.zone || '';

    const N = lightingResult?.N || 0;
    const N_adjusted = climateResult?.adjusted?.N_adjusted ?? N; // Fallback to N if missing

    // STEP 1 — Intermittence factor by building type
    let intermittence = 0.85; // Default for Autre
    if (buildingType === 'École/Salle de classe' || buildingType === 'Scolaire') {
      intermittence = 0.90;
    } else if (buildingType === 'Bureau/Administration') {
      intermittence = 0.85;
    } else if (buildingType === 'Logement résidentiel') {
      intermittence = 0.70;
    }

    // STEP 2 — Power cut rate by zone
    let cutHours = 2; // Default
    if (zone.includes("Sud") || zone.includes("Cotonou") || zone.includes("Porto-Novo")) {
      cutHours = 2;
    } else if (zone.includes("Centre") || zone.includes("Bohicon") || zone.includes("Abomey")) {
      cutHours = 3;
    } else if (zone.includes("Nord") || zone.includes("Parakou") || zone.includes("Natitingou")) {
      cutHours = 4;
    }

    // STEP 3 — Real usage hours
    // cutRate = cutHours / 24
    // H_real = hoursPerDay × intermittence × (1 - cutRate)
    const cutRate = cutHours / 24;
    let H_real = hoursPerDay * intermittence * (1 - cutRate);
    if (H_real < 0) H_real = 0; // never negative

    // STEP 4 — Simultaneity factor
    // simultaneity = 0.80 (fixed, Benin context)
    const simultaneity = 0.80;

    // STEP 5 — Real daily consumption
    // C_day = (N_adjusted × powerPerUnit × H_real × simultaneity) / 1000 (kWh/day)
    let C_day = 0;
    if (N_adjusted > 0 && powerPerUnit > 0 && H_real > 0) {
      C_day = (N_adjusted * powerPerUnit * H_real * simultaneity) / 1000;
    }

    // STEP 6 — Periodic consumption
    // C_week   = C_day × daysPerWeek
    // C_month  = C_day × (daysPerWeek × 4.33)
    // C_year   = C_day × (daysPerWeek × 52)
    const C_week = C_day * daysPerWeek;
    const C_month = C_day * (daysPerWeek * 4.33);
    const C_year = C_day * (daysPerWeek * 52);

    // STEP 7 — Energy cost (SBEE tariff)
    // tarifKwh = 98 (FCFA/kWh, normal tariff)
    const tarifKwh = 98;
    const cost_day = C_day * tarifKwh;
    const cost_month = C_month * tarifKwh;
    const cost_year = C_year * tarifKwh;

    // STEP 8 — Savings vs no optimization
    // C_day_noOptim = (N × powerPerUnit × hoursPerDay) / 1000
    // cost_year_noOptim = C_day_noOptim × daysPerWeek × 52 × tarifKwh
    let C_day_noOptim = 0;
    if (N > 0 && powerPerUnit > 0 && hoursPerDay > 0) {
      C_day_noOptim = (N * powerPerUnit * hoursPerDay) / 1000;
    }
    const cost_year_noOptim = C_day_noOptim * daysPerWeek * 52 * tarifKwh;
    
    // annualSavings = cost_year_noOptim - cost_year
    const annualSavings = cost_year_noOptim - cost_year;
    
    // Calculate savings percentage
    let savingsPercent = 0;
    if (cost_year_noOptim > 0) {
      savingsPercent = (annualSavings / cost_year_noOptim) * 100;
    }

    // STEP 9 — Usage profile timeline
    // Generate array of 24 hourly slots
    // Assume start at 7h for école, 8h for bureau/admin, 18h for logement
    let startHour = 8; // Default Bureau
    if (buildingType === 'École/Salle de classe' || buildingType === 'Scolaire') {
      startHour = 7;
    } else if (buildingType === 'Logement résidentiel') {
      startHour = 18;
    }
    
    const endHour = (startHour + Math.round(hoursPerDay)) % 24;
    const timeline = [];
    
    for (let hour = 0; hour < 24; hour++) {
      let active = false;
      
      // Handle wrap-around midnight cases (e.g., 18h to 2h)
      if (startHour < endHour) {
        active = (hour >= startHour && hour < endHour);
      } else if (startHour > endHour) {
        active = (hour >= startHour || hour < endHour);
      } else if (hoursPerDay >= 24) {
        active = true;
      }
      
      timeline.push({
        hour: hour,
        active: active
      });
    }

    // RETURN this object
    return {
      usageFactors: {
        intermittence: Math.round(intermittence * 100) / 100,
        cutHours: cutHours,
        cutRate: Math.round(cutRate * 1000) / 1000,
        simultaneity: simultaneity,
        H_real: Math.round(H_real * 10) / 10
      },
      consumption: {
        daily: Math.round(C_day * 100) / 100,
        weekly: Math.round(C_week * 100) / 100,
        monthly: Math.round(C_month * 100) / 100,
        annual: Math.round(C_year * 100) / 100
      },
      cost: {
        tarifKwh: tarifKwh,
        daily: Math.round(cost_day),
        monthly: Math.round(cost_month),
        annual: Math.round(cost_year)
      },
      savings: {
        C_day_noOptim: Math.round(C_day_noOptim * 100) / 100,
        annualSavings: Math.round(annualSavings),
        savingsPercent: Math.round(savingsPercent * 10) / 10
      },
      timeline: timeline
    };

  } catch (error) {
    console.error("Usage profile calculation failed:", error);
    // Safe fallback
    return {
      usageFactors: { intermittence: 0.85, cutHours: 2, cutRate: 0.08, simultaneity: 0.80, H_real: 0 },
      consumption: { daily: 0, weekly: 0, monthly: 0, annual: 0 },
      cost: { tarifKwh: 98, daily: 0, monthly: 0, annual: 0 },
      savings: { C_day_noOptim: 0, annualSavings: 0, savingsPercent: 0 },
      timeline: Array.from({ length: 24 }, (_, i) => ({ hour: i, active: false }))
    };
  }
}
