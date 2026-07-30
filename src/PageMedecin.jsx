import { useState } from 'react'
import ordonnance from './ordonnance.json'

const NOMS_MOMENTS = { matin: 'matin', midi: 'midi', soir: 'soir', coucher: 'au coucher' }

export const PROFILS = {
  aucun: 'Aucune adaptation',
  cognitif: 'Déficience intellectuelle / cognitive',
  visuel: 'Déficience visuelle'
}

export default function PageMedecin() {
  const [handicap, setHandicap] = useState('cognitif')
  const [code, setCode] = useState(null)
  const [erreur, setErreur] = useState(null)

  const ajouter = async () => {
    setErreur(null)
    const r = await fetch('/api/ordonnances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ordonnance, handicap })
    })
    const data = await r.json()
    if (!r.ok) {
      setErreur(data.erreur || 'Envoi impossible.')
      return
    }
    setCode(data.code)
  }

  return (
    <main className="page-medecin">
      <header className="pharma-entete">
        <p className="pharma-eyebrow">Mon ordonnance facile · Espace prescripteur</p>
        <h1>Ordonnance de sortie — {ordonnance.patient.prenom} {ordonnance.patient.nom}</h1>
        <p className="pharma-contexte">{ordonnance.prescripteur}</p>
      </header>

      <div className="medecin-colonnes">
        <section className="feuille-ordonnance">
          <header>
            <p><strong>{ordonnance.prescripteur}</strong></p>
            <p>Le {new Date(ordonnance.date).toLocaleDateString('fr-FR')}</p>
            <p>Patient : {ordonnance.patient.prenom} {ordonnance.patient.nom}, née le {new Date(ordonnance.patient.naissance).toLocaleDateString('fr-FR')}</p>
          </header>
          <ul>
            {ordonnance.lignes.map((l) => (
              <li key={l.id}>
                {l.nom} {l.dosage} — {l.quantite} comprimé{l.quantite > 1 ? 's' : ''} {l.moments.map((m) => NOMS_MOMENTS[m]).join(', ')}
                {l.adaptation && <em> · {l.adaptation}</em>}
              </li>
            ))}
          </ul>
          <p className="signature">Docteur</p>
        </section>

        <aside className="panneau-lap">
          <p className="lap-titre">Élément du logiciel d'édition d'ordonnance du médecin (simulé)</p>
          <div className="lap-actions">
            <label>
              Choix handicap
              <select value={handicap} onChange={(e) => setHandicap(e.target.value)}>
                {Object.entries(PROFILS).map(([cle, nom]) => (
                  <option key={cle} value={cle}>{nom}</option>
                ))}
              </select>
            </label>
            {!code ? (
              <button className="bouton-lap" onClick={ajouter}>Ajouter prescription</button>
            ) : (
              <div className="code-remis">
                <p>Prescription transmise avec l'adaptation à prévoir.</p>
                <p className="code-grand">{code}</p>
                <p>Donnez ce code au patient : la pharmacie s'en servira pour retrouver l'ordonnance.</p>
              </div>
            )}
            {erreur && <p className="pharma-erreur" role="alert">{erreur}</p>}
          </div>
        </aside>
      </div>
    </main>
  )
}
