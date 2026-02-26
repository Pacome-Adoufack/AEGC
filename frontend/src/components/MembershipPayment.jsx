import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../components/Url';
import { getAuthToken, getAuthHeaders } from '../utils/auth';
import '../styles/MembershipPayment.css';

const MembershipPayment = () => {
    const [currency, setCurrency] = useState('EUR');
    const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' ou 'mobile_money'
    const [mobileChannel, setMobileChannel] = useState('orange_money'); // 'orange_money' ou 'mtn_momo'
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentMembership, setCurrentMembership] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const navigate = useNavigate();

    const prices = {
        EUR: 16,
        USD: 18,
        XAF: 10000
    };

    useEffect(() => {
        // Vérifier si l'utilisateur a déjà une cotisation
        fetchCurrentMembership();
    }, []);

    // Adapter le mode de paiement selon la devise sélectionnée
    useEffect(() => {
        if (currency === 'XAF') {
            setPaymentMethod('mobile_money');
        } else {
            setPaymentMethod('card');
        }
    }, [currency]);

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

            // Paiement Mobile Money (Notch Pay)
            if (paymentMethod === 'mobile_money') {
                if (currency !== 'XAF') {
                    setError('Mobile Money ne supporte que le Franc CFA (XAF).');
                    setLoading(false);
                    return;
                }

                if (!phone) {
                    setError('Veuillez entrer votre numéro de téléphone.');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/membership/create-notchpay-payment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        currency: 'XAF',
                        phone,
                        paymentChannel: mobileChannel
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Erreur lors de la création du paiement');
                }

                // Afficher un message et rediriger si nécessaire
                if (data.authorizationUrl) {
                    window.location.href = data.authorizationUrl;
                } else {
                    alert(data.message || 'Paiement initialisé. Suivez les instructions sur votre téléphone.');
                    // Vérifier le statut après quelques secondes
                    setTimeout(() => verifyMobilePayment(data.reference), 5000);
                }
            }
            // Paiement par carte (Stripe)
            else {
                if (currency === 'XAF') {
                    setError('Le paiement par carte ne supporte pas le Franc CFA. Utilisez Mobile Money.');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/api/membership/create-checkout-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ currency })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Erreur lors de la création de la session de paiement');
                }

                // Rediriger vers Stripe Checkout
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error('URL de paiement non disponible');
                }
            }

        } catch (err) {
            console.error('Erreur paiement:', err);
            setError(err.message || 'Une erreur est survenue');
            setLoading(false);
        }
    };

    const verifyMobilePayment = async (reference) => {
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
                navigate('/membership/success?reference=' + reference);
            } else {
                setError('Paiement en attente. Vérifiez votre téléphone.');
                setLoading(false);
            }
        } catch (err) {
            console.error('Erreur vérification:', err);
            setLoading(false);
        }
    };

    if (isActive && currentMembership) {
        return (
            <div className="membership-payment-container">
                <div className="membership-active-card">
                    <h2>✅ Cotisation Active</h2>
                    <p>Votre cotisation annuelle est active.</p>
                    <div className="membership-info">
                        <p><strong>Montant:</strong> {currentMembership.amount} {currentMembership.currency}</p>
                        <p><strong>Date de début:</strong> {new Date(currentMembership.startDate).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Date de fin:</strong> {new Date(currentMembership.endDate).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Numéro de paiement:</strong> {currentMembership.paymentNumber}</p>
                    </div>
                    <button onClick={() => navigate('/informations personnelles')} className="back-button">
                        Retour au profil
                    </button>
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

                <div className="currency-selector">
                    <h3>Choisissez votre devise</h3>
                    <div className="currency-options">
                        <div
                            className={`currency-option ${currency === 'EUR' ? 'selected' : ''}`}
                            onClick={() => setCurrency('EUR')}
                        >
                            <input
                                type="radio"
                                name="currency"
                                value="EUR"
                                checked={currency === 'EUR'}
                                onChange={() => setCurrency('EUR')}
                            />
                            <div className="currency-details">
                                <span className="currency-label">Euro</span>
                                <span className="currency-price">{prices.EUR} €</span>
                            </div>
                        </div>

                        <div
                            className={`currency-option ${currency === 'USD' ? 'selected' : ''}`}
                            onClick={() => setCurrency('USD')}
                        >
                            <input
                                type="radio"
                                name="currency"
                                value="USD"
                                checked={currency === 'USD'}
                                onChange={() => setCurrency('USD')}
                            />
                            <div className="currency-details">
                                <span className="currency-label">Dollar US</span>
                                <span className="currency-price">{prices.USD} $</span>
                            </div>
                        </div>

                        <div
                            className={`currency-option ${currency === 'XAF' ? 'selected' : ''}`}
                            onClick={() => setCurrency('XAF')}
                        >
                            <input
                                type="radio"
                                name="currency"
                                value="XAF"
                                checked={currency === 'XAF'}
                                onChange={() => setCurrency('XAF')}
                            />
                            <div className="currency-details">
                                <span className="currency-label">Franc CFA</span>
                                <span className="currency-price">{prices.XAF.toLocaleString()} FCFA</span>
                            </div>
                        </div>
                    </div>
                </div>

                {currency !== 'XAF' && (
                    <div className="payment-method-selector">
                        <h3>Mode de paiement</h3>
                        <div className="payment-methods">
                            <div
                                className={`payment-method ${paymentMethod === 'card' ? 'selected' : ''}`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="card"
                                    checked={paymentMethod === 'card'}
                                    onChange={() => setPaymentMethod('card')}
                                />
                                <span>💳 Carte bancaire</span>
                            </div>
                        </div>
                    </div>
                )}

                {currency === 'XAF' && (
                    <div className="mobile-money-section">
                        <h3>Mobile Money</h3>

                        <div className="mobile-channels">
                            <div
                                className={`mobile-channel ${mobileChannel === 'orange_money' ? 'selected' : ''}`}
                                onClick={() => setMobileChannel('orange_money')}
                            >
                                <input
                                    type="radio"
                                    name="mobileChannel"
                                    value="orange_money"
                                    checked={mobileChannel === 'orange_money'}
                                    onChange={() => setMobileChannel('orange_money')}
                                />
                                <span>🟠 Orange Money</span>
                            </div>

                            <div
                                className={`mobile-channel ${mobileChannel === 'mtn_momo' ? 'selected' : ''}`}
                                onClick={() => setMobileChannel('mtn_momo')}
                            >
                                <input
                                    type="radio"
                                    name="mobileChannel"
                                    value="mtn_momo"
                                    checked={mobileChannel === 'mtn_momo'}
                                    onChange={() => setMobileChannel('mtn_momo')}
                                />
                                <span>🟡 MTN Mobile Money</span>
                            </div>
                        </div>

                        <div className="phone-input-group">
                            <label htmlFor="phone">Numéro de téléphone</label>
                            <input
                                type="tel"
                                id="phone"
                                placeholder="Ex: 237670000000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="phone-input"
                            />
                            <small>Format international avec indicatif pays (237)</small>
                        </div>
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="payment-button"
                >
                    {loading ? 'Traitement...' : `Payer ${currency === 'XAF' ? prices.XAF.toLocaleString() + ' FCFA' : prices[currency] + ' ' + (currency === 'EUR' ? '€' : '$')}`}
                </button>

                <p className="payment-info">
                    {paymentMethod === 'card'
                        ? '🔒 Paiement sécurisé par Stripe'
                        : '📱 Vous recevrez une notification pour valider le paiement'
                    }
                </p>
            </div>
        </div>
    );
};

export default MembershipPayment;
