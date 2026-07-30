# Mon ordonnance facile

Rendre une ordonnance accessible à une personne avec une déficience intellectuelle légère, au moment de la remise des médicaments en pharmacie.

**Cas d'usage :** Nadia, 70 ans, sort d'hospitalisation avec une ordonnance post-opératoire. Le pharmacien génère une fiche en langage FALC (Facile À Lire et à Comprendre), la relit, la corrige, la valide — puis Nadia reçoit un lien vers sa journée de médicaments, découpée en 4 moments, avec les comprimés dessinés et un bouton Écouter.

## Le parcours

```
Prescripteur (/medecin) : ordonnance + « Choix handicap » → Ajouter prescription
        ▼
Un CODE est remis au patient (ex : A7K2PM)
        ▼
Pharmacien (/pharmacien) : entre le code → l'outil affiche les lignes structurées
        + bannière « L'ordonnance présente une spécificité d'accessibilité »
        ▼
L'IA (Mistral) rédige à quoi sert chaque médicament + les précautions
        ▼
Pharmacien : relit, corrige, VALIDE        ← contrôle bloquant
        ▼
Fiche imprimable + lien SMS (simulé) + code fiche
        ▼
Nadia ouvre le lien : sa journée en 4 moments, avec Écouter
        — le rendu s'adapte au profil choisi par le prescripteur
```

## Profils d'accessibilité

Le prescripteur déclare le handicap ; la fiche patient s'adapte automatiquement :

- **Déficience intellectuelle / cognitive** : FALC, journée en 4 moments colorés, comprimés dessinés un par un, « Ne rien prendre » pour les moments vides, synthèse vocale.
- **Déficience visuelle** : mêmes contenus en très fort contraste (fond noir, texte blanc/jaune), tailles de texte augmentées, boutons plus grands.
- **Aucune adaptation** : rendu standard.

## Ce qui est construit / simulé

| Étape | Statut |
|---|---|
| Contenu de l'ordonnance (LAP du médecin) | **Simulé** — `src/ordonnance.json` |
| Dépôt par le prescripteur + choix du handicap + code | **Construit** |
| Récupération par code en pharmacie | **Construit** |
| Explications IA (Mistral) | **Construit** |
| Relecture + validation bloquante du pharmacien | **Construit** (bloquant côté client ET serveur) |
| Fiche papier | **Construit** — `window.print()` + CSS d'impression |
| Envoi SMS | **Simulé** — le message et le lien sont affichés à copier |
| Page patient publique | **Construit** |

## Les garde-fous

1. **L'IA ne parle jamais de doses** : le serveur rejette toute explication contenant un chiffre de posologie (regex `mg|g|ml|cp|comprimé`). Le champ revient vide et le pharmacien doit rédiger à la main.
2. **Validation bloquante** : impossible de créer la fiche si une explication est vide ou si la case « J'ai relu » n'est pas cochée. Revérifié côté serveur.
3. **Les changements de dose ne passent pas par l'IA** : le champ `adaptation` vient de l'ordonnance et s'affiche tel quel dans l'encadré « Changement prévu ».

## Lancer le projet

```bash
npm install
```

Créer un fichier `.env` à la racine :

```
MISTRAL_KEY=votre_clé_api_mistral
```

(Sans clé, tout fonctionne sauf le bouton « Rédiger avec l'IA » — le pharmacien peut rédiger à la main.)

```bash
npm run dev
```

- Espace prescripteur : http://localhost:5173/medecin (génère le code)
- Espace pharmacien : http://localhost:5173/pharmacien (entre le code)
- Fiche patient : le lien généré après validation (`/fiche/<id>`)

## Architecture

```
├── server/
│   ├── index.js          ← Express : 5 routes (proxy Mistral, ordonnances par code, fiches)
│   └── base.db           ← SQLite, créée toute seule
├── src/
│   ├── App.jsx           ← les 3 routes React
│   ├── PageMedecin.jsx   ← ordonnance + choix handicap + code
│   ├── PagePharmacien.jsx
│   ├── PageFiche.jsx     ← écran patient FALC (police Atkinson Hyperlegible,
│   │                        synthèse vocale fr-FR, comprimés dessinés)
│   └── ordonnance.json   ← l'ordonnance simulée
└── .env                  ← MISTRAL_KEY (jamais dans le navigateur)
```

## Déploiement

Le front (Vite) se déploie sur Netlify tel quel. Le serveur Express + SQLite a besoin d'un hébergeur Node (Render, Railway, Fly.io…) — ou d'une réécriture des 3 routes en Netlify Functions avec un stockage type Netlify Blobs. Pour la démo, tout tourne en local.
