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

const METHOD_LABELS = {
    bank_transfer: '🏦 Virement',
    orange_money: '🟠 Orange Money',
    mtn_momo: '🟡 MTN MoMo',
    manual_form: '📄 Formulaire',
    email: '📧 Email',
};

export default function MembershipsTab({ token, setMessage, setActiveTab }) {
    const [memberships, setMemberships] = useState([]);
    const [pendingMemberships, setPendingMemberships] = useState([]);
    const [membershipStats, setMembershipStats] = useState(null);
    const [innerTab, setInnerTab] = useState('actives');

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

    const [historyFilter, setHistoryFilter] = useState('approved');
    const [historySearch, setHistorySearch] = useState('');

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
                body: JSON.stringify({ submissionStatus: 'revoked', notes: 'Révocation par admin' }),
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
                setActivateAmountOption('');
                setActivateCustomAmount('');
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

    const activeMemberships = memberships.filter((m) => m.submissionStatus === 'approved');

    const historySorted = [...memberships]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .filter((m) => {
            if (historyFilter !== 'all' && m.submissionStatus !== historyFilter) return false;
            if (historySearch) {
                const q = historySearch.toLowerCase();
                return (
                    `${m.user?.firstName} ${m.user?.name}`.toLowerCase().includes(q) ||
                    (m.user?.email || '').toLowerCase().includes(q) ||
                    (m.paymentNumber || '').toLowerCase().includes(q)
                );
            }
            return true;
        });

    const historyStatusLabel = (m) => {
        const s = m.submissionStatus;
        const expired = s === 'approved' && m.endDate && new Date(m.endDate) <= new Date();
        if (expired) return { label: '⚠ Expiré', cls: 'expired' };
        if (s === 'approved') return { label: '✓ Approuvé', cls: 'approved' };
        if (s === 'pending') return { label: '⏳ En attente', cls: 'pending' };
        if (s === 'revoked') return { label: '🛑 Révoqué', cls: 'revoked' };
        if (s === 'rejected') return { label: '✗ Rejeté', cls: 'rejected' };
        return { label: s, cls: '' };
    };

    const openActivateModal = () => {
        setSelectedEmail('');
        setActivateFeedback('');
        setActivateYears(1);
        setActivateAmount('');
        setActivateAmountOption('');
        setActivateCustomAmount('');
        setActivateCurrency('XAF');
        setShowActivateModal(true);
    };

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

            <div className="inner-tabs-bar">
                <div className="inner-tabs-list">
                    <button
                        className={`inner-tab${innerTab === 'actives' ? ' active' : ''}`}
                        onClick={() => setInnerTab('actives')}
                    >
                        Cotisations actives
                        <span className="inner-tab-count">{activeMemberships.length}</span>
                    </button>
                    <button
                        className={`inner-tab${innerTab === 'pending' ? ' active' : ''}`}
                        onClick={() => setInnerTab('pending')}
                    >
                        En attente
                        {pendingMemberships.length > 0 && (
                            <span className="inner-tab-badge">{pendingMemberships.length}</span>
                        )}
                    </button>
                    <button
                        className={`inner-tab${innerTab === 'history' ? ' active' : ''}`}
                        onClick={() => setInnerTab('history')}
                    >
                        Historique
                    </button>
                </div>
                <button className="btn-activate" onClick={openActivateModal}>
                    ➕ Activer
                </button>
            </div>

            {/* Onglet : Cotisations actives */}
            {innerTab === 'actives' && (
                <div className="memberships-table">
                    {activeMemberships.length === 0 ? (
                        <p className="empty-state">Aucune cotisation active.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Membre</th><th>Email</th><th>Montant</th>
                                    <th>N° Paiement</th><th>Date début</th><th>Date fin</th><th>Méthode</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeMemberships.map((m) => (
                                    <tr key={m._id}>
                                        <td>{m.user?.firstName} {m.user?.name}</td>
                                        <td>{m.user?.email}</td>
                                        <td>{m.amount} {m.currency}</td>
                                        <td>{m.paymentNumber}</td>
                                        <td>{formatDateSafe(m.startDate)}</td>
                                        <td>{formatDateSafe(m.endDate)}</td>
                                        <td>{METHOD_LABELS[m.submissionMethod] || '-'}</td>
                                        <td>
                                            <button className="btn-revoke" onClick={() => { setSelectedRevoke(m); setShowRevokeConfirm(true); }}>
                                                🛑 Révoquer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Onglet : En attente */}
            {innerTab === 'pending' && (
                <div className="memberships-table">
                    {pendingMemberships.length === 0 ? (
                        <p className="empty-state">Aucune soumission en attente.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Membre</th><th>Email</th><th>N° Paiement</th>
                                    <th>Méthode</th><th>Date</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingMemberships.map((m) => (
                                    <tr key={m._id}>
                                        <td>{m.user?.firstName} {m.user?.name}</td>
                                        <td>{m.user?.email}</td>
                                        <td>{m.paymentNumber}</td>
                                        <td>{METHOD_LABELS[m.submissionMethod] || m.submissionMethod || '-'}</td>
                                        <td>{formatDateSafe(m.createdAt)}</td>
                                        <td className="action-buttons">
                                            <button className="btn-approve" onClick={() => {
                                                setSelectedPending(m);
                                                setApproveYears(1);
                                                setApproveAmount(m.amount || '');
                                                setApproveAmountOption('');
                                                setApproveCustomAmount('');
                                                setApproveCurrency(m.currency || 'XAF');
                                                setShowApproveModal(true);
                                            }}>
                                                ✓ Approuver
                                            </button>
                                            <button className="btn-reject" onClick={() => {
                                                setSelectedPending(m);
                                                setRejectReason('');
                                                setShowRejectModal(true);
                                            }}>
                                                ✗ Rejeter
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Onglet : Historique */}
            {innerTab === 'history' && (
                <div className="memberships-table">
                    <div className="history-controls">
                        <input
                            type="text"
                            className="history-search"
                            placeholder="Rechercher membre, email, N° paiement..."
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                        />
                        <select
                            className="history-filter"
                            value={historyFilter}
                            onChange={(e) => setHistoryFilter(e.target.value)}
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="approved">Approuvé</option>
                            <option value="pending">En attente</option>
                            <option value="rejected">Rejeté</option>
                            <option value="revoked">Révoqué</option>
                        </select>
                    </div>
                    {historySorted.length === 0 ? (
                        <p className="empty-state">Aucune entrée.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Membre</th><th>Email</th><th>Statut</th><th>Montant</th>
                                    <th>N° Paiement</th><th>Date soumission</th><th>Date fin</th><th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historySorted.map((m) => {
                                    const { label, cls } = historyStatusLabel(m);
                                    return (
                                        <tr key={m._id}>
                                            <td>{m.user?.firstName} {m.user?.name}</td>
                                            <td>{m.user?.email}</td>
                                            <td><span className={`badge-status ${cls}`}>{label}</span></td>
                                            <td>{m.amount ? `${m.amount} ${m.currency}` : '-'}</td>
                                            <td>{m.paymentNumber}</td>
                                            <td>{formatDateSafe(m.createdAt)}</td>
                                            <td>{m.endDate ? formatDateSafe(m.endDate) : '-'}</td>
                                            <td className="notes-cell">{m.notes || m.rejectionReason || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modale approbation */}
            {showApproveModal && (
                <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Approuver la soumission</h3>
                        <p>Approuver la soumission de {selectedPending?.user?.email} :</p>
                        <div className="modal-form">
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
                        <div className="modal-actions">
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
                        <textarea
                            className="reject-textarea"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                        />
                        <div className="modal-actions">
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
                            {activateFeedback && <div className="inline-feedback">{activateFeedback}</div>}
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
