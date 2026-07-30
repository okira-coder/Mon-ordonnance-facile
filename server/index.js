import 'dotenv/config'
import express from 'express'
import Database from 'better-sqlite3'

const app = express()
app.use(express.json())

const db = new Database('server/base.db')
db.exec(`CREATE TABLE IF NOT EXISTS fiches (
  id TEXT PRIMARY KEY, contenu TEXT, cree_le TEXT
)`)

const construirePrompt = (lignes) => `Tu écris pour une personne âgée avec une déficience intellectuelle légère, selon les règles du FALC (Facile À Lire et à Comprendre).

Pour chaque médicament, écris :
- "utilite" : à quoi sert ce médicament. 1 ou 2 phrases très courtes.
- "precaution" : la précaution la plus importante de la notice. 1 phrase courte. Sinon chaîne vide.

Règles strictes :
- Jamais de chiffres de dose : pas de mg, pas de nombre de comprimés.
- Pas de mots médicaux compliqués. Mots de tous les jours.
- Phrases de moins de 12 mots. Une idée par phrase.
- On s'adresse à la personne avec « vous ».

Réponds uniquement avec un objet JSON de la forme :
{ "<id>": { "utilite": "...", "precaution": "..." } }

Médicaments :
${lignes.map((l) => `- id "${l.id}" : ${l.nom} ${l.dosage} — prescrit pour : ${l.indication}`).join('\n')}`

// 1. Proxy IA — la clé reste ici, jamais dans le navigateur
app.post('/api/expliquer', async (req, res) => {
  if (!process.env.MISTRAL_KEY) {
    return res.status(503).json({ erreur: 'Clé Mistral absente. Ajoutez MISTRAL_KEY dans le fichier .env puis relancez le serveur.' })
  }
  try {
    const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: construirePrompt(req.body.lignes) }]
      })
    })
    if (!r.ok) {
      const detail = await r.text()
      return res.status(502).json({ erreur: `Mistral a répondu ${r.status}`, detail })
    }
    const data = await r.json()
    const sortie = JSON.parse(data.choices[0].message.content)

    // GARDE-FOU : aucun chiffre de posologie ne doit sortir du modèle
    for (const cle in sortie) {
      const txt = `${sortie[cle].utilite || ''} ${sortie[cle].precaution || ''}`
      if (/\d+\s*(mg|g|ml|cp|comprimé)/i.test(txt)) {
        sortie[cle].utilite = null // rejeté → le pharmacien devra rédiger
        sortie[cle].precaution = ''
      }
    }
    res.json(sortie)
  } catch (e) {
    res.status(502).json({ erreur: `L'appel à Mistral a échoué : ${e.message}` })
  }
})

// 2. Enregistrer une fiche validée
app.post('/api/fiches', (req, res) => {
  const lignes = req.body?.lignes
  if (!Array.isArray(lignes) || lignes.length === 0) {
    return res.status(400).json({ erreur: 'Fiche vide.' })
  }
  // Contrôle bloquant côté serveur aussi : chaque ligne doit être rédigée
  const incomplete = lignes.find((l) => !l.utilite || !l.utilite.trim())
  if (incomplete) {
    return res.status(400).json({ erreur: `L'explication de ${incomplete.nom} est vide.` })
  }
  const id = Math.random().toString(36).slice(2, 8)
  db.prepare('INSERT INTO fiches VALUES (?,?,?)')
    .run(id, JSON.stringify(req.body), new Date().toISOString())
  res.json({ id })
})

// 3. Lire une fiche
app.get('/api/fiches/:id', (req, res) => {
  const f = db.prepare('SELECT contenu FROM fiches WHERE id=?').get(req.params.id)
  f ? res.json(JSON.parse(f.contenu)) : res.status(404).json({ erreur: 'introuvable' })
})

app.listen(3000, () => console.log('Serveur prêt sur http://localhost:3000'))
