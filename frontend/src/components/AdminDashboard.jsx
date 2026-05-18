import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "./Url";
import ConfirmDialog from "./common/ConfirmDialog";
import MembershipsTab from "./admin/MembershipsTab";
import AnnouncementsTab from "./admin/AnnouncementsTab";
import "../styles/AdminDashboard.css";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [reservations, setReservations] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [message, setMessage] = useState("");
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

    const openConfirm = ({ title, message, onConfirm, type = 'danger' }) =>
        setConfirmState({ isOpen: true, title, message, onConfirm, type });

    const navigate = useNavigate();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        if (!["admin", "dev"].includes(currentUser.role)) navigate("/home");
    }, [currentUser.role, navigate]);

    useEffect(() => {
        if (activeTab === "overview" || activeTab === "reservations") {
            fetch(`${API_BASE_URL}/reservation/all`, { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => r.json())
                .then(setReservations)
                .catch(console.error);
        }
    }, [activeTab, token]);

    useEffect(() => {
        if (activeTab === "contacts") {
            fetch(`${API_BASE_URL}/contact`, { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => r.json())
                .then(setContacts)
                .catch(console.error);
        }
    }, [activeTab, token]);

    useEffect(() => {
        if (activeTab === "subscribers") {
            fetch(`${API_BASE_URL}/subscribe`, { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => r.json())
                .then(setSubscribers)
                .catch(console.error);
        }
    }, [activeTab, token]);

    const handleDeleteContact = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/contact/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            setContacts((c) => c.filter((x) => x._id !== id));
            setMessage("Contact supprimé");
        } catch (err) {
            setMessage("Erreur: " + err.message);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const handleDeleteSubscriber = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/subscribe/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            setSubscribers((s) => s.filter((x) => x._id !== id));
            setMessage("Abonné supprimé");
        } catch (err) {
            setMessage("Erreur: " + err.message);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const TABS = [
        { id: "overview", label: "📊 Vue d'ensemble" },
        { id: "content", label: "📝 Gestion Contenu" },
        { id: "reservations", label: "🎫 Réservations" },
        { id: "contacts", label: "📧 Contacts" },
        { id: "subscribers", label: "📬 Abonnés" },
        { id: "memberships", label: "💳 Cotisations" },
        { id: "announcements", label: "📢 Annonces" },
    ];

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>👨‍💼 Dashboard Administrateur</h1>
                <p>Bienvenue {currentUser.firstName} {currentUser.name}</p>
            </div>

            {message && <div className="admin-message">{message}</div>}

            <div className="admin-tabs">
                {TABS.map((t) => (
                    <button key={t.id} className={activeTab === t.id ? "active" : ""} onClick={() => setActiveTab(t.id)}>
                        {t.label}
                    </button>
                ))}
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
                                <div className="stat-recent"><small>Total</small></div>
                                <div className="tooltip-text">Nombre total de personnes qui ont réservé des activités (séminaires, événements, etc.)</div>
                            </div>
                            <div className="stat-card">
                                <h3>🎓 Réservations Formations</h3>
                                <div className="stat-number">{reservations.stats.totalFormationReservations}</div>
                                <div className="stat-recent"><small>Total</small></div>
                                <div className="tooltip-text">Nombre total de personnes inscrites aux formations proposées par l'AEGC</div>
                            </div>
                            <div className="stat-card">
                                <h3>📧 Messages Contacts</h3>
                                <div className="stat-number">{contacts.length}</div>
                                <div className="stat-recent"><small>Total reçus</small></div>
                                <div className="tooltip-text">Nombre de messages reçus via le formulaire de contact du site web</div>
                            </div>
                            <div className="stat-card">
                                <h3>📬 Abonnés Newsletter</h3>
                                <div className="stat-number">{subscribers.length}</div>
                                <div className="stat-recent"><small>Total</small></div>
                                <div className="tooltip-text">Nombre total d'adresses email abonnées à la newsletter de l'AEGC</div>
                            </div>
                        </div>
                        <div className="quick-access">
                            <h3>Accès Rapide</h3>
                            <div className="quick-links">
                                <Link to="/admin/create-activity" className="quick-link">➕ Créer une Activité</Link>
                                <Link to="/admin/create-formation" className="quick-link">➕ Créer une Formation</Link>
                                <Link to="/admin/manage-faq" className="quick-link">❓ Gérer les FAQ</Link>
                                <Link to="/admin/manage-images" className="quick-link">🖼️ Gérer les Images</Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTENT */}
                {activeTab === "content" && (
                    <div className="content-section">
                        <h2>Gestion du Contenu</h2>
                        <div className="content-grid">
                            <div className="content-card"><h3>🎯 Activités</h3><p>Créer, modifier et supprimer des activités</p><Link to="/admin/activities" className="btn-manage">Gérer</Link></div>
                            <div className="content-card"><h3>🎓 Formations</h3><p>Créer, modifier et supprimer des formations</p><Link to="/admin/formations" className="btn-manage">Gérer</Link></div>
                            <div className="content-card"><h3>❓ FAQ</h3><p>Gérer les questions fréquentes</p><Link to="/admin/faq" className="btn-manage">Gérer</Link></div>
                            <div className="content-card"><h3>🖼️ Images</h3><p>Upload et gestion des images</p><Link to="/admin/images" className="btn-manage">Gérer</Link></div>
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
                                <thead><tr><th>Utilisateur</th><th>Email</th><th>Activité</th><th>Date</th></tr></thead>
                                <tbody>
                                    {reservations.activities.map((r) => (
                                        <tr key={r._id}>
                                            <td>{r.user?.firstName} {r.user?.name}</td>
                                            <td>{r.user?.email}</td>
                                            <td>{r.activity?.name}</td>
                                            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <h3 style={{ marginTop: "2rem" }}>Formations ({reservations.formations.length})</h3>
                        <div className="reservations-table">
                            <table>
                                <thead><tr><th>Nom</th><th>Email</th><th>Formation</th><th>Date</th></tr></thead>
                                <tbody>
                                    {reservations.formations.map((r) => (
                                        <tr key={r._id}>
                                            <td>{r.firstName} {r.lastName}</td>
                                            <td>{r.email}</td>
                                            <td>{r.formationId?.title}</td>
                                            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
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
                            {contacts.map((c) => (
                                <div key={c._id} className="contact-card">
                                    <div className="contact-header">
                                        <strong>{c.email}</strong>
                                        <button className="btn-delete-small" onClick={() => openConfirm({ title: 'Supprimer le contact', message: 'Supprimer ce contact ?', onConfirm: () => handleDeleteContact(c._id) })}>🗑️</button>
                                    </div>
                                    <div className="contact-subject"><strong>Sujet:</strong> {c.subject}</div>
                                    <div className="contact-message">{c.message}</div>
                                    <div className="contact-date">{new Date(c.createdAt).toLocaleString()}</div>
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
                                <thead><tr><th>Nom</th><th>Prénom</th><th>Email</th><th>Date d'inscription</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {subscribers.map((s) => (
                                        <tr key={s._id}>
                                            <td>{s.name}</td>
                                            <td>{s.lastName}</td>
                                            <td>{s.email}</td>
                                            <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button className="btn-delete" onClick={() => openConfirm({ title: "Supprimer l'abonné", message: 'Supprimer cet abonné ?', onConfirm: () => handleDeleteSubscriber(s._id) })}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MEMBERSHIPS */}
                {activeTab === "memberships" && (
                    <MembershipsTab token={token} setMessage={setMessage} setActiveTab={setActiveTab} />
                )}

                {/* ANNOUNCEMENTS */}
                {activeTab === "announcements" && (
                    <AnnouncementsTab token={token} setMessage={setMessage} openConfirm={openConfirm} />
                )}

            </div>

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                type={confirmState.type}
                onConfirm={() => { if (typeof confirmState.onConfirm === 'function') confirmState.onConfirm(); }}
                onClose={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
            />
        </div>
    );
}
