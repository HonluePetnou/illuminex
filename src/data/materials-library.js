export const CATALOGUE_MATERIAUX = [
  { id: "carreau-blanc",   name: "Carreau blanc",       type: "Carrelage",   reflectance: 0.70, description: "Carrelage céramique blanc standard" },
  { id: "marbre-blanc",    name: "Marbre blanc",         type: "Marbre",      reflectance: 0.65, description: "Marbre poli clair" },
  { id: "carreau-creme",   name: "Carreau crème",        type: "Carrelage",   reflectance: 0.55, description: "Carrelage beige/crème" },
  { id: "parquet-clair",   name: "Parquet clair",        type: "Bois",        reflectance: 0.35, description: "Parquet bois clair verni" },
  { id: "granit-gris",     name: "Granit gris",          type: "Pierre",      reflectance: 0.30, description: "Granit gris poli" },
  { id: "beton-gris",      name: "Béton gris brut",      type: "Béton",       reflectance: 0.25, description: "Dalle béton non traitée" },
  { id: "carreau-rouge",   name: "Carreau rouge brique", type: "Carrelage",   reflectance: 0.20, description: "Carrelage céramique rouge/brique" },
  { id: "parquet-fonce",   name: "Parquet foncé",        type: "Bois",        reflectance: 0.15, description: "Parquet bois foncé" },
  { id: "terre-battue",    name: "Terre battue",         type: "Sol naturel", reflectance: 0.10, description: "Sol en terre compactée" },
  { id: "pierre-noire",    name: "Pierre noire",         type: "Pierre",      reflectance: 0.06, description: "Ardoise ou pierre sombre polie" },

  // Bois & Métal pour Portes
  { id: "porte-bois-clair",  name: "Porte bois verni clair",  type: "Porte",       reflectance: 0.40, description: "Porte en bois clair" },
  { id: "porte-bois-moyen",  name: "Porte bois verni moyen",  type: "Porte",       reflectance: 0.25, description: "Porte en teck / bois moyen" },
  { id: "porte-bois-fonce",  name: "Porte bois verni foncé",  type: "Porte",       reflectance: 0.12, description: "Porte en bois sombre" },
  { id: "porte-metal-blanc", name: "Porte métal peint blanc", type: "Porte",       reflectance: 0.75, description: "Porte métallique blanche" },
  { id: "porte-alu-gris",    name: "Porte aluminium gris",    type: "Porte",       reflectance: 0.55, description: "Porte en aluminium anodisé" },

  // Matériaux pour Mobilier (Tables, Chaises)
  { id: "table-bois-clair",  name: "Table bois clair",        type: "Mobilier",    reflectance: 0.45, description: "Surface de table claire" },
  { id: "table-bois-fonce",  name: "Table bois foncé",        type: "Mobilier",    reflectance: 0.15, description: "Surface de table sombre" },
  { id: "table-stratifie",   name: "Table stratifié blanc",   type: "Mobilier",    reflectance: 0.75, description: "Table blanche brillante" },
  { id: "chaise-tissu-clair",name: "Chaise tissu clair",      type: "Mobilier",    reflectance: 0.60, description: "Siège en tissu gris/beige clair" },
  { id: "chaise-tissu-fonce",name: "Chaise tissu foncé",      type: "Mobilier",    reflectance: 0.15, description: "Siège en tissu noir/bleu foncé" },
  { id: "plastique-blanc",   name: "Plastique blanc",         type: "Mobilier",    reflectance: 0.70, description: "Plastique moulé blanc" },
  { id: "plastique-noir",    name: "Plastique noir",          type: "Mobilier",    reflectance: 0.10, description: "Plastique moulé noir" },

  // Matériaux pour Vitrages (Window reflectivity & transmittance)
  { id: "vitre-simple",      name: "Simple vitrage",          type: "Vitrage",     reflectance: 0.08, transmittance: 0.85, description: "Verre clair simple (85%)" },
  { id: "vitre-double",      name: "Double vitrage",          type: "Vitrage",     reflectance: 0.12, transmittance: 0.70, description: "Double vitrage standard (70%)" },
  { id: "vitre-lowe",        name: "Double vitrage low-E",    type: "Vitrage",     reflectance: 0.15, transmittance: 0.60, description: "Basse émissivité (60%)" },
  { id: "vitre-teinte",      name: "Vitrage teinté",          type: "Vitrage",     reflectance: 0.06, transmittance: 0.40, description: "Contrôle solaire (40%)" },
];
