# Utiliser une image Node.js officielle comme base
FROM node:20-bookworm

# Installe des dépendances systèmes communes nécessaires pour Electron
RUN apt-get update && apt-get install -y \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    fakeroot \
    rpm \
    && rm -rf /var/lib/apt/lists/*

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Installer les dépendances du projet
RUN npm install

# Copier tout le reste du code source
COPY . .

# La commande par défaut va créer les exécutables (build)
# Les fichiers générés seront placés dans le dossier "out"
CMD ["npm", "run", "make"]
