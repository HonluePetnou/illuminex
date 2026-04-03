# ILLUMINEX — Prompts de développement
# App Electron + React | Simulation d'éclairage | Afrique subsaharienne
# Passer chaque bloc séparément à l'IA dans l'ordre indiqué

---

## CONTEXTE GLOBAL (à inclure dans CHAQUE prompt)

Tu travailles sur **Illuminex**, une application desktop (Electron + React) de simulation d'éclairage intérieur destinée à l'Afrique subsaharienne. L'app permet de calculer le nombre de luminaires nécessaires selon les normes EN 12464-1, de simuler l'éclairage en 2D et 3D, et de générer un rapport PDF. Le design est sombre (fond #1A1D2E), avec des accents dorés (#F0A500) et bleus (#3B82F6). Les cards et panneaux utilisent un style glassmorphism : `background: rgba(30,34,55,0.85)`, `border: 1px solid rgba(255,255,255,0.06)`, `box-shadow: 0 8px 32px rgba(0,0,0,0.4)`, `border-radius: 12px`.

---

## PHASE 1 — Redesign de la page d'accueil

### Contexte de l'écran actuel
La page d'accueil actuelle a : une sidebar gauche avec le menu de navigation et un tutoriel vidéo en bas, une zone principale avec le titre "Bienvenue sur ILLUMINEX", un bouton "Nouvelle simulation", et une liste de projets récents. Le fond est gris anthracite uni (trop plat), les cards de projets sont trop grandes, et toutes les références parlent uniquement du Bénin.

### Ce qu'il faut faire

Redesigne la page d'accueil d'Illuminex (Electron + React) selon les instructions suivantes.

**FOND ET ATMOSPHÈRE**
- Fond principal : `#1A1D2E`
- Ajouter un radial gradient très subtil au centre : `radial-gradient(ellipse at 50% 40%, rgba(240,165,0,0.06) 0%, transparent 70%)`
- Toutes les cards et panneaux : `background: rgba(30,34,55,0.85)`, `border: 1px solid rgba(255,255,255,0.06)`, `box-shadow: 0 8px 32px rgba(0,0,0,0.4)`, `border-radius: 12px`

**ZONE PRINCIPALE — HAUT**
- Titre H1 : "Bienvenue sur **ILLUMINEX**" — fonte élégante (Outfit ou DM Sans), taille 32px, blanc pur, le mot ILLUMINEX en gras doré `#F0A500`
- Sous-titre : "Votre outil de simulation d'éclairage pour l'Afrique subsaharienne" — 14px, couleur `#94A3B8`
- Bouton CTA : "Nouvelle simulation" — fond `#3B82F6`, border-radius 8px, padding 12px 28px, hover effect (`brightness(1.15)`, transition 200ms)

**SECTION PROJETS RÉCENTS**
- Cards compactes : hauteur max 72px, flex-row avec miniature 40×40px à gauche (border-radius 6px), nom du projet en blanc 14px bold, sous-ligne avec dimensions + ville + date en `#64748B` 12px, date alignée à droite
- Barre de recherche au-dessus des cards : fond `rgba(255,255,255,0.04)`, border `1px solid rgba(255,255,255,0.08)`, icône loupe, placeholder "Rechercher un projet..."

**SECTION GUIDE RAPIDE (bas de page)**
- Titre : "Comment utiliser Illuminex ?" — 18px, blanc, centré
- 4 cartes horizontales en grid 4 colonnes :
  - 📐 Définir la pièce — "Renseignez les dimensions et le type de la pièce"
  - 🎨 Choisir les matériaux — "Sélectionnez couleurs et surfaces pour calculer la réflectance"
  - 💡 Sélectionner les luminaires — "Choisissez parmi notre bibliothèque africaine"
  - 📊 Simuler & Exporter — "Visualisez en 2D/3D et générez votre rapport PDF"
- Chaque carte : icône emoji 28px, titre 13px bold blanc, description 12px `#94A3B8`, style glassmorphism

**SIDEBAR GAUCHE**
- Conserver la navigation existante
- Conserver le bouton tutoriel vidéo en bas
- Remplacer toute mention "Bénin" par "Afrique subsaharienne"

**RÈGLE GLOBALE**
Supprimer toute référence exclusive au Bénin dans l'ensemble de l'application. Utiliser "Afrique subsaharienne" partout.

---

## PHASE 2 — Écran "Définition de la Pièce"

### Contexte de l'écran actuel
L'écran actuel contient : une vue 3D filaire de la pièce à gauche, et à droite les champs Longueur, Largeur, Hauteur plafond, Type de pièce, puis une section "Réflectance surfaces" avec des sliders pour Plafond / Murs / Sol.

### Ce qu'il faut faire

Modifie l'écran "Définition de la Pièce" dans Illuminex (Electron + React).

**1. SUPPRIMER**
- Retirer complètement la section "Réflectance surfaces" (sliders Plafond/Murs/Sol). Elle sera dans un écran dédié.

**2. AJOUTER — Sélecteur Pays**
- Dropdown "Pays" avec la liste complète `DEFAULT_LOCATIONS` (voir fichier à créer ci-dessous)
- Quand un pays est sélectionné : remplir automatiquement les champs latitude, longitude, et climat
- Les champs latitude/longitude restent modifiables manuellement par l'utilisateur

**3. AJOUTER — Sélecteur Climat**
- Lecture seule si pays sélectionné, sinon manuel
- Options : `Équatorial` | `Tropical humide` | `Tropical sec` | `Semi-aride (Sahel)` | `Désertique` | `Méditerranéen`

**4. AJOUTER — Orientation bâtiment**
- Composant SVG simple représentant une rose des vents avec 8 directions cliquables : N, NE, E, SE, S, SO, O, NO
- Direction sélectionnée mise en surbrillance dorée
- Valeur par défaut : **N (Nord)**

**5. AJOUTER — Champ conditionnel "Espace plan de travail → plafond"**
- Ce champ n'apparaît QUE si le type de pièce sélectionné est dans : `{Bureau, Salle de classe, Cuisine, Chambre, Salle de réunion}`
- Pré-remplissage automatique selon le type :
  - Bureau → 0.85 m
  - Salle de classe → 0.75 m
  - Cuisine → 0.90 m
  - Chambre → 0.70 m
  - Salle de réunion → 0.75 m
- Le champ reste éditable (l'utilisateur peut changer la valeur)
- Afficher un tooltip au survol : "Hauteur normative selon EN 12464-1 — modifiable si besoin"

**6. CRÉER le fichier `src/data/default-locations.js`**

```js
export const DEFAULT_LOCATIONS = [
  { country: "Bénin",           climate: "Tropical humide",  representativeCity: "Cotonou",      latitude: 6.37,   longitude: 2.43   },
  { country: "Sénégal",         climate: "Tropical sec",     representativeCity: "Dakar",         latitude: 14.69,  longitude: -17.44 },
  { country: "Côte d'Ivoire",   climate: "Équatorial",       representativeCity: "Abidjan",       latitude: 5.35,   longitude: -4.00  },
  { country: "Ghana",           climate: "Tropical humide",  representativeCity: "Accra",         latitude: 5.56,   longitude: -0.20  },
  { country: "Cameroun",        climate: "Équatorial",       representativeCity: "Yaoundé",       latitude: 3.86,   longitude: 11.52  },
  { country: "Kenya",           climate: "Tropical sec",     representativeCity: "Nairobi",       latitude: -1.29,  longitude: 36.82  },
  { country: "Mali",            climate: "Semi-aride",       representativeCity: "Bamako",        latitude: 12.65,  longitude: -8.00  },
  { country: "Burkina Faso",    climate: "Semi-aride",       representativeCity: "Ouagadougou",   latitude: 12.36,  longitude: -1.53  },
  { country: "Niger",           climate: "Désertique",       representativeCity: "Niamey",        latitude: 13.51,  longitude: 2.11   },
  { country: "Tchad",           climate: "Semi-aride",       representativeCity: "N'Djamena",     latitude: 12.10,  longitude: 15.04  },
  { country: "RDC",             climate: "Équatorial",       representativeCity: "Kinshasa",      latitude: -4.32,  longitude: 15.32  },
  { country: "Nigeria",         climate: "Tropical humide",  representativeCity: "Lagos",         latitude: 6.45,   longitude: 3.39   },
  { country: "Éthiopie",        climate: "Tropical sec",     representativeCity: "Addis-Abeba",   latitude: 9.03,   longitude: 38.74  },
  { country: "Tanzanie",        climate: "Tropical humide",  representativeCity: "Dar es Salaam", latitude: -6.79,  longitude: 39.21  },
  { country: "Mozambique",      climate: "Tropical humide",  representativeCity: "Maputo",        latitude: -25.96, longitude: 32.59  },
  { country: "Madagascar",      climate: "Tropical humide",  representativeCity: "Antananarivo",  latitude: -18.91, longitude: 47.54  },
  { country: "Togo",            climate: "Tropical humide",  representativeCity: "Lomé",          latitude: 6.14,   longitude: 1.22   },
  { country: "Guinée",          climate: "Tropical humide",  representativeCity: "Conakry",       latitude: 9.54,   longitude: -13.68 },
  { country: "Gabon",           climate: "Équatorial",       representativeCity: "Libreville",    latitude: 0.39,   longitude: 9.45   },
  { country: "Mauritanie",      climate: "Désertique",       representativeCity: "Nouakchott",    latitude: 18.08,  longitude: -15.97 },
];
```

---

## PHASE 2b — Nouvel écran "Matériaux & Surfaces"

### Contexte
Cet écran est entièrement nouveau. Il doit être inséré entre "Définition de la Pièce" et "Sélection des Luminaires" dans le flow de simulation. Son rôle : remplacer les anciens sliders de réflectance par une sélection intuitive de matériaux et couleurs réels.

### Ce qu'il faut faire

Crée un nouvel écran "Matériaux & Surfaces" dans Illuminex (Electron + React).

**STRUCTURE**
- Même layout que les autres écrans (sidebar gauche, contenu à droite, boutons Précédent/Suivant en bas)
- Titre de la page : "Matériaux & Surfaces"
- 3 sections distinctes : PLAFOND | MURS | SOL

**POUR CHAQUE SURFACE**, afficher :
- Label + icône (🟦 Plafond / 🟧 Murs / 🟫 Sol)
- Dropdown "Couleur / Peinture" (depuis `CATALOGUE_COULEURS`)
- Dropdown "Matériau" (depuis `CATALOGUE_MATERIAUX`)
- Badge "Réflectance : XX%" qui s'affiche automatiquement selon la sélection (non modifiable)

**PANNEAU RÉCAPITULATIF** (affiché à droite ou en bas)
- R_moyen calculé en temps réel avec formule :
  `R_moyen = (R_plafond × A_plafond + R_murs × A_murs + R_sol × A_sol) / A_total`
- IRC estimé en temps réel :
  `IRC = (0.85 × Surface_fenêtres) / (Surface_totale × (1 - R_moyen))`
- Code couleur du badge R_moyen : vert si > 0.5, orange si 0.3–0.5, rouge si < 0.3
- Tooltip : "Un R_moyen élevé = lumière mieux réfléchie = moins de luminaires nécessaires"

**CRÉER `src/data/colors-library.js`**

```js
export const CATALOGUE_COULEURS = [
  { id: "blanc-mat",      name: "Blanc mat",       hex: "#F5F5F5", reflectance: 0.85, type: "Peinture" },
  { id: "blanc-casse",    name: "Blanc cassé",      hex: "#F0EAD6", reflectance: 0.80, type: "Peinture" },
  { id: "creme",          name: "Crème",            hex: "#FFFDD0", reflectance: 0.75, type: "Peinture" },
  { id: "beige-clair",    name: "Beige clair",      hex: "#D4C5A9", reflectance: 0.65, type: "Peinture" },
  { id: "jaune-ocre",     name: "Jaune ocre",       hex: "#C8A951", reflectance: 0.55, type: "Peinture" },
  { id: "gris-clair",     name: "Gris clair",       hex: "#BDBDBD", reflectance: 0.50, type: "Peinture" },
  { id: "vert-pastel",    name: "Vert pastel",      hex: "#B8D5B8", reflectance: 0.45, type: "Peinture" },
  { id: "bleu-ciel",      name: "Bleu ciel",        hex: "#89B4D9", reflectance: 0.40, type: "Peinture" },
  { id: "saumon",         name: "Saumon",           hex: "#E8A090", reflectance: 0.35, type: "Peinture" },
  { id: "terracotta",     name: "Terracotta",       hex: "#C17B5C", reflectance: 0.25, type: "Peinture" },
  { id: "marron-moyen",   name: "Marron moyen",     hex: "#8B6347", reflectance: 0.20, type: "Peinture" },
  { id: "vert-fonce",     name: "Vert foncé",       hex: "#4A7C59", reflectance: 0.15, type: "Peinture" },
  { id: "gris-fonce",     name: "Gris foncé",       hex: "#616161", reflectance: 0.12, type: "Peinture" },
  { id: "brun-fonce",     name: "Brun foncé",       hex: "#4A3728", reflectance: 0.08, type: "Peinture" },
  { id: "noir-mat",       name: "Noir mat",         hex: "#212121", reflectance: 0.05, type: "Peinture" },
];
```

**CRÉER `src/data/materials-library.js`**

```js
export const CATALOGUE_MATERIAUX = [
  { id: "carreau-blanc",   name: "Carreau blanc",      type: "Carrelage",   reflectance: 0.70, description: "Carrelage céramique blanc standard" },
  { id: "marbre-blanc",    name: "Marbre blanc",        type: "Marbre",      reflectance: 0.65, description: "Marbre poli clair" },
  { id: "carreau-creme",   name: "Carreau crème",       type: "Carrelage",   reflectance: 0.55, description: "Carrelage beige/crème" },
  { id: "parquet-clair",   name: "Parquet clair",       type: "Bois",        reflectance: 0.35, description: "Parquet bois clair verni" },
  { id: "granit-gris",     name: "Granit gris",         type: "Pierre",      reflectance: 0.30, description: "Granit gris poli" },
  { id: "beton-gris",      name: "Béton gris brut",     type: "Béton",       reflectance: 0.25, description: "Dalle béton non traitée" },
  { id: "carreau-rouge",   name: "Carreau rouge brique",type: "Carrelage",   reflectance: 0.20, description: "Carrelage céramique rouge/brique" },
  { id: "parquet-fonce",   name: "Parquet foncé",       type: "Bois",        reflectance: 0.15, description: "Parquet bois foncé" },
  { id: "terre-battue",    name: "Terre battue",        type: "Sol naturel", reflectance: 0.10, description: "Sol en terre compactée" },
  { id: "pierre-noire",    name: "Pierre noire",        type: "Pierre",      reflectance: 0.06, description: "Ardoise ou pierre sombre polie" },
];
```

---

## PHASE 3 — Écran "Sélection des Luminaires" (refonte complète)

### Contexte de l'écran actuel
L'écran actuel montre des cards de luminaires génériques (LED_Philips, LED_Osram, LED_General) qui sont toutes des dalles LED. La température de couleur est modifiable dans les filtres, ce qui ne doit plus être le cas. Les halos dans les prévisualisations ne sont pas réalistes.

### Ce qu'il faut faire

Refonds complètement l'écran "Sélection des Luminaires" dans Illuminex.

**STRUCTURE — 5 onglets horizontaux**
```
[ Incandescent ] [ Fluorescent ] [ LED ] [ Halogène ] [ Fournisseurs ]
```

**CHAQUE ONGLET (1 à 4) — Cards de produits**

Chaque card affiche :
- Illustration du luminaire avec halo réaliste (voir spécifications halos ci-dessous)
- Nom du modèle
- Champs **ÉDITABLES** par l'utilisateur : Flux (lm) | Puissance (W) | Prix unitaire (FCFA)
- Champ **NON MODIFIABLE** : Température de couleur Tc — affiché comme badge coloré, récupérée depuis le store global (définie par le type de pièce à l'Écran 2)
- IRC indicatif (non modifiable)

**RÈGLE CRITIQUE — Température de couleur**
La Tc NE DOIT JAMAIS être modifiable. Elle est calculée automatiquement selon ce tableau :

| Type de pièce           | Tc imposée  | Badge couleur |
|-------------------------|-------------|---------------|
| Chambre, Salon          | 2700K–3000K | Orange #FF9A3C |
| Cuisine, Couloir, Sanitaires | 3000K–3500K | Blanc #F5F5DC |
| Bureau, Classe, Réunion | 4000K       | Bleu #93C5FD  |
| Commerce, Magasin       | 3000K–4000K | Blanc #F5F5DC |

Afficher un tooltip sur le badge : "Définie automatiquement selon EN 12464-1 pour votre type de pièce. Non modifiable."

**BIBLIOTHÈQUE PAR DÉFAUT — Créer `src/data/luminaires-library.js`**

```js
export const LUMINAIRES_LIBRARY = {
  incandescent: [
    { id: "inc-60w",  name: "Ampoule E27 60W",   flux: 800,  puissance: 60,  irc: 100, prix: 500,  description: "Ampoule classique" },
    { id: "inc-100w", name: "Ampoule E27 100W",  flux: 1380, puissance: 100, irc: 100, prix: 700,  description: "Ampoule classique forte" },
  ],
  fluorescent: [
    { id: "flu-t8-18", name: "Tube T8 18W 60cm",    flux: 1350, puissance: 18, irc: 80, prix: 1500, description: "Tube fluorescent court" },
    { id: "flu-t8-36", name: "Tube T8 36W 120cm",   flux: 3350, puissance: 36, irc: 80, prix: 2500, description: "Tube fluorescent standard" },
    { id: "flu-flc",   name: "Fluo compact 15W E27", flux: 900,  puissance: 15, irc: 82, prix: 1200, description: "Ampoule fluo compacte" },
  ],
  led: [
    { id: "led-9w",   name: "LED E27 9W",          flux: 800,  puissance: 9,  irc: 80, prix: 2500,  description: "LED standard" },
    { id: "led-12w",  name: "LED E27 12W",          flux: 1100, puissance: 12, irc: 80, prix: 3500,  description: "LED standard puissante" },
    { id: "led-spot", name: "Spot LED GU10 7W",     flux: 600,  puissance: 7,  irc: 85, prix: 3000,  description: "Spot encastré" },
    { id: "led-24w",  name: "Dalle LED 24W 30x30",  flux: 2200, puissance: 24, irc: 80, prix: 8000,  description: "Dalle plafond" },
    { id: "led-36w",  name: "Dalle LED 36W 60x60",  flux: 3600, puissance: 36, irc: 80, prix: 12000, description: "Grande dalle plafond" },
  ],
  halogene: [
    { id: "hal-28w",  name: "Halogène GU10 28W",   flux: 370, puissance: 28, irc: 100, prix: 1500, description: "Spot halogène" },
    { id: "hal-50w",  name: "Halogène GU10 50W",   flux: 700, puissance: 50, irc: 100, prix: 2000, description: "Spot halogène puissant" },
  ],
};
```

**HALOS LUMINEUX RÉALISTES (CSS/Canvas)**

Appliquer ces styles dans les cards ET dans la simulation 2D/3D :

```css
/* Incandescent — chaud, large, orangé */
.halo-incandescent {
  background: radial-gradient(circle, rgba(255,160,30,0.75) 0%, rgba(255,120,0,0.3) 30%, transparent 70%);
  filter: blur(8px);
  width: 90px; height: 90px;
}

/* Fluorescent — diffus, bleuté, très étalé */
.halo-fluorescent {
  background: radial-gradient(circle, rgba(200,225,255,0.45) 0%, rgba(180,210,255,0.2) 40%, transparent 75%);
  filter: blur(14px);
  width: 140px; height: 60px; /* ellipse horizontale */
}

/* LED — net, blanc pur, concentré */
.halo-led {
  background: radial-gradient(circle, rgba(255,255,245,0.90) 0%, rgba(220,240,255,0.4) 35%, transparent 65%);
  filter: blur(4px);
  width: 55px; height: 55px;
}

/* Halogène — très intense, blanc chaud, petit */
.halo-halogene {
  background: radial-gradient(circle, rgba(255,255,200,0.95) 0%, rgba(255,240,150,0.5) 30%, transparent 60%);
  filter: blur(3px);
  width: 45px; height: 45px;
}
```

**CALCUL AUTOMATIQUE DU NOMBRE DE LUMINAIRES**

Bouton "Calculer le nombre nécessaire" qui affiche :

```
Formule : N = (E × S) / (Φ × CU × MF)

E = éclairement normatif du type de pièce (lux, depuis norms.js)
S = surface du sol (m², depuis l'Écran 2)
Φ = flux du luminaire sélectionné (lm)
CU = calculé depuis le ratio de salle k = (L × l) / (H_travail × (L + l))
     k < 1 → CU = 0.40 | 1 ≤ k < 2 → CU = 0.50 | 2 ≤ k < 3 → CU = 0.60 | k ≥ 3 → CU = 0.70
MF = sélectionnable par l'utilisateur :
     Propre (bureaux, classes) → 0.80
     Normal                    → 0.70
     Sale (cuisine, atelier)   → 0.60
```

Afficher : résultat N arrondi au supérieur + disposition suggérée (ex: "4 rangées × 3 colonnes")

**ONGLET 5 — Fournisseurs partenaires**

Cards avec : nom de la quincaillerie, ville, nombre de produits, bouton "Voir le catalogue" (lien externe)

```js
export const FOURNISSEURS = [
  { name: "Quincaillerie Moderne", city: "Cotonou, Bénin",    products: 127, url: "#" },
  { name: "Électro Dakar",         city: "Dakar, Sénégal",    products: 89,  url: "#" },
  { name: "Lumières Abidjan",      city: "Abidjan, CI",       products: 203, url: "#" },
];
```

Message en bas : "Vous êtes fournisseur ? Contactez-nous pour intégrer votre catalogue."

---

## PHASE 4 — Écran "Éclairage Naturel" (refonte logique)

### Contexte de l'écran actuel
L'écran actuel utilise des données de Paris, France. Les halos jaunes sont peu réalistes. Il faut remplacer toute la logique météo par les données NASA POWER adaptées à l'Afrique subsaharienne.

### Ce qu'il faut faire

Refonds la logique de l'écran "Éclairage Naturel" dans Illuminex.

**LOGIQUE DE CALCUL — Implémenter dans `src/utils/solar-calc.js`**

```
ÉTAPE 1 : Récupérer le climat depuis le store global (défini à l'Écran 2)
ÉTAPE 2 : Charger le fichier de données correspondant :
  Équatorial       → src/data/climate/equatorial.json
  Tropical humide  → src/data/climate/tropical-humide.json
  Tropical sec     → src/data/climate/tropical-sec.json
  Semi-aride       → src/data/climate/sahel.json
  Désertique       → src/data/climate/desertique.json
  Méditerranéen    → src/data/climate/mediterraneen.json

ÉTAPE 3 : Lire les valeurs ALLSKY et CLRSKY pour le mois et l'heure sélectionnés

ÉTAPE 4 : Calculer f
  f = ALLSKY / CLRSKY
  (si CLRSKY = 0, alors f = 0)

ÉTAPE 5 : Déterminer K (efficacité lumineuse)
  if f >= 0.90  → K = 110  (ciel clair ☀️)
  if f >= 0.60  → K = 105  (partiellement nuageux ⛅)
  else          → K = 120  (couvert ☁️)

ÉTAPE 6 : Calculer l'éclairement extérieur
  E_extérieur = ALLSKY × K  (en lux)

ÉTAPE 7 : Afficher E_extérieur, le type de ciel, et utiliser cette valeur dans la simulation
```

**STRUCTURE DES FICHIERS DE DONNÉES — Créer les 6 fichiers JSON vides avec cette structure**

```json
// src/data/climate/equatorial.json (exemple)
{
  "metadata": {
    "climate": "Equatorial",
    "representativeCity": "Libreville, Gabon",
    "source": "NASA POWER 2015-2025 (moyenne)",
    "unit": "W/m²"
  },
  "data": {
    "1": {
      "6":  { "ALLSKY": 0,     "CLRSKY": 0     },
      "7":  { "ALLSKY": 120.5, "CLRSKY": 180.2 },
      "8":  { "ALLSKY": 350.0, "CLRSKY": 520.0 },
      "9":  { "ALLSKY": 520.0, "CLRSKY": 700.0 },
      "10": { "ALLSKY": 640.0, "CLRSKY": 800.0 },
      "11": { "ALLSKY": 690.0, "CLRSKY": 820.0 },
      "12": { "ALLSKY": 710.0, "CLRSKY": 840.0 },
      "13": { "ALLSKY": 695.0, "CLRSKY": 830.0 },
      "14": { "ALLSKY": 620.0, "CLRSKY": 790.0 },
      "15": { "ALLSKY": 500.0, "CLRSKY": 680.0 },
      "16": { "ALLSKY": 340.0, "CLRSKY": 500.0 },
      "17": { "ALLSKY": 140.0, "CLRSKY": 220.0 },
      "18": { "ALLSKY": 20.0,  "CLRSKY": 50.0  },
      "19": { "ALLSKY": 0,     "CLRSKY": 0     }
    }
  }
}
```

Les valeurs réelles seront fournies par le propriétaire du projet après traitement des données NASA POWER. Créer les fichiers avec cette structure vide/exemple pour l'instant.

**INTÉGRATION SUNCALC**

```bash
npm install suncalc
```

```js
import SunCalc from 'suncalc';

// Utiliser latitude/longitude de l'Écran 2
const sunPos = SunCalc.getPosition(date, latitude, longitude);
const azimuth = sunPos.azimuth * (180 / Math.PI) + 180; // en degrés
const altitude = sunPos.altitude * (180 / Math.PI);     // en degrés

const sunTimes = SunCalc.getTimes(date, latitude, longitude);
// sunTimes.sunrise, sunTimes.sunset → afficher les heures de lever/coucher
```

Afficher sur un diagramme SVG simple : cercle = ciel vu du dessus, point = position du soleil, arc = trajectoire approximative

**MODIFICATIONS DE L'UI**
- Supprimer la ville "Paris, France" → utiliser la ville sélectionnée à l'Écran 2
- Ajouter un badge dynamique "Type de ciel" (Clair ☀️ / Partiellement nuageux ⛅ / Couvert ☁️)
- Conserver les sliders Luminosité soleil et Luminosité ciel comme multiplicateurs (×0.5 à ×1.5 sur E_extérieur)
- Afficher en grand : "Éclairement extérieur : X XXX lux"

---

## PHASE 5 — Écran "Simulation 2D/3D"

### Contexte de l'écran actuel
L'écran actuel affiche une vue 2D (plan du dessus) à gauche et une vue 3D perspective à droite. Les halos sont jaunes vifs et uniformes (peu réalistes). La section du bas montre des checkboxes Éclairement + un tableau Résultats basique.

### Ce qu'il faut faire

Modifie l'écran "Simulation 2D/3D" dans Illuminex.

**1. HALOS LUMINEUX — Appliquer les styles selon le type de luminaire**

Dans la vue 2D (canvas ou SVG) et la vue 3D, remplacer les halos jaunes uniformes par les gradients définis en Phase 3 (`.halo-incandescent`, `.halo-fluorescent`, `.halo-led`, `.halo-halogene`). Le type de luminaire est récupéré depuis le store global.

**2. REMPLACER la section du bas par deux blocs**

**BLOC A — Slider Température de couleur (indicatif)**
```
[  2700K ══════════════●══════════════ 6500K  ]
   ████████████████░░░░░░░░░░░░░░░░░░░
   (dégradé : #FF9A3C → #FFFFFF → #C9E2FF)

Label sous le slider : "Votre luminaire : 4000K — Blanc neutre"
Note : ce slider est indicatif uniquement, il montre la position de la Tc choisie
```

**BLOC B — Estimation Budget & Énergie**

Afficher deux colonnes côte à côte :

```
ESTIMATION BUDGÉTAIRE          CONSOMMATION ÉNERGÉTIQUE
─────────────────────          ────────────────────────
Luminaires                     Puissance totale
N × Prix unitaire = X FCFA     N × W = XX W         [fixe]

Installation estimée           Coût du kWh
[champ éditable]  FCFA         [éditable] FCFA/kWh

TOTAL                          Heures / jour
Luminaires + Install = X FCFA  [éditable, défaut 8h]

                               Coût mensuel (30j)
                               calculé automatiquement FCFA

                               Coût annuel
                               calculé automatiquement FCFA
```

Formules à implémenter :
```js
const puissanceTotale = N * puissanceUnitaire; // W
const consoMensuelle = (puissanceTotale * heuresParJour * 30) / 1000; // kWh
const coutMensuel = consoMensuelle * coutKwh; // FCFA
const coutAnnuel = coutMensuel * 12; // FCFA
```

Valeur par défaut `coutKwh` selon pays (récupéré depuis le store) :
```js
const COUT_KWH_PAR_PAYS = {
  "Bénin": 125, "Sénégal": 118, "Côte d'Ivoire": 130,
  "Ghana": 95,  "Cameroun": 112, "Kenya": 140,
  default: 120
};
```

Mettre à jour tous les calculs en temps réel quand l'utilisateur modifie un champ éditable.

**3. CONSERVER**
- Vue 2D + vue 3D côte à côte
- Bouton "Exporter simulation"
- Bouton "Continuer vers analyse"

---

## PHASE 6 — Écran "Analyse & Optimisation"

### Action requise : AUCUNE MODIFICATION

Conserver l'écran tel quel. Vérifier uniquement que :
- U0 est calculé comme `U0 = E_min / E_moyen`
- Si U0 < valeur normative du type de pièce → afficher un badge rouge "Non conforme"
- Si U0 ≥ valeur normative → badge vert "Conforme"

Valeurs normatives U0 par type de pièce :
```js
export const NORMS_U0 = {
  "Salle de classe": 0.60,
  "Bureau": 0.60,
  "Salle de réunion": 0.60,
  "Cuisine": 0.70,
  "Chambre": 0.40,
  "Salon": 0.40,
  "Couloir": 0.40,
  "Sanitaires": 0.40,
  "Commerce": 0.60,
};
```

---

## PHASE 7 — Écran "Rapport & Export"

### Contexte de l'écran actuel
L'écran actuel a un formulaire (nom projet, client, adresse, auteur), une preview du rapport, et des options d'export. Il manque la section tarifaire dans le rapport PDF.

### Ce qu'il faut faire

Modifie l'écran "Rapport & Export" pour intégrer les données budgétaires dans le rapport PDF.

**1. AJOUTER dans le formulaire**
- Champ "Coût d'installation (FCFA)" — pré-rempli avec la valeur saisie à l'Écran 5
- Case à cocher "Inclure l'estimation budgétaire dans le rapport" (cochée par défaut)

**2. AJOUTER dans le rapport PDF exporté — Section "Budget & Consommation"**

Insérer cette section après la section "Résultats d'éclairage" :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ESTIMATION BUDGÉTAIRE & ÉNERGÉTIQUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVESTISSEMENT INITIAL
  Luminaires : [N] × [Nom] [W]      [N × Prix] FCFA
  Installation estimée                   [X] FCFA
  ─────────────────────────────────────────────
  TOTAL INVESTISSEMENT                [TOTAL] FCFA

CONSOMMATION ÉNERGÉTIQUE
  Puissance installée              [N × W] W
  Utilisation journalière          [H] h/j
  Coût du kWh                      [C] FCFA
  Consommation annuelle            [kWh/an] kWh
  Coût mensuel estimé              [CM] FCFA
  Coût annuel estimé               [CA] FCFA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**3. VÉRIFIER que le rapport PDF inclut aussi**
- Tableau de conformité aux normes :

| Indicateur | Valeur mesurée | Valeur normative | Conformité |
|---|---|---|---|
| Éclairement moyen | XXX lux | YYY lux | ✅ / ❌ |
| Uniformité U0 | 0.XX | 0.YY | ✅ / ❌ |
| IRC | XX | 80 | ✅ / ❌ |

- Informations pays / ville / climat (récupérées depuis l'Écran 2)
- Liste des matériaux avec leurs réflectances (depuis l'Écran 2b)
- Vue 2D schématique de la disposition des luminaires

---

## FICHIER DE NORMES — Créer `src/data/norms.js`

```js
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
```

---

*Illuminex — Guide de développement v1.0 | Afrique subsaharienne*
