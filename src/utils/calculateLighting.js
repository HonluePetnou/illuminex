/**
 * Lighting Calculation Engine (Pure JavaScript)
 * Calculates photometric properties and energy consumption based on user input.
 * 
 * @param {Object} formData The parsed JSON object from the multi-step form
 * @returns {Object} Calculation results
 */
export function calculateLighting(formData) {
  try {
    // Safely extract input data with fallbacks to avoid NaN
    const length = parseFloat(formData?.room?.length) || 0;
    const width = parseFloat(formData?.room?.width) || 0;
    const ceilingHeight = parseFloat(formData?.room?.ceilingHeight) || 0;
    const workPlaneHeight = parseFloat(formData?.room?.workPlaneHeight) || 0;
    
    const buildingType = formData?.occupation?.buildingType || '';
    const hoursPerDay = parseFloat(formData?.occupation?.hoursPerDay) || 0;
    const daysPerWeek = parseFloat(formData?.occupation?.daysPerWeek) || 0;
    
    const fluxPerUnit = parseFloat(formData?.luminaire?.fluxPerUnit) || 0;
    const powerPerUnit = parseFloat(formData?.luminaire?.powerPerUnit) || 0;

    // STEP 1 — Room surface & index
    // S = length × width
    const surface = length * width;
    
    // Hm = ceilingHeight - workPlaneHeight
    const hm = ceilingHeight - workPlaneHeight;
    
    // RI = (length × width) / (Hm × (length + width))
    // Prevent division by zero
    let roomIndex = 0;
    if (hm > 0 && (length + width) > 0) {
      roomIndex = surface / (hm * (length + width));
    }

    // STEP 2 — Get reference illuminance (E) by building type
    let eRequired = 200; // Default for "Autre"
    if (buildingType === 'Logement résidentiel') {
      eRequired = 150;
    } else if (buildingType === 'Bureau/Administration') {
      eRequired = 500;
    } else if (buildingType === 'École/Salle de classe' || buildingType === 'Scolaire') {
      eRequired = 300;
    }

    // STEP 3 — Get CU from RI
    let cu = 0.50;
    if (roomIndex > 3) {
      cu = 0.80;
    } else if (roomIndex >= 2) {
      cu = 0.70;
    } else if (roomIndex >= 1) {
      cu = 0.60;
    } else {
      cu = 0.50; // RI < 1
    }

    // STEP 4 — Set MF (maintenance factor)
    // Default MF = 0.70 (medium environment, Benin context)
    const mf = 0.70;

    // STEP 5 — Calculate number of luminaires
    // N_raw = (E × S) / (fluxPerUnit × CU × MF)
    let numberOfLuminaires = 0;
    if (fluxPerUnit > 0 && cu > 0 && mf > 0) {
      const nRaw = (eRequired * surface) / (fluxPerUnit * cu * mf);
      // N = Math.ceil(N_raw) → round up always
      numberOfLuminaires = Math.ceil(nRaw);
    }

    // STEP 6 — Calculate real illuminance
    // E_real = (fluxPerUnit × N × CU × MF) / S
    let realIlluminance = 0;
    if (surface > 0) {
      realIlluminance = (fluxPerUnit * numberOfLuminaires * cu * mf) / surface;
    }

    // STEP 7 — Uniformity
    // U0 = 0.7 × E_real (simplified estimate)
    const uniformity = 0.7 * realIlluminance;

    // STEP 8 — Energy
    // totalPower = N × powerPerUnit (W)
    const totalPowerW = numberOfLuminaires * powerPerUnit;
    
    // dailyConsumption = (totalPower × hoursPerDay) / 1000 (kWh/day)
    const kwhPerDay = (totalPowerW * hoursPerDay) / 1000;
    
    // weeklyConsumption = dailyConsumption × daysPerWeek (kWh/week)
    const kwhPerWeek = kwhPerDay * daysPerWeek;

    // RETURN this object
    return {
      S: surface,
      RI: roomIndex,
      CU: cu,
      MF: mf,
      E_required: eRequired,
      N: numberOfLuminaires,
      E_real: realIlluminance,
      U0: uniformity,
      totalPower: totalPowerW,
      dailyConsumption: kwhPerDay,
      weeklyConsumption: kwhPerWeek
    };

  } catch (error) {
    console.error("Lighting calculation failed:", error);
    // Return safe fallback in case of missing input architecture
    return {
      S: 0, RI: 0, CU: 0.5, MF: 0.7, E_required: 0, 
      N: 0, E_real: 0, U0: 0, totalPower: 0, 
      dailyConsumption: 0, weeklyConsumption: 0
    };
  }
}
