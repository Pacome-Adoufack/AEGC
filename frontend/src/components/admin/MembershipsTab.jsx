import { useEffect, useState } from "react";
import { API_BASE_URL } from "../Url";
import ConfirmDialog from "../common/ConfirmDialog";

const USD_TO_EUR = 0.92;
const USD_TO_XAF = 602;
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
const fmtEUR = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
const formatDateSafe = (d) => {
    if (!d) return '-';
    const t = new Date(d);
    if (isNaN(t.getTime())) return '-';
    return t.toLocaleDateString('fr-FR');
};

const AMOUNT_OPTIONS = [27, 35, 50, 70, 100];

export default function MembershipsTab({ token, setMessage, setActiveTab }) {
    const [memberships, setMemberships] = useState([]);
    const [pendingMemberships, setPendingMemberships] = useState([]);
    const [membershipStats, setMembershipStats] = useState(null);

    const [selectedPending, setSelectedPending] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveYears, setApproveYears] = useState(1);
    const [approveAmount, setApproveAmount] = useState('');
    const [approveCurrency, setApproveCurrency] = useState('XAF');
    const [approveAmountOption, setApproveAmountOption] = useState('');
    const [approveCustomAmount, setApproveCustomAmount] = useState('');

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
    const [selectedRevoke, setSelectedRevoke] = useState(null);

    const [showActivateModal, setShowActivateModal] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [activateFeedback, setActivateFeedback] = useState('');
    const [activateYears, setActivateYears] = useState(1);
    const [activateAmount, setActivateAmount] = useState('');
    const [activateCurrency, setActivateCurrency] = useState('XAF');
    const [activateAmountOption, setActivateAmountOption] = useState('');
    const [activateCustomAmount, setActivateCustomAmount] = useState('');

    useEffect(() => {
        fetch(`${API_BASE_URL}/memberships`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => { if (d.success) setMemberships(d.data); })
            .catch(console.error);

        fetch(`${API_BASE_URL}/memberships/pending`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => { if (d?.data) setPendingMemberships(d.data); })
            .catch(console.error);

        fetch(`${API_BASE_URL}/memberships/stats`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => { if (d.success) setMembershipStats(d.stats); })
            .catch(console.error);
    }, [token]);

    const resolveAmount = (option, custom, currency, fallback) => {
        if (option === 'other') return Number(custom) || 0;
        const baseUSD = Number(option || fallback) || 0;
        if (currency === 'USD') return baseUSD;
        if (currency === 'EUR') return Number((baseUSD * USD_TO_EUR).toFixed(2));
        return Math.round(baseUSD * USD_TO_XAF);
    };

    const handleApprove = async () => {
        try {
            const amount = resolveAmount(approveAmountOption, approveCustomAmount, approveCurrency, approveAmount);
            const res = await fetch(`${API_BASE_URL}/memberships/${selectedPending._id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ years: approveYears, amount, currency: approveCurrency }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Soumission approuvée');
                setPendingMemberships((p) => p.filter((x) => x._id !== selectedPending._id));
                setMemberships((p) => [data.membership, ...p]);
            } else {
                setMessage('Erreur: ' + (data.error || data.message));
            }
        } catch (err) {
            setMessage('Erreur: ' + err.message);
        }
        setShowApproveModal(false);
        setSelectedPending(null);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleReject = async () => {
        if (!rejectReason) { setMessage('Veuillez fournir un motif'); return; }
        try {
            const res = await fetch(`${API_BASE_URL}/memberships/${selectedPending._id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reason: rejectReason }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Soumission rejetée');
                setPendingMemberships((p) => p.filter((x) => x._id !== selectedPending._id));
            } else {
                setMessage('Erreur: ' + (data.error || data.message));
            }
        } catch (err) {
            setMessage('Erreur: ' + err.message);
        }
        setShowRejectModal(false);
        setSelectedPending(null);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleRevoke = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/memberships/${selectedRevoke._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ submissionStatus: 'rejected', notes: 'Révocation par admin' }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Cotisation révoquée');
                setMemberships((p) => p.map((m) => m._id === selectedRevoke._id ? data.membership : m));
            } else {
                setMessage('Erreur: ' + (data.error || data.message));
            }
        } catch (err) {
            setMessage('Erreur: ' + err.message);
        }
        setShowRevokeConfirm(false);
        setSelectedRevoke(null);
        setTimeout(() => setMessage(''), 3000);
    };

    const handleActivate = async () => {
        setActivateFeedback('');
        try {
            const amount = resolveAmount(activateAmountOption, activateCustomAmount, activateCurrency, activateAmount);
            const response = await fetch(`${API_BASE_URL}/memberships/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: selectedEmail, years: activateYears, amount, currency: activateCurrency }),
            });
            const data = await response.json();
            if (data.success) {
                setMessage('Cotisation activée avec succès');
                setShowActivateModal(false);
                setSelectedEmail('');
                setActivateYears(1);
                setActivateAmount('');
                setActivateCurrency('XAF');
                setActiveTab("overview");
                setTimeout(() => setActiveTab("memberships"), 100);
            } else {
                const feedback =
                    response.status === 404 ? 'Utilisateur non trouvé avec cet email.'
                    : response.status === 409 ? 'Abonnement déjà actif pour cet utilisateur.'
                    : data.error || data.message || "Erreur lors de l'activation.";
                setActivateFeedback(feedback);
                setMessage('Erreur: ' + feedback);
            }
        } catch (err) {
            const feedback = 'Erreur serveur ou réseau: ' + err.message;
            setActivateFeedback(feedback);
            setMessage(feedback);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const approved = memberships.filter((m) => m.submissionStatus === 'approved');

    return (
        <div className="memberships-section">
            <h2>Gestion des Cotisations</h2>

            {membershipStats && (
                <div className="membership-stats-grid">
                    <div className="stat-card membership-active"><h3>✓ Actifs</h3><div className="stat-number">{membershipStats.active}</div></div>
                    <div className="stat-card membership-expired"><h3>⚠ Expirés</h3><div className="stat-number">{membershipStats.expired}</div></div>
                    <div className="stat-card membership-pending"><h3>⏳ En attente</h3><div className="stat-number">{membershipStats.pending}</div></div>
                    <div className="stat-card membership-total"><h3>💰 Total payé</h3><div className="stat-number">{membershipStats.total}</div></div>
                </div>
            )}

            <div className="membership-actions">
                <button className="btn-activate" onClick={() => { setShowActivateModal(true); setSelectedEmail(''); setActivateFeedback(''); setActivateYears(1); setActivateAmount(''); setActivateCurrency('XAF'); }}>
                    ➕ Activer une cotisation manuellement
                </button>
            </div>

            {/* Liste des cotisations */}
            <div className="memberships-table">
                <h3>Liste des cotisations ({approved.length})</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Membre</th><th>Email</th><th>Statut</th><th>Montant</th>
                            <th>N° Paiement</th><th>Date début</th><th>Date fin</th><th>Méthode</th><th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {approved.map((m) => (
                            <tr key={m._id}>
                                <td>{m.user?.firstName} {m.user?.name}</td>
                                <td>{m.user?.email}</td>
                                <td><span className="badge-status approved">✓ Approuvé</span></td>
                                <td>{m.amount} {m.currency}</td>
                                <td>{m.paymentNumber}</td>
                                <td>{m.startDate ? new Date(m.startDate).toLocaleDateString('fr-FR') : '-'}</td>
                                <td>{m.endDate ? formatDateSafe(m.endDate) : '-'}</td>
                                <td>
                                    {m.submissionMethod === 'bank_transfer' && '🏦 Virement'}
                                    {m.submissionMethod === 'orange_money' && '🟠 Orange Money'}
                                    {m.submissionMethod === 'mtn_momo' && '🟡 MTN MoMo'}
                                    {m.submissionMethod === 'manual_form' && '📄 Formulaire'}
                                </td>
                                <td>
                                    <button className="btn-revoke" onClick={() => { setSelectedRevoke(m); setShowRevokeConfirm(true); }}>
                                        🛑 Révoquer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Soumissions en attente */}
            <div className="pending-submissions" style={{ marginTop: '2rem' }}>
                <h3>Soumissions en attente ({pendingMemberships.length})</h3>
                {pendingMemberships.length === 0 && <p>Aucune soumission en attente.</p>}
                {pendingMemberships.length > 0 && (
                    <table>
                        <thead>
                            <tr><th>Membre</th><th>Email</th><th>N° Paiement</th><th>Méthode</th><th>Date</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {pendingMemberships.map((m) => (
                                <tr key={m._id}>
                                    <td>{m.user?.firstName} {m.user?.name}</td>
                                    <td>{m.user?.email}</td>
                                    <td>{m.paymentNumber}</td>
                                    <td>{m.submissionMethod}</td>
                                    <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                                    <td className="action-buttons">
                                        <button className="btn-approve" onClick={() => { setSelectedPending(m); setApproveYears(1); setApproveAmount(m.amount || ''); setApproveCurrency(m.currency || 'XAF'); setShowApproveModal(true); }}>
                                            ✓ Approuver
                                        </button>
                                        <button className="btn-reject" onClick={() => { setSelectedPending(m); setRejectReason(''); setShowRejectModal(true); }}>
                                            ✗ Rejeter
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modale approbation */}
            {showApproveModal && (
                <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Approuver la soumission</h3>
                        <p>Approuver la soumission de {selectedPending?.user?.email} :</p>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label>Nombre d'années</label>
                            <input type="number" min={1} value={approveYears} onChange={(e) => setApproveYears(Number(e.target.value))} />
                            <label>Montant</label>
                            <select value={approveAmountOption} onChange={(e) => setApproveAmountOption(e.target.value)}>
                                <option value="">-- Choisir un montant --</option>
                                {AMOUNT_OPTIONS.map((usd) => (
                                    <option key={usd} value={usd}>
                                        {usd} USD — {fmtEUR(usd * USD_TO_EUR)} EUR — {fmt(usd * USD_TO_XAF)} XOF
                                    </option>
                                ))}
                                <option value="other">Autre</option>
                            </select>
                            {approveAmountOption === 'other' && (
                                <input type="number" value={approveCustomAmount} onChange={(e) => setApproveCustomAmount(e.target.value)} placeholder="Montant personnalisé" />
                            )}
                            <label>Devise</label>
                            <select value={approveCurrency} onChange={(e) => setApproveCurrency(e.target.value)}>
                                <option value="XAF">XAF</option><option value="USD">USD</option><option value="EUR">EUR</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button className="btn-confirm" onClick={handleApprove}>Approuver</button>
                            <button className="btn-cancel" onClick={() => { setShowApproveModal(false); setSelectedPending(null); }}>Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modale rejet */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Rejeter la soumission</h3>
                        <p>Motif du rejet pour {selectedPending?.user?.email} :</p>
                        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button className="btn-reject" onClick={handleReject}>Confirmer le rejet</button>
                            <button className="btn-cancel" onClick={() => { setShowRejectModal(false); setSelectedPending(null); }}>Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation révocation */}
            <ConfirmDialog
                isOpen={showRevokeConfirm}
                title="Confirmer la révocation"
                message={`Révoquer la cotisation de ${selectedRevoke?.user?.email || ''} ?`}
                confirmText="Révoquer"
                cancelText="Annuler"
                onClose={() => { setShowRevokeConfirm(false); setSelectedRevoke(null); }}
                onConfirm={handleRevoke}
            />

            {/* Modale activation manuelle */}
            {showActivateModal && (
                <div className="modal-overlay" onClick={() => setShowActivateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Activer une cotisation manuellement</h3>
                        <div className="modal-form">
                            <label>Email de l'utilisateur</label>
                            <input type="email" value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)} placeholder="exemple@email.com" />
                            <label>Nombre d'années</label>
                            <input type="number" min={1} value={activateYears} onChange={(e) => setActivateYears(Number(e.target.value))} />
                            <label>Montant</label>
                            <select value={activateAmountOption} onChange={(e) => setActivateAmountOption(e.target.value)}>
                                <option value="">-- Choisir un montant --</option>
                                {AMOUNT_OPTIONS.map((usd) => (
                                    <option key={usd} value={usd}>
                                        {usd} USD — {fmtEUR(usd * USD_TO_EUR)} EUR — {fmt(usd * USD_TO_XAF)} XOF
                                    </option>
                                ))}
                                <option value="other">Autre</option>
                            </select>
                            {activateAmountOption === 'other' && (
                                <input type="number" value={activateCustomAmount} onChange={(e) => setActivateCustomAmount(e.target.value)} placeholder="Montant personnalisé" />
                            )}
                            <label>Devise</label>
                            <select value={activateCurrency} onChange={(e) => setActivateCurrency(e.target.value)}>
                                <option value="XAF">XAF</option><option value="USD">USD</option><option value="EUR">EUR</option>
                            </select>
                            {activateFeedback && <div className="inline-feedback" style={{ marginTop: '0.75rem' }}>{activateFeedback}</div>}
                            <div className="modal-actions">
                                <button className="btn-confirm" onClick={handleActivate}>Activer</button>
                                <button className="btn-cancel" onClick={() => { setShowActivateModal(false); setSelectedEmail(''); setActivateFeedback(''); }}>Annuler</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
