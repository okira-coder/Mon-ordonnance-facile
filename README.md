# Mon ordonnance facile

Rendre une ordonnance accessible à une personne avec une déficience intellectuelle légère, au moment de la remise des médicaments en pharmacie.

**Cas d'usage :** Nadia, 70 ans, sort d'hospitalisation avec une ordonnance post-opératoire. Le pharmacien génère une fiche en langage FALC (Facile À Lire et à Comprendre), la relit, la corrige, la valide — puis Nadia reçoit un lien vers sa journée de médicaments, découpée en 4 moments, avec les comprimés dessinés et un bouton Écouter.

## Le parcours

```
Ordonnance numérique (simulée : src/ordonnance.json)
        ▼
Pharmacien : l'outil affiche les lignes structurées (nom, dose, moments)
        ▼
L'IA (Mistral) rédige à quoi sert chaque médicament + les précautions
        ▼
Pharmacien : relit, corrige, VALIDE        ← contrôle bloquant
        ▼
Fiche imprimable + lien SMS (simulé : affiché à copier)
        ▼
Nadia ouvre le lien : sa journée en 4 moments, avec Écouter
```

## Ce qui est construit / simulé

| Étape | Statut |
|---|---|
| Ordonnance numérique | **Simulé** — `src/ordonnance.json` |
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

- Espace pharmacien : http://localhost:5173/pharmacien
- Fiche patient : le lien généré après validation (`/fiche/<id>`)

## Architecture

```
├── server/
│   ├── index.js          ← Express : 3 routes (proxy Mistral, POST/GET fiches)
│   └── base.db           ← SQLite, créée toute seule
├── src/
│   ├── App.jsx           ← les 2 routes React
│   ├── PagePharmacien.jsx
│   ├── PageFiche.jsx     ← écran patient FALC (police Atkinson Hyperlegible,
│   │                        synthèse vocale fr-FR, comprimés dessinés)
│   └── ordonnance.json   ← l'ordonnance simulée
└── .env                  ← MISTRAL_KEY (jamais dans le navigateur)
```

## Déploiement

Le front (Vite) se déploie sur Netlify tel quel. Le serveur Express + SQLite a besoin d'un hébergeur Node (Render, Railway, Fly.io…) — ou d'une réécriture des 3 routes en Netlify Functions avec un stockage type Netlify Blobs. Pour la démo, tout tourne en local.
