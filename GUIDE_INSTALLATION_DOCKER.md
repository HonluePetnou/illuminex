# Guide d'Installation avec Docker (Pour Débutants)

Ce guide a pour but de vous aider à utiliser **Docker** pour compiler et installer le logiciel **Illuminex-BJ**, même si vous n'avez pas de compétences techniques avancées. 

L'utilisation de Docker évite d'avoir à installer manuellement `Node.js`, `NPM` ou d'autres dépendances de développement. Tout se passe dans une "boîte" isolée (un conteneur).

---

## 🛠️ Prérequis

Avant de commencer, vous avez uniquement besoin d'installer **Docker** sur votre ordinateur :

1. Allez sur le site officiel : [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Téléchargez la version qui correspond à votre système d'exploitation (Windows, Mac ou Linux).
3. Installez le logiciel en suivant les instructions par défaut.
4. Démarrez l'application **Docker Desktop** (elle doit être ouverte en arrière-plan).

---

## 🚀 Comment générer l'application (Build)

Une fois Docker installé et démarré, vous pouvez générer l'application (c'est-à-dire créer l'exécutable pour pouvoir l'installer) en suivant ces étapes simples :

### 1. Ouvrir le terminal (ou Invite de commandes)
- **Sur Windows :** Cherchez `cmd` ou `PowerShell` dans le menu Démarrer.
- **Sur Mac :** Cherchez `Terminal` dans Spotlight.
- **Sur Linux :** Ouvrez votre terminal habituel.

### 2. Naviguer vers le dossier du projet
Dans le terminal, déplacez-vous dans le dossier où se trouve le code du projet. Par exemple :
```bash
cd chemin/vers/le/dossier/illuminex-bj/my-app
```

### 3. Lancer la compilation via Docker
Tapez simplement la commande suivante :
```bash
docker-compose up --build
```

**Que va-t-il se passer ?**
- La première fois, Docker va télécharger les éléments nécessaires (cela peut prendre quelques minutes selon votre connexion).
- Il va installer automatiquement toutes les dépendances dans son conteneur isolé.
- Il va compiler l'application de simulation.
- Une fois terminé, vous verrez un message indiquant que le processus a réussi et le conteneur s'arrêtera.

---

## 📁 Où trouver l'application générée ?

Regardez dans votre dossier de projet `my-app`. Vous verrez qu'un nouveau dossier nommé **`out`** est apparu !

Dans ce dossier `out/make`, vous trouverez les installeurs générés (fichiers `.zip`, fichiers `.deb` ou `.rpm` pour Linux, ainsi que les fichiers `.exe` pour Windows). 

**Remarque :** Le conteneur a été spécialement configuré pour inclure un émulateur Windows (Wine). La commande génèrera automatiquement **à la fois la version Linux et la version Windows (.exe)** !

---

## 🧹 Nettoyage (Optionnel)

Si vous voulez supprimer le conteneur après avoir généré votre application pour libérer de l'espace, tapez :
```bash
docker-compose down
```
Cela ne supprimera pas vos exécutables dans le dossier `out`.

---

🎉 **C'est tout ! Vous savez maintenant comment utiliser Docker pour compiler ce projet.**
