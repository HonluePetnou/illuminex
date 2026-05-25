# Illuminex - Dimensionnement d'Éclairage Intérieur

**Illuminex** est une application professionnelle (Windows/Linux/Mac) permettant de simuler et dimensionner l'éclairage intérieur, spécifiquement pensée pour l'Afrique subsaharienne.

Ce document explique la stratégie de distribution du projet, séparée en deux profils distincts : les **utilisateurs finaux** et les **développeurs**.

---

## 🎯 1. Pour les Utilisateurs (Architectes, Étudiants, Ingénieurs)

Si vous souhaitez simplement **utiliser** l'application, vous n'avez pas besoin de savoir programmer, ni d'installer Docker ou des lignes de commande complexes.

**Étapes d'installation :**
1. Téléchargez le fichier d'installation correspondant à votre système :
   - **Windows :** Téléchargez le fichier `Illuminex-Setup.exe` (Lien à définir par l'administrateur).
   - **Linux :** Téléchargez le fichier `.deb` ou `.rpm`.
2. Double-cliquez sur le fichier téléchargé.
3. L'application s'installe et une icône apparaît sur votre bureau. C'est tout !

*(Note pour le propriétaire du projet : Générez le `.exe` sur votre PC Windows avec `npm run make` et partagez-le sur Google Drive ou GitHub Releases).*

---

## 💻 2. Pour les Développeurs (Contribuer au code)

Si vous êtes un programmeur et que vous souhaitez modifier le code ou générer vous-même les installeurs, deux options s'offrent à vous.

### Option A : Développement Local Classique (Recommandé sur Windows)
C'est la méthode la plus rapide pour voir ses modifications en direct sur Windows.
1. Installez **Node.js** (version 20+).
2. Ouvrez le terminal dans le dossier du projet.
3. Installez les dépendances : `npm install`
4. Lancez l'environnement de développement : `npm start`
5. Pour générer un exécutable `.exe` Windows (depuis un PC Windows) : `npm run make`

### Option B : Environnement Docker (Recommandé pour compiler sous Linux)
Si vous ne voulez pas installer Node.js, ou si vous voulez générer proprement les installeurs Linux (`.deb`, `.rpm`) sans polluer votre ordinateur, nous avons préparé un environnement Docker "clé en main".

Consultez le fichier dédié : 👉 **[Guide d'Installation Docker](GUIDE_INSTALLATION_DOCKER.md)** pour savoir comment lancer la compilation isolée en une seule commande.
