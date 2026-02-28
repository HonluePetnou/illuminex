import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ScreenContact() {
  return (
    <div className="page-container" style={{ padding: '3rem', flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: '#FFF', marginBottom: '1rem', textAlign: 'center' }}>
          Nous Contacter
        </h2>
        <p style={{ color: '#A0A0A5', textAlign: 'center', marginBottom: '3rem', fontSize: '1.125rem' }}>
          Une question sur ILLUMINEX ou besoin d'assistance technique ? Notre équipe est là pour vous aider.
        </p>

        <div style={{ display: 'flex', gap: '3rem', flexDirection: 'column' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {/* Contact Cards */}
            <div style={{ background: '#26272D', padding: '2rem', borderRadius: '12px', border: '1px solid #363741', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(90, 132, 213, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Mail size={24} color="#5A84D5" />
              </div>
              <h3 style={{ color: '#FFF', fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 500 }}>Email</h3>
              <p style={{ color: '#A0A0A5', fontSize: '0.875rem', marginBottom: '1rem' }}>Support technique et commercial</p>
              <a href="mailto:support@illuminex.bj" style={{ color: '#5A84D5', textDecoration: 'none', fontWeight: 500 }}>support@illuminex.bj</a>
            </div>

            <div style={{ background: '#26272D', padding: '2rem', borderRadius: '12px', border: '1px solid #363741', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(90, 132, 213, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Phone size={24} color="#5A84D5" />
              </div>
              <h3 style={{ color: '#FFF', fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 500 }}>Téléphone</h3>
              <p style={{ color: '#A0A0A5', fontSize: '0.875rem', marginBottom: '1rem' }}>Lun-Ven de 8h à 18h</p>
              <a href="tel:+22990000000" style={{ color: '#5A84D5', textDecoration: 'none', fontWeight: 500 }}>+229 90 00 00 00</a>
            </div>

            <div style={{ background: '#26272D', padding: '2rem', borderRadius: '12px', border: '1px solid #363741', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(90, 132, 213, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <MapPin size={24} color="#5A84D5" />
              </div>
              <h3 style={{ color: '#FFF', fontSize: '1.125rem', marginBottom: '0.5rem', fontWeight: 500 }}>Bureaux</h3>
              <p style={{ color: '#A0A0A5', fontSize: '0.875rem', marginBottom: '1rem' }}>Adresse principale</p>
              <span style={{ color: '#5A84D5', fontWeight: 500 }}>Cotonou, Bénin</span>
            </div>
          </div>

          <div style={{ background: '#26272D', padding: '2.5rem', borderRadius: '12px', border: '1px solid #363741' }}>
            <h3 style={{ color: '#FFF', fontSize: '1.5rem', marginBottom: '2rem', fontWeight: 500 }}>Envoyez-nous un message</h3>
            
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Nom complet</label>
                  <input type="text" placeholder="Votre nom" style={{
                    background: '#191A1E', border: '1px solid #363741', borderRadius: '8px', padding: '0.875rem 1rem', color: '#FFF', width: '100%', outline: 'none', fontSize: '1rem'
                  }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Adresse email</label>
                  <input type="email" placeholder="Votre email" style={{
                    background: '#191A1E', border: '1px solid #363741', borderRadius: '8px', padding: '0.875rem 1rem', color: '#FFF', width: '100%', outline: 'none', fontSize: '1rem'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Sujet</label>
                <select style={{
                  background: '#191A1E', border: '1px solid #363741', borderRadius: '8px', padding: '0.875rem 1rem', color: '#FFF', width: '100%', outline: 'none', fontSize: '1rem', appearance: 'none'
                }}>
                  <option>Support technique</option>
                  <option>Question commerciale</option>
                  <option>Suggestion d'amélioration</option>
                  <option>Autre</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: '#A0A0A5', fontSize: '0.875rem' }}>Message</label>
                <textarea placeholder="Comment pouvons-nous vous aider ?" rows={5} style={{
                  background: '#191A1E', border: '1px solid #363741', borderRadius: '8px', padding: '0.875rem 1rem', color: '#FFF', width: '100%', outline: 'none', fontSize: '1rem', resize: 'vertical'
                }}></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
                  <Send size={18} /> Envoyer le message
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
