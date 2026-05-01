import { COUT_KWH_PAR_PAYS } from '../data/luminaires-library';

/**
 * Usage Profile Engine (Pure JavaScript)
 * Models real energy consumption based on LogiqueDeveloppement_v2.md
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

    const Jours_an = daysPerWeek * 52;
    const Heures_totales = hoursPerDay * Jours_an;
    const E_annuelle = (N * powerPerUnit * hoursPerDay * Jours_an) / 1000;

    const Heures_mixte_jour = climateResult?.naturalLight?.summary?.hoursMixed || 0;
    const Heures_mixte_an = Heures_mixte_jour * Jours_an;
    
    let Economie_naturelle = 0;
    if (Heures_totales > 0) {
      Economie_naturelle = (Heures_mixte_an / Heures_totales) * E_annuelle * 0.4;
    }

    const E_reelle = E_annuelle - Economie_naturelle;
    
    const country = formData?.location?.country || 'default';
    const Cout_kWh = COUT_KWH_PAR_PAYS[country] || 120;
    
    const Cout_annuel = E_reelle * Cout_kWh;
    const Cout_annuel_noOptim = E_annuelle * Cout_kWh;
    const annualSavings = Cout_annuel_noOptim - Cout_annuel;
    const savingsPercent = Cout_annuel_noOptim > 0 ? (annualSavings / Cout_annuel_noOptim) * 100 : 0;

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
        intermittence: 1,
        cutHours: 0,
        cutRate: 0,
        simultaneity: 1,
        H_real: hoursPerDay
      },
      consumption: {
        daily: Math.round((E_reelle / Jours_an) * 100) / 100,
        weekly: Math.round((E_reelle / 52) * 100) / 100,
        monthly: Math.round((E_reelle / 12) * 100) / 100,
        annual: Math.round(E_reelle * 100) / 100
      },
      cost: {
        tarifKwh: Cout_kWh,
        daily: Math.round(Cout_annuel / Jours_an),
        monthly: Math.round(Cout_annuel / 12),
        annual: Math.round(Cout_annuel)
      },
      savings: {
        C_day_noOptim: Math.round((E_annuelle / Jours_an) * 100) / 100,
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
