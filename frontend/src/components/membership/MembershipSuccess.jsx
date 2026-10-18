import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../Url';
import { getAuthHeaders } from '../../utils/auth';
import '@/styles/MembershipSuccess.css';
import { useTranslation } from 'react-i18next';

const MembershipSuccess = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [membership, setMembership] = useState(null);

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending':
                return t('header.membership.pending');
            case 'approved':
                return t('header.membership.active');
            case 'rejected':
                return t('membership.rejectedTitle');
            default:
                return t('membership.pendingTitle');
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
                    <h2>{t('membership.loading')}</h2>
                    <p>{t('membership.wait')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="membership-success-container">
            <div className="membership-success-card">
                <div className="success-eyebrow">{t('membership.submissionSaved')}</div>
                <h1>{t('membership.requestReceived')}</h1>
                <p className="success-message">
                    {t('membership.requestText')}
                </p>

                {membership && (
                    <div className="membership-details">
                        <h3>{t('membership.requestState')}</h3>
                        <div className="detail-row">
                            <span className="detail-label">{t('membership.status')}</span>
                            <span className="detail-value detail-pill">{getStatusLabel(membership.submissionStatus)}</span>
                        </div>
                        {membership.submissionStatus === 'rejected' && (
                            <div className="detail-row">
                                <span className="detail-label">{t('membership.rejectionReason')}</span>
                                <span className="detail-value">{membership.rejectionReason || '-'}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="success-actions">
                    <button onClick={() => navigate('/informations personnelles')} className="primary-button">
                        {t('membership.profile')}
                    </button>
                    <button onClick={() => navigate('/home')} className="secondary-button">
                        {t('membership.backHome')}
                    </button>
                </div>

                <p className="info-text">
                    {t('membership.confirmationSent')}
                </p>
            </div>
        </div>
    );
};

export default MembershipSuccess;
