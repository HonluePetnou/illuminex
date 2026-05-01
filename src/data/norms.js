export const NORMS = {
  "Salle de classe": {
    lux: 500, u0: 0.60, ugrMax: 19, ircMin: 80, tc: 4000,
    mf: 0.80, hauteurTravail: 0.75
  },
  "Bureau": {
    lux: 500, u0: 0.60, ugrMax: 19, ircMin: 80, tc: 4000,
    mf: 0.80, hauteurTravail: 0.85
  },
  "Salle de réunion": {
    lux: 500, u0: 0.60, ugrMax: 19, ircMin: 80, tc: 4000,
    mf: 0.80, hauteurTravail: 0.75
  },
  "Cuisine": {
    lux: 500, u0: 0.70, ugrMax: 22, ircMin: 80, tc: 3500,
    mf: 0.60, hauteurTravail: 0.90
  },
  "Chambre": {
    lux: 150, u0: 0.40, ugrMax: 25, ircMin: 80, tc: 2700,
    mf: 0.80, hauteurTravail: 0.70
  },
  "Salon": {
    lux: 175, u0: 0.40, ugrMax: 25, ircMin: 80, tc: 2700,
    mf: 0.80, hauteurTravail: null
  },
  "Couloir": {
    lux: 125, u0: 0.40, ugrMax: 25, ircMin: 80, tc: 3000,
    mf: 0.70, hauteurTravail: null
  },
  "Sanitaires": {
    lux: 200, u0: 0.40, ugrMax: 25, ircMin: 80, tc: 3500,
    mf: 0.70, hauteurTravail: null
  },
  "Commerce": {
    lux: 500, u0: 0.60, ugrMax: 22, ircMin: 85, tc: 3500,
    mf: 0.70, hauteurTravail: null
  },
};

export const NORMS_U0 = {
  "Salle de classe":  0.60,
  "Bureau":           0.60,
  "Salle de réunion": 0.60,
  "Cuisine":          0.70,
  "Chambre":          0.40,
  "Salon":            0.40,
  "Couloir":          0.40,
  "Sanitaires":       0.40,
  "Commerce":         0.60,
};

// Mapping type de bâtiment → type de pièce par défaut (pour fallback)
const BUILDING_TO_ROOM = {
  'Logement résidentiel':   'Salon',
  'Bureau/Administration':  'Bureau',
  'École/Salle de classe':  'Salle de classe',
  'Scolaire':               'Salle de classe',
  'Atelier / Industrie':    'Commerce',
  'Commerce / Boutique':    'Commerce',
  'Hôpital / Clinique':     'Bureau',
  'Restaurant / Hôtel':     'Sanitaires',
};

// Calcul du CU depuis le ratio de salle k
export function calculateCU(k) {
  if (k < 1)       return 0.40;
  if (k < 2)       return 0.50;
  if (k < 3)       return 0.60;
  return 0.70;
}

/**
 * Retourne l'éclairement requis (lux) en utilisant d'abord le type de pièce
 * (NORMS), puis le type de bâtiment en fallback.
 * Source unique de vérité pour calculateLighting et calculateClimateAdjustment.
 */
export function getERequired(roomType, buildingType) {
  // Priorité 1 : type de pièce exact dans NORMS
  if (roomType && NORMS[roomType]) {
    return NORMS[roomType].lux;
  }
  // Priorité 2 : déduire le type de pièce depuis le type de bâtiment
  const mappedRoom = BUILDING_TO_ROOM[buildingType];
  if (mappedRoom && NORMS[mappedRoom]) {
    return NORMS[mappedRoom].lux;
  }
  // Fallback
  return 300;
}

// Calcul du nombre de luminaires
export function calculateNbLuminaires({ surface, luxNormatif, flux, cu, mf }) {
  if (!flux || !cu || !mf) return 0;
  return Math.ceil((luxNormatif * surface) / (flux * cu * mf));
}

// Calcul du ratio de salle k
export function calculateK({ length, width, ceilingHeight, workPlaneHeight }) {
  const hTravail = workPlaneHeight || 0.85;
  const hUtil = ceilingHeight - hTravail;
  if (hUtil <= 0) return 1;
  return (length * width) / (hUtil * (length + width));
}
