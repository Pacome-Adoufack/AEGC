import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast.js';
import { API_BASE_URL } from '../components/Url';
import { getAuthToken, getAuthHeaders } from '../utils/auth';
import '../styles/MembershipPayment.css';

const MembershipPayment = () => {
    const toast = useToast();
    const [formMode, setFormMode] = useState('email'); // email | online
    const [emailConfirmation, setEmailConfirmation] = useState(false);
    const [onlineForm, setOnlineForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        affiliation: '',
        notes: ''
    });
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [onlineFormError, setOnlineFormError] = useState('');
    const [currentMembership, setCurrentMembership] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const formatDateSafe = (d) => {
        if (!d) return '-';
        const t = new Date(d);
        if (isNaN(t.getTime())) return '-';
        return t.toLocaleDateString('fr-FR');
    };

    useEffect(() => {
        const resubmit = !!(location && location.state && location.state.resubmit);

        // Si c'est une resoumission, on n'interroge PAS l'API pour éviter de remettre la soumission rejetée
        if (!resubmit) {
            fetchCurrentMembership();
        } else {
            setCurrentMembership(null);
            setFormMode('email');
            setEmailConfirmation(false);
            setOnlineForm({ fullName: '', email: '', phone: '', affiliation: '', notes: '' });
        }

        fetchPaymentInfo();
    }, [location && location.state && location.state.resubmit]);

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
        setOnlineFormError('');

        try {
            const token = getAuthToken();

            if (!token) {
                setError('Vous devez être connecté pour souscrire.');
                setLoading(false);
                return;
            }

            if (formMode === 'email' && !emailConfirmation) {
                setError('Veuillez confirmer que vous avez envoyé la preuve et le formulaire par email.');
                setLoading(false);
                return;
            }

            if (formMode === 'online' && (!onlineForm.fullName || !onlineForm.email)) {
                setOnlineFormError('Veuillez remplir au minimum le nom complet et l\'email du formulaire en ligne.');
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append('currency', 'XAF');
            formData.append('category', 'standard');
            formData.append('submissionMethod', formMode === 'online' ? 'online' : 'email');

            if (formMode === 'online') {
                formData.append('formData', JSON.stringify(onlineForm));
            }

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

    const handleOnlineFormChange = (field, value) => {
        setOnlineForm((prev) => ({ ...prev, [field]: value }));
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
                        <p><strong>Mode d'envoi:</strong> {currentMembership.submissionMethod}</p>
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
                                setFormMode('email');
                                setEmailConfirmation(false);
                                setOnlineForm({ fullName: '', email: '', phone: '', affiliation: '', notes: '' });
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

    return (
        <div className="membership-payment-container">
            <div className="membership-payment-card">
                <h1>Cotisation Annuelle AEGC</h1>
                <p className="membership-description">
                    Devenez membre de l'Association des Économistes et Gestionnaires du Cameroun
                    et bénéficiez d'avantages exclusifs pendant 1 an.
                </p>

                <div className="manual-payment-info">
                    <h4>Montant unique</h4>
                    <p>La cotisation annuelle est fixée à <strong>10 000 FCFA</strong>.</p>
                </div>

                <div className="membership-benefits">
                    <h4>Avantages du membership</h4>
                    <ul>
                        <li>Accès aux publications et revues de l'association</li>
                        <li>Réductions sur les événements et formations</li>
                        <li>Réseautage professionnel et opportunités de collaboration</li>
                        <li>Accès aux ressources et annonces réservées aux membres</li>
                        <li>Droit de vote aux assemblées générales</li>
                    </ul>
                    <p>Pour la version complète du formulaire et des conditions, téléchargez le PDF ou utilisez le lien dans le bloc « J'envoie formulaire + preuve par email ».</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="manual-payment-info">
                    <h4>Instructions de paiement manuel</h4>
                    <ul>
                        <li><strong>IBAN:</strong> {paymentInfo?.iban || 'FR76 3000 6000 0112 3456 7890 189'}</li>
                        <li><strong>Compte bancaire:</strong> {paymentInfo?.bankAccount || '002376XXXXXXXX'}</li>
                        <li><strong>Orange Money:</strong> {paymentInfo?.orangeNumber || '002376XXXXXXXX'}</li>
                        <li><strong>MTN MoMo:</strong> {paymentInfo?.mtnNumber || '002376YYYYYYYY'}</li>
                        <li><strong>Envoyez la preuve à:</strong> {paymentInfo?.adminEmail || 'aegc.admi@gmail.com'}</li>
                    </ul>
                    {!paymentInfo && <small>Coordonnées d'exemple affichées — configurez `PAYMENT_INFO_*` dans le backend</small>}

                    <h4>Mode d'envoi du formulaire</h4>
                    <div className="payment-methods">
                        <div
                            className={`payment-method ${formMode === 'email' ? 'selected' : ''}`}
                            onClick={() => setFormMode('email')}
                        >
                            <input
                                type="radio"
                                name="formMode"
                                value="email"
                                checked={formMode === 'email'}
                                onChange={() => setFormMode('email')}
                            />
                            <span>📧 J'envoie formulaire + preuve par email</span>
                        </div>

                        <div
                            className={`payment-method ${formMode === 'online' ? 'selected' : ''}`}
                            onClick={() => setFormMode('online')}
                        >
                            <input
                                type="radio"
                                name="formMode"
                                value="online"
                                checked={formMode === 'online'}
                                onChange={() => setFormMode('online')}
                            />
                            <span>📝 Je remplis le formulaire en ligne</span>
                        </div>
                    </div>

                    {formMode === 'email' && (
                        <div className="file-inputs">
                            <p>
                                Merci d'effectuer le paiement puis d'envoyer la preuve de paiement et le formulaire rempli
                                par email à <strong>{paymentInfo?.adminEmail || 'aegc.admi@gmail.com'}</strong>.
                            </p>

                            <a className="download-form-link" href="/pdf/AEGC_membership_form.pdf" target="_blank" rel="noreferrer">Télécharger le formulaire d'adhésion (PDF)</a>

                            <label style={{ display: 'block', marginTop: '0.8rem' }}>
                                <input
                                    type="checkbox"
                                    checked={emailConfirmation}
                                    onChange={(e) => setEmailConfirmation(e.target.checked)}
                                />{' '}
                                J'ai envoyé la preuve de paiement et le formulaire par email.
                            </label>
                        </div>
                    )}

                    {formMode === 'online' && (
                        <div className="file-inputs">
                            <p>
                                La preuve de paiement doit toujours être envoyée par email à{' '}
                                <strong>{paymentInfo?.adminEmail || 'aegc.admi@gmail.com'}</strong>.
                            </p>

                            {onlineFormError && (
                                <div className="inline-form-message" role="alert">
                                    {onlineFormError}
                                </div>
                            )}

                            <div className="online-form-grid">
                                <label>Nom complet</label>
                                <input
                                    type="text"
                                    value={onlineForm.fullName}
                                    onChange={(e) => handleOnlineFormChange('fullName', e.target.value)}
                                    placeholder="Votre nom complet"
                                />

                                <label>Email</label>
                                <input
                                    type="email"
                                    value={onlineForm.email}
                                    onChange={(e) => handleOnlineFormChange('email', e.target.value)}
                                    placeholder="votre@email.com"
                                />

                                <label>Téléphone</label>
                                <input
                                    type="tel"
                                    value={onlineForm.phone}
                                    onChange={(e) => handleOnlineFormChange('phone', e.target.value)}
                                    placeholder="Ex: 237670000000"
                                />

                                <label>Affiliation / Institution</label>
                                <input
                                    type="text"
                                    value={onlineForm.affiliation}
                                    onChange={(e) => handleOnlineFormChange('affiliation', e.target.value)}
                                    placeholder="Université, entreprise, etc."
                                />

                                <label>Informations complémentaires</label>
                                <textarea
                                    value={onlineForm.notes}
                                    onChange={(e) => handleOnlineFormChange('notes', e.target.value)}
                                    rows={4}
                                    placeholder="Ajoutez toute précision utile"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="payment-button"
                >
                    {loading ? 'Traitement...' : 'Soumettre ma demande d\'adhésion'}
                </button>

                {(error || onlineFormError) && (
                    <div className="inline-form-message" role="alert" style={{ marginTop: '1rem' }}>
                        {error || onlineFormError}
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
