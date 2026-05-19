import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast.js';
import { API_BASE_URL } from '../Url';
import { getAuthToken, getAuthHeaders } from '../../utils/auth';
import '@/styles/MembershipPayment.css';

const formatDateSafe = (d) => {
    if (!d) return '-';
    const t = new Date(d);
    return isNaN(t.getTime()) ? '-' : t.toLocaleDateString('fr-FR');
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
                setError('Vous devez être connecté pour souscrire.');
                setLoading(false);
                return;
            }
            if (!emailConfirmation) {
                setError('Veuillez confirmer que vous avez envoyé la preuve et le formulaire par email.');
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
            if (!response.ok) throw new Error(data.message || 'Erreur lors de la soumission');

            toast.success(data.message || 'Soumission reçue. En attente de validation.');
            navigate('/membership/success');
        } catch (err) {
            console.error('Erreur paiement:', err);
            setError(err.message || 'Une erreur est survenue');
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
        adminEmail: paymentInfo?.adminEmail || 'aegc.admi@gmail.com',
    };

    // --- États intermédiaires ---
    if (isActive && currentMembership) {
        return (
            <div className="mp-container">
                <div className="mp-card mp-state-card">
                    <div className="mp-state-icon">✅</div>
                    <h2>Cotisation Active</h2>
                    <p>Votre cotisation annuelle est en cours de validité.</p>
                    <div className="mp-info-grid">
                        <span>Montant</span><strong>{currentMembership.amount} {currentMembership.currency}</strong>
                        <span>Date de début</span><strong>{formatDateSafe(currentMembership.startDate)}</strong>
                        <span>Date de fin</span><strong>{formatDateSafe(currentMembership.endDate)}</strong>
                        <span>N° de paiement</span><strong>{currentMembership.paymentNumber}</strong>
                    </div>
                    <button onClick={() => navigate('/informations personnelles')} className="mp-btn-secondary">Retour au profil</button>
                </div>
            </div>
        );
    }

    if (currentMembership && currentMembership.submissionStatus === 'pending') {
        return (
            <div className="mp-container">
                <div className="mp-card mp-state-card">
                    <div className="mp-state-icon">⏳</div>
                    <h2>Demande en attente</h2>
                    <p>Votre demande d'adhésion a été reçue et est en cours de validation par un administrateur.</p>
                    <div className="mp-info-grid">
                        <span>N° de soumission</span><strong>{currentMembership.paymentNumber || '-'}</strong>
                        <span>Soumis le</span><strong>{formatDateSafe(currentMembership.createdAt)}</strong>
                    </div>
                    <button onClick={() => navigate('/informations personnelles')} className="mp-btn-secondary">Retour au profil</button>
                </div>
            </div>
        );
    }

    if (currentMembership && currentMembership.submissionStatus === 'rejected') {
        return (
            <div className="mp-container">
                <div className="mp-card mp-state-card">
                    <div className="mp-state-icon mp-state-icon--rejected">✗</div>
                    <h2>Demande rejetée</h2>
                    <p>Votre demande d'adhésion a été rejetée par l'administrateur.</p>
                    {currentMembership.rejectionReason && (
                        <div className="mp-rejection-reason">
                            <strong>Motif :</strong> {currentMembership.rejectionReason}
                        </div>
                    )}
                    <div className="mp-info-grid">
                        <span>N° de soumission</span><strong>{currentMembership.paymentNumber || '-'}</strong>
                        <span>Soumis le</span><strong>{formatDateSafe(currentMembership.createdAt)}</strong>
                    </div>
                    <div className="mp-state-actions">
                        <button className="mp-btn-primary" onClick={() => { setCurrentMembership(null); setEmailConfirmation(false); }}>
                            Resoumettre ma demande
                        </button>
                        <button onClick={() => navigate('/informations personnelles')} className="mp-btn-secondary">Voir mon profil</button>
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
                    <h1>Cotisation Annuelle AEGC</h1>
                    <p>Rejoignez l'Association des Économistes et Gestionnaires du Cameroun et accédez à des avantages exclusifs pendant 1 an.</p>
                </div>

                {/* Étapes */}
                <div className="mp-steps">
                    <div className="mp-step">
                        <div className="mp-step-num">1</div>
                        <span>Effectuez votre paiement</span>
                    </div>
                    <div className="mp-step-sep" />
                    <div className="mp-step">
                        <div className="mp-step-num">2</div>
                        <span>Envoyez la preuve par email</span>
                    </div>
                    <div className="mp-step-sep" />
                    <div className="mp-step">
                        <div className="mp-step-num">3</div>
                        <span>Soumettez votre demande ici</span>
                    </div>
                </div>

                {/* Tarifs */}
                <section className="mp-section">
                    <h2 className="mp-section-title">Tarifs selon votre profil</h2>
                    <div className="mp-pricing-grid">
                        {PRICING.map(({ label, price, icon }) => (
                            <div className="mp-pricing-card" key={label}>
                                <span className="mp-pricing-icon">{icon}</span>
                                <span className="mp-pricing-label">{label}</span>
                                <span className="mp-pricing-price">{price}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Avantages */}
                <section className="mp-section">
                    <h2 className="mp-section-title">Avantages par profil</h2>
                    <div className="mp-advantages-grid">
                        {ADVANTAGES.map(({ title, icon, items }) => (
                            <div className="mp-advantage-card" key={title}>
                                <div className="mp-advantage-title">{icon} {title}</div>
                                <ul>
                                    {items.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Méthodes de paiement */}
                <section className="mp-section">
                    <h2 className="mp-section-title">Instructions de paiement</h2>
                    <div className="mp-tabs">
                        <button className={`mp-tab${paymentTab === 'bank' ? ' active' : ''}`} onClick={() => setPaymentTab('bank')}>🏦 Virement bancaire</button>
                        <button className={`mp-tab${paymentTab === 'orange' ? ' active' : ''}`} onClick={() => setPaymentTab('orange')}>🟠 Orange Money</button>
                        <button className={`mp-tab${paymentTab === 'mtn' ? ' active' : ''}`} onClick={() => setPaymentTab('mtn')}>🟡 MTN MoMo</button>
                    </div>

                    <div className="mp-tab-content">
                        {paymentTab === 'bank' && (
                            <div className="mp-bank-grid">
                                <span>IBAN</span><strong>{p.iban}</strong>
                                <span>Banque</span><strong>{p.bankAccount}</strong>
                                <span>N° de compte</span><strong>{p.accountNumber}</strong>
                                <span>Code SWIFT</span><strong>{p.swift}</strong>
                                <span>Titulaire</span><strong>{p.accountHolder}</strong>
                                <span>Adresse</span><strong>{p.address}</strong>
                            </div>
                        )}
                        {paymentTab === 'orange' && (
                            <div className="mp-mobile-money orange">
                                <div className="mp-mm-number">{p.orangeNumber}</div>
                                <div className="mp-mm-label">Numéro Orange Money</div>
                                <div className="mp-mm-holder">Titulaire : <strong>{p.mobileHolder}</strong></div>
                            </div>
                        )}
                        {paymentTab === 'mtn' && (
                            <div className="mp-mobile-money mtn">
                                <div className="mp-mm-number">{p.mtnNumber}</div>
                                <div className="mp-mm-label">Numéro MTN MoMo</div>
                                <div className="mp-mm-holder">Titulaire : <strong>{p.mobileHolder}</strong></div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Formulaire + confirmation */}
                <section className="mp-section mp-confirm-section">
                    <h2 className="mp-section-title">Finaliser votre demande</h2>
                    <p className="mp-confirm-text">
                        Après votre paiement, envoyez la preuve et le formulaire rempli à{' '}
                        <a href={`mailto:${p.adminEmail}`} className="mp-email-link">{p.adminEmail}</a>.
                    </p>

                    <a
                        className="mp-download-btn"
                        href="/pdf/Formulaire_Adhesion_AEGC_2026.docx"
                        target="_blank"
                        rel="noreferrer"
                        download
                    >
                        ⬇ Télécharger le formulaire d'adhésion (Word)
                    </a>

                    <label className="mp-checkbox-label">
                        <input
                            type="checkbox"
                            checked={emailConfirmation}
                            onChange={(e) => setEmailConfirmation(e.target.checked)}
                        />
                        <span>J'ai effectué mon paiement et envoyé la preuve avec le formulaire à {p.adminEmail}.</span>
                    </label>

                    {error && (
                        <div className="mp-error" role="alert">{error}</div>
                    )}

                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="mp-submit-btn"
                    >
                        {loading ? 'Traitement en cours…' : 'Soumettre ma demande d\'adhésion'}
                    </button>

                    <p className="mp-footer-note">
                        Un administrateur vérifiera votre paiement et activera votre adhésion sous quelques jours.
                    </p>
                </section>

            </div>
        </div>
    );
};

export default MembershipPayment;
