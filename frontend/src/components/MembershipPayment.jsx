import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast.js';
import { API_BASE_URL } from '../components/Url';
import { getAuthToken, getAuthHeaders } from '../utils/auth';
import '../styles/MembershipPayment.css';

const MembershipPayment = () => {
    const toast = useToast();
    const [emailConfirmation, setEmailConfirmation] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentMembership, setCurrentMembership] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const resubmit = !!location?.state?.resubmit;
    const formatDateSafe = (d) => {
        if (!d) return '-';
        const t = new Date(d);
        if (isNaN(t.getTime())) return '-';
        return t.toLocaleDateString('fr-FR');
    };

    useEffect(() => {
        // Si c'est une resoumission, on n'interroge PAS l'API pour éviter de remettre la soumission rejetée
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
                headers: getAuthHeaders()
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

            const formData = new FormData();
            formData.append('currency', 'XAF');
            formData.append('category', 'standard');
            // submissionMethod is no longer used (email-only workflow)

            const response = await fetch(`${API_BASE_URL}/api/membership/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de la soumission');
            }

            toast.success(data.message || 'Soumission reçue. En attente de validation.');
            navigate('/membership/success');

        } catch (err) {
            console.error('Erreur paiement:', err);
            setError(err.message || 'Une erreur est survenue');
            setLoading(false);
        }
    };

    // Legacy verify functions removed: manual submission flow used instead

    if (isActive && currentMembership) {
        return (
            <div className="membership-payment-container">
                <div className="membership-active-card">
                    <h2>✅ Cotisation Active</h2>
                    <p>Votre cotisation annuelle est active.</p>
                    <div className="membership-info">
                        <p><strong>Montant:</strong> {currentMembership.amount} {currentMembership.currency}</p>
                        <p><strong>Date de début:</strong> {formatDateSafe(currentMembership.startDate)}</p>
                        <p><strong>Date de fin:</strong> {formatDateSafe(currentMembership.endDate)}</p>
                        <p><strong>Numéro de paiement:</strong> {currentMembership.paymentNumber}</p>
                    </div>
                    <button onClick={() => navigate('/informations personnelles')} className="back-button">
                        Retour au profil
                    </button>
                </div>
            </div>
        );
    }

    // Si une soumission existe mais est en attente, montrer l'état en attente
    if (currentMembership && currentMembership.submissionStatus === 'pending') {
        return (
            <div className="membership-payment-container">
                <div className="membership-pending-card">
                    <h2>⏳ Soumission en attente</h2>
                    <p>Votre demande d'adhésion a été reçue et est en attente de validation par un administrateur.</p>
                    <div className="membership-info">
                        <p><strong>Numéro de soumission:</strong> {currentMembership.paymentNumber || '-'}</p>
                        {/* submissionMethod removed — workflow email-only */}
                        <p><strong>Soumis le:</strong> {formatDateSafe(currentMembership.createdAt)}</p>
                    </div>
                    <button onClick={() => navigate('/informations personnelles')} className="back-button">
                        Retour au profil
                    </button>
                </div>
            </div>
        );
    }

    // Si la soumission a été rejetée, permettre la resoumission
    if (currentMembership && currentMembership.submissionStatus === 'rejected') {
        return (
            <div className="membership-payment-container">
                <div className="membership-rejected-card">
                    <h2>✗ Demande rejetée</h2>
                    <p>Votre demande d'adhésion a été rejetée par l'administrateur.</p>
                    {currentMembership.rejectionReason && (
                        <p><strong>Motif:</strong> {currentMembership.rejectionReason}</p>
                    )}
                    <div className="membership-info">
                        <p><strong>Numéro de soumission:</strong> {currentMembership.paymentNumber || '-'}</p>
                        <p><strong>Soumis le:</strong> {formatDateSafe(currentMembership.createdAt)}</p>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <button
                            className="primary-button"
                            onClick={() => {
                                // allow user to start a fresh submission
                                setCurrentMembership(null);
                                setEmailConfirmation(false);
                            }}
                        >
                            Resoumettre ma demande
                        </button>
                        <button onClick={() => navigate('/informations personnelles')} className="back-button" style={{ marginLeft: '0.5rem' }}>
                            Voir mon profil
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const defaultPaymentInfo = {
        iban: paymentInfo?.iban || 'CM21 10005 00021 00000062141-02',
        bankAccount: paymentInfo?.bankAccount || 'Afriland First Bank - Cameroun',
        accountNumber: paymentInfo?.accountNumber || '10005 00021 00000062141 02',
        swift: paymentInfo?.swift || 'CCEICMCX',
        accountHolder: paymentInfo?.accountHolder || 'ASSOCIATION DES ECONOMISTES ET GESTIONNAIRES DU CAMEROUN (AEGC)',
        address: paymentInfo?.address || 'Yaoundé, Cameroun',
        website: paymentInfo?.website || 'www.aegc-web.com',
        orangeNumber: paymentInfo?.orangeNumber || '+237698905007',
        mtnNumber: paymentInfo?.mtnNumber || '+237651659996',
        mobileHolder: paymentInfo?.mobileHolder || 'Dr Zeh Inès Pérolde',
        adminEmail: paymentInfo?.adminEmail || 'aegc.admi@gmail.com'
    };

    const pricingRows = [
        ['Étudiant national', '27 USD'],
        ['Étudiant étranger', '35 USD'],
        ['Enseignant‑Chercheur / Professionnel (National - sur le territoire)', '50 USD'],
        ['Enseignant‑Chercheur / Professionnel (Étranger - pays à revenu élevé)', '100 USD'],
        ['Enseignant‑Chercheur / Professionnel (Étranger - pays à revenus faibles)', '50 USD']
    ];

    const advantagesByProfile = [
        {
            title: 'Étudiants',
            items: [
                'Participation gratuite aux activités',
                'Mentorat',
                'Prix de recherche',
                'Publication dans les bulletins'
            ]
        },
        {
            title: 'Enseignants',
            items: [
                'Réduction de 80% sur les conférences',
                'Bourses de recherche',
                'Publication gratuite ou à tarif réduit',
                'Participation aux comités scientifiques'
            ]
        },
        {
            title: 'Professionnels',
            items: [
                'Réduction de 80% sur les événements',
                'Accès aux réseaux partenaires',
                'Conférencier invité',
                'Promotion de leurs entreprises via l\'AEGC'
            ]
        }
    ];

    return (
        <div className="membership-payment-container">
            <div className="membership-payment-card">
                <h1>Cotisation Annuelle AEGC</h1>
                <p className="membership-description">
                    Devenez membre de l'Association des Économistes et Gestionnaires du Cameroun
                    et bénéficiez d'avantages exclusifs pendant 1 an.
                </p>

                <div className="manual-payment-info">
                    <h4>Tarifs</h4>
                    <p>Les tarifs varient selon la catégorie et l'origine. Référence actuelle :</p>
                    <ul>
                        {pricingRows.map(([label, price]) => (
                            <li key={label}><strong>{label}:</strong> {price}</li>
                        ))}
                    </ul>
                </div>

                <div className="membership-benefits">
                    <h4>Avantages (par profil)</h4>
                    {advantagesByProfile.map((profile) => (
                        <div key={profile.title} style={{ marginBottom: '0.75rem' }}>
                            <strong>{profile.title}</strong>
                            <ul>
                                {profile.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <p>Pour la version complète du formulaire et des conditions, téléchargez le fichier Word fourni ci‑dessous.</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="manual-payment-info">
                    <h4>Instructions de paiement manuel</h4>
                    <ul>
                        <li><strong>IBAN:</strong> {defaultPaymentInfo.iban}</li>
                        <li><strong>Compte bancaire:</strong> {defaultPaymentInfo.bankAccount}</li>
                        <li><strong>Numéro de compte:</strong> {defaultPaymentInfo.accountNumber}</li>
                        <li><strong>Code SWIFT:</strong> {defaultPaymentInfo.swift}</li>
                        <li><strong>Titulaire du compte:</strong> {defaultPaymentInfo.accountHolder}</li>
                        <li><strong>Adresse:</strong> {defaultPaymentInfo.address}</li>
                        <li><strong>Site web:</strong> {defaultPaymentInfo.website}</li>
                        <li><strong>Orange Money (compte):</strong> {defaultPaymentInfo.orangeNumber}</li>
                        <li><strong>MTN MoMo (compte):</strong> {defaultPaymentInfo.mtnNumber || 'Non communiqué'}</li>
                        <li><strong>Titulaire des comptes mobile:</strong> {defaultPaymentInfo.mobileHolder}</li>
                        <li><strong>Envoyez la preuve à:</strong> {defaultPaymentInfo.adminEmail}</li>
                    </ul>
                    {!paymentInfo && <small>Coordonnées par défaut affichées — configurez `PAYMENT_INFO_*` dans le backend pour les remplacer</small>}

                    <div className="file-inputs">
                        <p>
                            Merci d'effectuer le paiement puis d'envoyer la preuve de paiement et le formulaire rempli
                            par email à <strong>{paymentInfo?.adminEmail || 'aegc.admi@gmail.com'}</strong>.
                        </p>

                        <a className="download-form-link" href="/pdf/Formulaire_Adhesion_AEGC_2026.docx" target="_blank" rel="noreferrer" download>Télécharger le formulaire d'adhésion (Word)</a>

                        <label style={{ display: 'block', marginTop: '0.8rem' }}>
                            <input
                                type="checkbox"
                                checked={emailConfirmation}
                                onChange={(e) => setEmailConfirmation(e.target.checked)}
                            />{' '}
                            J'ai envoyé la preuve de paiement et le formulaire par email.
                        </label>
                    </div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="payment-button"
                >
                    {loading ? 'Traitement...' : 'Soumettre ma demande d\'adhésion'}
                </button>

                {error && (
                    <div className="inline-form-message" role="alert" style={{ marginTop: '1rem' }}>
                        {error}
                    </div>
                )}

                <p className="payment-info">
                    La preuve de paiement est envoyée par email ; un administrateur validera votre adhésion après vérification.
                </p>
            </div>
        </div>
    );
};

export default MembershipPayment;
