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
        setMembershipStatus(data.isActive ? 'active' : 'expired');
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
      case 'none':
        return { color: '#6c757d', text: 'Non membre', icon: '○' };
      default:
        return { color: '#6c757d', text: 'Non membre', icon: '○' };
    }
  };

  const badge = getMembershipBadge();

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
              <span className="info-value">{new Date(membership.startDate).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="membership-info-row">
              <span className="info-label">Date de fin:</span>
              <span className="info-value">{new Date(membership.endDate).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        ) : membership && membershipStatus === 'expired' ? (
          <div className="membership-expired-card">
            <p className="expired-message">Votre cotisation a expiré le {new Date(membership.endDate).toLocaleDateString('fr-FR')}</p>
            <button
              className="renew-button"
              onClick={() => navigate('/membership/payment')}
            >
              Renouveler ma cotisation
            </button>
          </div>
        ) : (
          <div className="membership-none-card">
            <p className="none-message">Vous n'avez pas encore de cotisation active.</p>
            <button
              className="subscribe-button"
              onClick={() => navigate('/membership/payment')}
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
