import { useState, useEffect } from "react";
import { API_BASE_URL } from "../Url";
import ConfirmDialog from "../common/ConfirmDialog";

export default function DevUsersTab({ token, setMessage }) {
    const [users, setUsers] = useState([]);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const usersPerPage = 20;
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: "", message: "", onConfirm: null, type: "danger" });
    const [editUser, setEditUser] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);
    // L'erreur s'affiche DANS la fenêtre : la bannière de la page est masquée
    // par le voile de la modale, donc un refus du serveur passait inaperçu.
    const [editError, setEditError] = useState("");

    const openConfirm = ({ title, message, onConfirm, type = "danger" }) =>
        setConfirmState({ isOpen: true, title, message, onConfirm, type });

    const loadUsers = () => {
        const params = new URLSearchParams({ page: currentPage, limit: usersPerPage, search: searchQuery });
        if (roleFilter) params.append("role", roleFilter);
        fetch(`${API_BASE_URL}/dev/users?${params}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((data) => {
                setUsers(data.users || []);
                setTotalPages(data.pagination?.pages || 1);
                setTotalUsers(data.pagination?.total || 0);
            })
            .catch(console.error);
    };

    useEffect(() => { loadUsers(); }, [currentPage, searchQuery, roleFilter]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleRoleFilterChange = (e) => {
        setRoleFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleChangeRole = async (userId, newRole) => {
        try {
            const res = await fetch(`${API_BASE_URL}/dev/users/${userId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                setMessage("Rôle mis à jour avec succès");
                loadUsers();
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
        const fd = new FormData(e.target);
        const userData = {
            name: fd.get("name"), firstName: fd.get("firstName"), email: fd.get("email"),
            gender: fd.get("gender"), telefonNummer: fd.get("telefonNummer"), country: fd.get("country"),
            city: fd.get("city"), university: fd.get("university"), password: fd.get("password"),
            role: fd.get("role"),
        };
        try {
            const res = await fetch(`${API_BASE_URL}/dev/create-user`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(userData),
            });
            if (res.ok) {
                setMessage("Utilisateur créé avec succès");
                setShowCreateUser(false);
                e.target.reset();
                loadUsers();
            } else {
                const error = await res.json();
                setMessage("Erreur: " + error.error);
            }
        } catch (err) {
            setMessage("Erreur: " + err.message);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = {
            name: fd.get("name"), firstName: fd.get("firstName"), email: fd.get("email"),
            gender: fd.get("gender"), telefonNummer: fd.get("telefonNummer"),
            country: fd.get("country"), city: fd.get("city"), university: fd.get("university"),
        };
        setSavingEdit(true);
        setEditError("");
        try {
            const res = await fetch(`${API_BASE_URL}/dev/users/${editUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Erreur lors de la mise à jour");
            setMessage(data.message || "Profil mis à jour");
            setEditUser(null); // succès : on ferme
            loadUsers();
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            // Échec : la fenêtre reste ouverte, avec la raison et la saisie intacte.
            setEditError(err.message);
        } finally {
            setSavingEdit(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/dev/users/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setMessage("Utilisateur supprimé");
                loadUsers();
            }
        } catch (err) {
            setMessage("Erreur: " + err.message);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const askDeleteUser = (userId) =>
        openConfirm({
            title: "Supprimer l'utilisateur",
            message: "Êtes-vous sûr de vouloir supprimer cet utilisateur ?",
            onConfirm: () => handleDeleteUser(userId),
        });

    return (
        <div className="users-section">
            <div className="users-header">
                <h2>Gestion des Utilisateurs</h2>
                <button className="btn-create" onClick={() => setShowCreateUser(!showCreateUser)}>
                    {showCreateUser ? "❌ Annuler" : "➕ Créer un utilisateur"}
                </button>
            </div>

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
                <select className="role-filter-select" value={roleFilter} onChange={handleRoleFilterChange}>
                    <option value="">Tous les rôles</option>
                    <option value="user">👤 User</option>
                    <option value="admin">👨‍💼 Admin</option>
                    <option value="dispatcher">🧭 Gestionnaire</option>
                    <option value="dev">👨‍💻 Dev</option>
                </select>
                <div className="users-info">
                    <span className="users-count">
                        {totalUsers} utilisateur{totalUsers > 1 ? "s" : ""} trouvé{totalUsers > 1 ? "s" : ""}
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
                                    <button className="btn-edit" title="Modifier le profil" onClick={() => { setEditError(""); setEditUser(user); }}>✏️</button>
                                    <button className="btn-delete" onClick={() => askDeleteUser(user.id)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination-controls">
                    <button className="btn-pagination" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>« Début</button>
                    <button className="btn-pagination" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>‹ Précédent</button>
                    <span className="pagination-info">Page {currentPage} sur {totalPages}</span>
                    <button className="btn-pagination" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Suivant ›</button>
                    <button className="btn-pagination" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Fin »</button>
                </div>
            )}

            {editUser && (
                <div className="dev-modal-overlay" onClick={() => setEditUser(null)}>
                    <div className="dev-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dev-modal-header">
                            <h2>Modifier le profil</h2>
                            <button className="dev-modal-close" onClick={() => setEditUser(null)}>x</button>
                        </div>
                        <div className="dev-modal-body">
                            {/* Le rôle se change dans le tableau, le mot de passe reste
                                à la charge de l'utilisateur : ni l'un ni l'autre ici. */}
                            {editError && <div className="dev-modal-error">{editError}</div>}

                            {/* Champs préremplis : sans libellé, on ne sait plus ce qu'on
                                modifie une fois le texte d'aide remplacé par la valeur. */}
                            <form className="create-user-form" onSubmit={handleEditUser}>
                                <div className="form-grid">
                                    <label className="dev-field">
                                        <span>Nom</span>
                                        <input name="name" defaultValue={editUser.name || ""} required />
                                    </label>
                                    <label className="dev-field">
                                        <span>Prénom</span>
                                        <input name="firstName" defaultValue={editUser.firstName || ""} required />
                                    </label>
                                    <label className="dev-field">
                                        <span>Email</span>
                                        <input name="email" type="email" defaultValue={editUser.email || ""} required />
                                    </label>
                                    <label className="dev-field">
                                        <span>Genre</span>
                                        <select name="gender" defaultValue={editUser.gender || ""} required>
                                            <option value="">À renseigner</option>
                                            <option value="Male">Homme</option>
                                            <option value="Female">Femme</option>
                                            <option value="Other">Autre</option>
                                        </select>
                                    </label>
                                    <label className="dev-field">
                                        <span>Téléphone</span>
                                        <input name="telefonNummer" defaultValue={editUser.telefonNummer || ""} required />
                                    </label>
                                    <label className="dev-field">
                                        <span>Pays</span>
                                        <input name="country" defaultValue={editUser.country || ""} required />
                                    </label>
                                    <label className="dev-field">
                                        <span>Ville</span>
                                        <input name="city" defaultValue={editUser.city || ""} required />
                                    </label>
                                    <label className="dev-field">
                                        <span>Université</span>
                                        <input name="university" defaultValue={editUser.university || ""} required />
                                    </label>
                                </div>
                                <div className="dev-modal-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setEditUser(null)}>Annuler</button>
                                    <button type="submit" className="btn-submit" disabled={savingEdit}>
                                        {savingEdit ? "Enregistrement…" : "Enregistrer"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                type={confirmState.type}
                onConfirm={() => { if (typeof confirmState.onConfirm === "function") confirmState.onConfirm(); }}
                onClose={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
            />
        </div>
    );
}
