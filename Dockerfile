# Utiliser une image Node.js officielle comme base
FROM node:20-bookworm

# Activer l'architecture 32 bits requise par Wine
RUN dpkg --add-architecture i386

# Installe des dépendances systèmes nécessaires pour Electron (Linux) et Wine/Mono (Windows)
RUN apt-get update && apt-get install -y \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    fakeroot \
    rpm \
    wine \
    wine32 \
    wine64 \
    mono-devel \
    && rm -rf /var/lib/apt/lists/*

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Installer les dépendances du projet
RUN npm install

# Copier tout le reste du code source
COPY . .

# La commande par défaut va créer les exécutables pour Linux et Windows (.exe)
# Les fichiers générés seront placés dans le dossier "out"
CMD npx electron-forge make --platform=linux,win32 --arch=x64
