import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast.js";
import { API_BASE_URL } from "../Url";
import { getAuthToken } from "../../utils/auth";
import ConfirmDialog from "../common/ConfirmDialog";
import WorkingPapersTab from "../admin/WorkingPapersTab";
import SubmissionsTab from "../admin/SubmissionsTab";
import PublicationsTab from "../admin/PublicationsTab";
import { normalizeStatus } from "../admin/wpConstants";
import "../../styles/wp-base.css";
import "../../styles/wp-admin.css";
import "../../styles/wp-components.css";

function AdminWorkingPapers() {
    const toast = useToast();
    const navigate = useNavigate();
    const [tab, setTab] = useState("workingPapers");
    const [currentUserRole, setCurrentUserRole] = useState("admin");
    const [workingPapers, setWorkingPapers] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [managers, setManagers] = useState([]);
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: "", message: "", onConfirm: null, type: "danger" });

    const openConfirm = ({ title, message, onConfirm, type = "danger" }) =>
        setConfirmState({ isOpen: true, title, message, onConfirm, type });

    const isAdmin = currentUserRole === "admin";
    const isManager = currentUserRole === "dispatcher";

    // Refs to trigger modals in child tabs via hidden buttons
    const wpCreateRef = useRef(null);
    const pubCreateRef = useRef(null);

    useEffect(() => {
        const token = getAuthToken();
        const userStr = localStorage.getItem("user");
        if (!token && !userStr) { navigate("/"); return; }
        const user = JSON.parse(userStr || "{}");
        if (!["admin", "dispatcher"].includes(user.role)) { navigate("/"); return; }
        const role = user.role || "admin";
        setCurrentUserRole(role);
        if (role === "dispatcher") setTab("submissions");
        fetchData(role);
    }, []);

    const fetchData = async (roleFromCaller) => {
        try {
            const token = getAuthToken();
            const role = roleFromCaller || currentUserRole;
            const canManage = role === "admin";

            const wpRes = await fetch(`${API_BASE_URL}/api/working-papers`);
            setWorkingPapers(await wpRes.json());

            const subEndpoint = canManage
                ? `${API_BASE_URL}/api/admin/submissions`
                : `${API_BASE_URL}/api/dispatcher/submissions`;

            const subRes = await fetch(subEndpoint, { headers: { Authorization: `Bearer ${token}` } });
            if (subRes.status === 401 || subRes.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/");
                return;
            }
            const subData = await subRes.json();
            const normalized = (Array.isArray(subData) ? subData : []).map((s) => ({
                ...s, status: normalizeStatus(s.status),
            }));
            setSubmissions(normalized);

            if (canManage) {
                const mgRes = await fetch(`${API_BASE_URL}/api/admin/dispatchers`, { headers: { Authorization: `Bearer ${token}` } });
                if (mgRes.ok) { const d = await mgRes.json(); setManagers(Array.isArray(d) ? d : []); }

                const pubRes = await fetch(`${API_BASE_URL}/api/admin/publications`, { headers: { Authorization: `Bearer ${token}` } });
                if (pubRes.ok) { const d = await pubRes.json(); setPublications(Array.isArray(d) ? d : []); }
            } else {
                setManagers([]);
                setPublications([]);
            }
        } catch (err) {
            console.error("Erreur fetchData:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="admin-container"><p>Chargement...</p></div>;

    const openWorkingPapers = workingPapers.filter((wp) => wp.status === "ouvert").length;

    return (
        <div className="admin-container">
            <div className="admin-main">
                <div className="admin-shell-header">
                    <p className="admin-shell-kicker">{isAdmin ? "Administration" : "Gestionnaire"}</p>
                    <h1>Working Papers</h1>
                    <p className="admin-shell-subtitle">
                        {isAdmin
                            ? "Assigne les soumissions aux gestionnaires, suis leur progression et clôture les sessions finalisées."
                            : "Traite uniquement les soumissions qui te sont attribuées : évaluation, demandes de correction et décision finale."}
                    </p>
                    <div className="admin-stats-grid">
                        <div className="admin-stat-tile"><span className="admin-stat-label">Appels totaux</span><strong>{workingPapers.length}</strong></div>
                        <div className="admin-stat-tile"><span className="admin-stat-label">Appels ouverts</span><strong>{openWorkingPapers}</strong></div>
                        <div className="admin-stat-tile"><span className="admin-stat-label">Appels clôturés</span><strong>{workingPapers.length - openWorkingPapers}</strong></div>
                        <div className="admin-stat-tile">
                            <span className="admin-stat-label">{isAdmin ? "Gestionnaires" : "Mes soumissions"}</span>
                            <strong>{isAdmin ? managers.length : submissions.length}</strong>
                        </div>
                    </div>
                </div>

                <div className="tab-toolbar tab-toolbar-primary">
                    <div className="tab-buttons" role="tablist">
                        {isAdmin && <button className={tab === "workingPapers" ? "active" : ""} onClick={() => setTab("workingPapers")}>Appels à contributions ({workingPapers.length})</button>}
                        <button className={tab === "submissions" ? "active" : ""} onClick={() => setTab("submissions")}>
                            {isAdmin ? "Gestion des soumissions" : "Mes soumissions"} ({submissions.length})
                        </button>
                        {isAdmin && <button className={tab === "publications" ? "active" : ""} onClick={() => setTab("publications")}>Publications éditoriales ({publications.length})</button>}
                    </div>
                    {isAdmin && tab === "workingPapers" && (
                        <button className="btn btn-primary btn-small" onClick={() => document.getElementById("wp-tab-create-btn")?.click()}>
                            + Nouvel appel
                        </button>
                    )}
                    {isAdmin && tab === "publications" && (
                        <button className="btn btn-primary btn-small" onClick={() => document.getElementById("pub-tab-create-btn")?.click()}>
                            + Nouvelle publication
                        </button>
                    )}
                </div>

                {isAdmin && tab === "workingPapers" && (
                    <WorkingPapersTab
                        workingPapers={workingPapers}
                        isAdmin={isAdmin}
                        toast={toast}
                        openConfirm={openConfirm}
                        onRefresh={() => fetchData(currentUserRole)}
                    />
                )}

                {tab === "submissions" && (
                    <SubmissionsTab
                        submissions={submissions}
                        managers={managers}
                        isAdmin={isAdmin}
                        isManager={isManager}
                        toast={toast}
                        openConfirm={openConfirm}
                        onRefresh={() => fetchData(currentUserRole)}
                    />
                )}

                {isAdmin && tab === "publications" && (
                    <PublicationsTab
                        publications={publications}
                        toast={toast}
                        openConfirm={openConfirm}
                        onRefresh={() => fetchData(currentUserRole)}
                    />
                )}
            </div>

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

export default AdminWorkingPapers;
