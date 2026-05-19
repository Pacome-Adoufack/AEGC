import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../Url";
import "../../styles/InfoPersonelle.css";

const InfoPersonelle = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [user, setUser] = useState(storedUser);
  const [membership, setMembership] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('none');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState(storedUser);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    fetchMembership();
  }, []);

  const fetchMembership = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/membership/my-membership`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.membership) {
        setMembership(data.membership);
        const statusField = data.membership.submissionStatus || data.membership.paymentStatus;
        let status = 'none';
        if (statusField === 'pending') status = 'pending';
        else if (statusField === 'rejected' || statusField === 'cancelled') status = 'rejected';
        else if (statusField === 'approved') status = data.isActive ? 'active' : 'expired';
        else status = data.isActive ? 'active' : 'none';
        setMembershipStatus(status);
      } else {
        setMembershipStatus('none');
      }
      setLoading(false);
    } catch (err) {
      console.error('Erreur chargement membership:', err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEditBuffer({ ...editBuffer, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setEditBuffer({ ...user });
    setSaveMsg('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditBuffer({ ...user });
    setSaveMsg('');
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editBuffer),
      });
      if (!response.ok) throw new Error('Erreur serveur');
      setUser(editBuffer);
      localStorage.setItem('user', JSON.stringify(editBuffer));
      setSaveMsg('Modifications enregistrées.');
      setIsEditing(false);
    } catch (err) {
      setSaveMsg('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const BADGE_CONFIG = {
    active:   { cls: 'badge--active',   text: 'Actif',       icon: '✓' },
    expired:  { cls: 'badge--expired',  text: 'Expiré',      icon: '⚠' },
    pending:  { cls: 'badge--pending',  text: 'En attente',  icon: '⏳' },
    rejected: { cls: 'badge--rejected', text: 'Rejeté',      icon: '✗' },
    none:     { cls: 'badge--none',     text: 'Non membre',  icon: '–' },
  };

  const badge = BADGE_CONFIG[membershipStatus] || BADGE_CONFIG.none;

  const formatDate = (d) => {
    if (!d) return '-';
    const t = new Date(d);
    return isNaN(t.getTime()) ? '-' : t.toLocaleDateString('fr-FR');
  };

  return (
    <div className="ip-container">
      <h1 className="ip-page-title">Mon Profil</h1>

      {/* Statut de cotisation */}
      <div className="ip-card">
        <div className="ip-card-header">
          <h2 className="ip-card-title">Statut de cotisation</h2>
          <span className={`ip-badge ${badge.cls}`}>
            {badge.icon} {badge.text}
          </span>
        </div>

        {loading ? (
          <p className="ip-loading">Chargement…</p>
        ) : membership && membershipStatus === 'active' ? (
          <div className="ip-membership-active">
            <div className="ip-membership-notice ip-membership-notice--green">
              <strong>Adhésion validée</strong>
              <span>Votre statut est actif jusqu'au {formatDate(membership.endDate)}.</span>
            </div>
            <div className="ip-info-grid">
              <span>Numéro de paiement</span><strong>{membership.paymentNumber}</strong>
              <span>Montant</span><strong>{membership.amount} {membership.currency}</strong>
              <span>Début</span><strong>{formatDate(membership.startDate)}</strong>
              <span>Fin</span><strong>{formatDate(membership.endDate)}</strong>
            </div>
          </div>
        ) : membership && membershipStatus === 'expired' ? (
          <div className="ip-membership-state">
            <p className="ip-state-msg ip-state-msg--red">Votre cotisation a expiré le {formatDate(membership.endDate)}.</p>
            <button className="ip-btn ip-btn--red" onClick={() => navigate('/membership/payment')}>
              Renouveler ma cotisation
            </button>
          </div>
        ) : membership && membershipStatus === 'pending' ? (
          <div className="ip-membership-state">
            <p className="ip-state-msg">Votre demande est en attente de validation par l'administrateur.</p>
          </div>
        ) : membership && membershipStatus === 'rejected' ? (
          <div className="ip-membership-state">
            <p className="ip-state-msg ip-state-msg--red">Votre demande d'adhésion a été rejetée.</p>
            {membership.rejectionReason && (
              <p className="ip-rejection-reason">Motif : {membership.rejectionReason}</p>
            )}
            <button className="ip-btn ip-btn--blue" onClick={() => navigate('/membership/payment', { state: { resubmit: true } })}>
              Resoumettre ma demande
            </button>
          </div>
        ) : (
          <div className="ip-membership-state">
            <p className="ip-state-msg">Vous n'avez pas encore de cotisation active.</p>
            <button className="ip-btn ip-btn--green" onClick={() => navigate('/membership/payment')}>
              Souscrire à la cotisation annuelle
            </button>
          </div>
        )}
      </div>

      {/* Informations personnelles */}
      <div className="ip-card">
        <div className="ip-card-header">
          <h2 className="ip-card-title">Informations personnelles</h2>
          {!isEditing && (
            <button type="button" className="ip-btn ip-btn--outline" onClick={handleEdit}>
              ✏ Modifier
            </button>
          )}
        </div>

        {saveMsg && !isEditing && (
          <p className={`ip-save-msg ${saveMsg.includes('Erreur') ? 'ip-save-msg--error' : 'ip-save-msg--ok'}`}>
            {saveMsg}
          </p>
        )}

        {isEditing ? (
          <form className="ip-form" onSubmit={handleSave}>
            <div className="ip-form-grid">
              {[
                { label: 'Nom', name: 'name', type: 'text' },
                { label: 'Prénom', name: 'firstName', type: 'text' },
                { label: 'Email', name: 'email', type: 'email' },
                { label: 'Pays', name: 'country', type: 'text' },
                { label: 'Ville', name: 'city', type: 'text' },
                { label: 'Téléphone', name: 'telefonNummer', type: 'text' },
                { label: 'Sexe', name: 'gender', type: 'text' },
                { label: 'Université / Profession', name: 'university', type: 'text' },
              ].map(({ label, name, type }) => (
                <div className="ip-field" key={name}>
                  <label>{label}</label>
                  <input type={type} name={name} value={editBuffer?.[name] || ''} onChange={handleChange} />
                </div>
              ))}
            </div>
            <div className="ip-form-footer">
              {saveMsg && (
                <span className={`ip-save-msg ${saveMsg.includes('Erreur') ? 'ip-save-msg--error' : 'ip-save-msg--ok'}`}>
                  {saveMsg}
                </span>
              )}
              <button type="button" className="ip-btn ip-btn--ghost" onClick={handleCancel}>Annuler</button>
              <button type="submit" className="ip-btn ip-btn--blue" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        ) : (
          <div className="ip-form-grid ip-form-grid--readonly">
            {[
              { label: 'Nom', value: user?.name },
              { label: 'Prénom', value: user?.firstName },
              { label: 'Email', value: user?.email },
              { label: 'Pays', value: user?.country },
              { label: 'Ville', value: user?.city },
              { label: 'Téléphone', value: user?.telefonNummer },
              { label: 'Sexe', value: user?.gender },
              { label: 'Université / Profession', value: user?.university },
            ].map(({ label, value }) => (
              <div className="ip-field" key={label}>
                <label>{label}</label>
                <span className="ip-field-value">{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoPersonelle;
