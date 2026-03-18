import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Headphones, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';

/* ── Tokens ── */
const C = {
  bg: '#191A1E', surface: '#26272D', surface2: '#2B2C35',
  border: '#363741', primary: '#5A84D5', accent: '#FFB84D',
  text: '#FFF', muted: '#A0A0A5', dim: '#7E7E86', input: '#1E1F24',
};

export default function ScreenContact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'Support technique', message: '' });
  const [isSent, setIsSent] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulation d'envoi
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setFormData({ name: '', email: '', subject: 'Support technique', message: '' });
    }, 4000);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflowY: 'auto', position: 'relative' }}>
      
      {/* ── En-tête de la page ── */}
      <div style={{ padding: '2.5rem 2.5rem 1.5rem', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(180deg, rgba(90, 132, 213, 0.05) 0%, rgba(25, 26, 30, 0) 100%)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '14px', background: `${C.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <MessageSquare size={24} color={C.primary} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: C.text, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Besoin d'aide avec <span style={{ color: C.primary }}>ILLUMINEX-BJ</span> ?
        </h1>
        <p style={{ color: C.muted, fontSize: '1rem', maxWidth: '600px', lineHeight: 1.6 }}>
          Notre équipe d'experts en éclairage est disponible pour vous accompagner dans vos projets au Bénin ou répondre à vos questions techniques.
        </p>
      </div>

      <div style={{ padding: '2.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%', display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        
        {/* ── Informations de contact rapides ── */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: C.text, marginBottom: '0.5rem' }}>Bureaux & Support</h2>

          <ContactCard 
            icon={MapPin} title="Siège Social (Bénin)" 
            desc="Cotonou, Haie Vive, Immeuble Lumier" 
            sub="Ouvert du Lundi au Samedi"
            color={C.primary}
          />

          <ContactCard 
            icon={Phone} title="Ligne Directe" 
            desc="+229 90 00 00 00 / +229 97 00 00 00" 
            sub="08:00 - 18:00 (Heure de Cotonou)"
            color={C.accent}
          />

          <ContactCard 
            icon={Mail} title="Adresses Email" 
            desc="support@illuminex.bj" 
            sub="commercial@illuminex.bj"
            color="#4ade80"
          />

          <div style={{ marginTop: '1rem', padding: '1.5rem', background: C.surface, borderRadius: '12px', border: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: C.text, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} color={C.muted} /> Réseaux Professionnels
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={socialBtnStyle}>LinkedIn</button>
              <button style={socialBtnStyle}>Twitter</button>
              <button style={socialBtnStyle}>WhatsApp</button>
            </div>
          </div>
        </div>

        {/* ── Formulaire de message ── */}
        <div style={{ flex: 1.5, minWidth: '400px' }}>
          <form 
            onSubmit={handleSubmit}
            style={{ 
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '2rem',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
              <Headphones size={22} color={C.primary} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: C.text, margin: 0 }}>Envoyez-nous un message</h2>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Nom complet</label>
                <input required type="text" placeholder="Ex: Jean Martin" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputStyle} />
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Adresse email</label>
                <input required type="email" placeholder="jean@exemple.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ ...inputGroupStyle, marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Sujet de la demande</label>
              <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} style={selectStyle}>
                <option value="Support technique">Support technique / Bug logiciel</option>
                <option value="Question commerciale">Acquisition de licences / Devis</option>
                <option value="Partenariat">Proposition de partenariat</option>
                <option value="Autre">Autre demande</option>
              </select>
            </div>

            <div style={{ ...inputGroupStyle, marginBottom: '2rem' }}>
              <label style={labelStyle}>Votre message</label>
              <textarea required placeholder="Comment pouvons-nous vous aider aujourd'hui ?" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} rows={5} style={{ ...inputStyle, resize: 'vertical' }}></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSent}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                width: '100%', padding: '1rem', borderRadius: '10px',
                background: isSent ? '#16A34A' : isHovered ? '#4A71C0' : C.primary,
                color: '#FFF', border: 'none', fontSize: '1rem', fontWeight: 600,
                cursor: isSent ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                transition: 'all 0.2s', boxShadow: isSent ? 'none' : '0 4px 14px rgba(90,132,213,0.3)'
              }}
            >
              {isSent ? (
                <><CheckCircle2 size={20} /> Message envoyé avec succès !</>
              ) : (
                <><Send size={18} /> Envoyer la demande <ArrowRight size={16} style={{ transform: isHovered ? 'translateX(4px)' : 'none', transition: 'transform 0.2s' }} /></>
              )}
            </button>
            
            {/* Overlay de succès temporaire */}
            {isSent && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(38, 39, 45, 0.9)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#16A34A20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <CheckCircle2 size={32} color="#4ade80" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFF', marginBottom: '0.5rem' }}>Merci pour votre message !</h3>
                <p style={{ color: C.muted, fontSize: '0.875rem' }}>Notre équipe vous répondra sous 24h.</p>
              </div>
            )}
          </form>
        </div>
      </div>
      
      {/* ── Footer ── */}
      <div style={{ marginTop: 'auto', padding: '1.5rem', textAlign: 'center', borderTop: `1px solid ${C.border}`, fontSize: '0.75rem', color: C.dim }}>
        © 2026 ILLUMINEX-BJ (Illuminaire Nuilere) par Supra Stores. Tous droits réservés.
      </div>
    </div>
  );
}

/* ── Mini composant Carte de Contact ── */
function ContactCard({ icon: Icon, title, desc, sub, color }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', background: C.surface, padding: '1.25rem', borderRadius: '12px', border: `1px solid ${C.border}`, transition: 'transform 0.2s, border-color 0.2s', cursor: 'default' }}
         onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = `${color}50`; }}
         onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = C.border; }}>
      <div style={{ width: 42, height: 42, borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: C.text, marginBottom: '0.25rem' }}>{title}</h4>
        <p style={{ fontSize: '0.875rem', color: C.muted, marginBottom: '0.25rem' }}>{desc}</p>
        <p style={{ fontSize: '0.75rem', color: C.dim }}>{sub}</p>
      </div>
    </div>
  );
}

/* ── Styles partagés ── */
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 };
const labelStyle = { color: C.muted, fontSize: '0.8125rem', fontWeight: 600 };
const inputStyle = {
  background: C.input, border: `1px solid ${C.border}`, borderRadius: '8px',
  padding: '0.75rem 1rem', color: C.text, fontSize: '0.9375rem', outline: 'none',
  transition: 'border-color 0.2s'
};
const selectStyle = {
  ...inputStyle, appearance: 'none', cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237E7E86' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center'
};
const socialBtnStyle = {
  background: C.bg, border: `1px solid ${C.border}`, color: C.muted,
  padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
  cursor: 'pointer', transition: 'all 0.2s', flex: 1
};
