/**
 * Climate Adjustment Engine (Pure JavaScript)
 * Adjusts lighting needs based on Benin's climate, season, and natural light.
 * 
 * @param {Object} formData User inputs from the form
 * @param {Object} lightingResult Results from the calculateLighting function (N, E_real, S, CU, MF)
 * @returns {Object} Climate adjustment and energy savings analysis
 */
export function calculateClimateAdjustment(formData, lightingResult) {
  try {
    // Safely extract inputs
    const buildingType = formData?.occupation?.buildingType || '';
    const hoursPerDay = parseFloat(formData?.occupation?.hoursPerDay) || 0;
    const daysPerWeek = parseFloat(formData?.occupation?.daysPerWeek) || 0;
    
    const fluxPerUnit = parseFloat(formData?.luminaire?.fluxPerUnit) || 0;
    const powerPerUnit = parseFloat(formData?.luminaire?.powerPerUnit) || 0;
    
    const hasWindows = formData?.naturalLight?.hasWindows === true;
    const orientation = formData?.naturalLight?.orientation || '';
    const windowArea = parseFloat(formData?.naturalLight?.windowArea) || 0;
    
    // Zone - User might have added this in formData somewhere, fallback to default 5.2 if missing
    const zone = formData?.location?.zone || ''; 

    const N = lightingResult?.N || 0;
    const S = lightingResult?.S || 0;
    const CU = lightingResult?.CU || 0.50;
    const MF = lightingResult?.MF || 0.70;

    // STEP 1 — Detect current season from system date
    const month = new Date().getMonth() + 1; // 1 to 12
    let season = "Pluvieuse";
    let dayDuration = 12;
    let naturalFactor = 0.55;
    let E_exterior = 45000;

    if ([11, 12, 1, 2].includes(month)) {
      season = "Sèche";
      dayDuration = 11;
      naturalFactor = 0.85;
      E_exterior = 80000;
    } else if ([3, 4].includes(month)) {
      season = "Transition";
      dayDuration = 12;
      naturalFactor = 0.75;
      E_exterior = 65000;
    } // else Pluvieuse (default)

    // STEP 2 — Get zone from user (solar irradiance)
    let solarIrradiance = 5.2; // Default
    if (zone.includes("Sud") || zone.includes("Cotonou") || zone.includes("Porto-Novo")) {
      solarIrradiance = 4.5;
    } else if (zone.includes("Centre") || zone.includes("Bohicon") || zone.includes("Abomey")) {
      solarIrradiance = 5.2;
    } else if (zone.includes("Nord") || zone.includes("Parakou") || zone.includes("Natitingou")) {
      solarIrradiance = 6.0;
    }

    // STEP 3 — Orientation correction factor
    let orientationFactor = 0;
    if (hasWindows) {
      switch (orientation) {
        case "Sud": orientationFactor = 1.00; break;
        case "Est":
        case "Ouest": orientationFactor = 0.75; break;
        case "Nord": orientationFactor = 0.40; break;
        default: orientationFactor = 0.50; // Fallback if orientation is unspecified but windows exist
      }
    }

    // STEP 4 — Natural Light Factor (FLN)
    const Tv = 0.6; // Glass transmittance
    let FLN = 0;
    let E_natural = 0;

    if (hasWindows && S > 0) {
      FLN = (windowArea * Tv * naturalFactor * orientationFactor) / S;
      E_natural = FLN * E_exterior;
    }

    // STEP 5 — Adjusted illuminance need
    let eRequired = 200; // Default
    if (buildingType === 'Logement résidentiel') {
      eRequired = 150;
    } else if (buildingType === 'Bureau/Administration') {
      eRequired = 500;
    } else if (buildingType === 'École/Salle de classe' || buildingType === 'Scolaire') {
      eRequired = 300;
    }

    let E_artificial_needed = eRequired - E_natural;
    if (E_artificial_needed < 0) {
      E_artificial_needed = 0;
    }

    // STEP 6 — Adjusted number of luminaires
    let N_adjusted = 0;
    if (E_artificial_needed > 0 && fluxPerUnit > 0 && CU > 0 && MF > 0 && S > 0) {
      N_adjusted = Math.ceil((E_artificial_needed * S) / (fluxPerUnit * CU * MF));
    }
    
    // Ensure we don't adjust to more than original N (if original was capped or based on different assumptions)
    if (N_adjusted > N && N > 0) {
      N_adjusted = N;
    }

    // STEP 7 — Savings calculation
    const luminairesSaved = N - N_adjusted;
    const savingsPercent = N > 0 ? (luminairesSaved / N) * 100 : 0;
    const powerSaved = luminairesSaved * powerPerUnit; // in Watts
    const dailySavings = (powerSaved * hoursPerDay) / 1000; // in kWh/day
    const weeklySavings = dailySavings * daysPerWeek;

    // STEP 8 — Daytime vs nighttime split
    let dayHours = 0;
    let nightHours = 0;

    if (hoursPerDay > dayDuration) {
      nightHours = hoursPerDay - dayDuration;
      dayHours = dayDuration;
    } else {
      dayHours = hoursPerDay;
      nightHours = 0;
    }

    // Return the specific object structure requested
    return {
      climate: {
        season,
        dayDuration,
        E_exterior,
        naturalFactor,
        solarIrradiance
      },
      naturalLight: {
        FLN: Math.round(FLN * 1000) / 1000,
        E_natural: Math.round(E_natural),
        orientationFactor,
        Tv
      },
      adjusted: {
        E_artificial_needed: Math.round(E_artificial_needed),
        N_adjusted,
        dayHours,
        nightHours
      },
      savings: {
        luminairesSaved,
        savingsPercent: Math.round(savingsPercent * 10) / 10,
        powerSaved: Math.round(powerSaved),
        dailySavings: Math.round(dailySavings * 100) / 100,
        weeklySavings: Math.round(weeklySavings * 100) / 100
      }
    };

  } catch (error) {
    console.error("Climate adjustment calculation failed:", error);
    // Safe fallback
    return {
      climate: { season: "Inconnue", dayDuration: 12, E_exterior: 0, naturalFactor: 0, solarIrradiance: 5.2 },
      naturalLight: { FLN: 0, E_natural: 0, orientationFactor: 0, Tv: 0.6 },
      adjusted: { E_artificial_needed: 0, N_adjusted: 0, dayHours: 0, nightHours: 0 },
      savings: { luminairesSaved: 0, savingsPercent: 0, powerSaved: 0, dailySavings: 0, weeklySavings: 0 }
    };
  }
}
