# Envoi du formulaire depuis Vercel

## Correction

FormSubmit renvoyait HTTP 521 et le navigateur ne pouvait pas joindre le service. Une vérification réelle de la nouvelle API Resend a obtenu une réponse JSON d’authentification attendue avec une clé volontairement invalide ; aucun message n’a été envoyé.

Le navigateur appelle maintenant **`/api/contact` sur le même site**. Vercel valide les champs puis contacte Resend côté serveur. La clé n’est jamais envoyée au navigateur. Ni FormSubmit ni Web3Forms ne sont utilisés dans la version corrigée.

## Configuration à faire par le propriétaire

1. Créer un compte Resend avec **y.faraj@esisa.ac.ma** : https://resend.com/signup.
2. Créer une clé d’envoi dans https://resend.com/api-keys.
3. Dans Vercel, projet **portfolio → Settings → Environment Variables**, ajouter `RESEND_API_KEY` avec cette clé, pour l’environnement Production. Ne pas la préfixer par `VITE_`, la publier sur GitHub ou la coller dans le chat.
4. `CONTACT_FROM` est facultatif. Sans valeur, l’expéditeur est `Portfolio Yassine Faraj <onboarding@resend.dev>`. Resend limite cet expéditeur de test à l’adresse du compte Resend : elle doit donc être **y.faraj@esisa.ac.ma**. Pour un expéditeur professionnel sur un domaine personnel, vérifier ce domaine dans Resend puis définir `CONTACT_FROM`.
5. Déployer le code corrigé et redéployer après toute modification des variables d’environnement.
6. Soumettre un message depuis le site et vérifier sa réception réelle. Une réponse HTTP réussie signifie que Resend a accepté le message ; la réception en boîte doit encore être vérifiée par le propriétaire.

## Prévisualisation locale

Copier `.env.example` vers `.env.local` et renseigner la clé uniquement dans ce fichier ignoré par Git. `npm run dev -- --port 5177` ou `npm run preview -- --port 5175` exposent le même handler d’API en local. Redémarrer le serveur après modification de la clé.

Sans clé, l’API renvoie un état indisponible et ne simule jamais un envoi réussi. Les champs du visiteur restent remplis.

## Contrôles

`node --test tests/contact.test.mjs` : validation côté serveur, origine, absence de clé, erreurs de fournisseur, échecs réseau, destinataire fixe, limite par instance et confirmation réelle de l’acceptation par le fournisseur. Les appels du fournisseur sont interceptés dans ces tests ; ils ne constituent pas une preuve de réception en boîte.

Champ anti-spam, limite de taille, délai serveur de 15 secondes, limitation de six tentatives par minute **par instance** (non globale), et clé d’idempotence pour une nouvelle tentative du même message. Aucun e-mail du visiteur n’est utilisé comme expéditeur authentifié ; il est placé dans `reply_to`.

## Références

- https://resend.com/docs/send-with-vercel-functions
- https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
- https://vercel.com/docs/functions/runtimes/node-js
