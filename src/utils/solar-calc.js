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
  transmission = 0.5,
  orientation = 'S',
}) {
  if (!windowArea || !floorArea) return 0;

  // Coefficient d'orientation (facteur de réduction selon ex position soleil)
  const ORIENTATION_FACTORS = {
    'N': 0.40, 'NE': 0.55, 'E': 0.75, 'SE': 0.90,
    'S': 1.00, 'SO': 0.90, 'O': 0.75, 'NO': 0.55,
  };
  const orientFactor = ORIENTATION_FACTORS[orientation] || 0.80;

  // Facteur de lumière du jour (FLJ) simplifié
  const flj = (windowArea * transmission * orientFactor) / floorArea;
  const eInterieur = Math.round(eExterieur * flj * 0.10); // 10% habituel
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
