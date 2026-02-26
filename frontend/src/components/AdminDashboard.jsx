import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "./Url";
import ConfirmDialog from "./common/ConfirmDialog";
import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [reservations, setReservations] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [membershipStats, setMembershipStats] = useState(null);
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState('EUR');
    const [activateNotes, setActivateNotes] = useState('');
    const [message, setMessage] = useState("");
    const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

    const navigate = useNavigate();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    // Vérifier que l'utilisateur est bien ADMIN ou DEV
    useEffect(() => {
        if (!["admin", "dev"].includes(currentUser.role)) {
            navigate("/home");
        }
    }, [currentUser.role, navigate]);

    // Récupérer les réservations
    useEffect(() => {
        if (activeTab === "overview" || activeTab === "reservations") {
            fetch(`${API_BASE_URL}/reservation/all`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setReservations(data))
                .catch((err) => console.error(err));
        }
    }, [activeTab, token]);

    // Récupérer les contacts
    useEffect(() => {
        if (activeTab === "contacts") {
            fetch(`${API_BASE_URL}/contact`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setContacts(data))
                .catch((err) => console.error(err));
        }
    }, [activeTab, token]);

    // Récupérer les abonnés
    useEffect(() => {
        if (activeTab === "subscribers") {
            fetch(`${API_BASE_URL}/subscribe`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setSubscribers(data))
                .catch((err) => console.error(err));
        }
    }, [activeTab, token]);

    // Récupérer les memberships et stats
    useEffect(() => {
        if (activeTab === "memberships") {
            // Récupérer les memberships
            fetch(`${API_BASE_URL}/memberships`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setMemberships(data.data);
                    }
                })
                .catch((err) => console.error(err));

            // Récupérer les stats
            fetch(`${API_BASE_URL}/memberships/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setMembershipStats(data.stats);
                    }
                })
                .catch((err) => console.error(err));
        }
    }, [activeTab, token]);

    const handleDeleteContact = async (id) => {
        if (!confirm("Supprimer ce contact ?")) return;
        try {
            await fetch(`${API_BASE_URL}/contact/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setContacts(contacts.filter((c) => c._id !== id));
            setMessage("Contact supprimé");
        } catch (err) {
            setMessage("Erreur: " + err.message);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const handleDeleteSubscriber = async (id) => {
        if (!confirm("Supprimer cet abonné ?")) return;
        try {
            await fetch(`${API_BASE_URL}/subscribe/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setSubscribers(subscribers.filter((s) => s._id !== id));
            setMessage("Abonné supprimé");
        } catch (err) {
            setMessage("Erreur: " + err.message);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>👨‍💼 Dashboard Administrateur</h1>
                <p>Bienvenue {currentUser.firstName} {currentUser.name}</p>
            </div>

            {message && <div className="admin-message">{message}</div>}

            <div className="admin-tabs">
                <button
                    className={activeTab === "overview" ? "active" : ""}
                    onClick={() => setActiveTab("overview")}
                >
                    📊 Vue d'ensemble
                </button>
                <button
                    className={activeTab === "content" ? "active" : ""}
                    onClick={() => setActiveTab("content")}
                >
                    📝 Gestion Contenu
                </button>
                <button
                    className={activeTab === "reservations" ? "active" : ""}
                    onClick={() => setActiveTab("reservations")}
                >
                    🎫 Réservations
                </button>
                <button
                    className={activeTab === "contacts" ? "active" : ""}
                    onClick={() => setActiveTab("contacts")}
                >
                    📧 Contacts
                </button>
                <button
                    className={activeTab === "subscribers" ? "active" : ""}
                    onClick={() => setActiveTab("subscribers")}
                >
                    📬 Abonnés
                </button>
                <button
                    className={activeTab === "memberships" ? "active" : ""}
                    onClick={() => setActiveTab("memberships")}
                >
                    💳 Cotisations
                </button>
            </div>

            <div className="admin-content">
                {/* OVERVIEW */}
                {activeTab === "overview" && reservations && (
                    <div className="overview-section">
                        <h2>Statistiques Rapides</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>🎫 Réservations Activités</h3>
                                <div className="stat-number">{reservations.stats.totalActivityReservations}</div>
                                <div className="stat-recent">
                                    <small>Total</small>
                                </div>
                                <div className="tooltip-text">
                                    Nombre total de personnes qui ont réservé des activités (séminaires, événements, etc.)
                                </div>
                            </div>

                            <div className="stat-card">
                                <h3>🎓 Réservations Formations</h3>
                                <div className="stat-number">{reservations.stats.totalFormationReservations}</div>
                                <div className="stat-recent">
                                    <small>Total</small>
                                </div>
                                <div className="tooltip-text">
                                    Nombre total de personnes inscrites aux formations proposées par l'AEGC
                                </div>
                            </div>

                            <div className="stat-card">
                                <h3>📧 Messages Contacts</h3>
                                <div className="stat-number">{contacts.length}</div>
                                <div className="stat-recent">
                                    <small>Total reçus</small>
                                </div>
                                <div className="tooltip-text">
                                    Nombre de messages reçus via le formulaire de contact du site web
                                </div>
                            </div>

                            <div className="stat-card">
                                <h3>📬 Abonnés Newsletter</h3>
                                <div className="stat-number">{subscribers.length}</div>
                                <div className="stat-recent">
                                    <small>Total</small>
                                </div>
                                <div className="tooltip-text">
                                    Nombre total d'adresses email abonnées à la newsletter de l'AEGC
                                </div>
                            </div>
                        </div>

                        <div className="quick-access">
                            <h3>Accès Rapide</h3>
                            <div className="quick-links">
                                <Link to="/admin/create-activity" className="quick-link">
                                    ➕ Créer une Activité
                                </Link>
                                <Link to="/admin/create-formation" className="quick-link">
                                    ➕ Créer une Formation
                                </Link>
                                <Link to="/admin/manage-faq" className="quick-link">
                                    ❓ Gérer les FAQ
                                </Link>
                                <Link to="/admin/manage-images" className="quick-link">
                                    🖼️ Gérer les Images
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTENT MANAGEMENT */}
                {activeTab === "content" && (
                    <div className="content-section">
                        <h2>Gestion du Contenu</h2>
                        <div className="content-grid">
                            <div className="content-card">
                                <h3>🎯 Activités</h3>
                                <p>Créer, modifier et supprimer des activités</p>
                                <Link to="/admin/activities" className="btn-manage">Gérer</Link>
                            </div>

                            <div className="content-card">
                                <h3>🎓 Formations</h3>
                                <p>Créer, modifier et supprimer des formations</p>
                                <Link to="/admin/formations" className="btn-manage">Gérer</Link>
                            </div>

                            <div className="content-card">
                                <h3>❓ FAQ</h3>
                                <p>Gérer les questions fréquentes</p>
                                <Link to="/admin/faq" className="btn-manage">Gérer</Link>
                            </div>

                            <div className="content-card">
                                <h3>🖼️ Images</h3>
                                <p>Upload et gestion des images</p>
                                <Link to="/admin/images" className="btn-manage">Gérer</Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESERVATIONS */}
                {activeTab === "reservations" && reservations && (
                    <div className="reservations-section">
                        <h2>Réservations</h2>

                        <h3>Activités ({reservations.activities.length})</h3>
                        <div className="reservations-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Utilisateur</th>
                                        <th>Email</th>
                                        <th>Activité</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.activities.map((res) => (
                                        <tr key={res._id}>
                                            <td>{res.user?.firstName} {res.user?.name}</td>
                                            <td>{res.user?.email}</td>
                                            <td>{res.activity?.name}</td>
                                            <td>{new Date(res.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <h3 style={{ marginTop: "2rem" }}>Formations ({reservations.formations.length})</h3>
                        <div className="reservations-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Email</th>
                                        <th>Formation</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.formations.map((res) => (
                                        <tr key={res._id}>
                                            <td>{res.firstName} {res.lastName}</td>
                                            <td>{res.email}</td>
                                            <td>{res.formationId?.title}</td>
                                            <td>{new Date(res.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* CONTACTS */}
                {activeTab === "contacts" && (
                    <div className="contacts-section">
                        <h2>Messages de Contact ({contacts.length})</h2>
                        <div className="contacts-list">
                            {contacts.map((contact) => (
                                <div key={contact._id} className="contact-card">
                                    <div className="contact-header">
                                        <strong>{contact.email}</strong>
                                        <button
                                            className="btn-delete-small"
                                            onClick={() => handleDeleteContact(contact._id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    <div className="contact-subject">
                                        <strong>Sujet:</strong> {contact.subject}
                                    </div>
                                    <div className="contact-message">{contact.message}</div>
                                    <div className="contact-date">
                                        {new Date(contact.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SUBSCRIBERS */}
                {activeTab === "subscribers" && (
                    <div className="subscribers-section">
                        <h2>Abonnés Newsletter ({subscribers.length})</h2>
                        <div className="subscribers-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Prénom</th>
                                        <th>Email</th>
                                        <th>Date d'inscription</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscribers.map((sub) => (
                                        <tr key={sub._id}>
                                            <td>{sub.name}</td>
                                            <td>{sub.lastName}</td>
                                            <td>{sub.email}</td>
                                            <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDeleteSubscriber(sub._id)}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MEMBERSHIPS / COTISATIONS */}
                {activeTab === "memberships" && (
                    <div className="memberships-section">
                        <h2>Gestion des Cotisations</h2>

                        {/* Statistiques */}
                        {membershipStats && (
                            <div className="membership-stats-grid">
                                <div className="stat-card membership-active">
                                    <h3>✓ Actifs</h3>
                                    <div className="stat-number">{membershipStats.active}</div>
                                </div>
                                <div className="stat-card membership-expired">
                                    <h3>⚠ Expirés</h3>
                                    <div className="stat-number">{membershipStats.expired}</div>
                                </div>
                                <div className="stat-card membership-pending">
                                    <h3>⏳ En attente</h3>
                                    <div className="stat-number">{membershipStats.pending}</div>
                                </div>
                                <div className="stat-card membership-total">
                                    <h3>💰 Total payé</h3>
                                    <div className="stat-number">{membershipStats.total}</div>
                                </div>
                            </div>
                        )}

                        {/* Revenus */}
                        {membershipStats && (
                            <div className="revenue-section">
                                <h3>Revenus par devise</h3>
                                <div className="revenue-cards">
                                    <div className="revenue-card">
                                        <span className="revenue-label">Euro (EUR)</span>
                                        <span className="revenue-amount">{membershipStats.revenue.EUR} €</span>
                                    </div>
                                    <div className="revenue-card">
                                        <span className="revenue-label">Dollar US (USD)</span>
                                        <span className="revenue-amount">{membershipStats.revenue.USD} $</span>
                                    </div>
                                    <div className="revenue-card">
                                        <span className="revenue-label">Franc CFA (XAF)</span>
                                        <span className="revenue-amount">{membershipStats.revenue.XAF?.toLocaleString()} FCFA</span>
                                    </div>
                                </div>
                                <div className="payment-methods">
                                    <small>
                                        <strong>Méthodes:</strong>
                                        💳 Stripe ({membershipStats.paymentMethods.stripe}) |
                                        👤 Manuel ({membershipStats.paymentMethods.manual}) |
                                        🟠 Orange ({membershipStats.paymentMethods.orange_money || 0}) |
                                        🟡 MTN ({membershipStats.paymentMethods.mtn_momo || 0})
                                    </small>
                                </div>
                            </div>
                        )}

                        {/* Bouton d'activation manuelle */}
                        <div className="membership-actions">
                            <button
                                className="btn-activate"
                                onClick={() => setShowActivateModal(true)}
                            >
                                ➕ Activer une cotisation manuellement
                            </button>
                            <button
                                className="btn-cleanup"
                                onClick={() => setShowCleanupConfirm(true)}
                            >
                                🗑️ Nettoyer les paiements échoués
                            </button>
                        </div>

                        {/* Liste des memberships */}
                        <div className="memberships-table">
                            <h3>Liste des cotisations ({memberships.filter(m => m.paymentStatus === 'paid' || m.paymentStatus === 'expired').length})</h3>
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
                                    {memberships
                                        .filter(m => m.paymentStatus === 'paid' || m.paymentStatus === 'expired')
                                        .map((membership) => (
                                            <tr key={membership._id}>
                                                <td>{membership.user?.firstName} {membership.user?.name}</td>
                                                <td>{membership.user?.email}</td>
                                                <td>
                                                    <span className={`badge-status ${membership.paymentStatus}`}>
                                                        {membership.paymentStatus === 'paid' && '✓ Payé'}
                                                        {membership.paymentStatus === 'pending' && '⏳ En attente'}
                                                        {membership.paymentStatus === 'expired' && '⚠ Expiré'}
                                                        {membership.paymentStatus === 'cancelled' && '✗ Annulé'}
                                                    </span>
                                                </td>
                                                <td>{membership.amount} {membership.currency}</td>
                                                <td>{membership.paymentNumber}</td>
                                                <td>
                                                    {membership.startDate
                                                        ? new Date(membership.startDate).toLocaleDateString('fr-FR')
                                                        : '-'
                                                    }
                                                </td>
                                                <td>
                                                    {membership.endDate
                                                        ? new Date(membership.endDate).toLocaleDateString('fr-FR')
                                                        : '-'
                                                    }
                                                </td>
                                                <td>
                                                    {membership.paymentMethod === 'stripe' && '💳 Stripe'}
                                                    {membership.paymentMethod === 'manual' && '👤 Manuel'}
                                                    {membership.paymentMethod === 'notchpay' && '📱 Notch Pay'}
                                                    {membership.paymentMethod === 'orange_money' && '🟠 Orange Money'}
                                                    {membership.paymentMethod === 'mtn_momo' && '🟡 MTN MoMo'}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Modal d'activation manuelle */}
                        {showActivateModal && (
                            <div className="modal-overlay" onClick={() => setShowActivateModal(false)}>
                                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                    <h3>Activer une cotisation manuellement</h3>
                                    <div className="modal-form">
                                        <label>Email de l'utilisateur:</label>
                                        <input
                                            type="email"
                                            value={selectedEmail}
                                            onChange={(e) => setSelectedEmail(e.target.value)}
                                            placeholder="exemple@email.com"
                                        />

                                        <label>Devise:</label>
                                        <select
                                            value={selectedCurrency}
                                            onChange={(e) => setSelectedCurrency(e.target.value)}
                                        >
                                            <option value="EUR">Euro (16 €)</option>
                                            <option value="USD">Dollar US (18 $)</option>
                                            <option value="XAF">Franc CFA (10 000 FCFA)</option>
                                        </select>

                                        <label>Notes (optionnel):</label>
                                        <textarea
                                            value={activateNotes}
                                            onChange={(e) => setActivateNotes(e.target.value)}
                                            placeholder="Raison de l'activation manuelle..."
                                            rows="3"
                                        />

                                        <div className="modal-actions">
                                            <button
                                                className="btn-confirm"
                                                onClick={async () => {
                                                    try {
                                                        const response = await fetch(`${API_BASE_URL}/memberships/activate`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({
                                                                email: selectedEmail,
                                                                currency: selectedCurrency,
                                                                notes: activateNotes
                                                            })
                                                        });
                                                        const data = await response.json();
                                                        if (data.success) {
                                                            setMessage('Cotisation activée avec succès');
                                                            setShowActivateModal(false);
                                                            setSelectedEmail('');
                                                            setActivateNotes('');
                                                            // Recharger les memberships
                                                            setActiveTab("overview");
                                                            setTimeout(() => setActiveTab("memberships"), 100);
                                                        } else {
                                                            setMessage('Erreur: ' + data.error);
                                                        }
                                                    } catch (err) {
                                                        setMessage('Erreur: ' + err.message);
                                                    }
                                                    setTimeout(() => setMessage(''), 3000);
                                                }}
                                            >
                                                Activer
                                            </button>
                                            <button
                                                className="btn-cancel"
                                                onClick={() => {
                                                    setShowActivateModal(false);
                                                    setSelectedEmail('');
                                                    setActivateNotes('');
                                                }}
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Dialog de confirmation pour le nettoyage */}
                        <ConfirmDialog
                            isOpen={showCleanupConfirm}
                            onClose={() => setShowCleanupConfirm(false)}
                            onConfirm={async () => {
                                try {
                                    const response = await fetch(`${API_BASE_URL}/memberships/cleanup-pending`, {
                                        method: 'DELETE',
                                        headers: {
                                            'Authorization': `Bearer ${token}`
                                        }
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                        setMessage(`✓ ${data.deletedCount} paiement(s) échoué(s) supprimé(s)`);
                                        // Recharger les memberships
                                        setActiveTab("overview");
                                        setTimeout(() => setActiveTab("memberships"), 100);
                                    } else {
                                        setMessage('Erreur: ' + data.error);
                                    }
                                } catch (err) {
                                    setMessage('Erreur: ' + err.message);
                                }
                                setTimeout(() => setMessage(''), 3000);
                            }}
                            title="Nettoyage des paiements"
                            message="Voulez-vous vraiment supprimer tous les paiements en attente de plus d'1 heure ? Cette action est irréversible."
                            confirmText="Supprimer"
                            cancelText="Annuler"
                            type="danger"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
