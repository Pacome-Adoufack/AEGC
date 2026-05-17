import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./Url";
import ConfirmDialog from "./common/ConfirmDialog";
import WorkingPapersCommittee from "./WorkingPapersCommittee";
import "../styles/DevDashboard.css";

export default function DevDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [memberships, setMemberships] = useState([]);
    const [membershipStats, setMembershipStats] = useState(null);
    const [showActivateModal, setShowActivateModal] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState('EUR');
    const [activateNotes, setActivateNotes] = useState('');
    const [message, setMessage] = useState("");
    const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

    // États pour pagination et recherche
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [usersPerPage] = useState(20);

    const navigate = useNavigate();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const formatDateSafe = (d) => {
        if (!d) return '-';
        const t = new Date(d);
        if (isNaN(t.getTime())) return '-';
        return t.toLocaleDateString('fr-FR');
    };

    // Vérifier que l'utilisateur est bien DEV
    useEffect(() => {
        if (currentUser.role !== "dev") {
            navigate("/home");
        }
    }, [currentUser.role, navigate]);

    // Récupérer les stats
    useEffect(() => {
        if (activeTab === "overview") {
            fetch(`${API_BASE_URL}/dev/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setStats(data))
                .catch((err) => console.error(err));
        }
    }, [activeTab, token]);

    // Récupérer la liste des users avec pagination
    useEffect(() => {
        if (activeTab === "users") {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: usersPerPage,
                search: searchQuery
            });

            fetch(`${API_BASE_URL}/dev/users?${queryParams}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    setUsers(data.users || []);
                    setTotalPages(data.pagination?.pages || 1);
                    setTotalUsers(data.pagination?.total || 0);
                })
                .catch((err) => console.error(err));
        }
    }, [activeTab, currentPage, searchQuery, token, usersPerPage]);

    // Fonction de recherche avec debounce
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset à la page 1 lors d'une recherche
    };

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

    const handleChangeRole = async (userId, newRole) => {
        try {
            const res = await fetch(`${API_BASE_URL}/dev/users/${userId}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (res.ok) {
                setMessage("Rôle mis à jour avec succès");
                // Rafraîchir la liste
                const updatedUsers = await fetch(`${API_BASE_URL}/dev/users`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then((r) => r.json());
                setUsers(updatedUsers.users || []);
            } else {
                setMessage("Erreur lors de la mise à jour du rôle");
            }
        } catch (err) {
            setMessage("Erreur: " + err.message);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userData = {
            name: formData.get("name"),
            firstName: formData.get("firstName"),
            email: formData.get("email"),
            gender: formData.get("gender"),
            telefonNummer: formData.get("telefonNummer"),
            country: formData.get("country"),
            city: formData.get("city"),
            university: formData.get("university"),
            password: formData.get("password"),
            role: formData.get("role"),
        };

        try {
            const res = await fetch(`${API_BASE_URL}/dev/create-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(userData),
            });

            if (res.ok) {
                setMessage("Utilisateur créé avec succès");
                setShowCreateUser(false);
                e.target.reset();
                // Rafraîchir la liste
                const updatedUsers = await fetch(`${API_BASE_URL}/dev/users`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then((r) => r.json());
                setUsers(updatedUsers.users || []);
            } else {
                const error = await res.json();
                setMessage("Erreur: " + error.error);
            }
        } catch (err) {
            setMessage("Erreur: " + err.message);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/dev/users/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setMessage("Utilisateur supprimé");
                const updatedUsers = await fetch(`${API_BASE_URL}/dev/users`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then((r) => r.json());
                setUsers(updatedUsers.users || []);
            }
        } catch (err) {
            setMessage("Erreur: " + err.message);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    return (
        <div className="dev-dashboard">
            <div className="dev-header">
                <h1>🛠️ Dashboard Développeur</h1>
                <p>Bienvenue {currentUser.firstName} {currentUser.name}</p>
            </div>

            {message && <div className="dev-message">{message}</div>}

            <div className="dev-tabs">
                <button
                    className={activeTab === "overview" ? "active" : ""}
                    onClick={() => setActiveTab("overview")}
                >
                    📊 Vue d'ensemble
                </button>
                <button
                    className={activeTab === "users" ? "active" : ""}
                    onClick={() => setActiveTab("users")}
                >
                    👥 Gestion Users
                </button>
                <button
                    className={activeTab === "tools" ? "active" : ""}
                    onClick={() => setActiveTab("tools")}
                >
                    🔧 Outils
                </button>
                <button
                    className={activeTab === "memberships" ? "active" : ""}
                    onClick={() => setActiveTab("memberships")}
                >
                    💳 Cotisations
                </button>
                <button
                    className={activeTab === "committee" ? "active" : ""}
                    onClick={() => setActiveTab("committee")}
                >
                    👥 Comité
                </button>
            </div>

            <div className="dev-content">
                {/* OVERVIEW TAB */}
                {activeTab === "overview" && stats && (
                    <div className="overview-section">
                        <h2>Statistiques Globales</h2>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>👥 Utilisateurs</h3>
                                <div className="stat-number">{stats.users.total}</div>
                                <div className="stat-details">
                                    <span>🟢 Users: {stats.users.byRole.user}</span>
                                    <span>🔵 Admins: {stats.users.byRole.admin}</span>
                                    <span>🔴 Devs: {stats.users.byRole.dev}</span>
                                    <span>🟣 Gestionnaires: {stats.users.byRole.dispatcher || 0}</span>
                                </div>
                                <div className="stat-recent">
                                    <small>📅 Derniers 7 jours: {stats.users.recent.last7days}</small>
                                </div>
                                <div className="tooltip-text">
                                    Nombre total d'utilisateurs inscrits sur la plateforme, classés par rôle (utilisateurs, administrateurs, développeurs)
                                </div>
                            </div>

                            <div className="stat-card">
                                <h3>🎯 Activités</h3>
                                <div className="stat-number">{stats.activities.total}</div>
                                <div className="stat-recent">
                                    <small>📅 Ce mois: {stats.activities.recent}</small>
                                </div>
                                <div className="tooltip-text">
                                    Nombre total d'activités créées (séminaires, événements) avec statistiques du mois en cours
                                </div>
                            </div>

                            <div className="stat-card">
                                <h3>🎓 Formations</h3>
                                <div className="stat-number">{stats.formations.total}</div>
                                <div className="stat-recent">
                                    <small>📅 Ce mois: {stats.formations.recent}</small>
                                </div>
                                <div className="tooltip-text">
                                    Nombre total de formations proposées par l'AEGC avec statistiques du mois en cours
                                </div>
                            </div>

                            <div className="stat-card">
                                <h3>🎫 Réservations</h3>
                                <div className="stat-number">{stats.reservations.totalAll}</div>
                                <div className="stat-details">
                                    <span>Activités: {stats.reservations.activities.total}</span>
                                    <span>Formations: {stats.reservations.formations.total}</span>
                                </div>
                                <div className="tooltip-text">
                                    Nombre total de réservations effectuées (activités + formations) par les utilisateurs
                                </div>
                            </div>

                            <div className="stat-card">
                                <h3>📧 Contacts</h3>
                                <div className="stat-number">{stats.contacts.total}</div>
                                <div className="stat-recent">
                                    <small>📅 Cette semaine: {stats.contacts.recent}</small>
                                </div>
                                <div className="tooltip-text">
                                    Nombre de messages reçus via le formulaire de contact du site web
                                </div>
                            </div>

                            <div className="stat-card">
                                <h3>📬 Abonnés</h3>
                                <div className="stat-number">{stats.subscribers.total}</div>
                                <div className="stat-recent">
                                    <small>📅 Ce mois: {stats.subscribers.recent}</small>
                                </div>
                                <div className="tooltip-text">
                                    Nombre total d'adresses email abonnées à la newsletter de l'AEGC
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === "users" && (
                    <div className="users-section">
                        <div className="users-header">
                            <h2>Gestion des Utilisateurs</h2>
                            <button
                                className="btn-create"
                                onClick={() => setShowCreateUser(!showCreateUser)}
                            >
                                {showCreateUser ? "❌ Annuler" : "➕ Créer un utilisateur"}
                            </button>
                        </div>

                        {/* Barre de recherche et info pagination */}
                        <div className="users-search-bar">
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="🔍 Rechercher par nom, email ou université..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="search-input"
                                />
                            </div>
                            <div className="users-info">
                                <span className="users-count">
                                    {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} trouvé{totalUsers > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {showCreateUser && (
                            <form className="create-user-form" onSubmit={handleCreateUser}>
                                <h3>Créer un nouvel utilisateur</h3>
                                <div className="form-grid">
                                    <input name="name" placeholder="Nom" required />
                                    <input name="firstName" placeholder="Prénom" required />
                                    <input name="email" type="email" placeholder="Email" required />
                                    <select name="gender" required>
                                        <option value="">Genre</option>
                                        <option value="Male">Homme</option>
                                        <option value="Female">Femme</option>
                                        <option value="Other">Autre</option>
                                    </select>
                                    <input name="telefonNummer" placeholder="Téléphone" required />
                                    <input name="country" placeholder="Pays" required />
                                    <input name="city" placeholder="Ville" required />
                                    <input name="university" placeholder="Université" required />
                                    <input name="password" type="password" placeholder="Mot de passe" required />
                                    <select name="role" required>
                                        <option value="user">👤 User</option>
                                        <option value="admin">👨‍💼 Admin</option>
                                        <option value="dispatcher">🧭 Gestionnaire</option>
                                        <option value="dev">👨‍💻 Dev</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-submit">Créer</button>
                            </form>
                        )}

                        <div className="users-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Email</th>
                                        <th>Rôle</th>
                                        <th>Université</th>
                                        <th>Date création</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.firstName} {user.name}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                                    className={`role-badge role-${user.role}`}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                    <option value="dispatcher">Gestionnaire</option>
                                                    <option value="dev">Dev</option>
                                                </select>
                                            </td>
                                            <td>{user.university}</td>
                                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Contrôles de pagination */}
                        {totalPages > 1 && (
                            <div className="pagination-controls">
                                <button
                                    className="btn-pagination"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    « Début
                                </button>
                                <button
                                    className="btn-pagination"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    ‹ Précédent
                                </button>

                                <span className="pagination-info">
                                    Page {currentPage} sur {totalPages}
                                </span>

                                <button
                                    className="btn-pagination"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Suivant ›
                                </button>
                                <button
                                    className="btn-pagination"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    Fin »
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* TOOLS TAB */}
                {activeTab === "tools" && (
                    <div className="tools-section">
                        <h2>Outils de Développement</h2>

                        <div className="tool-card">
                            <h3>📊 Informations Système</h3>
                            <p>Version Backend: 2.0.0</p>
                            <p>Base de données: MongoDB</p>
                            <p>API: {API_BASE_URL}</p>
                        </div>
                    </div>
                )}

                {/* COMMITTEE TAB */}
                {activeTab === "committee" && (
                    <div className="tools-section committee-section">
                        <h2>Gestion du Comité Scientifique</h2>
                        <WorkingPapersCommittee />
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
                                onClick={() => setShowActivateModal(true)}
                            >
                                ➕ Activer une cotisation manuellement
                            </button>
                        </div>

                        {/* Liste des memberships */}
                        <div className="memberships-table">
                            <h3>
                                Liste des cotisations ({memberships.filter((membership) => {
                                    const status = membership.submissionStatus || membership.paymentStatus;
                                    return status === 'approved';
                                }).length})
                            </h3>
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
                                        .filter((membership) => {
                                            const status = membership.submissionStatus || membership.paymentStatus;
                                            return status === 'approved';
                                        })
                                        .map((membership) => (
                                            <tr key={membership._id}>
                                                <td>{membership.user?.firstName} {membership.user?.name}</td>
                                                <td>{membership.user?.email}</td>
                                                <td>
                                                    <span className={`badge-status ${membership.submissionStatus || membership.paymentStatus}`}>
                                                        {(() => {
                                                            const status = membership.submissionStatus || membership.paymentStatus;
                                                            const expired = membership.endDate && new Date(membership.endDate) <= new Date();
                                                            if (status === 'approved' && expired) return '⚠ Expiré';
                                                            if (status === 'approved') return '✓ Approuvé';
                                                            if (status === 'pending') return '⏳ En attente';
                                                            if (status === 'rejected' || status === 'cancelled') return '✗ Rejeté';
                                                            return status || '-';
                                                        })()}
                                                    </span>
                                                </td>
                                                <td>{membership.amount} {membership.currency}</td>
                                                <td>{membership.paymentNumber}</td>
                                                <td>
                                                    {membership.startDate ? formatDateSafe(membership.startDate) : '-'}
                                                </td>
                                                <td>
                                                    {membership.endDate ? formatDateSafe(membership.endDate) : '-'}
                                                </td>
                                                <td>
                                                    {membership.submissionMethod === 'bank_transfer' && '🏦 Virement'}
                                                    {membership.submissionMethod === 'orange_money' && '🟠 Orange Money'}
                                                    {membership.submissionMethod === 'mtn_momo' && '🟡 MTN MoMo'}
                                                    {membership.submissionMethod === 'manual_form' && '📄 Formulaire'}
                                                    {membership.submissionMethod === 'email' && '📧 Email'}
                                                    {membership.submissionMethod === 'online' && '📝 En ligne'}
                                                    {!membership.submissionMethod && membership.paymentMethod === 'manual' && '👤 Manuel'}
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
                                        <label>Email de l'utilisateur</label>
                                        <input
                                            type="email"
                                            value={selectedEmail}
                                            onChange={(e) => setSelectedEmail(e.target.value)}
                                            placeholder="exemple@email.com"
                                        />

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
                                                        const response = await fetch(`${API_BASE_URL}/memberships/activate`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({ email: selectedEmail })
                                                        });
                                                        const data = await response.json();
                                                        if (data.success) {
                                                            setActivateFeedback(data.message || 'Utilisateur trouvé et abonnement activé.');
                                                            setMessage('Cotisation activée avec succès');
                                                            setShowActivateModal(false);
                                                            setSelectedEmail('');
                                                            setActiveTab("overview");
                                                            setTimeout(() => setActiveTab("memberships"), 100);
                                                        } else {
                                                            const feedback =
                                                                response.status === 404
                                                                    ? 'Utilisateur non trouvé avec cet email.'
                                                                    : response.status === 409
                                                                        ? 'Abonnement déjà actif pour cet utilisateur.'
                                                                        : data.error || data.message || 'Erreur lors de l’activation.';
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
            </div>
        </div>
    );
}
