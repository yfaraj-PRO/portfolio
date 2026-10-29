# Yassine Faraj — Portfolio

React, TypeScript, Vite, Three.js, React Three Fiber et Drei. Design sombre violet/cyan, responsive, navigation mobile, projets filtrables et détails dans une fenêtre accessible.

## Démarrage

`npm install`, puis `npm run dev`. Production : `npm run build`.

## Contenu

### Parcours sportif — ajout local du 29 octobre 2026

La rubrique `src/BasketballSection.tsx` reprend les informations essentielles du CV sportif fourni : poste de meneur/arrière, MAS de Fès depuis 2024, formation à Nejme Fès, palmarès 2025/2026, sélections marocaines U16/U17 et objectif sport-études en France. Les statistiques seniors ne sont pas affichées, conformément à la demande. Les coordonnées sportives sont distinctes des coordonnées professionnelles. Le lien de highlights est repris de l’annotation du PDF ; le CV source est disponible dans `public/cv-basketball-yassine-faraj.pdf` sans modification.

La rubrique sportive conserve l’identité visuelle et les informations professionnelles du portfolio.

Modifier `src/data.ts`. Les informations personnelles, les compétences et les deux projets proviennent de https://portfolio-seven-snowy-acz9tytsam.vercel.app/ (consulté le 27 octobre 2026). Aucun stage, date de formation ou niveau de maîtrise supplémentaire n’a été inventé. Le CV imprimable est dans `public/cv.html`.

## Portrait

Le portrait affiché dans l’accueil est une photo fixe en pleine largeur. Aucun suivi de la souris, animation du visage ou des yeux n’est chargé. L’ancien composant expérimental `InteractiveAvatar3D` reste disponible dans les sources, mais n’est plus importé par l’application.

Un GLB/GLTF peut remplacer le portrait via `<InteractiveAvatar3D modelUrl="/avatar.glb" />`. Ajuster l’échelle du modèle selon son export. L’adaptateur fait tourner le groupe ; un vrai suivi anatomique des yeux nécessite de mapper les os du rig du modèle fourni.

## Contact

Par défaut, le formulaire valide les champs et ouvre un e-mail prérempli ; il ne prétend pas avoir envoyé le message. Pour l’envoi direct, définir `VITE_CONTACT_ENDPOINT` dans `.env` avec un endpoint HTTPS qui accepte du JSON (`name`, `email`, `message`) et autorise l’origine du site via CORS, puis reconstruire. Le succès s’affiche uniquement après une réponse HTTP réussie. Ne jamais placer une clé secrète dans une variable `VITE_`.

## Vérification

`npm run build` vérifie TypeScript et produit le site statique. Le chargement des polices Google requiert une connexion ; une police système sert de repli.
