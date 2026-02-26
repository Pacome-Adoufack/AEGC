import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./Url";
import ConfirmDialog from "./common/ConfirmDialog";
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
                                </div>
                                <div className="payment-methods">
                                    <small>
                                        <strong>Méthodes:</strong> Stripe ({membershipStats.paymentMethods.stripe}) |
                                        Manuel ({membershipStats.paymentMethods.manual})
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
