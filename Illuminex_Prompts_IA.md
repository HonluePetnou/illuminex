# ILLUMINEX — Prompts de développement
# App Electron + React | Simulation d'éclairage | Afrique subsaharienne
# Passer chaque bloc séparément à l'IA dans l'ordre indiqué

---

## CONTEXTE GLOBAL (à inclure dans CHAQUE prompt)

Tu travailles sur **Illuminex**, une application desktop (Electron + React) de simulation d'éclairage intérieur destinée à l'Afrique subsaharienne. L'app utilise un design system "Expert UI Anthracite". 
Utilise ces tokens CSS (palette) partout :
- Background principal : `#1C1D24`
- Surfaces (cards, panneaux) : `#23242B`
- Surfaces secondaires (hover) : `#2B2C35`
- Bordures : `#3A3A44`
- Couleur primaire (Boutons, accents) : `#3B82F6` ou `#5A84D5` selon le composant
- Accentuation (Warn, highlights) : `#F0A500` ou `#FFB84D`
- Text principal : `#FFFFFF`
- Text secondaire (muted) : `#A0A0A5` ou `#94A3B8`
- Text dim : `#6D6D78` ou `#64748B`
- Inputs : `#15151B`

Le style est un mode sombre professionnel, sans glassmorphism excessif, avec des bordures fines (1px solid border) et des coins légèrement arrondis (6px à 12px). 

---

## PHASE 1 — Navigation globale et Accueil

### Contexte
La page d'accueil et la barre de navigation doivent adopter le thème Expert UI Anthracite (`#1C1D24` pour le fond). Finis les dégradés complexes et les cartes de grandes dimensions.

### Ce qu'il faut faire
- Header avec titre et boutons (Filtres, Plans) en haut
- Barre latérale de navigation avec icônes de Lucide React
- Remplacer toute mention "Bénin" strict par "Afrique subsaharienne" de manière générale, tout en permettant le choix précis du pays dans la simulation.

---

## PHASE 2 — Écran "Paramètres de Base" (Dimensions)

### Ce qu'il faut faire
Cet écran remplace l'ancienne "Définition de la Pièce". 

**STRUCTURE**
- **Gauche (Aperçu et Stats) :** Boîte 3D filaire (wireframe) représentant la pièce sélectionnée avec une lumière simulée et légende des valeurs de Surface (m²) et Volume (m³). Un badge "Climat" (ex: "BÉNIN - Tropical humide") s'affiche en superposition. En dessous, 3 petites cartes pour Longueur, Largeur, et Hauteur avec leurs valeurs brutes.
- **Droite (Formulaire) :** 3 sections empilées :
  - *Dimensions de la pièce* : Inputs pour Longueur, Largeur, Hauteur totale, Plan de travail.
  - *Localisation & Orientation* : Liste déroulante Pays (groupés par régions comme 'Afrique de l'Ouest', 'Afrique Centrale'), Liste déroulante Orientation façade. Affichage du climat local correspondant.
  - *Usage & Occupation* : Type de bâtiment, Nb d'occupants, Horaires/Jour, Jours/Semaine.

Validation par un bouton "Matériaux & Surfaces →".

---

## PHASE 2b — Nouvel écran "Matériaux & Surfaces"

### Ce qu'il faut faire
Cet écran remplace les anciens sliders de réflectance bruts.

**STRUCTURE**
- **Gauche (Sélection) :** 3 Blocs : PLAFOND, MURS, SOL. Chaque bloc comporte une icône colorée, et deux listes déroulantes : "Couleur / Peinture" et "Matériau". Lorsqu'une option est sélectionnée, la Réflectance (%) est calculée et un badge couleur l'indique.
- **Droite (Récapitulatif - fixée en sticky) :** 
  - Résumé des réflectances (Plafond, Murs, Sol) et de leurs surfaces respectives.
  - *R_moyen* calculé globalement avec une barre de progression colorée (rouge, orange, vert).
  - Un badge qualitatif (Ex: "Bonne réflectance").
  - Valeur de l'IRC estimé.

---

## PHASE 3 — Écran "Sélection des Luminaires"

### Ce qu'il faut faire
Refonte complète avec le design system Expert UI Anthracite.

**STRUCTURE**
- **Sidebar gauche (Filtres) :** Curseurs (Range sliders customisés) pour : Flux lumineux, Puissance (W), Température colorée (K), et IRC. Sélection rapide de dimension (ex: 600x600).
- **Zone Principale :** 
  - *En-tête* : Barre de recherche globale, bouton "Mode Expert", et des sous-filtres avec icônes.
  - *Grille de Cartes* : Chaque carte luminaire inclut une vue 3D filaire du luminaire avec un panneau rayonnant, les spécifications (lm, W, lm/W, K, IRC), et surtout une courbe photométrique vectorielle `PhotometricCurve` dessinée dynamiquement avec des données factices ou calculées.
  - *Action Floating* : Un gros bouton "Calculer le nombre auto" flottant en bas à droite pour valider.

---

## PHASE 4 — Écran "Éclairage Naturel"

### Ce qu'il faut faire
Implémentation poussée de l'éclairage de jour (Naturel).

**STRUCTURE**
- **Barre d'outils médiane :** Trois blocs affichant Date/Heure, Localisation, et Météo (Type de couverture nuageuse, température) avec jauges d'options (ex: Transparence).
- **Zone Principale :**
  - *Faux rendu 3D Gauche* : Une boite contenant des rayons volumétriques (`volumetric rays`) dessinée via des dégradés CSS, reflétant la puissance du soleil et l'angle d'incidence.
  - *Sidebar Droite* : Sliders pour Luminosité Soleil, Ciel, et Lumière Ambiante, et toggle Rayons. 
- **Panneau inférieur (Heatmap) :** Un aperçu de la répartition de l'éclairement en faux-couleurs (Lux) et des statistiques clés ("Moyenne", "Max"). 

---

## PHASE 5 — Écran "Simulation Dashboard" (2D/3D & Résultats Finaux)

### Ce qu'il faut faire
Le point culminant de l'outil, combinant rendu spatial et KPI techniques.

**STRUCTURE**
- **Top Split Area :**
  - *Gauche (Vue Spatiale)* : Un conteneur 2D/3D (Toggle 2D/3D en haut). L'affichage `RoomSimulation2D` montre la grille de luminaires, les lux.
  - *Droite (Détails KPI)* : Cartes avec des valeurs métriques fortes : UGR (Éblouissement), LPD (Efficacité Énergétique W/m²), et U0 (Uniformité). Petit bloc "Résumé de l'Éclairage" en dessous avec Moyenne, Min, Total(lm).
- **Bottom Area (False Color Scale) :** Une échelle de couleur visuelle paramétrable (Slider "FalseColorScale" avec crans log/lux) pour modifier à la volée le rendu thermique des résultats.
- **Footer :** Heure d'analyse et bouton de validation "Continuer l'analyse".

---

## PHASE 6 — Écran "Analyse & Optimisation"

*(Aucun changement majeur de logique, mais un alignement sur les couleurs Anthracite `#1C1D24`)*
Garantir que le bouton d'export est visible et utilise `#3B82F6` ou `#5A84D5`.

---

## PHASE 7 — Écran "Rapport & Export"

### Ce qu'il faut faire
Mettre en page la section Rapport avec un layout sombre (Anthracite), et implémenter l'export PDF (via `reportGenerator.js`).

**AJOUTER DANS LE RAPPORT PDF**
S'assurer d'inclure :
- Tableau des performances (Flux total, kW, LPD).
- Bilan budgétaire estimatif.
- Graphiques de répartition lumineuse.

---

*Illuminex — Prompts de développement mis-à-jour (Aligned with current Expert UI architecture).*
