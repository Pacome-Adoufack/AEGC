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
    const [pendingMemberships, setPendingMemberships] = useState([]);
    const [selectedPending, setSelectedPending] = useState(null);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
    const [selectedRevoke, setSelectedRevoke] = useState(null);
    const [approveYears, setApproveYears] = useState(1);
    const [approveAmount, setApproveAmount] = useState('');
    const [approveCurrency, setApproveCurrency] = useState('XAF');
    const [approveAmountOption, setApproveAmountOption] = useState('');
    const [approveCustomAmount, setApproveCustomAmount] = useState('');
    const [membershipStats, setMembershipStats] = useState(null);
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [activateFeedback, setActivateFeedback] = useState('');
    const [activateYears, setActivateYears] = useState(1);
    const [activateAmount, setActivateAmount] = useState('');
    const [activateCurrency, setActivateCurrency] = useState('XAF');
    const [activateAmountOption, setActivateAmountOption] = useState('');
    const [activateCustomAmount, setActivateCustomAmount] = useState('');
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
    const [announcementForm, setAnnouncementForm] = useState({
        title: '',
        summary: '',
        content: '',
        category: 'ANNOUNCEMENT',
        isPublished: true,
        isPinned: false,
        expiresAt: '',
        expiresForever: true,
    });

    // Conversion rates (base USD)
    const USD_TO_EUR = 0.92; // 100 USD => 92 EUR
    const USD_TO_XAF = 602; // 100 USD => 60200 XOF

    const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
    const fmtEUR = (n) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
    const [message, setMessage] = useState("");
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
    const openConfirm = ({ title, message, onConfirm, type = 'danger' }) => setConfirmState({ isOpen: true, title, message, onConfirm, type });

    const navigate = useNavigate();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const formatDateSafe = (d) => {
        if (!d) return '-';
        const t = new Date(d);
        if (isNaN(t.getTime())) return '-';
        return t.toLocaleDateString('fr-FR');
    };

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

            // Récupérer les soumissions en attente
            fetch(`${API_BASE_URL}/memberships/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data && data.data) setPendingMemberships(data.data);
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

    const resetAnnouncementForm = () => {
        setAnnouncementForm({
            title: '',
            summary: '',
            content: '',
            category: 'ANNOUNCEMENT',
            isPublished: true,
            isPinned: false,
            expiresAt: '',
            expiresForever: true,
        });
        setEditingAnnouncementId(null);
        setShowAnnouncementModal(false);
    };

    const loadAnnouncements = async () => {
        setAnnouncementsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/announcements`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setAnnouncements(data.data || []);
            } else {
                setMessage(`Erreur: ${data.error || 'Impossible de récupérer les annonces'}`);
            }
        } catch (err) {
            setMessage(`Erreur: ${err.message}`);
        } finally {
            setAnnouncementsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "announcements") {
            loadAnnouncements();
        }
    }, [activeTab, token]);

    const handleDeleteContact = async (id) => {
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

    const askDeleteContact = (id) => openConfirm({ title: 'Supprimer le contact', message: 'Supprimer ce contact ?', onConfirm: () => handleDeleteContact(id), type: 'danger' });

    const handleDeleteSubscriber = async (id) => {
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

    const askDeleteSubscriber = (id) => openConfirm({ title: 'Supprimer l\'abonné', message: 'Supprimer cet abonné ?', onConfirm: () => handleDeleteSubscriber(id), type: 'danger' });

    const handleAnnouncementSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...announcementForm,
                expiresAt: announcementForm.expiresForever ? null : (announcementForm.expiresAt || null),
            };

            const endpoint = editingAnnouncementId
                ? `${API_BASE_URL}/api/admin/announcements/${editingAnnouncementId}`
                : `${API_BASE_URL}/api/admin/announcements`;

            const method = editingAnnouncementId ? 'PUT' : 'POST';

            const res = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || data.message || "Erreur lors de l’enregistrement");
            }

            setMessage(editingAnnouncementId ? 'Annonce mise à jour' : 'Annonce créée');
            setShowAnnouncementModal(false);
            resetAnnouncementForm();
            await loadAnnouncements();
        } catch (err) {
            setMessage(`Erreur: ${err.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleEditAnnouncement = (announcement) => {
        setEditingAnnouncementId(announcement._id);
        setAnnouncementForm({
            title: announcement.title || '',
            summary: announcement.summary || '',
            content: announcement.content || '',
            category: announcement.category || 'ANNOUNCEMENT',
            isPublished: Boolean(announcement.isPublished),
            isPinned: Boolean(announcement.isPinned),
            expiresAt: announcement.expiresAt || '',
            expiresForever: !announcement.expiresAt,
        });
        setShowAnnouncementModal(true);
    };

    const handleDeleteAnnouncement = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || data.message || 'Erreur lors de la suppression');
            }

            setAnnouncements((prev) => prev.filter((item) => item._id !== id));
            setMessage('Annonce supprimée');
        } catch (err) {
            setMessage(`Erreur: ${err.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const askDeleteAnnouncement = (id) =>
        openConfirm({
            title: "Supprimer l’annonce",
            message: 'Confirmer la suppression de cette annonce ?',
            onConfirm: () => handleDeleteAnnouncement(id),
            type: 'danger',
        });

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
                <button
                    className={activeTab === "announcements" ? "active" : ""}
                    onClick={() => setActiveTab("announcements")}
                >
                    📢 Annonces
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
                                            onClick={() => askDeleteContact(contact._id)}
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
                                                    onClick={() => askDeleteSubscriber(sub._id)}
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

                        {/* Revenus: section supprimée (redondante) */}

                        {/* Bouton d'activation manuelle */}
                        <div className="membership-actions">
                            <button
                                className="btn-activate"
                                onClick={() => { setShowActivateModal(true); setSelectedEmail(''); setActivateFeedback(''); setActivateYears(1); setActivateAmount(''); setActivateCurrency('XAF'); }}
                            >
                                ➕ Activer une cotisation manuellement
                            </button>
                        </div>

                        {/* Liste des memberships */}
                        <div className="memberships-table">
                            <h3>Liste des cotisations ({memberships.filter(m => m.submissionStatus === 'approved').length})</h3>
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
                                        .filter(m => m.submissionStatus === 'approved')
                                        .map((membership) => (
                                            <tr key={membership._id}>
                                                <td>{membership.user?.firstName} {membership.user?.name}</td>
                                                <td>{membership.user?.email}</td>
                                                <td>
                                                    <span className={`badge-status ${membership.submissionStatus}`}>
                                                        {membership.submissionStatus === 'approved' && '✓ Approuvé'}
                                                        {membership.submissionStatus === 'pending' && '⏳ En attente'}
                                                        {membership.submissionStatus === 'rejected' && '✗ Rejeté'}
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
                                                    {membership.endDate ? formatDateSafe(membership.endDate) : '-'}
                                                </td>
                                                <td>
                                                    {membership.submissionMethod === 'bank_transfer' && '🏦 Virement'}
                                                    {membership.submissionMethod === 'orange_money' && '🟠 Orange Money'}
                                                    {membership.submissionMethod === 'mtn_momo' && '🟡 MTN MoMo'}
                                                    {membership.submissionMethod === 'manual_form' && '📄 Formulaire'}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-revoke"
                                                        onClick={() => { setSelectedRevoke(membership); setShowRevokeConfirm(true); }}
                                                    >
                                                        🛑 Révoquer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pending submissions */}
                        <div className="pending-submissions" style={{ marginTop: '2rem' }}>
                            <h3>Soumissions en attente ({pendingMemberships.length})</h3>
                            {pendingMemberships.length === 0 && <p>Aucune soumission en attente.</p>}
                            {pendingMemberships.length > 0 && (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Membre</th>
                                            <th>Email</th>
                                            <th>N° Paiement</th>
                                            <th>Méthode</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
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
                                                    <button
                                                        className="btn-approve"
                                                        onClick={() => {
                                                            setSelectedPending(m);
                                                            setApproveYears(1);
                                                            setApproveAmount(m.amount || '');
                                                            setApproveCurrency(m.currency || 'XAF');
                                                            setShowApproveModal(true);
                                                        }}
                                                    >
                                                        ✓ Approuver
                                                    </button>
                                                    <button
                                                        className="btn-reject"
                                                        onClick={() => { setSelectedPending(m); setRejectReason(''); setShowRejectModal(true); }}
                                                    >
                                                        ✗ Rejeter
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Approve confirm dialog */}
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
                                            {[27, 35, 50, 70, 100].map((usd) => (
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
                                            <option value="XAF">XAF</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button className="btn-confirm" onClick={async () => {
                                            try {
                                                let selectedAmount;
                                                if (approveAmountOption === 'other') {
                                                    selectedAmount = Number(approveCustomAmount) || 0;
                                                } else {
                                                    const baseUSD = Number(approveAmountOption || approveAmount) || 0;
                                                    if (approveCurrency === 'USD') selectedAmount = baseUSD;
                                                    else if (approveCurrency === 'EUR') selectedAmount = Number((baseUSD * USD_TO_EUR).toFixed(2));
                                                    else selectedAmount = Math.round(baseUSD * USD_TO_XAF);
                                                }
                                                const res = await fetch(`${API_BASE_URL}/memberships/${selectedPending._id}/approve`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                    body: JSON.stringify({ years: approveYears, amount: selectedAmount, currency: approveCurrency })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setMessage('Soumission approuvée');
                                                    setPendingMemberships(pendingMemberships.filter(p => p._id !== selectedPending._id));
                                                    setMemberships([data.membership, ...memberships]);
                                                } else {
                                                    setMessage('Erreur: ' + (data.error || data.message));
                                                }
                                            } catch (err) {
                                                setMessage('Erreur: ' + err.message);
                                            }
                                            setShowApproveModal(false);
                                            setSelectedPending(null);
                                            setTimeout(() => setMessage(''), 3000);
                                        }}>Approuver</button>
                                        <button className="btn-cancel" onClick={() => { setShowApproveModal(false); setSelectedPending(null); }}>Annuler</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reject modal with textarea */}
                        {showRejectModal && (
                            <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                    <h3>Rejeter la soumission</h3>
                                    <p>Motif du rejet pour {selectedPending?.user?.email} :</p>
                                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button
                                            className="btn-reject"
                                            onClick={async () => {
                                                if (!rejectReason) { setMessage('Veuillez fournir un motif'); return; }
                                                try {
                                                    const res = await fetch(`${API_BASE_URL}/memberships/${selectedPending._id}/reject`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                        body: JSON.stringify({ reason: rejectReason })
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        setMessage('Soumission rejetée');
                                                        setPendingMemberships(pendingMemberships.filter(p => p._id !== selectedPending._id));
                                                    } else {
                                                        setMessage('Erreur: ' + (data.error || data.message));
                                                    }
                                                } catch (err) {
                                                    setMessage('Erreur: ' + err.message);
                                                }
                                                setShowRejectModal(false);
                                                setSelectedPending(null);
                                                setTimeout(() => setMessage(''), 3000);
                                            }}
                                        >
                                            Confirmer le rejet
                                        </button>
                                        <button className="btn-cancel" onClick={() => { setShowRejectModal(false); setSelectedPending(null); }}>Annuler</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Revoke confirm dialog */}
                        <ConfirmDialog
                            isOpen={showRevokeConfirm}
                            title="Confirmer la révocation"
                            message={`Révoquer la cotisation de ${selectedRevoke?.user?.email || ''} ?`}
                            confirmText="Révoquer"
                            cancelText="Annuler"
                            onClose={() => { setShowRevokeConfirm(false); setSelectedRevoke(null); }}
                            onConfirm={async () => {
                                try {
                                    const res = await fetch(`${API_BASE_URL}/memberships/${selectedRevoke._id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                        body: JSON.stringify({ submissionStatus: 'rejected', notes: 'Révocation par admin' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        setMessage('Cotisation révoquée');
                                        setMemberships(memberships.map(m => m._id === selectedRevoke._id ? data.membership : m));
                                    } else {
                                        setMessage('Erreur: ' + (data.error || data.message));
                                    }
                                } catch (err) {
                                    setMessage('Erreur: ' + err.message);
                                }
                                setShowRevokeConfirm(false);
                                setSelectedRevoke(null);
                                setTimeout(() => setMessage(''), 3000);
                            }}
                        />

                        {/* Modal d'activation manuelle */}
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

                                        <label>Nombre d'années</label>
                                        <input type="number" min={1} value={activateYears} onChange={(e) => setActivateYears(Number(e.target.value))} />

                                        <label>Montant</label>
                                        <select value={activateAmountOption} onChange={(e) => setActivateAmountOption(e.target.value)}>
                                            <option value="">-- Choisir un montant --</option>
                                            {[27, 35, 50, 70, 100].map((usd) => (
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
                                            <option value="XAF">XAF</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>

                                        {activateFeedback && (
                                            <div className="inline-feedback" style={{ marginTop: '0.75rem' }}>
                                                {activateFeedback}
                                            </div>
                                        )}

                                        <div className="modal-actions">
                                            <button
                                                className="btn-confirm"
                                                onClick={async () => {
                                                    setActivateFeedback('');
                                                    try {
                                                        let selectedActAmount;
                                                        if (activateAmountOption === 'other') {
                                                            selectedActAmount = Number(activateCustomAmount) || 0;
                                                        } else {
                                                            const baseUSD = Number(activateAmountOption || activateAmount) || 0;
                                                            if (activateCurrency === 'USD') selectedActAmount = baseUSD;
                                                            else if (activateCurrency === 'EUR') selectedActAmount = Number((baseUSD * USD_TO_EUR).toFixed(2));
                                                            else selectedActAmount = Math.round(baseUSD * USD_TO_XAF);
                                                        }
                                                        const response = await fetch(`${API_BASE_URL}/memberships/activate`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({ email: selectedEmail, years: activateYears, amount: selectedActAmount, currency: activateCurrency })
                                                        });
                                                        const data = await response.json();
                                                        if (data.success) {
                                                            setActivateFeedback(data.message || 'Utilisateur trouvé et abonnement activé.');
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
                                                                response.status === 404
                                                                    ? 'Utilisateur non trouvé avec cet email.'
                                                                    : response.status === 409
                                                                        ? 'Abonnement déjà actif pour cet utilisateur.'
                                                                        : data.error || data.message || "Erreur lors de l’activation.";
                                                            setActivateFeedback(feedback);
                                                            setMessage('Erreur: ' + feedback);
                                                        }
                                                    } catch (err) {
                                                        const feedback = 'Erreur serveur ou réseau: ' + err.message;
                                                        setActivateFeedback(feedback);
                                                        setMessage(feedback);
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
                                                    setActivateFeedback('');
                                                }}
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {/* ANNOUNCEMENTS */}
                {activeTab === "announcements" && (
                    <div className="announcements-section">
                        <div className="announcements-section-header">
                            <div>
                                <h2>Gestion des annonces</h2>
                                <p className="announcements-section-subtitle">{announcements.length} annonce{announcements.length !== 1 ? 's' : ''} au total</p>
                            </div>
                            <button
                                className="btn-create-announcement"
                                onClick={() => { resetAnnouncementForm(); setShowAnnouncementModal(true); }}
                            >
                                + Créer une annonce
                            </button>
                        </div>

                        <div className="announcements-list">
                            {announcementsLoading ? (
                                <p>Chargement…</p>
                            ) : announcements.length === 0 ? (
                                <p className="announcements-empty">Aucune annonce pour le moment. Cliquez sur "Créer une annonce" pour commencer.</p>
                            ) : (
                                <div className="announcements-cards">
                                    {announcements.map((announcement) => (
                                        <div key={announcement._id} className="announcement-card">
                                            <div className="announcement-card-top">
                                                <span className="announcement-tag">{announcement.category}</span>
                                                <span className={`badge-status ${announcement.isPublished ? 'paid' : 'pending'}`}>
                                                    {announcement.isPublished ? 'Publié' : 'Brouillon'}
                                                </span>
                                            </div>
                                            <h4>{announcement.title}</h4>
                                            <p>{announcement.summary}</p>
                                            <small>
                                                {announcement.isPinned ? '📌 Épinglé · ' : ''}
                                                Créé le {new Date(announcement.createdAt).toLocaleDateString('fr-FR')}
                                            </small>
                                            <div className="announcement-card-actions">
                                                <button className="btn-approve" onClick={() => handleEditAnnouncement(announcement)}>
                                                    Modifier
                                                </button>
                                                <button className="btn-delete" onClick={() => askDeleteAnnouncement(announcement._id)}>
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal formulaire */}
                        {showAnnouncementModal && (
                            <div className="modal-overlay" onClick={resetAnnouncementForm}>
                                <div className="ann-form-modal" onClick={(e) => e.stopPropagation()}>
                                    <div className="ann-form-modal-header">
                                        <h3>{editingAnnouncementId ? "Modifier l'annonce" : 'Nouvelle annonce'}</h3>
                                        <button className="ann-form-close" onClick={resetAnnouncementForm}>✕</button>
                                    </div>
                                    <form className="announcements-form" onSubmit={handleAnnouncementSubmit}>
                                        <div className="announcements-grid-2">
                                            <div>
                                                <label>Titre</label>
                                                <input
                                                    type="text"
                                                    value={announcementForm.title}
                                                    onChange={(e) =>
                                                        setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))
                                                    }
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label>Catégorie</label>
                                                <select
                                                    value={announcementForm.category}
                                                    onChange={(e) =>
                                                        setAnnouncementForm((prev) => ({ ...prev, category: e.target.value }))
                                                    }
                                                >
                                                    <option value="ANNOUNCEMENT">Annonce</option>
                                                    <option value="INFO">Information</option>
                                                    <option value="EVENT">Événement</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label>Résumé</label>
                                            <textarea
                                                rows={3}
                                                value={announcementForm.summary}
                                                onChange={(e) =>
                                                    setAnnouncementForm((prev) => ({ ...prev, summary: e.target.value }))
                                                }
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label>Contenu détaillé (optionnel)</label>
                                            <textarea
                                                rows={5}
                                                value={announcementForm.content}
                                                onChange={(e) =>
                                                    setAnnouncementForm((prev) => ({ ...prev, content: e.target.value }))
                                                }
                                            />
                                        </div>

                                        <div className="announcements-grid-2">
                                            <div>
                                                <label>Date d’expiration</label>
                                                <input
                                                    type="date"
                                                    value={announcementForm.expiresAt}
                                                    onChange={(e) =>
                                                        setAnnouncementForm((prev) => ({ ...prev, expiresAt: e.target.value }))
                                                    }
                                                    disabled={announcementForm.expiresForever}
                                                />
                                                <div className="forever-label-wrapper">
                                                    <label className="forever-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={announcementForm.expiresForever}
                                                            onChange={(e) =>
                                                                setAnnouncementForm((prev) => ({ ...prev, expiresForever: e.target.checked }))
                                                            }
                                                        />
                                                        À vie (par défaut)
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="announcements-checkboxes">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={announcementForm.isPublished}
                                                        onChange={(e) =>
                                                            setAnnouncementForm((prev) => ({ ...prev, isPublished: e.target.checked }))
                                                        }
                                                    />
                                                    Publier
                                                </label>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={announcementForm.isPinned}
                                                        onChange={(e) =>
                                                            setAnnouncementForm((prev) => ({ ...prev, isPinned: e.target.checked }))
                                                        }
                                                    />
                                                    Épingler en haut
                                                </label>
                                            </div>
                                        </div>

                                        <div className="announcements-actions">
                                            <button type="submit" className="btn-confirm">
                                                {editingAnnouncementId ? 'Mettre à jour' : 'Publier'}
                                            </button>
                                            <button type="button" className="btn-cancel" onClick={resetAnnouncementForm}>
                                                Annuler
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                type={confirmState.type}
                onConfirm={() => { if (typeof confirmState.onConfirm === 'function') confirmState.onConfirm(); }}
                onClose={() => setConfirmState(s => ({ ...s, isOpen: false }))}
            />
        </div>
    );
}
