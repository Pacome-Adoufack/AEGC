import { useState, useEffect } from "react";
import { API_BASE_URL } from "../Url";

const formatDateSafe = (d) => {
    if (!d) return "-";
    const t = new Date(d);
    return isNaN(t.getTime()) ? "-" : t.toLocaleDateString("fr-FR");
};

export default function DevMembershipsTab({ token, setMessage, setActiveTab }) {
    const [memberships, setMemberships] = useState([]);
    const [membershipStats, setMembershipStats] = useState(null);
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState("");
    const [activateFeedback, setActivateFeedback] = useState("");

    const loadAll = () => {
        fetch(`${API_BASE_URL}/memberships`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((data) => { if (data.success) setMemberships(data.data); })
            .catch(console.error);

        fetch(`${API_BASE_URL}/memberships/stats`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((data) => { if (data.success) setMembershipStats(data.stats); })
            .catch(console.error);
    };

    useEffect(() => { loadAll(); }, []);

    const handleActivate = async () => {
        setActivateFeedback("");
        try {
            const response = await fetch(`${API_BASE_URL}/memberships/activate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: selectedEmail }),
            });
            const data = await response.json();
            if (data.success) {
                setMessage("Cotisation activée avec succès");
                setShowActivateModal(false);
                setSelectedEmail("");
                loadAll();
            } else {
                const feedback =
                    response.status === 404 ? "Utilisateur non trouvé avec cet email."
                    : response.status === 409 ? "Abonnement déjà actif pour cet utilisateur."
                    : data.error || data.message || "Erreur lors de l'activation.";
                setActivateFeedback(feedback);
                setMessage("Erreur: " + feedback);
            }
        } catch (err) {
            const feedback = "Erreur serveur ou réseau: " + err.message;
            setActivateFeedback(feedback);
            setMessage(feedback);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const approvedMemberships = memberships.filter((m) => {
        const status = m.submissionStatus || m.paymentStatus;
        return status === "approved";
    });

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
                <button className="btn-activate" onClick={() => setShowActivateModal(true)}>
                    ➕ Activer une cotisation manuellement
                </button>
            </div>

            <div className="memberships-table">
                <h3>Liste des cotisations ({approvedMemberships.length})</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Membre</th>
                            <th>Email</th>
                            <th>Statut</th>
                            <th>Montant</th>
                            <th>N° Paiement</th>
                            <th>Date début</th>
                            <th>Date fin</th>
                            <th>Méthode</th>
                        </tr>
                    </thead>
                    <tbody>
                        {approvedMemberships.map((m) => {
                            const status = m.submissionStatus || m.paymentStatus;
                            const expired = m.endDate && new Date(m.endDate) <= new Date();
                            const statusLabel =
                                status === "approved" && expired ? "⚠ Expiré"
                                : status === "approved" ? "✓ Approuvé"
                                : status === "pending" ? "⏳ En attente"
                                : status === "rejected" || status === "cancelled" ? "✗ Rejeté"
                                : status || "-";

                            const methodLabel =
                                m.submissionMethod === "bank_transfer" ? "🏦 Virement"
                                : m.submissionMethod === "orange_money" ? "🟠 Orange Money"
                                : m.submissionMethod === "mtn_momo" ? "🟡 MTN MoMo"
                                : m.submissionMethod === "manual_form" ? "📄 Formulaire"
                                : m.submissionMethod === "email" ? "📧 Email"
                                : m.submissionMethod === "online" ? "📝 En ligne"
                                : !m.submissionMethod && m.paymentMethod === "manual" ? "👤 Manuel"
                                : "-";

                            return (
                                <tr key={m._id}>
                                    <td>{m.user?.firstName} {m.user?.name}</td>
                                    <td>{m.user?.email}</td>
                                    <td><span className={`badge-status ${status}`}>{statusLabel}</span></td>
                                    <td>{m.amount} {m.currency}</td>
                                    <td>{m.paymentNumber}</td>
                                    <td>{formatDateSafe(m.startDate)}</td>
                                    <td>{formatDateSafe(m.endDate)}</td>
                                    <td>{methodLabel}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showActivateModal && (
                <div className="modal-overlay" onClick={() => setShowActivateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Activer une cotisation manuellement</h3>
                        <div className="modal-form">
                            <label>Email de l'utilisateur</label>
                            <input
                                type="email"
                                value={selectedEmail}
                                onChange={(e) => setSelectedEmail(e.target.value)}
                                placeholder="exemple@email.com"
                            />
                            {activateFeedback && (
                                <div className="inline-feedback" style={{ marginTop: "0.75rem" }}>
                                    {activateFeedback}
                                </div>
                            )}
                            <div className="modal-actions">
                                <button className="btn-confirm" onClick={handleActivate}>Activer</button>
                                <button className="btn-cancel" onClick={() => { setShowActivateModal(false); setSelectedEmail(""); setActivateFeedback(""); }}>
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
