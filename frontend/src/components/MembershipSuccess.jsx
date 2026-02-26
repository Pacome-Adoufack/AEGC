import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../components/Url';
import { getAuthHeaders } from '../utils/auth';
import '../styles/MembershipSuccess.css';

const MembershipSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [membership, setMembership] = useState(null);

    const fetchMembership = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/membership/my-membership`, {
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (data.membership) {
                setMembership(data.membership);
            }
            setLoading(false);
        } catch (err) {
            console.error('Erreur chargement membership:', err);
            setLoading(false);
        }
    }, []);

    const verifyStripePayment = useCallback(async (sessionId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/membership/verify-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session_id: sessionId })
            });

            const data = await response.json();

            if (data.success) {
                setTimeout(() => {
                    fetchMembership();
                }, 1000);
            } else {
                console.error('Erreur vérification:', data.message);
                setLoading(false);
            }
        } catch (err) {
            console.error('Erreur vérification paiement Stripe:', err);
            setLoading(false);
        }
    }, [fetchMembership]);

    const verifyNotchPayPayment = useCallback(async (reference) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/membership/verify-notchpay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reference })
            });

            const data = await response.json();

            if (data.success) {
                setTimeout(() => {
                    fetchMembership();
                }, 1000);
            } else {
                console.error('Erreur vérification:', data.message);
                setLoading(false);
            }
        } catch (err) {
            console.error('Erreur vérification paiement Notch Pay:', err);
            setLoading(false);
        }
    }, [fetchMembership]);

    useEffect(() => {
        const sessionId = searchParams.get('session_id');
        const reference = searchParams.get('reference');

        if (sessionId) {
            // Vérifier paiement Stripe
            verifyStripePayment(sessionId);
        } else if (reference) {
            // Vérifier paiement Notch Pay
            verifyNotchPayPayment(reference);
        } else {
            setLoading(false);
        }
    }, [searchParams, verifyStripePayment, verifyNotchPayPayment]);

    if (loading) {
        return (
            <div className="membership-success-container">
                <div className="membership-success-card">
                    <div className="loading-spinner"></div>
                    <h2>Vérification du paiement...</h2>
                    <p>Veuillez patienter quelques instants.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="membership-success-container">
            <div className="membership-success-card">
                <div className="success-icon">✅</div>
                <h1>Paiement réussi !</h1>
                <p className="success-message">
                    Félicitations ! Votre cotisation annuelle a été activée avec succès.
                </p>

                {membership && (
                    <div className="membership-details">
                        <h3>Détails de votre cotisation</h3>
                        <div className="detail-row">
                            <span className="detail-label">Numéro de paiement:</span>
                            <span className="detail-value">{membership.paymentNumber}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Montant:</span>
                            <span className="detail-value">{membership.amount} {membership.currency}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Date de début:</span>
                            <span className="detail-value">
                                {new Date(membership.startDate).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Date de fin:</span>
                            <span className="detail-value">
                                {new Date(membership.endDate).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                    </div>
                )}

                <div className="success-actions">
                    <button onClick={() => navigate('/informations personnelles')} className="primary-button">
                        Voir mon profil
                    </button>
                    <button onClick={() => navigate('/home')} className="secondary-button">
                        Retour à l'accueil
                    </button>
                </div>

                <p className="info-text">
                    Un email de confirmation vous a été envoyé avec tous les détails de votre cotisation.
                </p>
            </div>
        </div>
    );
};

export default MembershipSuccess;
