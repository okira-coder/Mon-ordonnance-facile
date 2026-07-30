import { useState } from 'react'
import ordonnance from './ordonnance.json'

const NOMS_MOMENTS = { matin: 'Matin', midi: 'Midi', soir: 'Soir', coucher: 'Coucher' }

export default function PagePharmacien() {
  const [explications, setExplications] = useState(
    Object.fromEntries(ordonnance.lignes.map((l) => [l.id, { utilite: '', precaution: '', rejete: false }]))
  )
  const [statut, setStatut] = useState('attente') // attente | generation | pret
  const [relu, setRelu] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [manquants, setManquants] = useState([])
  const [ficheId, setFicheId] = useState(null)
  const [copie, setCopie] = useState(false)

  const genererIA = async () => {
    setStatut('generation')
    setErreur(null)
    try {
      const r = await fetch('/api/expliquer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lignes: ordonnance.lignes })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.erreur || 'Erreur serveur')
      setExplications((prev) => {
        const suivant = { ...prev }
        for (const l of ordonnance.lignes) {
          const s = data[l.id]
          if (!s) continue
          suivant[l.id] = {
            utilite: s.utilite ?? '',
            precaution: s.precaution ?? '',
            rejete: s.utilite === null
          }
        }
        return suivant
      })
      setStatut('pret')
    } catch (e) {
      setErreur(e.message)
      setStatut('pret') // le pharmacien peut toujours rédiger à la main
    }
  }

  const modifier = (id, champ, valeur) => {
    setExplications((prev) => ({ ...prev, [id]: { ...prev[id], [champ]: valeur, rejete: false } }))
    setManquants((prev) => prev.filter((m) => m !== id))
  }

  const valider = async () => {
    setErreur(null)
    const vides = ordonnance.lignes.filter((l) => !explications[l.id].utilite.trim()).map((l) => l.id)
    if (vides.length > 0) {
      setManquants(vides)
      setErreur('Chaque médicament doit avoir une explication avant validation.')
      return
    }
    if (!relu) {
      setErreur('Cochez la case « J\'ai relu et corrigé chaque explication » pour valider.')
      return
    }
    const fiche = {
      patient: ordonnance.patient,
      date: ordonnance.date,
      aidant: ordonnance.aidant,
      lignes: ordonnance.lignes.map((l) => ({
        ...l,
        utilite: explications[l.id].utilite.trim(),
        precaution: explications[l.id].precaution.trim()
      }))
    }
    const r = await fetch('/api/fiches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fiche)
    })
    const data = await r.json()
    if (!r.ok) {
      setErreur(data.erreur || 'Enregistrement impossible.')
      return
    }
    setFicheId(data.id)
  }

  const lien = ficheId ? `${window.location.origin}/fiche/${ficheId}` : null

  const copierLien = async () => {
    await navigator.clipboard.writeText(lien)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  return (
    <main className="page-pharmacien">
      <header className="pharma-entete">
        <p className="pharma-eyebrow">Mon ordonnance facile · Espace pharmacien</p>
        <h1>Préparer la fiche de {ordonnance.patient.prenom} {ordonnance.patient.nom}</h1>
        <p className="pharma-contexte">
          Ordonnance du {new Date(ordonnance.date).toLocaleDateString('fr-FR')} — {ordonnance.prescripteur}
        </p>
      </header>

      <section className="pharma-bloc">
        <h2>1. Ordonnance reçue</h2>
        <table className="table-ordonnance">
          <thead>
            <tr>
              <th>Médicament</th>
              <th>Dosage</th>
              <th>Quantité</th>
              <th>Moments</th>
              <th>Adaptation prévue</th>
            </tr>
          </thead>
          <tbody>
            {ordonnance.lignes.map((l) => (
              <tr key={l.id}>
                <td><strong>{l.nom}</strong></td>
                <td>{l.dosage}</td>
                <td>{l.quantite} cp</td>
                <td>{l.moments.map((m) => NOMS_MOMENTS[m]).join(', ')}</td>
                <td>{l.adaptation || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="pharma-bloc">
        <div className="bloc-titre-action">
          <h2>2. Explications en langage simple</h2>
          <button className="bouton-ia" onClick={genererIA} disabled={statut === 'generation'}>
            {statut === 'generation' ? 'Rédaction en cours…' : 'Rédiger avec l\'IA'}
          </button>
        </div>
        <p className="aide">
          L'IA propose un brouillon FALC. <strong>Vous restez responsable :</strong> relisez, corrigez, puis validez.
          Les changements de dose viennent de l'ordonnance et ne passent jamais par l'IA.
        </p>

        {ordonnance.lignes.map((l) => (
          <article key={l.id} className={`carte-edition ${manquants.includes(l.id) ? 'manquant' : ''}`}>
            <header>
              <h3>{l.nom} {l.dosage}</h3>
              {explications[l.id].rejete && (
                <p className="alerte-rejet">
                  Proposition de l'IA rejetée par le garde-fou (chiffre de dose détecté). Rédigez à la main.
                </p>
              )}
            </header>
            <label>
              À quoi ça sert (obligatoire)
              <textarea
                value={explications[l.id].utilite}
                onChange={(e) => modifier(l.id, 'utilite', e.target.value)}
                placeholder="Phrases courtes, mots simples, pas de chiffres de dose."
                rows={2}
              />
            </label>
            <label>
              Précaution importante (facultatif)
              <textarea
                value={explications[l.id].precaution}
                onChange={(e) => modifier(l.id, 'precaution', e.target.value)}
                rows={2}
              />
            </label>
            {l.adaptation && (
              <p className="rappel-adaptation">
                Encadré « Changement prévu » affiché tel quel : <em>{l.adaptation}</em>
              </p>
            )}
          </article>
        ))}
      </section>

      <section className="pharma-bloc">
        <h2>3. Validation</h2>
        <label className="case-relecture">
          <input type="checkbox" checked={relu} onChange={(e) => setRelu(e.target.checked)} />
          J'ai relu et corrigé chaque explication. Je valide cette fiche.
        </label>
        {erreur && <p className="pharma-erreur" role="alert">{erreur}</p>}
        {!ficheId ? (
          <button className="bouton-valider" onClick={valider}>
            Valider et créer la fiche
          </button>
        ) : (
          <div className="resultat">
            <h3>Fiche créée</h3>
            <p className="lien-fiche">
              <a href={lien} target="_blank" rel="noreferrer">{lien}</a>
              <button onClick={copierLien}>{copie ? 'Copié !' : 'Copier le lien'}</button>
            </p>
            <div className="sms-simule">
              <p className="sms-titre">SMS envoyé (simulé) au patient et à l'aidant ({ordonnance.aidant.nom}) :</p>
              <p className="sms-corps">
                « Bonjour {ordonnance.patient.prenom}, voici votre fiche médicaments, vérifiée par votre pharmacien : {lien} »
              </p>
            </div>
            <p className="aide">
              Ouvrez la fiche puis « Imprimer cette fiche » pour la version papier.
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
