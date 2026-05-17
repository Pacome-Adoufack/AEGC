import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../components/Url";
import "../styles/InfoPersonelle.css";

const InfoPersonelle = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [user, setUser] = useState(storedUser);
  const [membership, setMembership] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('none');
  const [loading, setLoading] = useState(true);

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
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const getMembershipBadge = () => {
    switch (membershipStatus) {
      case 'active':
        return { color: '#28a745', text: 'Actif', icon: '✓' };
      case 'expired':
        return { color: '#dc3545', text: 'Expiré', icon: '⚠' };
      case 'pending':
        return { color: '#ffc107', text: "En attente", icon: '⏳' };
      case 'rejected':
        return { color: '#6c757d', text: 'Rejeté', icon: '✗' };
      case 'none':
        return { color: '#6c757d', text: 'Non membre', icon: '○' };
      default:
        return { color: '#6c757d', text: 'Non membre', icon: '○' };
    }
  };

  const badge = getMembershipBadge();
  const formatDateSafe = (d) => {
    if (!d) return null;
    const t = new Date(d);
    if (isNaN(t.getTime())) return null;
    return t.toLocaleDateString('fr-FR');
  };

  const activeUntil = formatDateSafe(membership && membership.endDate);

  return (
    <div className="info-container">
      <h2>Information Personnelle</h2>
      <h4>Mon Profil</h4>

      {/* Section Membership */}
      <div className="membership-section">
        <div className="membership-header">
          <h3>Statut de Cotisation</h3>
          <div className="membership-badge" style={{ backgroundColor: badge.color }}>
            <span className="badge-icon">{badge.icon}</span>
            <span className="badge-text">{badge.text}</span>
          </div>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : membership && membershipStatus === 'active' ? (
          <div className="membership-info-card">
            <div className="membership-active-note">
              <strong>Adhésion validée</strong>
              <span>Votre statut est actif jusqu'au {activeUntil}.</span>
            </div>
            <div className="membership-info-row">
              <span className="info-label">Numéro de paiement:</span>
              <span className="info-value">{membership.paymentNumber}</span>
            </div>
            <div className="membership-info-row">
              <span className="info-label">Montant payé:</span>
              <span className="info-value">{membership.amount} {membership.currency}</span>
            </div>
            <div className="membership-info-row">
              <span className="info-label">Date de début:</span>
              <span className="info-value">{formatDateSafe(membership && membership.startDate) || '-'}</span>
            </div>
            <div className="membership-info-row">
              <span className="info-label">Date de fin:</span>
              <span className="info-value">{formatDateSafe(membership && membership.endDate) || '-'}</span>
            </div>
          </div>
        ) : membership && membershipStatus === 'expired' ? (
          <div className="membership-expired-card">
            <p className="expired-message">Votre cotisation a expiré le {formatDateSafe(membership && membership.endDate) || '-'}</p>
            <button
              className="renew-button"
              onClick={() => navigate('/membership/payment')}
            >
              Renouveler ma cotisation
            </button>
          </div>
        ) : membership && membershipStatus === 'pending' ? (
          <div className="membership-pending-card">
            <p className="pending-message">Votre demande d'adhésion est en attente de validation par l'administrateur.</p>
          </div>
        ) : membership && membershipStatus === 'rejected' ? (
          <div className="membership-rejected-card">
            <p className="rejected-message">Votre demande d'adhésion a été rejetée.</p>
            {membership.rejectionReason && <p className="rejected-reason">Motif: {membership.rejectionReason}</p>}
            <button
              className="resubmit-button"
              onClick={() => navigate('/membership/payment', { state: { resubmit: true } })}
            >
              Resoumettre ma demande
            </button>
          </div>
        ) : (
          <div className="membership-none-card">
            <p className="none-message">Vous n'avez pas encore de cotisation active.</p>
            <button
              className="subscribe-button"
              onClick={() => navigate('/membership/payment', { state: { resubmit: false } })}
            >
              Souscrire à la cotisation annuelle
            </button>
          </div>
        )}
      </div>

      {/* Section Informations personnelles */}
      <div className="info-form">
        <label>Nom:</label>
        <input
          type="text"
          name="name"
          value={user.name}
          onChange={handleChange}
        />

        <label>Prénom:</label>
        <input
          type="text"
          name="firstName"
          value={user.firstName}
          onChange={handleChange}
        />

        <label>Email:</label>
        <input
          type="text"
          name="email"
          value={user.email}
          onChange={handleChange}
        />

        <label>Pays:</label>
        <input
          type="text"
          name="country"
          value={user.country}
          onChange={handleChange}
        />

        <label>Ville:</label>
        <input
          type="text"
          name="city"
          value={user.city}
          onChange={handleChange}
        />

        <label>Numéro de téléphone:</label>
        <input
          type="text"
          name="telefonNummer"
          value={user.telefonNummer}
          onChange={handleChange}
        />

        <label>Sexe:</label>
        <input
          type="text"
          name="gender"
          value={user.gender}
          onChange={handleChange}
        />

        <label>Université / Profession:</label>
        <input
          type="text"
          name="university"
          value={user.university}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default InfoPersonelle;
