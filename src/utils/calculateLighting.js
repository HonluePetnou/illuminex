/**
 * Lighting Calculation Engine (Pure JavaScript)
 * Calculates photometric properties and energy consumption based on user input.
 *
 * @param {Object} formData The parsed JSON object from the multi-step form
 * @returns {Object} Calculation results
 */
import { calculateCU, getERequired } from '../data/norms';

export function calculateLighting(formData) {
  try {
    // Safely extract input data with fallbacks matching the UI components
    const length = parseFloat(formData?.room?.length) || 10;
    const width = parseFloat(formData?.room?.width) || 10;
    const ceilingHeight = parseFloat(formData?.room?.ceilingHeight) || 3.0;
    const workPlaneHeight = parseFloat(formData?.room?.workPlaneHeight) || 0.85;
    const roomType = formData?.room?.type || 'Bureau';

    const buildingType = formData?.occupation?.buildingType || 'Bureau/Administration';
    const hoursPerDay = parseFloat(formData?.occupation?.hoursPerDay) || 8;
    const daysPerWeek = parseFloat(formData?.occupation?.daysPerWeek) || 5;

    const fluxPerUnit = parseFloat(formData?.luminaire?.fluxPerUnit) || 3000;
    const powerPerUnit = parseFloat(formData?.luminaire?.powerPerUnit) || 40;
    const luminaireType = formData?.luminaire?.type || '';

    // STEP 1 — Room surface & index
    const surface = length * width;
    const hm = ceilingHeight - workPlaneHeight;

    let roomIndex = 0;
    if (hm > 0 && (length + width) > 0) {
      roomIndex = surface / (hm * (length + width));
    }

    // STEP 2 — Get reference illuminance (E) — single source of truth from norms.js
    const eRequired = getERequired(roomType, buildingType);

    // STEP 3 — Get CU from RI — single source of truth from norms.js
    const cu = calculateCU(roomIndex);

    // STEP 4 — Set MF (maintenance factor)
    const mf = 0.70;

    // STEP 5 — Calculate number of luminaires
    let numberOfLuminaires = 0;
    if (fluxPerUnit > 0 && cu > 0 && mf > 0) {
      const nRaw = (eRequired * surface) / (fluxPerUnit * cu * mf);
      numberOfLuminaires = Math.ceil(nRaw);
    }

    // STEP 6 — Calculate real illuminance (= average illuminance E_moy)
    let realIlluminance = 0;
    if (surface > 0) {
      realIlluminance = (fluxPerUnit * numberOfLuminaires * cu * mf) / surface;
    }

    // STEP 7 — Energy
    const totalPowerW = numberOfLuminaires * powerPerUnit;
    const kwhPerDay = (totalPowerW * hoursPerDay) / 1000;
    const kwhPerWeek = kwhPerDay * daysPerWeek;

    // STEP 8 — Simplified UGR estimate
    // Based on room index and luminaire type (full CIE formula needs photometric files)
    let ugr = 22; // default conservative
    if (luminaireType.toLowerCase().includes('dalle')) {
      ugr = roomIndex > 2 ? 16 : roomIndex > 1 ? 18 : 19;
    } else if (luminaireType.toLowerCase().includes('tube')) {
      ugr = roomIndex > 2 ? 17 : roomIndex > 1 ? 19 : 21;
    } else if (luminaireType.toLowerCase().includes('led')) {
      ugr = roomIndex > 2 ? 16 : roomIndex > 1 ? 19 : 22;
    } else {
      ugr = roomIndex > 2 ? 19 : roomIndex > 1 ? 22 : 25;
    }

    // RETURN this object
    return {
      S: surface,
      RI: roomIndex,
      CU: cu,
      MF: mf,
      E_required: eRequired,
      N: numberOfLuminaires,
      E_real: realIlluminance,
      E_average: realIlluminance, // alias — E_real IS the average illuminance
      UGR: ugr,
      totalPower: totalPowerW,
      dailyConsumption: kwhPerDay,
      weeklyConsumption: kwhPerWeek
    };

  } catch (error) {
    console.error("Lighting calculation failed:", error);
    return {
      S: 0, RI: 0, CU: 0.5, MF: 0.7, E_required: 0,
      N: 0, E_real: 0, E_average: 0, UGR: 22, totalPower: 0,
      dailyConsumption: 0, weeklyConsumption: 0
    };
  }
}
