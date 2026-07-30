import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'

const MOMENTS = [
  { cle: 'matin', titre: 'Le matin', sousTitre: 'Au petit-déjeuner', classe: 'moment-matin', icone: IconeMatin },
  { cle: 'midi', titre: 'Le midi', sousTitre: 'Au déjeuner', classe: 'moment-midi', icone: IconeMidi },
  { cle: 'soir', titre: 'Le soir', sousTitre: 'Au dîner', classe: 'moment-soir', icone: IconeSoir },
  { cle: 'coucher', titre: 'Au coucher', sousTitre: 'Avant de dormir', classe: 'moment-coucher', icone: IconeCoucher }
]

function IconeMatin() {
  return (
    <svg viewBox="0 0 48 48" className="icone-moment" aria-hidden="true">
      <line x1="4" y1="34" x2="44" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 34a10 10 0 0 1 20 0" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="24" y1="12" x2="24" y2="18" />
        <line x1="10" y1="18" x2="14" y2="22" />
        <line x1="38" y1="18" x2="34" y2="22" />
      </g>
    </svg>
  )
}

function IconeMidi() {
  return (
    <svg viewBox="0 0 48 48" className="icone-moment" aria-hidden="true">
      <circle cx="24" cy="24" r="9" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="24" y1="4" x2="24" y2="10" />
        <line x1="24" y1="38" x2="24" y2="44" />
        <line x1="4" y1="24" x2="10" y2="24" />
        <line x1="38" y1="24" x2="44" y2="24" />
        <line x1="9.9" y1="9.9" x2="14.1" y2="14.1" />
        <line x1="33.9" y1="33.9" x2="38.1" y2="38.1" />
        <line x1="9.9" y1="38.1" x2="14.1" y2="33.9" />
        <line x1="33.9" y1="14.1" x2="38.1" y2="9.9" />
      </g>
    </svg>
  )
}

function IconeSoir() {
  return (
    <svg viewBox="0 0 48 48" className="icone-moment" aria-hidden="true">
      <line x1="4" y1="30" x2="44" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 30a10 10 0 0 1 20 0" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <line x1="10" y1="38" x2="16" y2="38" />
        <line x1="20" y1="38" x2="28" y2="38" />
        <line x1="32" y1="38" x2="38" y2="38" />
      </g>
    </svg>
  )
}

function IconeCoucher() {
  return (
    <svg viewBox="0 0 48 48" className="icone-moment" aria-hidden="true">
      <path d="M30 6a16 16 0 1 0 12 26A18 18 0 0 1 30 6z" fill="currentColor" />
      <circle cx="10" cy="12" r="2" fill="currentColor" />
      <circle cx="16" cy="6" r="1.5" fill="currentColor" />
    </svg>
  )
}

function Comprime() {
  return (
    <svg viewBox="0 0 44 44" className="comprime" aria-hidden="true">
      <circle cx="22" cy="22" r="19" fill="#eef2f7" stroke="#1e293b" strokeWidth="3.5" />
      <path d="M22 3a19 19 0 0 1 0 38" fill="#dbe3ec" stroke="none" />
      <circle cx="22" cy="22" r="19" fill="none" stroke="#1e293b" strokeWidth="3.5" />
      <line x1="11" y1="22" x2="33" y2="22" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function momentActuel() {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'matin'
  if (h >= 11 && h < 17) return 'midi'
  if (h >= 17 && h < 21) return 'soir'
  return 'coucher'
}

function texteALire(moment, meds) {
  const total = meds.reduce((n, m) => n + m.quantite, 0)
  const phrases = [`${moment.titre}, vous prenez ${total} comprimé${total > 1 ? 's' : ''}.`]
  for (const m of meds) {
    phrases.push(`${m.quantite} comprimé${m.quantite > 1 ? 's' : ''} de ${m.nom}. ${m.utilite}`)
    if (m.precaution) phrases.push(`Attention. ${m.precaution}`)
    if (m.adaptation) phrases.push(`Changement prévu. ${m.adaptation}`)
  }
  return phrases.join(' ')
}

export default function PageFiche() {
  const { id } = useParams()
  const [fiche, setFiche] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [enLecture, setEnLecture] = useState(null)
  const voixRef = useRef(null)

  useEffect(() => {
    fetch(`/api/fiches/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setFiche)
      .catch(() => setErreur(true))
  }, [id])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const ecouter = (cle, texte) => {
    const synth = window.speechSynthesis
    if (!synth) return
    if (enLecture === cle) {
      synth.cancel()
      setEnLecture(null)
      return
    }
    synth.cancel()
    const u = new SpeechSynthesisUtterance(texte)
    u.lang = 'fr-FR'
    u.rate = 0.85
    u.onend = () => setEnLecture(null)
    u.onerror = () => setEnLecture(null)
    voixRef.current = u
    synth.speak(u)
    setEnLecture(cle)
  }

  if (erreur)
    return (
      <main className="page-fiche">
        <div className="fiche-erreur">
          <h1>Fiche introuvable</h1>
          <p>Ce lien ne marche pas. Demandez de l'aide à votre pharmacien.</p>
        </div>
      </main>
    )
  if (!fiche) return <main className="page-fiche"><p className="chargement">Chargement…</p></main>

  const actuel = momentActuel()

  return (
    <main className="page-fiche">
      <header className="fiche-entete">
        <p className="fiche-eyebrow">Mes médicaments</p>
        <h1>La journée de {fiche.patient.prenom}</h1>
        <p className="fiche-source">
          Fiche vérifiée par votre pharmacien · Ordonnance du {new Date(fiche.date).toLocaleDateString('fr-FR')}
        </p>
        <button className="bouton-imprimer" onClick={() => window.print()}>
          Imprimer cette fiche
        </button>
      </header>

      {MOMENTS.map((moment) => {
        const meds = fiche.lignes.filter((l) => l.moments.includes(moment.cle))
        if (meds.length === 0) return null
        const total = meds.reduce((n, m) => n + m.quantite, 0)
        const Icone = moment.icone
        const estMaintenant = moment.cle === actuel

        return (
          <section key={moment.cle} className={`carte-moment ${moment.classe} ${estMaintenant ? 'maintenant' : ''}`}>
            {estMaintenant && <p className="badge-maintenant">C'est maintenant</p>}
            <header className="moment-entete">
              <Icone />
              <div>
                <h2>{moment.titre}</h2>
                <p className="moment-sous-titre">{moment.sousTitre}</p>
              </div>
              <p className="moment-total">
                <strong>{total}</strong> comprimé{total > 1 ? 's' : ''}
              </p>
            </header>

            {meds.map((m) => (
              <article key={m.id} className="ligne-medicament">
                <div className="ligne-haut">
                  <div className="comprimes" aria-label={`${m.quantite} comprimé${m.quantite > 1 ? 's' : ''}`}>
                    {Array.from({ length: m.quantite }, (_, i) => (
                      <Comprime key={i} />
                    ))}
                  </div>
                  <div>
                    <h3>{m.nom}</h3>
                    <p className="quantite-texte">
                      {m.quantite} comprimé{m.quantite > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <p className="utilite">{m.utilite}</p>
                {m.precaution && (
                  <p className="encadre encadre-attention">
                    <span className="encadre-titre">Attention</span>
                    {m.precaution}
                  </p>
                )}
                {m.adaptation && (
                  <p className="encadre encadre-changement">
                    <span className="encadre-titre">Changement prévu</span>
                    {m.adaptation}
                  </p>
                )}
              </article>
            ))}

            <button
              className={`bouton-ecouter ${enLecture === moment.cle ? 'actif' : ''}`}
              onClick={() => ecouter(moment.cle, texteALire(moment, meds))}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9v6h4l6 5V4L8 9H4z" fill="currentColor" />
                <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
              {enLecture === moment.cle ? 'Arrêter la lecture' : 'Écouter'}
            </button>
          </section>
        )
      })}

      <footer className="fiche-pied">
        <p>
          Une question ? Appelez votre pharmacie.
          <br />
          Votre aidant a aussi reçu cette fiche : {fiche.aidant?.nom}
        </p>
      </footer>
    </main>
  )
}
