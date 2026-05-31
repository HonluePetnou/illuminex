/**
 * solar-calc.js — Calcul de l'éclairage naturel selon le climat NASA POWER
 * Adaptée à l'Afrique subsaharienne (logique Illuminex)
 */

// Chargement des données climatiques par type
const CLIMATE_FILES = {
  'Équatorial':          () => import('../data/climate/equatorial.json'),
  'Tropical humide':     () => import('../data/climate/tropical-humide.json'),
  'Tropical sec':        () => import('../data/climate/tropical-sec.json'),
  'Semi-aride (Sahel)':  () => import('../data/climate/sahel.json'),
  'Désertique':          () => import('../data/climate/desertique.json'),
  'Méditerranéen':       () => import('../data/climate/mediterraneen.json'),
};

/**
 * Charge les données climatiques pour le climat donné
 * @param {string} climate - Type de climat
 * @returns {Promise<Object>} - Données JSON du fichier
 */
export async function loadClimateData(climate) {
  const loader = CLIMATE_FILES[climate];
  if (!loader) {
    console.warn(`Climat non reconnu: ${climate}, fallback sur tropical humide`);
    return (await import('../data/climate/tropical-humide.json')).default;
  }
  const mod = await loader();
  return mod.default || mod;
}

/**
 * Calcule l'éclairement extérieur depuis les données NASA POWER
 * @param {Object} params
 * @param {string} params.climate - Type de climat
 * @param {number} params.month - Mois (1-12)
 * @param {number} params.hour - Heure (6-19)
 * @returns {Promise<Object>} - { eExterieur, typeCiel, f, K }
 */
export async function calculateSolarIrradiance({ climate, month, hour }) {
  try {
    const data = await loadClimateData(climate);
    const monthStr = String(month);
    const hourStr = String(hour);

    const monthData = data.data?.[monthStr];
    if (!monthData) return { eExterieur: 0, typeCiel: 'Nuit', f: 0, K: 0 };

    const hourData = monthData[hourStr];
    if (!hourData) return { eExterieur: 0, typeCiel: 'Nuit', f: 0, K: 0 };

    const { ALLSKY, CLRSKY, T2M, WS10M } = hourData;

    // ÉTAPE 4 : Calcul de f
    const f = CLRSKY > 0 ? ALLSKY / CLRSKY : 0;

    // ÉTAPE 5 : Détermination de K (efficacité lumineuse)
    let K, typeCiel, skyIcon;
    if (f >= 0.90) {
      K = 110; typeCiel = 'Clair'; skyIcon = 'Sun';
    } else if (f >= 0.60) {
      K = 105; typeCiel = 'Partiellement nuageux'; skyIcon = 'CloudSun';
    } else {
      K = 120; typeCiel = 'Couvert'; skyIcon = 'Cloud';
    }

    // ÉTAPE 6 : Calcul de l'éclairement extérieur
    const eExterieur = Math.round(ALLSKY * K);

    return { eExterieur, typeCiel, skyIcon, f: Math.round(f * 100) / 100, K, ALLSKY, CLRSKY, T2M, WS10M };
  } catch (err) {
    console.error('Erreur calcul solaire:', err);
    return { eExterieur: 0, typeCiel: 'Erreur', f: 0, K: 0 };
  }
}

/**
 * Calcule l'éclairement intérieur selon la contribution lumière naturelle
 * @param {Object} params
 * @param {number} params.eExterieur - Éclairement extérieur en lux
 * @param {number} params.windowArea - Surface des fenêtres en m²
 * @param {number} params.floorArea - Surface du sol en m²
 * @param {number} params.transmission - Transmission vitrée (0.5 par défaut)
 * @param {string} params.orientation - Orientation (N, NE, E, SE, S, SO, O, NO)
 * @returns {number} - Éclairement naturel intérieur en lux
 */
export function calculateDaylightContribution({
  eExterieur,
  windowArea,
  floorArea,
  transmission = 0.70,
  orientation = 'S',
  doorType = 'porte-bois-moyen',
  windowsOpen = true,
  doorArea = 0,
}) {
  if (!floorArea) return 0;

  // Coefficient d'orientation
  const cleanOrient = (orientation || '').trim().toUpperCase();
  const ORIENTATION_FACTORS = {
    'N': 0.7, 'NE': 0.8, 'E': 0.9, 'SE': 1.05,
    'S': 1.2, 'SO': 1.1, 'O': 1.0, 'NO': 0.85,
    'NORD': 0.7, 'SUD': 1.2, 'EST': 0.9, 'OUEST': 1.0,
  };
  const orientFactor = ORIENTATION_FACTORS[cleanOrient] || 0.90;

  const S_portes_ouvertes = windowsOpen ? doorArea : 0;

  const S_ouverture = windowArea + S_portes_ouvertes;
  if (S_ouverture <= 0) return 0;

  const effectiveArea = (windowArea * transmission) + (S_portes_ouvertes * 1.0);
  const flj = (effectiveArea / floorArea) * orientFactor;
  const eInterieur = Math.round(eExterieur * flj);
  return Math.max(0, eInterieur);
}

/**
 * Calcule position solaire approximative (sans SunCalc — fallback)
 * @param {number} latitude
 * @param {number} month (1-12)
 * @param {number} hour (0-23)
 * @returns {{ altitude: number, azimuth: number }}
 */
export function approximateSunPosition(latitude, month, hour) {
  // Déclinaison solaire approximative
  const decl = 23.45 * Math.sin((2 * Math.PI / 12) * (month - 3));
  const latRad = (latitude * Math.PI) / 180;
  const declRad = (decl * Math.PI) / 180;
  const hourAngle = (hour - 12) * 15; // degrés
  const haRad = (hourAngle * Math.PI) / 180;

  // Altitude solaire
  const sinAlt = Math.sin(latRad) * Math.sin(declRad) +
                 Math.cos(latRad) * Math.cos(declRad) * Math.cos(haRad);
  const altitudeDeg = (Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180) / Math.PI;

  // Azimuth approximatif
  const azimuthDeg = (hourAngle + 180) % 360;

  return {
    altitude: Math.round(altitudeDeg * 10) / 10,
    azimuth: Math.round(azimuthDeg * 10) / 10,
  };
}

/**
 * Calcule la carte thermique de l'éclairage naturel dans une pièce
 * E_int = E_ext × F_orientation × τ × (S_ouv / S_p)
 * La carte utilise un facteur de décroissance simple par rangée :
 *   Rangée 0 (proche ouverture) : ×1.0
 *   Rangée 1 (intermédiaire)    : ×0.6
 *   Rangée 2 (fond de pièce)    : ×0.3 (+ apport porte si ouverte)
 */
// Coefficient matrix per spec (row = depth, col = lateral)
// Row 1 = proche ouverture, Row 2 = médiane, Row 3 = fond
// Col 1 = bord gauche … Col 4 = bord droit
const NATURAL_COEFFS = [
  [0.95, 1.00, 0.92, 0.85],
  [0.75, 0.80, 0.72, 0.65],
  [0.55, 0.50, 0.45, 0.40],
];

export function calculateNaturalHeatmap(formData, solarData = null) {
  try {
    const length   = parseFloat(formData?.room?.length)        || 10;
    const width    = parseFloat(formData?.room?.width)         || 10;
    const S_p      = length * width;

    const hasWindows   = formData?.naturalLight?.hasWindows === true;
    const windowArea   = parseFloat(formData?.naturalLight?.windowArea) || 0;
    const doorArea     = parseFloat(formData?.naturalLight?.doorArea)   || 0;
    const orientation  = formData?.naturalLight?.orientation    || 'S';
    const windowsOpen  = formData?.naturalLight?.windowsOpen    !== false;
    const S_ouv        = windowArea + (windowsOpen ? doorArea : 0);

    // Transmittance du vitrage selon le type sélectionné
    const GLAZING_T = {
      'Simple vitrage': 0.85,
      'Double standard': 0.72,
      'Double low-E': 0.65,
      'Triple vitrage': 0.55,
      'Vitrage teinté': 0.45,
      'Fenêtres jalousie': 0.90,
    };
    const glazingType = formData?.room?.glazingType || 'Double standard';
    const transmission = GLAZING_T[glazingType] || 0.72;

    // Facteur d'orientation
    const ORIENT_FACTORS = {
      'N':0.7, 'NE':0.8, 'E':0.9, 'SE':1.05,
      'S':1.2, 'SO':1.1, 'O':1.0, 'NO':0.85,
      'NORD':0.7, 'SUD':1.2, 'EST':0.9, 'OUEST':1.0,
    };
    const cleanOrient = (orientation || '').trim().toUpperCase();
    const F_orientation = hasWindows ? (ORIENT_FACTORS[cleanOrient] || 0.9) : 0;

    // Éclairement extérieur
    const E_ext = (solarData && solarData.eExterieur > 0)
      ? solarData.eExterieur
      : 60000;

    // E_sol : éclairement naturel au sol après transmission (Spec: valeur qui entre dans la pièce)
    let E_sol = 0;
    if (hasWindows && S_p > 0 && S_ouv > 0) {
      E_sol = E_ext * F_orientation * transmission * (S_ouv / S_p);
    }
    E_sol = Math.round(E_sol);

    // Étape 1 — E_carré[i][j] = E_sol × COEFFICIENTS[i][j]
    const rawZones = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const e = Math.round(E_sol * NATURAL_COEFFS[row][col]);
        rawZones.push({ row, col, e });
      }
    }

    // Étape 2 — E_max = max(E_carré)
    const E_max = Math.max(...rawZones.map(z => z.e));

    // Étape 3 — D_carré[i][j] = E_carré / E_max  (valeur normalisée 0‑1)
    const zones = rawZones.map(z => ({
      ...z,
      d: E_max > 0 ? Math.round((z.e / E_max) * 100) / 100 : 0,
      type: z.row === 0 ? 'proche' : z.row === 1 ? 'intermediaire' : 'fond',
      ok: z.e >= 100,
    }));

    // Étape 4 — E_moy = moyenne(D_carré)
    // Étape 5 — E_min = min(D_carré)
    const dValues = zones.map(z => z.d);
    const E_min_d = Math.min(...dValues);
    const E_moy_d = dValues.reduce((a, b) => a + b, 0) / dValues.length;

    // Étape 6 — Uo = E_min / E_moy
    const U0 = E_moy_d > 0 ? Math.round((E_min_d / E_moy_d) * 100) / 100 : 0;

    return {
      E_ext,
      E_sol,
      E_max,
      E_min: E_min_d,
      E_moy: Math.round(E_moy_d * 100) / 100,
      F_orientation,
      transmission,
      S_ouv,
      orientation,
      zones,
      uniformity: { E_min: E_min_d, E_moy: Math.round(E_moy_d * 100) / 100, U0 }
    };

  } catch (error) {
    console.error('Natural heatmap calculation failed:', error);
    return {
      E_ext: 0, E_sol: 0, E_max: 0, E_min: 0, E_moy: 0,
      F_orientation: 0, transmission: 0.7, S_ouv: 0, orientation: 'S',
      zones: [],
      uniformity: { E_min: 0, E_moy: 0, U0: 0 }
    };
  }
}

/**
 * Calcule lever/coucher de soleil approximatifs
 * @param {number} latitude
 * @param {number} month
 * @returns {{ sunrise: string, sunset: string }}
 */
export function approximateSunTimes(latitude, month) {
  const decl = 23.45 * Math.sin((2 * Math.PI / 12) * (month - 3));
  const latRad = (latitude * Math.PI) / 180;
  const declRad = (decl * Math.PI) / 180;

  const cosHA = -Math.tan(latRad) * Math.tan(declRad);
  let haSunset;
  if (cosHA > 1) haSunset = 0;  // Soleil ne se lève jamais
  else if (cosHA < -1) haSunset = 180; // Soleil ne se couche jamais
  else haSunset = (Math.acos(cosHA) * 180) / Math.PI;

  const dayLengthHours = (2 * haSunset) / 15;
  const sunriseH = 12 - dayLengthHours / 2;
  const sunsetH  = 12 + dayLengthHours / 2;

  const fmt = (h) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  };

  return { sunrise: fmt(sunriseH), sunset: fmt(sunsetH) };
}
