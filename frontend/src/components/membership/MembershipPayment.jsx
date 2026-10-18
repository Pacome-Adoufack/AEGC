import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast.js';
import { API_BASE_URL } from '../Url';
import { getAuthToken, getAuthHeaders } from '../../utils/auth';
import '@/styles/MembershipPayment.css';
import { useTranslation } from 'react-i18next';

const formatDateSafe = (d, language) => {
    if (!d) return '-';
    const t = new Date(d);
    return isNaN(t.getTime()) ? '-' : t.toLocaleDateString(language);
};

const PRICING = [
    { label: 'Étudiant national', price: '27 USD', icon: '🎓' },
    { label: 'Étudiant étranger', price: '35 USD', icon: '🎓' },
    { label: 'Enseignant-Chercheur / Professionnel (National)', price: '50 USD', icon: '👨‍🏫' },
    { label: 'Enseignant-Chercheur / Professionnel (Étranger - pays à revenus faibles)', price: '50 USD', icon: '👨‍🏫' },
    { label: 'Enseignant-Chercheur / Professionnel (Étranger - pays à revenu élevé)', price: '100 USD', icon: '👨‍💼' },
];

const ADVANTAGES = [
    {
        title: 'Étudiants',
        icon: '🎓',
        items: ['Participation gratuite aux activités', 'Mentorat', 'Prix de recherche', 'Publication dans les bulletins'],
    },
    {
        title: 'Enseignants',
        icon: '👨‍🏫',
        items: ['Réduction de 80% sur les conférences', 'Bourses de recherche', 'Publication gratuite ou à tarif réduit', 'Participation aux comités scientifiques'],
    },
    {
        title: 'Professionnels',
        icon: '👨‍💼',
        items: ['Réduction de 80% sur les événements', 'Accès aux réseaux partenaires', 'Conférencier invité', 'Promotion de leurs entreprises via l\'AEGC'],
    },
];

const MembershipPayment = () => {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [emailConfirmation, setEmailConfirmation] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentMembership, setCurrentMembership] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [paymentTab, setPaymentTab] = useState('bank');
    const navigate = useNavigate();
    const location = useLocation();
    const resubmit = !!location?.state?.resubmit;

    useEffect(() => {
        if (!resubmit) {
            fetchCurrentMembership();
        } else {
            setCurrentMembership(null);
            setEmailConfirmation(false);
        }
        fetchPaymentInfo();
    }, [resubmit]);

    const fetchPaymentInfo = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/membership/payment-info`);
            const data = await res.json();
            setPaymentInfo(data);
        } catch (err) {
            console.error('Erreur récupération infos paiement:', err);
        }
    };

    const fetchCurrentMembership = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/membership/my-membership`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (data.membership) {
                setCurrentMembership(data.membership);
                setIsActive(data.isActive);
            }
        } catch (err) {
            console.error('Erreur chargement membership:', err);
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        setError('');
        try {
            const token = getAuthToken();
            if (!token) {
                setError(t('membership.authRequired'));
                setLoading(false);
                return;
            }
            if (!emailConfirmation) {
                setError(t('membership.proofRequired'));
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/membership/submit`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currency: 'XAF', category: 'standard' }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || t('membership.submissionError'));

            toast.success(data.message || t('membership.received'));
            navigate('/membership/success');
        } catch (err) {
            console.error('Erreur paiement:', err);
            setError(err.message || t('membership.unexpectedError'));
            setLoading(false);
        }
    };

    const p = {
        iban: paymentInfo?.iban || 'CM21 10005 00021 00000062141-02',
        bankAccount: paymentInfo?.bankAccount || 'Afriland First Bank - Cameroun',
        accountNumber: paymentInfo?.accountNumber || '10005 00021 00000062141 02',
        swift: paymentInfo?.swift || 'CCEICMCX',
        accountHolder: paymentInfo?.accountHolder || 'ASSOCIATION DES ECONOMISTES ET GESTIONNAIRES DU CAMEROUN (AEGC)',
        address: paymentInfo?.address || 'Yaoundé, Cameroun',
        orangeNumber: paymentInfo?.orangeNumber || '+237698905007',
        mtnNumber: paymentInfo?.mtnNumber || '+237651659996',
        mobileHolder: paymentInfo?.mobileHolder || 'Dr Zeh Inès Pérolde',
        adminEmail: paymentInfo?.adminEmail || 'info@aegc-web.org',
    };

    // --- États intermédiaires ---
    if (isActive && currentMembership) {
        return (
            <div className="mp-container">
                <div className="mp-card mp-state-card">
                    <div className="mp-state-icon">✅</div>
                    <h2>{t('membership.activeTitle')}</h2>
                    <p>{t('membership.activeText')}</p>
                    <div className="mp-info-grid">
                        <span>{t('membership.amount')}</span><strong>{currentMembership.amount} {currentMembership.currency}</strong>
                        <span>{t('membership.startDate')}</span><strong>{formatDateSafe(currentMembership.startDate, i18n.language)}</strong>
                        <span>{t('membership.endDate')}</span><strong>{formatDateSafe(currentMembership.endDate, i18n.language)}</strong>
                        <span>{t('membership.paymentNumber')}</span><strong>{currentMembership.paymentNumber}</strong>
                    </div>
                    <button onClick={() => navigate('/informations personnelles')} className="mp-btn-secondary">{t('membership.backProfile')}</button>
                </div>
            </div>
        );
    }

    if (currentMembership && currentMembership.submissionStatus === 'pending') {
        return (
            <div className="mp-container">
                <div className="mp-card mp-state-card">
                    <div className="mp-state-icon">⏳</div>
                    <h2>{t('membership.pendingTitle')}</h2>
                    <p>{t('membership.pendingText')}</p>
                    <div className="mp-info-grid">
                        <span>{t('membership.submissionNumber')}</span><strong>{currentMembership.paymentNumber || '-'}</strong>
                        <span>{t('membership.submittedOn')}</span><strong>{formatDateSafe(currentMembership.createdAt, i18n.language)}</strong>
                    </div>
                    <button onClick={() => navigate('/informations personnelles')} className="mp-btn-secondary">{t('membership.backProfile')}</button>
                </div>
            </div>
        );
    }

    if (currentMembership && currentMembership.submissionStatus === 'rejected') {
        return (
            <div className="mp-container">
                <div className="mp-card mp-state-card">
                    <div className="mp-state-icon mp-state-icon--rejected">✗</div>
                    <h2>{t('membership.rejectedTitle')}</h2>
                    <p>{t('membership.rejectedText')}</p>
                    {currentMembership.rejectionReason && (
                        <div className="mp-rejection-reason">
                            <strong>{t('membership.reason')}</strong> {currentMembership.rejectionReason}
                        </div>
                    )}
                    <div className="mp-info-grid">
                        <span>{t('membership.submissionNumber')}</span><strong>{currentMembership.paymentNumber || '-'}</strong>
                        <span>{t('membership.submittedOn')}</span><strong>{formatDateSafe(currentMembership.createdAt, i18n.language)}</strong>
                    </div>
                    <div className="mp-state-actions">
                        <button className="mp-btn-primary" onClick={() => { setCurrentMembership(null); setEmailConfirmation(false); }}>
                            {t('membership.resubmit')}
                        </button>
                        <button onClick={() => navigate('/informations personnelles')} className="mp-btn-secondary">{t('membership.profile')}</button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Page principale ---
    return (
        <div className="mp-container">
            <div className="mp-card">

                {/* En-tête */}
                <div className="mp-header">
                    <h1>{t('membership.annualTitle')}</h1>
                    <p>{t('membership.annualText')}</p>
                </div>

                {/* Étapes */}
                <div className="mp-steps">
                    <div className="mp-step">
                        <div className="mp-step-num">1</div>
                        <span>{t('membership.steps.0')}</span>
                    </div>
                    <div className="mp-step-sep" />
                    <div className="mp-step">
                        <div className="mp-step-num">2</div>
                        <span>{t('membership.steps.1')}</span>
                    </div>
                    <div className="mp-step-sep" />
                    <div className="mp-step">
                        <div className="mp-step-num">3</div>
                        <span>{t('membership.steps.2')}</span>
                    </div>
                </div>

                {/* Tarifs */}
                <section className="mp-section">
                    <h2 className="mp-section-title">{t('membership.pricingTitle')}</h2>
                    <div className="mp-pricing-grid">
                        {PRICING.map(({ label, price, icon }, index) => (
                            <div className="mp-pricing-card" key={label}>
                                <span className="mp-pricing-icon">{icon}</span>
                                <span className="mp-pricing-label">{t(`membership.pricing.${index}`)}</span>
                                <span className="mp-pricing-price">{price}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Avantages */}
                <section className="mp-section">
                    <h2 className="mp-section-title">{t('membership.advantagesTitle')}</h2>
                    <div className="mp-advantages-grid">
                        {ADVANTAGES.map(({ icon }, index) => {
                            const advantageKey = ['students', 'teachers', 'professionals'][index];
                            return (
                            <div className="mp-advantage-card" key={advantageKey}>
                                <div className="mp-advantage-title">{icon} {t(`membership.advantages.${advantageKey}.title`)}</div>
                                <ul>
                                    {t(`membership.advantages.${advantageKey}.items`, { returnObjects: true }).map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                            );
                        })}
                    </div>
                </section>

                {/* Méthodes de paiement */}
                <section className="mp-section">
                    <h2 className="mp-section-title">{t('membership.paymentInstructions')}</h2>
                    <div className="mp-tabs">
                        <button className={`mp-tab${paymentTab === 'bank' ? ' active' : ''}`} onClick={() => setPaymentTab('bank')}>🏦 {t('membership.bankTransfer')}</button>
                        <button className={`mp-tab${paymentTab === 'orange' ? ' active' : ''}`} onClick={() => setPaymentTab('orange')}>🟠 {t('membership.orangeMoney')}</button>
                        <button className={`mp-tab${paymentTab === 'mtn' ? ' active' : ''}`} onClick={() => setPaymentTab('mtn')}>🟡 {t('membership.mtnMomo')}</button>
                    </div>

                    <div className="mp-tab-content">
                        {paymentTab === 'bank' && (
                            <div className="mp-bank-grid">
                                <span>IBAN</span><strong>{p.iban}</strong>
                                <span>{t('membership.bank')}</span><strong>{p.bankAccount}</strong>
                                <span>{t('membership.accountNumber')}</span><strong>{p.accountNumber}</strong>
                                <span>{t('membership.swift')}</span><strong>{p.swift}</strong>
                                <span>{t('membership.holder')}</span><strong>{p.accountHolder}</strong>
                                <span>{t('membership.address')}</span><strong>{p.address}</strong>
                            </div>
                        )}
                        {paymentTab === 'orange' && (
                            <div className="mp-mobile-money orange">
                                <div className="mp-mm-number">{p.orangeNumber}</div>
                                <div className="mp-mm-label">{t('membership.orangeNumber')}</div>
                                <div className="mp-mm-holder">{t('membership.holder')} : <strong>{p.mobileHolder}</strong></div>
                            </div>
                        )}
                        {paymentTab === 'mtn' && (
                            <div className="mp-mobile-money mtn">
                                <div className="mp-mm-number">{p.mtnNumber}</div>
                                <div className="mp-mm-label">{t('membership.mtnNumber')}</div>
                                <div className="mp-mm-holder">{t('membership.holder')} : <strong>{p.mobileHolder}</strong></div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Formulaire + confirmation */}
                <section className="mp-section mp-confirm-section">
                    <h2 className="mp-section-title">{t('membership.finalize')}</h2>
                    <p className="mp-confirm-text">
                        {t('membership.proofText')}{' '}
                        <a href={`mailto:${p.adminEmail}`} className="mp-email-link">{p.adminEmail}</a>.
                    </p>

                    <a
                        className="mp-download-btn"
                        href="/pdf/Formulaire_Adhesion_AEGC_2026.docx"
                        target="_blank"
                        rel="noreferrer"
                        download
                    >
                        ⬇ {t('membership.downloadForm')}
                    </a>

                    <label className="mp-checkbox-label">
                        <input
                            type="checkbox"
                            checked={emailConfirmation}
                            onChange={(e) => setEmailConfirmation(e.target.checked)}
                        />
                        <span>{t('membership.confirmation', { email: p.adminEmail })}</span>
                    </label>

                    {error && (
                        <div className="mp-error" role="alert">{error}</div>
                    )}

                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="mp-submit-btn"
                    >
                        {loading ? t('membership.processing') : t('membership.submit')}
                    </button>

                    <p className="mp-footer-note">
                        {t('membership.footerNote')}
                    </p>
                </section>

            </div>
        </div>
    );
};

export default MembershipPayment;
