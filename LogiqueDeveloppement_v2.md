


## LOGICIEL DE DIMENSIONNEMENT
## D'ECLAIRAGE

## Documentation Technique — Logique Fonctionnelle Complete



## AVANT DE COMMENCER
Ce que tu dois savoir avant de toucher au code

Salut ! Ce document est fait pour toi qui vas developper ce logiciel. Tu n'as pas de background en electricite ni
en energie, donc je vais tout expliquer depuis la base. Chaque formule est decortiquee variable par variable,
avec sa source verifiable. Rien n'est laisse au hasard.

Ce logiciel permet de simuler l'eclairage d'une piece : combien de lampes installer, est-ce qu'il y a assez de
lumiere naturelle, et est-ce que la piece sera thermiquement confortable. A la fin, il genere un rapport PDF
complet.

INFO — Principe fondamental : chaque interface collecte des donnees qui alimentent les calculs suivants. Si
l'utilisateur change quelque chose en amont, TOUT se recalcule automatiquement en cascade. C'est la regle
d'or du code.

Changements par rapport a la version precedente :
- Partenariat quincailleries abandonne — la bibliotheque de luminaires est uniquement interne
- Les tableaux NASA POWER ont maintenant 4 colonnes : ALLSKY (W/m2), f,  T2M (temperature air en
C), WS10M (vent a 10m en m/s)
- Les fenetres peuvent etre ouvertes ou fermees — change le calcul du confort thermique ET la plage de
confort
- Toutes les formules sont maintenant sourcees avec references verifiables


## 1. FLUX GENERAL DU LOGICIEL
Vue d'ensemble des 8 interfaces et de ce qui se passe en arriere-plan

Le logiciel se traverse en 8 interfaces dans l'ordre. Voici le flux global :

## 1
## Accueil & Configuration
Pays, type de piece, orientation -> climat deduit, lat/long fixee, normes d'eclairage chargees
automatiquement
## 2
Geometrie de la piece
Dimensions, hauteur plan de travail, type de vitrage -> calcul de toutes les surfaces + RCR
## 3
## Materiaux & Couleurs
Choix depuis bibliotheque -> reflectances auto -> calcul R_moyen, CU, DF
## 4
Room Planning 2D
Placement fenetres (ouvertes/fermees), portes, meubles -> S_fenetres calcule, DF mis a jour
## 5
Choix des luminaires
Selection + saisie flux/puissance/prix -> calcul N (nombre luminaires), placement auto en grille
## 6
Simulation 3D + Rendu journalier
Vue 3D + animation soleil 24h comme video + vue 2D uniformite. Moteur eclairage naturel en
arriere-plan.
## 7
## Couts & Consommation
Resume budgetaire automatique base sur tout ce qui precede
## 8
Rapport PDF
Rapport complet avec section confort thermique et conseils personnalises

BON A SAVOIR — Tout au long de l'utilisation, le logiciel stocke silencieusement : vitrage + SHGC, materiaux,
climat, orientation, etat des fenetres (ouvertes/fermees), T2M et WS10M du tableau. Ces donnees
n'apparaissent que dans le rapport PDF. L'utilisateur ne les voit pas pendant la saisie.


## 2. DETAIL INTERFACE PAR INTERFACE
Logique, donnees collectees, calculs declenches

Interface 1 — Accueil & Configuration de base

Premiere interface vue par l'utilisateur. Elle fixe les parametres de base qui conditionnent TOUT le reste du
logiciel.

Ce que l'utilisateur renseigne :
- Nom du projet (champ texte libre — aucun calcul)
- Pays (liste deroulante)
- Type de piece (bureau, classe, chambre, cuisine, salon, couloir, sanitaires, commerce)
- Orientation du batiment (Nord/Nord-Est/Est... — par defaut : Nord-Sud)

Deduction automatique par pays :

Des que le pays est choisi, le logiciel consulte sa table interne. Les coordonnees ci-dessous sont
EXACTEMENT celles des points NASA POWER utilises pour generer les tableaux climatiques :

Pays / Ville de
reference
## Climat Latitude
exacte
## Longitude
exacte
Fichier de donnees
Benin (Cotonou) Tropical humide 6.3546 2.4037 climate-tropical-humide.js
Cameroun (Douala) Equatorial 4.0549 9.6987 climate-equatorial.js
Niger (Niamey) Semi-aride (Sahel) 13.508 2.116 climate-semi-aride.js
## Burkina Faso
(Ouagadougou)
Tropical sec 12.3715 -1.5199 climate-tropical-sec.js
Algerie (Tamanrasset) Desertique 22.7914 5.5318 climate-desertique.js
Tunisie (Tunis) Mediterraneen 36.8001 10.1871 climate-mediterraneen.js

ATTENTION — Ces coordonnees sont EXACTEMENT celles utilisees pour telecharger les donnees NASA
POWER. Ne les modifie pas.

Normes d'eclairage chargees automatiquement selon le type de piece :

Type de piece Lux (E) UGR
max
IRC min Temp. couleur MF
Bureau / Open space 500 19 80 4000K 0.80
Salle de classe 500 19 80 4000K 0.80
Salle de reunion 500 19 80 4000K 0.80
Cuisine (plan de
travail)
## 500 22 80 3000K-4000K 0.60
Chambre a coucher 100-300 25 80 2700K-3000K 0.70
Salon 150-200 25 80 2700K-3000K 0.70
Couloir / Circulation 100-150 25 80 3000K-4000K 0.70
Sanitaires 200 25 80 3000K-4000K 0.70
Magasin / Commerce 300-750 22 80-90 3000K-4000K 0.70


INFO — Source : EN 12464-1:2021 (Lumiere et eclairage — Eclairage des lieux de travail intérieurs). Norme
europeenne de reference, adoptee internationalement. La temperature de couleur est fixee PAR LE LOGICIEL
selon le type de piece — l'utilisateur ne peut pas la modifier.

Interface 2 — Geometrie de la piece

L'utilisateur renseigne les dimensions physiques. Tous les calculs de surfaces sont declenches ici et utilises
dans presque toutes les formules suivantes.

Ce que l'utilisateur renseigne :
- Longueur (L) en metres
- Largeur (l) en metres
- Hauteur sous plafond (H) en metres
- Hauteur du plan de travail (h_pt) — uniquement si le type de piece implique un plan de travail. Valeur
normative proposee par defaut, modifiable par l'utilisateur.
- Type de vitrage (liste deroulante)

Hauteurs normatives du plan de travail :

Type de piece Hauteur par defaut Source
Bureau / Open space 0.75 m EN ISO 9241-5 (ergonomie du poste de travail)
Salle de classe
(élèves) / 0.85 m
## (prof)
EN 1729-1 (mobilier scolaire)
Cuisine (plan de travail) 0.85 m EN 1116 (meubles de cuisine)
Chambre (niveau lit) 0.60 m Usage courant — norme ergonomique
## Salon
0.40 m (table basse)
Usage courant

Tableau des vitrages — T, SHGC et impact :

T = facteur de transmission lumineuse (% de lumiere qui traverse la vitre).
SHGC = Solar Heat Gain Coefficient = fraction de la chaleur solaire transmise dans la piece. Ces deux valeurs
interviennent respectivement dans l'eclairage et le confort thermique.

Type de vitrage T (lumiere) SHGC (chaleur) Isolation thermique
Simple vitrage 0.85 0.85 Tres faible
Double vitrage standard 0.72 0.65 Moyenne
Double vitrage low-E 0.65 0.35 Bonne
Triple vitrage 0.55 0.25 Excellente
Vitrage teinte / solaire 0.45 0.25 Bonne (anti-chaleur)

INFO — Sources : EN 410:2011 pour les valeurs T. SHGC issus de l'ASHRAE Fundamentals Handbook 2021
ch. 15 et des fiches fabricants (Saint-Gobain, AGC Glass). Ces valeurs sont des moyennes representatives —
les indiquer comme 'valeurs indicatives' dans le code.

Calculs declenches automatiquement :
S_sol = L x l

S_plafond = L x l
S_murs = 2 x (L + l) x H
## S_totale = S_sol + S_plafond + S_murs

Et le RCR (Room Cavity Ratio = Indice du local). C'est un nombre sans unite qui resume la forme de la piece. Il
permet d'estimer le CU a l'etape suivante.
RCR = (5 x h x (L + l)) / (L x l)

Ou h = hauteur utile = H - h_pt (distance entre le luminaire au plafond et le plan de travail).

BON A SAVOIR — Source RCR : methode des cavites zonales, IESNA Lighting Handbook 10e edition (2011),
section 9. Exemple : piece 6x5x3m, h_pt=0.75m -> h=2.25m -> RCR=(5x2.25x11)/(30)=4.125.

Interface 3 — Materiaux & Couleurs des surfaces

L'utilisateur choisit les materiaux et couleurs de chaque surface. La couleur des murs et du plafond influence
directement la quantite de lumiere qui rebondit dans la piece — une piece aux murs blancs sera bien plus
lumineuse qu'une piece aux murs sombres, a nombre de lampes egal.

La reflectance R : ce que c'est
R = pourcentage de lumiere que la surface renvoie. R=0.85 signifie que la surface renvoie 85% et absorbe
15%. Elle depend du materiau ET de la couleur.

Bibliotheque de couleurs (murs et plafond) :

## Couleur / Finition Type R
Blanc pur / Blanc casse Peinture 0.85
## Creme / Ivoire Peinture 0.75
Jaune pale Peinture 0.70
Beige clair Peinture 0.65
Vert menthe / Bleu ciel pale Peinture 0.55
Gris clair Peinture 0.50
Jaune moutarde / Orange pastel Peinture 0.45
Bleu moyen / Vert moyen Peinture 0.35
Gris fonce Peinture 0.25
## Marron / Bordeaux Peinture 0.20
Noir / Tres fonce Peinture 0.05

Bibliotheque de materiaux (sols) :

Materiau Type Couleur typique R
Carrelage blanc / clair Carreaux Blanc / Creme 0.75
Carrelage beige / sable Carreaux Beige 0.55
Carrelage gris Carreaux Gris moyen 0.35
Carrelage fonce / noir Carreaux Noir / Anthracite 0.10

Materiau Type Couleur typique R
Marbre blanc Pierre Blanc veine 0.70
Parquet clair (chene naturel) Bois Beige / Miel 0.40
Parquet fonce (wenge, etc.) Bois Brun fonce 0.15
Beton brut Beton Gris 0.25
Terre battue / Laterite Sol naturel Rouge-brun 0.15
Moquette claire Textile Beige / Ecru 0.40
Moquette foncee Textile Marron / Gris fonce 0.15

INFO — Sources : CIBSE Lighting Guide LG10 (2014), IES Lighting Handbook 10e ed. Tableau 9.1, Munsell
Book of Color. A stocker dans data/materials-library.js.

Calcul de de la Réflectance Moyenne Pondérée (R_moyen) :

Une fois que l'utilisateur a choisi ses matériaux pour le plafond, les murs et le sol, le logiciel calcule R_moyen.
C'est une moyenne pondérée par la surface de chaque élément : une grande surface avec une faible
réflectance compte plus qu'une petite surface avec une haute réflectance.

R_moyen = (S_plafond x R_plafond + S_murs x R_murs + S_sol x R_sol) /
## S_totale

BON A SAVOIR — Source : methode de la reflectance moyenne ponderee, CIBSE Code for Lighting (2012),
chapitre 2. Exemple : piece 6x5x3m (S_totale=126m2), plafond blanc R=0.85, murs beige R=0.65, sol carrelage
gris R=0.35 -> R_moyen=(30x0.85+66x0.65+30x0.35)/126=0.626.

Calcul du CU (Coefficient d'Utilisation)  via RCR :
CU (Coefficient d'Utilisation) = fraction du flux lumineux des lampes qui atteint reellement le plan de travail.
Il dépend de la forme de la pièce (RCR) et de la réflectance des surfaces (R_moyen). Tu vas créer une table
d'interpolation simplifiée dans le code :

Formule d'estimation dans le code :
CU ~ 0.9 / (1 + RCR x (1 - R_moyen))

INFO — Approximation derivee de la methode des cavites (IESNA Handbook). Donne des resultats
satisfaisants pour un logiciel simplifie. Pour plus de precision, tu peux construire une table d'interpolation 2D
(RCR x R_moyen) issue des catalogues fabricants.

Interface 4 — Room Planning 2D

L'utilisateur place les elements de la piece. L'etat des fenetres (ouvertes ou fermees) est une donnee
CRITIQUE pour le confort thermique. Le logiciel la stocke silencieusement.

Elements placables :
- Fenetres avec dimensions. Pour chaque fenetre : option 'ouverte' ou 'fermee'. S_fenetres = somme de
toutes les fenetres.
- Portes (ouvertes ou fermees — pour le rendu 3D uniquement)
- Meubles basiques depuis la bibliotheque (table, bureau, lit, chaise, etagere...)


Calcul du Daylight Factor (DF) :
DF = pourcentage de lumiere exterieure qui arrive a l'interieur. DF=2% signifie que si dehors il y a 10 000 lux, a
l'interieur il y a ~200 lux de lumiere naturelle.
DF ~ 0.2 x (S_fenetres / S_sol) x f(R_moyen)

f(R_moyen) = facteur de correction selon la clarte des surfaces :
- R_moyen < 0.4 -> f = 0.8
- 0.4 <= R_moyen < 0.6 -> f = 1.0
- R_moyen >= 0.6 -> f = 1.2

INFO — Source : methode simplifiee BRE, Littlefair P.J. 'Site Layout Planning for Daylight and Sunlight' (BRE
Press, 2011). Acceptable pour un logiciel simplifie.


Interface 5 — Choix des Luminaires

L'utilisateur choisit ses luminaires depuis la bibliotheque interne du logiciel. Il peut modifier puissance (W), flux
(lm) et prix. Il ne peut PAS modifier la temperature de couleur.

ATTENTION — CHANGEMENT v2 : partenariat quincailleries abandonne. La bibliotheque est uniquement
interne au logiciel.

Bibliotheque de luminaires :

Reference Puissance Flux IRC Prix (FCFA) Usage
LED Standard E27 9W 9 W 800 lm 80 2 500 Residentiel
LED Standard E27 12W 12 W 1 100 lm 80 3 500 Residentiel / Bureau
LED Standard E27 15W 15 W 1 500 lm 80 4 200 Bureau / Classe
Tube LED T8 18W 120cm 18 W 1 800 lm 80 5 000 Bureau / Classe
Tube LED T8 36W 120cm 36 W 3 600 lm 80 8 500 Bureau / Classe
Plafonnier LED 24W 24 W 2 400 lm 80 12 000 Residentiel /
## Reunion
Plafonnier LED encastre
## 36W
36 W 3 800 lm 80 18 000 Bureau / Commerce
Reglette LED 40W 40 W 4 200 lm 80 14 000 Atelier / Cuisine

ATTENTION — L'utilisateur PEUT changer la puissance (W), le flux (lm) et le prix — ces valeurs servent aux
calculs. Il NE PEUT PAS changer la température de couleur — c'est le logiciel qui la fixe selon le type de pièce
(Interface 1).

Formule centrale : Methode des Lumens
N = (E x S) / (Φ x CU x MF)
## Où :
- E = Éclairement souhaité (lux) → valeur normative du tableau
- S = Surface du plan de travail (m²) → longueur × largeur
- Φ = Flux lumineux total d’un luminaire (lm) → l’utilisateur choisit ou entre la valeur
- CU = Coefficient d’utilisation (facteur d’utilisation) → entre 0.4 et 0.75 typiquement
- MF = Facteur de maintenance (variable)
NB: Pour MF;
Valeurs recommandées :
- Locaux propres (bureaux, classes) → 0.80
- Locaux normaux → 0.70
- Locaux sales (cuisine, atelier) → 0.60

Variable Signification Origine Valeur typique
N Nombre de luminaires
(arrondi superieur)
Resultat du calcul —
E Eclairement souhaite en lux Type de piece -> Interface 1 100 a 750 lux

Variable Signification Origine Valeur typique
S Surface du plan de travail =
L x l
Interface 2 m2
Phi Flux lumineux d'UN
luminaire (lm)
Saisi par l'utilisateur Interface 5 800 a 4200 lm
CU Coefficient d'Utilisation
(sans unite)
Calcule via RCR + R_moyen,
## Interfaces 2+3
0.30 a 0.75
MF Maintenance Factor (sans
unite)
Type de piece -> Interface 1 0.60 a 0.80

BON A SAVOIR — Source : methode des lumens (methode du flux), EN 12464-1:2021 + CIE 97:2005 (Guide
de maintenance des installations d'eclairage).
Exemple complet : classe 6x8m=48m2, E=500 lux, luminaire 3600 lm, CU=0.55, MF=0.80 ->
N=(500x48)/(3600x0.55x0.80)=15.15 -> 16 luminaires.

Placement automatique en grille :
Une fois N calculé, le logiciel doit placer les luminaires automatiquement en grille uniforme sur le plan 2D. La
logique est simple :
- Cherche les combinaisons entières (nx, ny) telles que nx × ny ≥ N avec nx et ny proches l'un de l'autre
(grille la plus carrée possible)
- Espace entre luminaires : dx = L / nx, dy = l / ny
- Premier luminaire à dx/2 de chaque mur (centré dans sa zone)

BON A SAVOIR — Exemple : N=16 → nx=4, ny=4. Pièce 8×6m → dx=2m, dy=1.5m. Premier luminaire à 1m
du mur en x et 0.75m en y. Les luminaires sont aux positions (1, 0.75), (3, 0.75), (5, 0.75), (7, 0.75), (1, 2.25)...
etc.


Interface 6 — Simulation 3D + Rendu Journalier

Interface la plus visuelle. La piece s'affiche en 3D avec eclairage artificiel et naturel. L'utilisateur choisit le mois
et lance la simulation — une animation video de 0h a 23h montre comment la lumiere naturelle evolue dans la
piece au fil de la journee.

INFO — L'eclairage naturel N'EST PAS une interface separee. C'est un moteur qui tourne en arriere-plan et
met a jour le rendu Three.js en temps reel. L'utilisateur choisit juste le mois et appuie sur 'Simuler la journee'.

Ce que l'interface affiche :
- La pièce en 3D (Three.js) avec les luminaires placés, les meubles, les fenêtres
- La lumière naturelle calculée en temps réel selon l'heure et le mois
- La vue 2D en fausses couleurs (plan vu de dessus) avec les niveaux de lux par zone
- Le scale de température de couleur (manipulable par l'utilisateur)
- Les résultats : E_moyen, E_min, Uniformité U0

Logique complete du moteur d'eclairage naturel :

## 1
Identifier le tableau climatique
Pays (Interface 1) -> climat -> fichier de donnees. Ex : Benin -> climate-tropical-humide.js
## 2
Lire ALLSKY et f

Dans le tableau du climat, lire ALLSKY (W/m2) et f (facteur de nebulosite, deja calcule dans le
tableau) pour le mois et l'heure selectionnes.
## 3
Choisir K selon f
f >= 0.9 -> ciel clair -> K = 110 lm/W | 0.6 <= f < 0.9 -> partiellement nuageux -> K = 105 lm/W | f <
0.6 -> couvert -> K = 120 lm/W
## 4
## Calculer E_exterieur
E_exterieur = ALLSKY x K (en lux). Ex : ALLSKY=691.7 W/m2, K=105 -> E_exterieur=72 628 lux
## 5
## Calculer E_interieur
E_interieur = E_exterieur x T x (DF/100). T = transmission vitrage (Interface 2), DF = Daylight Factor
(Interface 4).
## 6
Position du soleil avec SunCalc
npm install suncalc. Utiliser la lat/long EXACTE du climat (table Interface 1) + date/heure -> azimut
+ altitude du soleil.
## 7
Mise a jour Three.js
Azimut + altitude -> orienter la lumiere directionnelle Three.js. Intensite proportionnelle a
E_interieur. Si soleil sous l'horizon (nuit) : intensite = 0.

La simulation vidéo 24h :

Quand l'utilisateur clique sur 'Simuler la journée', le code lance une boucle de 0h à 23h (avec un setInterval ou
une animation requestAnimationFrame) qui exécute la séquence ci-dessus pour chaque heure et met à jour le
rendu Three.js en temps réel. L'utilisateur voit la lumière tourner autour de la pièce comme le soleil dans le ciel.
L’utilisateur peut ouvrir ou fermer les fenêtres en temps réel dans la 3D.
La boucle 24h (0h à 23h) prend aussi en compte l’état des fenêtres pour : – La quantité de lumière naturelle qui
entre – Le confort thermique (ventilation naturelle)

Calcul de l'uniformite U0 (vue 2D) :
L'uniformité mesure si la lumière est bien répartie dans la pièce ou s'il y a des zones très éclairées et des zones
sombres. Elle est calculée sur la vue 2D :

## U0 = E_min / E_moyen

Pour calculer E_min et E_moyen, tu divises le plan en une grille de points de mesure (ex: grille 10×10) et tu
calcules l'éclairement reçu à chaque point en fonction de la distance aux luminaires (loi du cosinus). E_min est
la valeur minimale et E_moyen est la moyenne. U0 doit être supérieur à la valeur normative du tableau de
l'Interface 1.

INFO — Source U0 : EN 12464-1:2021 section 4.4.2. Loi du cosinus inverse du carre : IES Lighting Handbook
10e ed., chapitre 4.

## Interface 7 — Couts & Consommation

Interface entierement automatique. L'utilisateur ajuste seulement : cout installation (main d'oeuvre), heures
d'utilisation/jour et cout du kWh.

Element Formule Valeur par defaut
Cout luminaires N x prix_unitaire (Interface 5) —

Element Formule Valeur par defaut
Cout installation Saisie manuelle 8 000 FCFA
TOTAL installation Cout luminaires + Cout installation —
Puissance totale N x Puissance_unitaire (W) —
Cout mensuel (Puissance_totale x heures_j x 30) / 1000 x
cout_kWh
## —
Cout annuel Cout_mensuel x 12 —

INFO — Valeurs par defaut : cout kWh = 125 FCFA (tarif residentiel SBEE Benin 2024), heures d'utilisation =
8h/jour. Modifiables par l'utilisateur.


## 3. CONFORT THERMIQUE — LOGIQUE COMPLETE ET CORRIGEE
Module invisible pendant l'utilisation — calcule en arriere-plan — apparait uniquement dans le rapport PDF

Le confort thermique mesure si une personne se sent bien dans la piece. On utilise le modele adaptatif de l'EN
15251 / ASHRAE 55, specialement concu pour les batiments naturellement ventiles des pays chauds. Ce
modele est bien plus adapte aux realites africaines que le PMV/PPD de Fanger qui suppose une climatisation.

INFO — NOUVEAUTE v2 : les tableaux NASA POWER ont 3 colonnes utiles pour le confort : T2M
(temperature de l'air a 2m en degres C) et WS10M (vitesse du vent a 10m en m/s).

3.1 — Donnees collectees silencieusement
Tout au long de l'utilisation du logiciel, ces données sont stockées dans l'état de l'application sans que
l'utilisateur ne le sache :

- Pays + climat (Interface 1) -> donne acces aux T2M et WS10M du tableau
- Type de vitrage + valeur T + SHGC (Interface 2) -> impact sur la chaleur qui entre
- Orientation du batiment (Interface 2) -> influence l'exposition solaire
- R_moyen et materiaux (Interface 3) -> influencent l'absorption de chaleur par les surfaces
- S_fenetres + etat fenetres ouvertes/fermees (Interface 4) -> CRITIQUE pour la ventilation
- ALLSKY du tableau (Interface 6) -> utilise dans DeltaT_gain_solaire

3.2 — Formule T_rm (temperature moyenne des 7 derniers jours)
Le principe est simple : plus il fait chaud dehors en moyenne, plus les gens sont habitués à la chaleur et
tolèrent une température intérieure élevée. C'est ça le confort adaptatif.

Étape 1 : Calculer T_rm (température moyenne des 7 derniers jours)

T_rm (running mean temperature) est la moyenne pondérée des températures extérieures des 7 jours
précédents. Les jours les plus récents ont plus de poids :

## 푻
## 풓풎
## =
## 푻
## 풋−ퟏ
## +ퟎ.ퟖ푻
## 풋−ퟐ
## +ퟎ.ퟔ푻
## 풋−ퟑ
## +ퟎ.ퟓ푻
## 풋−ퟒ
## +ퟎ.ퟒ푻
## 풋−ퟓ
## +ퟎ.ퟑ푻
## 풋−ퟔ
## +ퟎ.ퟐ푻
## 풋−ퟕ
## ퟑ.ퟖ


Diviseur 3.8 = somme des coefficients (1+0.8+0.6+0.5+0.4+0.3+0.2). Dans la pratique pour ce logiciel : utilise la
T2M moyenne mensuelle du mois simule comme approximation de T_rm. C'est suffisamment precis.
INFO — Source : EN 15251:2007, Annexe A2. Aussi cite dans ASHRAE Standard 55-2020, Section 5.4.

## 3.4 — Formule T_confort
T_confort = 0.31 x T_rm + 17.8

0.31 = coefficient empirique issu d'etudes sur des milliers de personnes dans des batiments naturellement
ventiles.
17.8 = constante de base (offset). Plus il fait chaud dehors en moyenne, plus les gens tolerent une temperature
interieure elevee.

Selon l’état des fenêtres :
- Fenêtres fermées → vitesse de l’air ≈ 0.2 m/s

- Fenêtres ouvertes → vitesse de l’air = WS10M (valeur du tableau)

INFO — Source : Humphreys M.A. & Nicol J.F. (2002), Energy and Buildings 34(6), 667-684. Adopte dans EN
15251:2007 et ASHRAE 55-2020.

3.5 — Calcul de T_ressentie dans la piece (FORMULES CORRIGEES)

C'est la temperature que les occupants ressentent reellement. Elle depend de T2M (temperature exterieure), du
gain solaire par le vitrage, et de l'effet rafraichissant du vent si les fenetres sont ouvertes.

Cas 1 : Fenetres OUVERTES
T_ressentie = T2M + ΔT_gain_solaire - ΔT_vent

ΔT_gain_solaire (chaleur qui entre par le vitrage) :
ΔT_gain_solaire = (ALLSKY / 1000) x SHGC x (S_fenetres / S_totale) x
## 2.5

Explication de chaque terme :
- ALLSKY/1000 : convertit l'irradiance de W/m2 en kW/m2 (valeurs typiques : 0.1 a 0.9 kW/m2)
- SHGC : facteur solaire du vitrage. Simple vitrage ~0.85, Double low-E ~0.35 (voir tableau Interface 2)
- S_fenetres / S_totale : ratio de surface vitree. Plus il y a de fenetres, plus la chaleur entre.
- 2.5 : coefficient empirique en C/(kW/m2) pour pieces africaines standard (volume 50-150m3)

ATTENTION —La formule corrigee utilise ALLSKY (en W/m2), le SHGC et le ratio de surface vitree, ce qui
donne des resultats realistes entre +0.1 et +3 degres. Source : derive du SHGC method, ASHRAE
Fundamentals Handbook 2021, ch. 15.

ΔT_vent (effet rafraichissant du vent) :
ΔT_vent = 0.15 x (WS10M - 0.2)

- 0.15 = coefficient empirique en C/(m/s) issu des modeles d'echange thermique convectif
- On soustrait 0.2 car c'est la vitesse de l'air minimale meme fenetres fermees
INFO — Source : derive de Parsons K. (2014) 'Human Thermal Environments', 3e ed., CRC Press, chapitre 3.
Coherent avec ISO 7730:2005 (Ambiances thermiques moderees).

Cas 2 : Fenetres FERMEES
T_ressentie = T2M + ΔT_gain_solaire_ferme
ΔT_gain_solaire_ferme = (ALLSKY / 1000) x SHGC x (S_fenetres /
S_totale) x 4.0

Quand les fenetres sont fermees : pas d'effet vent. Le coefficient est 4.0 (au lieu de 2.5) car la chaleur
s'accumule dans la piece sans evacuation par ventilation.
INFO — Justification du coefficient 4.0 : sans ventilation naturelle, le gain thermique solaire est environ 1.5 a 2
fois plus eleve qu'avec ventilation. Source : Givoni B. (1994) 'Passive and Low Energy Cooling of Buildings',
## Van Nostrand Reinhold.


3.6 — Statuts thermiques et plages de confort

Etat fenetres Plage
confortable
Trop froid Confortable Legerement chaud Trop chaud
## Fenetres
## OUVERTES
## T_confort +/- 2.5
## C
## T_res < T_conf
## - 3.5
## T_conf-2.5 <=
## T_res <=
## T_conf+2.5
## T_conf+2.5 < T_res
## <= T_conf+3.5
## T_res > T_conf + 3.5
## Fenetres
## FERMEES
## T_confort +/- 3.5
## C
## T_res < T_conf
## - 3.5
## T_conf-3.5 <=
## T_res <=
## T_conf+3.5
## T_conf+3.5 < T_res
## <= T_conf+4.5
## T_res > T_conf + 4.5

INFO — Source : EN 15251:2007 Tableau A.2 (Categories de confort adaptif). Fenetres ouvertes = batiment
naturellement ventile = plage plus etroite car les occupants s'attendent a plus de fraicheur. Fenetres fermees =
plage plus large car moins de possibilite d'agir sur l'environnement.

3.7 — Exemple concret complet (Cotonou, janvier, 12h)

Parametre Valeur Source ou calcul
T2M 28.7 C Tableau climate-tropical-humide.js, janvier
## 12h
WS10M 5.1 m/s Tableau climate-tropical-humide.js, janvier
## 12h
ALLSKY 691.7 W/m2 Tableau climate-tropical-humide.js, janvier
## 12h
T_rm (approx) 28.0 C Moyenne T2M janvier
T_confort 0.31 x 28 + 17.8 = 26.5 C Formule EN 15251
Vitrage choisi Double vitrage low-E
## (SHGC=0.35)
Choix utilisateur Interface 2
## S_fenetres / S_totale 6 / 126 = 0.048 Interfaces 4 / 2
DeltaT_gain_solaire (691.7/1000) x 0.35 x 0.048 x
## 2.5 = 0.029 C
Formule section 3.5
DeltaT_vent (fenetres ouvertes) 0.15 x (3.91 - 0.2) = 0.557 C Formule section 3.5
T_ressentie (fenetres ouvertes) 28.7 + 0.029 - 0.557 = 28.17 C Formule section 3.5
Statut CONFORTABLE : 24 C <=
## 28.17 C <= 29 C
Tableau section 3.6

3.8 — Contenu du rapport PDF — Section confort thermique

Partie 1 : Analyse des choix
Le logiciel genere automatiquement un texte qui explique l'impact de chaque choix. Exemples :

Vitrage : Double vitrage low-E (T=0.65, SHGC=0.35). Laisse passer 65% de la lumiere et bloque ~65% des
apports solaires thermiques. Tres adapte au climat tropical humide.

Fenetres : Ouvertes. Ventilation naturelle active. WS10M = 5.1 m/s -> WS2M = 3.91 m/s. Effet rafraichissant : -
0.56 C sur la temperature ressentie.

Conclusion : T_confort adaptative = 26.5 C. T_ressentie estimee = 28.2 C. Statut : CONFORTABLE (plage 24
## C - 29 C).


Partie 2 : Conseils automatiques
Logique de generation des conseils dans le code (exemples de conditions a coder) :
- Si vitrage = 'simple vitrage' ET climat tropical ou equatorial -> conseil : passer au double vitrage low-E.
Reduira les apports thermiques de ~59% tout en gardant 65% de lumiere naturelle.
- Si R_moyen < 0.45 -> conseil : choisir des couleurs plus claires. Reduira l'absorption de chaleur par les
surfaces et ameliorera la redistribution de la lumiere naturelle.
- Si (S_fenetres / S_sol) > 0.25 ET SHGC > 0.5 -> conseil : reduire la surface vitree OU ameliorer le
vitrage.
- Si fenetres fermees ET T_ressentie > T_confort + 1.5 -> conseil : ouvrir les fenetres. Calcule et affiche
la reduction de temperature estimee avec WS2M local.


## 4. BIBLIOTHEQUES DE DONNEES A CREER
Structure de tous les fichiers statiques du logiciel

Fichier Contenu Colonnes cles Utilise dans
data/default-locations.js Pays -> climat + lat/long
exacte
pays, climat, lat, long,
fichierDonnees
## Interface 1
data/room-norms.js Type de piece -> lux,
UGR, IRC, Tc, MF
typePiece, lux, ugr, irc,
tc, mf
Interface 1 + calculs
data/glazing-types.js Type de vitrage -> T,
SHGC, description
type, T, SHGC, isolation Interface 2 + rapport
data/materials-library.js Materiaux/couleurs ->
reflectance
nom, type, couleur, R Interface 3
data/luminaires-library.js Luminaires -> puissance,
flux, IRC, prix
ref, W, lm, irc, prix, usage Interface 5
data/climate-tropical-
humide.js
NASA POWER Cotonou
## (6.3546, 2.4037)
mois, heure, ALLSKY, f,
## T2M, WS10M
Interface 6 + confort
data/climate-equatorial.js NASA POWER Douala
## (4.0549, 9.6987)
mois, heure, ALLSKY, f,
## T2M, WS10M
Interface 6 + confort
data/climate-semi-aride.js NASA POWER Niamey
## (13.508, 2.116)
mois, heure, ALLSKY, f,
## T2M, WS10M
Interface 6 + confort
data/climate-tropical-sec.js NASA POWER
## Ouagadougou (12.3715,
## -1.5199)
mois, heure, ALLSKY, f,
## T2M, WS10M
Interface 6 + confort
data/climate-desertique.js NASA POWER
## Tamanrasset (22.7914,
## 5.5318)
mois, heure, ALLSKY, f,
## T2M, WS10M
Interface 6 + confort
data/climate-mediterraneen.js NASA POWER Tunis
## (36.8001, 10.1871)
mois, heure, ALLSKY, f,
## T2M, WS10M
Interface 6 + confort

INFO — Les 6 fichiers climatiques sont fournis par le porteur du projet sous forme de tableaux. Tu les integres
tels quels. Structure de chaque tableau : 12 mois x 24 heures = 288 lignes. Colonnes : mois (1-12), heure (0-
23), ALLSKY (W/m2), f (sans unite, deja calcule), T2M (C), WS10M (m/s).


## 5. RESUME — LOGIQUE EN CASCADE
Toutes les variables, leur origine et leurs dependances

Variable Calculee en Depend de Utilisee en
Normes (E, UGR, IRC,
Tc, MF)
Interface 1 Type de piece Interface 5, 7, Rapport
Climat + lat/long Interface 1 Pays choisi Interface 6, Rapport
S_sol, S_murs, S_totale Interface 2 L, l, H Interfaces 3, 4, 5
RCR Interface 2 L, l, H, h_pt Interface 3 (->CU)
## T (transmission
lumineuse)
Interface 2 Type vitrage Interface 6
SHGC (facteur solaire) Interface 2 Type vitrage Rapport (->DeltaT_gain)
R_moyen Interface 3 Surfaces + reflectances Interface 4 (->DF), 5 (->CU)
CU Interface 3 RCR + R_moyen Interface 5 (->N)
S_fenetres Interface 4 Placement fenetres Interface 6 (->DF), Rapport
Etat fenetres (ouv/ferm) Interface 4 Choix utilisateur Rapport (->T_ressentie +
plage)
DF Interface 4 S_fenetres, S_sol, R_moyen Interface 6
N (nombre luminaires) Interface 5 E, S, Phi, CU, MF Interfaces 6, 7, Rapport
E_interieur naturel Interface 6 ALLSKY, K, T, DF Affichage 3D, Rapport
T2M Interface 6
## (arriere-plan)
Climat + mois + heure Rapport (->T_rm, T_confort,
## T_ressentie)
WS10M Interface 6
## (arriere-plan)
Climat + mois + heure Rapport (->WS2M -
>DeltaT_vent)
T_ressentie Arriere-plan T2M, ALLSKY, SHGC,
WS10M, etat fenetres
Rapport thermique
Couts Interface 7 N, prix, puissance Rapport

BON A SAVOIR — Regle d'or du code : toutes ces variables dans un etat global (Redux, Zustand, Context API
ou equivalent). Quand une variable source change, un useEffect (ou equivalent) recalcule automatiquement
toutes les variables dependantes. Centralise TOUS les calculs dans utils/calculations.js — jamais dans les
composants.


## 6. NORMES ET REFERENCES VERIFIABLES
Toutes les sources utilisees dans ce document — verifiables en ligne ou en bibliotheque

Normes internationales

Reference Titre complet Utilisation Acces
EN 12464-1:2021 Lumiere et eclairage —
Eclairage des lieux de
travail — Partie 1 : Lieux de
travail interieurs
## Tableau
lux/UGR/IRC/Tc/MF par
type de piece (Interface 1).
Methode des lumens
N=ExS/(PhixCUxMF).
## AFNOR / BSI / DIN
(payant). Resume gratuit :
lighting.philips.com/en-
gb/education/lighting-
university
EN 15251:2007 Criteres d'ambiance
interieure pour la conception
et evaluation energetique
des batiments
## Formule
T_confort=0.31xT_rm+17.8,
T_rm, plages de confort
adaptif (Section 3)
AFNOR (payant). Contenu
detaille dans Humphreys
& Nicol 2002 (voir ci-
dessous)
ASHRAE Standard
## 55-2020
## Thermal Environmental
Conditions for Human
## Occupancy
Confirmation modele
adaptatif, plages de confort
fenetres ouvertes/fermees
ashrae.org (payant).
Resume gratuit :
ashrae.org/technical-
resources/standards-and-
guidelines
EN 410:2011 Verre dans la construction
— Determination des
caracteristiques lumineuses
et solaires du vitrage
## Valeurs T (transmission
lumineuse) des types de
vitrage (Interface 2)
AFNOR (payant). Valeurs
dans catalogues
fabricants : saint-gobain-
glass.com, agc-glass.eu
EN 673:2011 Verre dans la construction
— Determination du
coefficient de transmission
thermique U
Qualification isolation
thermique des vitrages
(Interface 2)
AFNOR (payant)
ISO 4354:2009 Actions du vent sur les
structures
Loi logarithmique du profil
de vent, conversion
WS10M -> WS2M (Section
## 3.2)
ISO.org (payant). Formule
disponible gratuitement
dans : NASA POWER
## User Guide
ISO 7730:2005 Ergonomie des ambiances
thermiques — Methode
analytique pour la
determination du confort
thermique PMV/PPD
Reference pour coefficients
convectifs (DeltaT_vent,
## Section 3.5)
ISO.org (payant)
CIE 97:2005 Maintenance of Indoor
## Electric Lighting Systems
Valeurs MF selon type de
local (Interfaces 1 + 5)
CIE (payant). Valeurs
resumees dans IES
## Lighting Handbook

Publications scientifiques (acces gratuit partiel)

Auteurs et annee Reference complete Formule concernee Comment y
acceder
gratuitement
## Humphreys & Nicol
## (2002)
'The validity of ISO-PMV for
predicting comfort votes in every-
day thermal environments', Energy
and Buildings 34(6), 667-684
Base empirique de
T_confort=0.31xT_rm+17.8
(Section 3.4)
scholar.google.com
— rechercher :
'Humphreys Nicol
validity PMV 2002'
Parsons K. (2014) 'Human Thermal Environments', 3e
edition, CRC Press. ISBN 978-0-
## 415-53965-5
Coefficients convectifs
DeltaT_vent Section 3.5
Extrait sur
books.google.com.
Disponible en
bibliotheque
universitaire.

Auteurs et annee Reference complete Formule concernee Comment y
acceder
gratuitement
Givoni B. (1994) 'Passive and Low Energy Cooling
of Buildings', Van Nostrand
## Reinhold
Coefficients gain thermique
fenetres fermees vs
ouvertes, coefficient 4.0
(Section 3.5)
Disponible sur
archive.org —
rechercher : 'Givoni
passive cooling
buildings'
Littlefair P.J. (2011) 'Site Layout Planning for Daylight
and Sunlight', 2e edition, BRE
## Press
## Formule Daylight Factor
simplifie
DF~0.2x(Sf/Ss)xf(R)
(Interface 4)
BRE Bookshop
## (payant). Resume
dans BRE Digest
350 (gratuit sur
brebookshop.com)

Guides techniques et outils (acces gratuit)

Ressource Contenu pertinent URL exact
NASA POWER User
Guide v2.6.0 (2023)
Description exacte des parametres
ALLSKY, T2M, WS10M et leur
signification. Loi du profil de vent.
power.larc.nasa.gov/docs/methodology/
NASA POWER Data
## Access Viewer
Telechargement des donnees ALLSKY,
T2M, WS10M par coordonnees GPS
pour n'importe quel point du monde
power.larc.nasa.gov/data-access-viewer/
IESNA Lighting
Handbook 10e ed.
Methode des lumens, methode RCR,
tables CU, valeurs reflectances.
Reference mondiale eclairage.
ies.org/product/lighting-handbook/
(payant). Formules gratuites :
digikey.com lighting calculation
CIBSE Code for Lighting
## (2012)
Reflectances materiaux, methode
R_moyen pondere, methode BRE
daylight
cibse.org (payant)
ASHRAE Fundamentals
Handbook 2021, ch. 15
Solar Heat Gain Coefficient (SHGC)
method — base de DeltaT_gain_solaire
ashrae.org (payant). Resume SHGC
gratuit :
energystar.gov/products/windows_doors
SunCalc npm library Calcul position du soleil (azimut +
altitude) par lat/long et date/heure. Open
source.
npmjs.com/package/suncalc (GRATUIT)



