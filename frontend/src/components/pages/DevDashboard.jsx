import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../Url";
import WorkingPapersCommittee from "../working-papers/WorkingPapersCommittee";
import DevUsersTab from "../admin/DevUsersTab";
import DevMembershipsTab from "../admin/DevMembershipsTab";
import "../../styles/DevDashboard.css";

export default function DevDashboard() {
    const [stats, setStats] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "overview";
    const setActiveTab = (tab) => setSearchParams({ tab });
    const [message, setMessage] = useState("");

    const navigate = useNavigate();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        if (currentUser.role !== "dev") navigate("/home");
    }, [currentUser.role, navigate]);

    useEffect(() => {
        if (activeTab === "overview") {
            fetch(`${API_BASE_URL}/dev/stats`, { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => r.json())
                .then(setStats)
                .catch(console.error);
        }
    }, [activeTab, token]);

    return (
        <div className="dev-dashboard">
            <div className="dev-header">
                <h1>🛠️ Dashboard Développeur</h1>
                <p>Bienvenue {currentUser.firstName} {currentUser.name}</p>
            </div>

            {message && <div className="dev-message">{message}</div>}

            <div className="dev-tabs">
                <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>📊 Vue d'ensemble</button>
                <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>👥 Gestion Users</button>
                <button className={activeTab === "tools" ? "active" : ""} onClick={() => setActiveTab("tools")}>🔧 Outils</button>
                <button className={activeTab === "memberships" ? "active" : ""} onClick={() => setActiveTab("memberships")}>💳 Cotisations</button>
                <button className={activeTab === "committee" ? "active" : ""} onClick={() => setActiveTab("committee")}>👥 Comité</button>
            </div>

            <div className="dev-content">
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
                                <div className="stat-recent"><small>📅 Derniers 7 jours: {stats.users.recent.last7days}</small></div>
                                <div className="tooltip-text">Nombre total d'utilisateurs inscrits sur la plateforme, classés par rôle</div>
                            </div>
                            <div className="stat-card">
                                <h3>🎯 Activités</h3>
                                <div className="stat-number">{stats.activities.total}</div>
                                <div className="stat-recent"><small>📅 Ce mois: {stats.activities.recent}</small></div>
                                <div className="tooltip-text">Nombre total d'activités créées (séminaires, événements)</div>
                            </div>
                            <div className="stat-card">
                                <h3>🎓 Formations</h3>
                                <div className="stat-number">{stats.formations.total}</div>
                                <div className="stat-recent"><small>📅 Ce mois: {stats.formations.recent}</small></div>
                                <div className="tooltip-text">Nombre total de formations proposées par l'AEGC</div>
                            </div>
                            <div className="stat-card">
                                <h3>🎫 Réservations</h3>
                                <div className="stat-number">{stats.reservations.totalAll}</div>
                                <div className="stat-details">
                                    <span>Activités: {stats.reservations.activities.total}</span>
                                    <span>Formations: {stats.reservations.formations.total}</span>
                                </div>
                                <div className="tooltip-text">Nombre total de réservations effectuées (activités + formations)</div>
                            </div>
                            <div className="stat-card">
                                <h3>📧 Contacts</h3>
                                <div className="stat-number">{stats.contacts.total}</div>
                                <div className="stat-recent"><small>📅 Cette semaine: {stats.contacts.recent}</small></div>
                                <div className="tooltip-text">Nombre de messages reçus via le formulaire de contact</div>
                            </div>
                            <div className="stat-card">
                                <h3>📬 Abonnés</h3>
                                <div className="stat-number">{stats.subscribers.total}</div>
                                <div className="stat-recent"><small>📅 Ce mois: {stats.subscribers.recent}</small></div>
                                <div className="tooltip-text">Nombre total d'adresses email abonnées à la newsletter</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "users" && (
                    <DevUsersTab token={token} setMessage={setMessage} />
                )}

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

                {activeTab === "memberships" && (
                    <DevMembershipsTab token={token} setMessage={setMessage} setActiveTab={setActiveTab} />
                )}

                {activeTab === "committee" && (
                    <div className="tools-section committee-section">
                        <h2>Gestion du Comité Scientifique</h2>
                        <WorkingPapersCommittee />
                    </div>
                )}
            </div>
        </div>
    );
}
