import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * TOURNOI LA LÉGENDE – 3e ÉDITION
 * Sondage de vote du « Meilleur Joueur » avec preuve de paiement Wave.
 *
 * ✅ Public :
 *    - Voir les joueurs (photo, nom, équipe)
 *    - Voter pour un joueur (saisir Nom, Téléphone, ID transaction Wave, Montant)
 *    - Voir le classement (votes validés)
 *
 * 🔐 Admin (code par défaut: LEG3) :
 *    - Ajouter / éditer / supprimer des joueurs (avec photo)
 *    - Valider / refuser les votes après vérification du paiement dans l’appli Wave
 *    - Modifier les réglages (montant par vote, n° Wave, code admin, titre)
 *    - Exporter / importer les données (.json) pour sauvegarde/partage
 *
 * 📦 100% Frontend (sans serveur). Les données sont sauvegardées dans le navigateur (localStorage).
 *    Utilisez Export/Import pour déplacer vos données vers un autre appareil ou pour publier.
 */

// —————— Petits utilitaires ——————
const uid = () => Math.random().toString(36).slice(2, 10);
const nowISO = () => new Date().toISOString();
const lsKey = "legend3_poll_store_v1";

function useLocalStore() {
  const [store, setStore] = useState(() => {
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      try { return JSON.parse(raw); } catch {}
    }
    return {
      meta: {
        title: "Tournoi La Légende – 3e Édition",
        subtitle: "Vote du Meilleur Joueur",
        waveNumber: "+225 07 09 46 74 72",
        votePrice: 200, // FCFA par vote (modifiable)
        adminCode: "LEG3",
        coverNote: "Payez par Wave puis entrez l'ID de la transaction pour valider votre vote.",
      },
      players: [
        // Démo (à supprimer)
        // { id: uid(), name: "Joueur Démo", team: "Équipe A", photo: "data:image/png;base64,..." }
      ],
      votes: [
        // { id, playerId, name, phone, txid, amount, at, status: 'pending'|'approved'|'rejected' }
      ],
    };
  });

  useEffect(() => {
    localStorage.setItem(lsKey, JSON.stringify(store));
  }, [store]);

  return [store, setStore];
}

function currency(n) {
  if (typeof n !== "number") return n;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);
}

// —————— Composants UI ——————
function Header({ meta }) {
  return (
    <div className="text-center space-y-2 py-6">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{meta.title}</h1>
      <p className="text-lg opacity-80">{meta.subtitle}</p>
      <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-3">
        <Badge>Vote: {currency(meta.votePrice)} / voix</Badge>
        <Badge>Wave: {meta.waveNumber}</Badge>
      </div>
      <p className="text-sm opacity-70 mt-3">{meta.coverNote}</p>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="px-3 py-1 rounded-2xl bg-gray-100 text-gray-800 text-xs font-semibold shadow-sm">
      {children}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl shadow-md bg-white p-4 ${className}`}>{children}</div>
  );
}

function Button({ children, onClick, type = "button", variant = "primary", disabled }) {
  const base = "px-4 py-2 rounded-2xl font-semibold shadow-sm transition active:scale-95 disabled:opacity-50";
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800",
    outline: "bg-white border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-500",
    success: "bg-green-600 text-white hover:bg-green-500",
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{title}</h3>
          <button className="text-2xl leading-none" onClick={onClose}>×</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

// —————— Gestion joueurs ——————
function PlayerCard({ p, votesApproved, onVote }) {
  return (
    <Card className="space-y-3">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-gray-100">
        {p.photo ? (
          <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">Aucune photo</div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-lg">{p.name}</div>
          {p.team && <div className="text-sm opacity-70">{p.team}</div>}
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold">{votesApproved}</div>
          <div className="text-xs opacity-70">voix</div>
        </div>
      </div>
      <Button onClick={() => onVote(p)}>Voter pour {p.name}</Button>
    </Card>
  );
}

// —————— Formulaire de vote ——————
function VoteForm({ meta, player, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [txid, setTxid] = useState("");
  const [amount, setAmount] = useState(meta.votePrice);

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, phone, txid, amount });
      }}
    >
      <p className="text-sm">
        1) Ouvrez l'application <b>Wave</b> et payez <b>{currency(meta.votePrice)}</b> par vote au numéro
        <br />
        <span className="font-mono font-bold">{meta.waveNumber}</span> (ajoutez en référence: « Vote {player.name} »).
        <br />
        2) Notez le <b>numéro de transaction</b> (ID Wave).
        <br />
        3) Remplissez ce formulaire pour soumettre votre vote.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm">Nom et Prénoms
          <input className="mt-1 w-full border border-gray-300 rounded-xl p-2" required value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ex: Koffi Armel" />
        </label>
        <label className="text-sm">Téléphone (WhatsApp)
          <input className="mt-1 w-full border border-gray-300 rounded-xl p-2" required value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Ex: 07 00 00 00 00" />
        </label>
        <label className="text-sm md:col-span-2">ID transaction Wave
          <input className="mt-1 w-full border border-gray-300 rounded-xl p-2 font-mono" required value={txid} onChange={(e)=>setTxid(e.target.value)} placeholder="Ex: TX123456789" />
        </label>
        <label className="text-sm">Montant payé (FCFA)
          <input type="number" min={meta.votePrice} step={meta.votePrice} className="mt-1 w-full border border-gray-300 rounded-xl p-2" required value={amount} onChange={(e)=>setAmount(parseInt(e.target.value||"0"))} />
        </label>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button type="submit">Soumettre le vote</Button>
      </div>
    </form>
  );
}

// —————— Admin ——————
function AdminGate({ onUnlock }) {
  const [code, setCode] = useState("");
  return (
    <Card className="space-y-3">
      <div className="text-lg font-bold">Espace Organisateur</div>
      <p className="text-sm opacity-70">Entrez le code administrateur pour gérer les joueurs et valider les votes.</p>
      <div className="flex gap-2">
        <input className="flex-1 border border-gray-300 rounded-xl p-2" placeholder="Code admin (ex: LEG3)" value={code} onChange={(e)=>setCode(e.target.value)} />
        <Button onClick={()=>onUnlock(code)}>Entrer</Button>
      </div>
    </Card>
  );
}

function ImagePicker({ value, onChange }) {
  const fileRef = useRef(null);
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
        {value ? <img src={value} alt="apercu" className="w-full h-full object-cover" /> : <span className="text-xs opacity-60">Aperçu</span>}
      </div>
      <div className="space-y-2">
        <Button variant="outline" onClick={()=>fileRef.current?.click()}>Choisir une photo</Button>
        <input type="file" accept="image/*" hidden ref={fileRef} onChange={(e)=>{
          const f = e.target.files?.[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => onChange(String(reader.result));
          reader.readAsDataURL(f);
        }} />
        {value && (
          <div>
            <button className="text-xs underline opacity-70" onClick={(e)=>{e.preventDefault(); onChange("");}}>Retirer</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPanel({ store, setStore }) {
  const [tab, setTab] = useState("joueurs");

  const approvedCountByPlayer = useMemo(() => {
    const map = {};
    store.players.forEach(p => { map[p.id] = 0; });
    store.votes.forEach(v => { if (v.status === 'approved') map[v.playerId] = (map[v.playerId]||0)+1; });
    return map;
  }, [store]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['joueurs','votes','reglages','sauvegarde'].map(t => (
          <Button key={t} variant={tab===t? 'primary':'outline'} onClick={()=>setTab(t)}>{t.toUpperCase()}</Button>
        ))}
      </div>

      {tab === 'joueurs' && (
        <Card className="space-y-4">
          <AddPlayer onAdd={(p)=> setStore(s=>({...s, players:[...s.players, p]}))} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {store.players.map(p => (
              <Card key={p.id} className="space-y-2">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
                  {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="font-bold">{p.name}</div>
                <div className="text-sm opacity-70">{p.team || '—'}</div>
                <div className="text-sm">Voix validées: <b>{approvedCountByPlayer[p.id]||0}</b></div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" onClick={()=>{
                    const name = prompt('Nom du joueur', p.name) || p.name;
                    const team = prompt('Équipe (facultatif)', p.team||'') || p.team;
                    setStore(s=>({...s, players: s.players.map(x=> x.id===p.id? {...x, name, team }: x)}));
                  }}>Éditer</Button>
                  <Button variant="danger" onClick={()=>{
                    if (confirm('Supprimer ce joueur ?')) {
                      setStore(s=>({...s, players: s.players.filter(x=>x.id!==p.id)}));
                    }
                  }}>Supprimer</Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {tab === 'votes' && (
        <Card className="space-y-3">
          <div className="text-lg font-bold">Votes à vérifier</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Joueur</th>
                  <th className="py-2 pr-3">Votant</th>
                  <th className="py-2 pr-3">Téléphone</th>
                  <th className="py-2 pr-3">ID Tx</th>
                  <th className="py-2 pr-3">Montant</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {store.votes.slice().reverse().map(v => {
                  const p = store.players.find(p=>p.id===v.playerId);
                  return (
                    <tr key={v.id} className="border-b">
                      <td className="py-2 pr-3 whitespace-nowrap">{new Date(v.at).toLocaleString()}</td>
                      <td className="py-2 pr-3">{p? p.name : '—'}</td>
                      <td className="py-2 pr-3">{v.name}</td>
                      <td className="py-2 pr-3">{v.phone}</td>
                      <td className="py-2 pr-3 font-mono">{v.txid}</td>
                      <td className="py-2 pr-3">{currency(v.amount)}</td>
                      <td className="py-2 pr-3">{v.status}</td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <Button variant="success" onClick={()=> setStore(s=>({...s, votes: s.votes.map(x=> x.id===v.id? {...x, status:'approved'}:x)}))}>Valider</Button>
                          <Button variant="danger" onClick={()=> setStore(s=>({...s, votes: s.votes.map(x=> x.id===v.id? {...x, status:'rejected'}:x)}))}>Refuser</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'reglages' && (
        <Card className="space-y-3">
          <div className="text-lg font-bold">Réglages</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">Titre
              <input className="mt-1 w-full border border-gray-300 rounded-xl p-2" value={store.meta.title} onChange={(e)=> setStore(s=>({...s, meta:{...s.meta, title: e.target.value}}))} />
            </label>
            <label className="text-sm">Sous-titre
              <input className="mt-1 w-full border border-gray-300 rounded-xl p-2" value={store.meta.subtitle} onChange={(e)=> setStore(s=>({...s, meta:{...s.meta, subtitle: e.target.value}}))} />
            </label>
            <label className="text-sm">Numéro Wave
              <input className="mt-1 w-full border border-gray-300 rounded-xl p-2 font-mono" value={store.meta.waveNumber} onChange={(e)=> setStore(s=>({...s, meta:{...s.meta, waveNumber: e.target.value}}))} />
            </label>
            <label className="text-sm">Montant par vote (FCFA)
              <input type="number" min={0} step={50} className="mt-1 w-full border border-gray-300 rounded-xl p-2" value={store.meta.votePrice} onChange={(e)=> setStore(s=>({...s, meta:{...s.meta, votePrice: parseInt(e.target.value||"0")}}))} />
            </label>
            <label className="text-sm">Code Admin
              <input className="mt-1 w-full border border-gray-300 rounded-xl p-2" value={store.meta.adminCode} onChange={(e)=> setStore(s=>({...s, meta:{...s.meta, adminCode: e.target.value}}))} />
            </label>
            <label className="text-sm md:col-span-2">Message d'en-tête
              <textarea className="mt-1 w-full border border-gray-300 rounded-xl p-2" rows={2} value={store.meta.coverNote} onChange={(e)=> setStore(s=>({...s, meta:{...s.meta, coverNote: e.target.value}}))} />
            </label>
          </div>
        </Card>
      )}

      {tab === 'sauvegarde' && (
        <Card className="space-y-3">
          <div className="text-lg font-bold">Sauvegarde & Partage</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={()=>{
              const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'legend3_sondage.json'; a.click();
              setTimeout(()=>URL.revokeObjectURL(url), 1000);
            }}>Exporter (.json)</Button>
            <label className="px-4 py-2 rounded-2xl font-semibold shadow-sm transition border border-gray-300 hover:bg-gray-50 cursor-pointer">
              Importer (.json)
              <input type="file" accept="application/json" hidden onChange={(e)=>{
                const f = e.target.files?.[0]; if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const data = JSON.parse(String(reader.result));
                    if (data?.meta && data?.players && data?.votes) {
                      setStore(data);
                      alert('Import réussi.');
                    } else {
                      alert('Fichier invalide.');
                    }
                  } catch { alert('Erreur de lecture du fichier.'); }
                };
                reader.readAsText(f);
              }} />
            </label>
            <Button variant="danger" onClick={()=>{
              if (confirm('Réinitialiser toutes les données ?')) {
                localStorage.removeItem(lsKey); window.location.reload();
              }
            }}>Réinitialiser</Button>
          </div>
          <p className="text-sm opacity-70">Astuce: publiez cette page sur Netlify/Vercel. Utilisez Export/Import pour transférer vos données entre ordinateurs.</p>
        </Card>
      )}
    </div>
  );
}

function AddPlayer({ onAdd }) {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [photo, setPhoto] = useState("");
  return (
    <Card className="space-y-3">
      <div className="text-lg font-bold">Ajouter un joueur</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm">Nom du joueur
          <input className="mt-1 w-full border border-gray-300 rounded-xl p-2" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ex: Traoré Ibrahim" />
        </label>
        <label className="text-sm">Équipe (facultatif)
          <input className="mt-1 w-full border border-gray-300 rounded-xl p-2" value={team} onChange={(e)=>setTeam(e.target.value)} placeholder="Ex: La Légende FC" />
        </label>
        <div className="md:col-span-2">
          <div className="text-sm mb-1">Photo du joueur</div>
          <ImagePicker value={photo} onChange={setPhoto} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={()=>{setName(""); setTeam(""); setPhoto("");}}>Effacer</Button>
        <Button onClick={()=>{
          if (!name) { alert('Entrez le nom du joueur.'); return; }
          onAdd({ id: uid(), name, team, photo });
          setName(""); setTeam(""); setPhoto("");
        }}>Ajouter</Button>
      </div>
    </Card>
  );
}

// —————— Classement ——————
function Leaderboard({ players, votes }) {
  const counts = useMemo(() => {
    const map = {};
    players.forEach(p => map[p.id] = 0);
    votes.forEach(v => { if (v.status === 'approved') map[v.playerId] = (map[v.playerId]||0) + 1; });
    return map;
  }, [players, votes]);

  const sorted = [...players].sort((a,b) => (counts[b.id]||0) - (counts[a.id]||0));

  return (
    <Card className="space-y-3">
      <div className="text-lg font-bold">Classement (votes validés)</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {sorted.map((p, idx) => (
          <div key={p.id} className={`rounded-xl p-3 border ${idx===0? 'bg-yellow-50 border-yellow-200':'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-extrabold w-10 text-center">{idx+1}</div>
              <div className="flex-1">
                <div className="font-bold">{p.name}</div>
                <div className="text-xs opacity-70">{p.team || '—'}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold">{counts[p.id]||0}</div>
                <div className="text-xs opacity-70">voix</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// —————— Application ——————
export default function App() {
  const [store, setStore] = useLocalStore();
  const [adminOn, setAdminOn] = useState(false);
  const [votePlayer, setVotePlayer] = useState(null);

  const approvedCountByPlayer = useMemo(() => {
    const m = {}; store.players.forEach(p => m[p.id] = 0);
    store.votes.forEach(v => { if (v.status==='approved') m[v.playerId] = (m[v.playerId]||0)+1; });
    return m;
  }, [store]);

  function tryUnlock(code) {
    if (code === store.meta.adminCode) setAdminOn(true);
    else alert('Code incorrect.');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Header meta={store.meta} />

        {/* Actions globales */}
        <div className="flex flex-wrap items-center gap-2 justify-between mb-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={()=> window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>Aller au classement</Button>
            <Button variant="outline" onClick={()=> navigator.clipboard.writeText(window.location.href).then(()=>alert('Lien copié !'))}>Copier le lien</Button>
          </div>
          <div className="flex gap-2">
            {!adminOn ? (
              <Button onClick={()=>{
                const code = prompt('Code admin'); if (code) tryUnlock(code);
              }}>Admin</Button>
            ) : (
              <Badge>Admin activé</Badge>
            )}
          </div>
        </div>

        {/* Liste des joueurs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {store.players.length === 0 && (
            <Card className="sm:col-span-2 lg:col-span-3 text-center py-10">
              <div className="text-lg font-bold">Aucun joueur pour le moment</div>
              <p className="text-sm opacity-70">Ajoutez des joueurs dans l'espace Admin.</p>
            </Card>
          )}
          {store.players.map(p => (
            <PlayerCard key={p.id} p={p} votesApproved={approvedCountByPlayer[p.id]||0} onVote={(pl)=> setVotePlayer(pl)} />
          ))}
        </div>

        {/* Classement */}
        <div className="mt-6" id="classement">
          <Leaderboard players={store.players} votes={store.votes} />
        </div>

        {/* Espace Admin */}
        <div className="mt-6">
          {!adminOn ? (
            <AdminGate onUnlock={tryUnlock} />
          ) : (
            <AdminPanel store={store} setStore={setStore} />
          )}
        </div>
      </div>

      {/* Modal Vote */}
      <Modal open={!!votePlayer} onClose={()=>setVotePlayer(null)} title={votePlayer? `Voter pour ${votePlayer.name}`: ''}>
        {votePlayer && (
          <VoteForm
            meta={store.meta}
            player={votePlayer}
            onCancel={()=> setVotePlayer(null)}
            onSubmit={({ name, phone, txid, amount })=>{
              const vote = { id: uid(), playerId: votePlayer.id, name, phone, txid, amount, at: nowISO(), status: 'pending' };
              setStore(s=> ({...s, votes: [...s.votes, vote]}));
              setVotePlayer(null);
              alert('Vote soumis ! Il sera pris en compte après validation.');
            }}
          />
        )}
      </Modal>

      {/* Footer */}
      <div className="text-center text-xs opacity-60 py-10">
        © {new Date().getFullYear()} – Tournoi La Légende. Propulsé par un sondage sans serveur.
      </div>
    </div>
  );
}
