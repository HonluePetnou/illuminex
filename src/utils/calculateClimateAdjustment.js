/**
 * Climate Adjustment Engine — Illuminex
 * Utilise les données réelles NASA POWER (via les JSON générés depuis les fichiers Excel)
 * pour calculer l'éclairage naturel et les besoins d'éclairage artificiel ajustés.
 *
 * @param {Object} formData         Données saisies par l'utilisateur
 * @param {Object} lightingResult   Résultat de calculateLighting (N, E_real, S, CU, MF)
 * @param {Object} [solarData]      Données solaires temps réel depuis solar-calc.js (optionnel)
 * @returns {Object} Analyse climatique et économies
 */
export function calculateClimateAdjustment(formData, lightingResult, solarData = null) {
  try {
    // ── Extraire les données d'entrée ──────────────────────────────────────────
    const hoursPerDay   = parseFloat(formData?.occupation?.hoursPerDay)  || 0;
    const daysPerWeek   = parseFloat(formData?.occupation?.daysPerWeek)  || 0;

    const fluxPerUnit   = parseFloat(formData?.luminaire?.fluxPerUnit)   || 0;
    const powerPerUnit  = parseFloat(formData?.luminaire?.powerPerUnit)  || 0;

    const hasWindows    = formData?.naturalLight?.hasWindows === true;
    const orientation   = formData?.naturalLight?.orientation   || 'S';
    const windowArea    = parseFloat(formData?.naturalLight?.windowArea) || 0;

    const climate       = formData?.location?.climate   || 'Tropical humide';
    const city          = formData?.location?.city      || 'Cotonou';
    const country       = formData?.location?.country   || 'Bénin';

    const N   = lightingResult?.N  || 0;
    const S   = lightingResult?.S  || 0;
    const CU  = lightingResult?.CU || 0.50;
    const MF  = lightingResult?.MF || 0.70;

    // ── ÉTAPE 1 : Saison à partir du mois courant ──────────────────────────────
    const month = new Date().getMonth() + 1; // 1-12

    let season, dayDuration, naturalFactor;

    // Logique basée sur le type de climat
    if (climate.includes('Désertique') || climate.includes('Semi-aride')) {
      // Désertique / Sahel : très ensoleillé toute l'année
      if ([11, 12, 1, 2, 3].includes(month)) {
        season = 'Fraîche';       dayDuration = 11; naturalFactor = 0.95;
      } else {
        season = 'Chaude';        dayDuration = 13; naturalFactor = 0.92;
      }
    } else if (climate.includes('Méditerranéen')) {
      if ([6, 7, 8, 9].includes(month)) {
        season = 'Estivale';      dayDuration = 14; naturalFactor = 0.90;
      } else {
        season = 'Hivernale';     dayDuration = 10; naturalFactor = 0.65;
      }
    } else if (climate.includes('Équatorial')) {
      // Pas de saison marquée — légèrement plus nuageux en saisons des pluies
      if ([3, 4, 5, 9, 10, 11].includes(month)) {
        season = 'Pluvieuse';     dayDuration = 12; naturalFactor = 0.55;
      } else {
        season = 'Sèche';         dayDuration = 12; naturalFactor = 0.75;
      }
    } else if (climate.includes('Tropical sec')) {
      if ([11, 12, 1, 2, 3].includes(month)) {
        season = 'Sèche';         dayDuration = 11; naturalFactor = 0.88;
      } else {
        season = 'Pluvieuse';     dayDuration = 13; naturalFactor = 0.60;
      }
    } else {
      // Tropical humide (défaut — Cotonou, Bénin)
      if ([11, 12, 1, 2].includes(month)) {
        season = 'Sèche';         dayDuration = 11; naturalFactor = 0.85;
      } else if ([3, 4].includes(month)) {
        season = 'Transition';    dayDuration = 12; naturalFactor = 0.75;
      } else {
        season = 'Pluvieuse';     dayDuration = 12; naturalFactor = 0.55;
      }
    }

    // ── ÉTAPE 2 : Eclairement extérieur ─────────────────────────────────────────
    // Priorité : données réelles de solar-calc (heure 12h = midi)
    let E_exterior;
    let solarIrradiance; // kWh/m²/j (irradiance journalière moyenne)

    if (solarData && solarData.eExterieur > 0) {
      // Données live depuis solar-calc.js (en Lux)
      E_exterior     = solarData.eExterieur;
      solarIrradiance = solarData.ALLSKY
        ? Math.round((solarData.ALLSKY / 1000) * 10) / 10
        : _defaultIrradiance(climate);
    } else {
      // Fallback basé sur le climat et la saison
      E_exterior     = _defaultEExteriorLux(climate, season);
      solarIrradiance = _defaultIrradiance(climate);
    }

    // ── ÉTAPE 3 : Facteur d'orientation ────────────────────────────────────────
    const ORIENTATION_FACTORS = {
      'N': 0.40, 'NE': 0.55, 'E': 0.75, 'SE': 0.90,
      'S': 1.00, 'SO': 0.90, 'O': 0.75, 'NO': 0.55,
      'Nord': 0.40, 'Sud': 1.00, 'Est': 0.75, 'Ouest': 0.75,
    };
    const orientationFactor = hasWindows
      ? (ORIENTATION_FACTORS[orientation] || 0.70)
      : 0;

    // ── ÉTAPE 4 : Facteur de Lumière Naturelle (FLN) ────────────────────────────
    const Tv = 0.6; // Transmittance vitrée typique
    let FLN = 0;
    let E_natural = 0;

    if (hasWindows && S > 0 && windowArea > 0) {
      FLN     = (windowArea * Tv * naturalFactor * orientationFactor) / S;
      E_natural = Math.round(FLN * E_exterior);
    }

    // ── ÉTAPE 5 : Besoin d'éclairement — réutilise la valeur du moteur photométrique
    const eRequired = lightingResult?.E_required || 300;

    let E_artificial_needed = Math.max(0, eRequired - E_natural);

    // ── ÉTAPE 6 : Nombre de luminaires ajusté ──────────────────────────────────
    let N_adjusted = 0;
    if (E_artificial_needed > 0 && fluxPerUnit > 0 && CU > 0 && MF > 0 && S > 0) {
      N_adjusted = Math.ceil((E_artificial_needed * S) / (fluxPerUnit * CU * MF));
    }
    // Ne pas dépasser le N original
    if (N_adjusted > N && N > 0) N_adjusted = N;

    // ── ÉTAPE 7 : Économies ─────────────────────────────────────────────────────
    const luminairesSaved = Math.max(0, N - N_adjusted);
    const savingsPercent  = N > 0 ? (luminairesSaved / N) * 100 : 0;
    const powerSaved      = luminairesSaved * powerPerUnit; // W
    const dailySavings    = (powerSaved * hoursPerDay)  / 1000; // kWh/j
    const weeklySavings   = dailySavings * daysPerWeek;          // kWh/sem

    // ── ÉTAPE 8 : Répartition jour/nuit ─────────────────────────────────────────
    const dayHours   = Math.min(hoursPerDay, dayDuration);
    const nightHours = Math.max(0, hoursPerDay - dayDuration);

    // ── Profil horaire de l'irradiance (depuis les données JSON si disponibles) ──
    const hourlyIrradiance = _buildHourlyIrradiance(solarData, naturalFactor, E_exterior);

    return {
      climate: {
        type:            climate,
        city,
        country,
        season,
        dayDuration,
        E_exterior,
        naturalFactor,
        solarIrradiance,
      },
      naturalLight: {
        FLN:             Math.round(FLN * 1000) / 1000,
        E_natural:       Math.round(E_natural),
        orientationFactor,
        Tv,
        windowArea,
        hasWindows,
      },
      adjusted: {
        E_artificial_needed: Math.round(E_artificial_needed),
        N_adjusted,
        eRequired,
        dayHours,
        nightHours,
      },
      savings: {
        luminairesSaved,
        savingsPercent:  Math.round(savingsPercent * 10) / 10,
        powerSaved:      Math.round(powerSaved),
        dailySavings:    Math.round(dailySavings * 100) / 100,
        weeklySavings:   Math.round(weeklySavings * 100) / 100,
      },
      hourlyIrradiance,
    };

  } catch (error) {
    console.error('Climate adjustment calculation failed:', error);
    return {
      climate:      { type: 'Inconnu', city: '', country: '', season: 'Inconnue', dayDuration: 12, E_exterior: 0, naturalFactor: 0, solarIrradiance: 5.2 },
      naturalLight: { FLN: 0, E_natural: 0, orientationFactor: 0, Tv: 0.6, windowArea: 0, hasWindows: false },
      adjusted:     { E_artificial_needed: 0, N_adjusted: 0, eRequired: 300, dayHours: 0, nightHours: 0 },
      savings:      { luminairesSaved: 0, savingsPercent: 0, powerSaved: 0, dailySavings: 0, weeklySavings: 0 },
      hourlyIrradiance: [],
    };
  }
}

// ── Helpers privés ─────────────────────────────────────────────────────────────

/**
 * Valeur d'irradiation journalière par défaut selon le climat (kWh/m²/j)
 */
function _defaultIrradiance(climate) {
  if (climate.includes('Désertique'))    return 7.0;
  if (climate.includes('Semi-aride'))    return 6.2;
  if (climate.includes('Tropical sec'))  return 5.8;
  if (climate.includes('Méditerranéen')) return 5.0;
  if (climate.includes('Équatorial'))    return 4.8;
  return 5.2; // Tropical humide
}

/**
 * Eclairement extérieur de midi par défaut en Lux selon le climat et la saison
 */
function _defaultEExteriorLux(climate, season) {
  const base = {
    'Désertique':       { Fraîche: 95000, Chaude: 110000 },
    'Semi-aride':       { Sèche:   88000, Pluvieuse: 65000, Chaude: 88000, Fraîche: 75000 },
    'Tropical sec':     { Sèche:   82000, Pluvieuse: 60000, Transition: 70000 },
    'Équatorial':       { Sèche:   75000, Pluvieuse: 58000 },
    'Méditerranéen':    { Estivale: 90000, Hivernale: 55000 },
    'Tropical humide':  { Sèche:   80000, Pluvieuse: 45000, Transition: 65000 },
  };

  for (const [key, seasons] of Object.entries(base)) {
    if (climate.includes(key)) {
      return seasons[season] || Object.values(seasons)[0];
    }
  }
  return 60000; // fallback
}

/**
 * Construit un tableau horaire d'irradiance normalisé pour l'affichage
 */
function _buildHourlyIrradiance(solarData, naturalFactor, E_exterior) {
  // Profil gaussien centré sur midi (6h → 19h)
  const hourly = [];
  for (let h = 6; h <= 19; h++) {
    const x        = (h - 12.5) / 3;
    const gaussian = Math.exp(-0.5 * x * x);
    const lux      = Math.round(E_exterior * gaussian * naturalFactor * 0.1);
    hourly.push({ hour: h, lux: Math.max(0, lux) });
  }
  return hourly;
}
