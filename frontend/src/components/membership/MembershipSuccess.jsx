import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../Url';
import { getAuthHeaders } from '../../utils/auth';
import '@/styles/MembershipSuccess.css';

const MembershipSuccess = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [membership, setMembership] = useState(null);

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending':
                return 'En attente de validation';
            case 'approved':
                return 'Validée';
            case 'rejected':
                return 'Rejetée';
            default:
                return 'En cours de traitement';
        }
    };

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

    useEffect(() => {
        // For manual submission flow we simply fetch membership status
        fetchMembership();
    }, [fetchMembership]);

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
                <div className="success-eyebrow">Soumission enregistrée</div>
                <h1>Votre demande a bien été reçue</h1>
                <p className="success-message">
                    Merci. Votre demande d'adhésion est bien enregistrée et sera traitée par l'équipe administrative.
                </p>

                {membership && (
                    <div className="membership-details">
                        <h3>État de la demande</h3>
                        <div className="detail-row">
                            <span className="detail-label">Statut</span>
                            <span className="detail-value detail-pill">{getStatusLabel(membership.submissionStatus)}</span>
                        </div>
                        {membership.submissionStatus === 'rejected' && (
                            <div className="detail-row">
                                <span className="detail-label">Motif du rejet</span>
                                <span className="detail-value">{membership.rejectionReason || '-'}</span>
                            </div>
                        )}
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
                    Un message de confirmation a été envoyé avec les informations utiles.
                </p>
            </div>
        </div>
    );
};

export default MembershipSuccess;
