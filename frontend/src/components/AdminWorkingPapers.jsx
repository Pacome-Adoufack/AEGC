import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast.js";
import { API_BASE_URL } from "./Url";
import { getAuthToken } from "../utils/auth";
import "../styles/wp-base.css";
import "../styles/wp-admin.css";
import "../styles/wp-components.css";

const LEGACY_STATUS_TO_NEW = {
    "re\u00e7ue": "soumise",
    "reÃ§ue": "soumise",
    en_attente: "en_revision",
    "trait\u00e9e": "revision_requise",
    "traitÃ©e": "revision_requise",
    "termin\u00e9e": "acceptee",
    "terminÃ©e": "acceptee",
};

const SUBMISSION_STATUS_LABELS = {
    soumise: "Soumise",
    en_revision: "En revision",
    revision_requise: "A modifier",
    rejetee: "Rejetee",
    acceptee: "Acceptee",
};

const SUBMISSION_STATUS_ORDER = [
    "soumise",
    "en_revision",
    "revision_requise",
    "rejetee",
    "acceptee",
];

const normalizeStatus = (status) => LEGACY_STATUS_TO_NEW[status] || status;

function AdminWorkingPapers() {
    const toast = useToast();
    const [tab, setTab] = useState("workingPapers");
    const [currentUserRole, setCurrentUserRole] = useState("admin");
    const [workingPapers, setWorkingPapers] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [dispatchers, setDispatchers] = useState([]);
    const [publications, setPublications] = useState([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [showCreateWP, setShowCreateWP] = useState(false);
    const [showCreatePublication, setShowCreatePublication] = useState(false);
    const [showEditWP, setShowEditWP] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [detailTab, setDetailTab] = useState("overview");
    const navigate = useNavigate();

    const [newWP, setNewWP] = useState({
        title: "",
        description: "",
        deadline: "",
    });

    const [editWP, setEditWP] = useState({
        id: "",
        title: "",
        description: "",
        deadline: "",
        status: "ouvert",
    });

    const [newComment, setNewComment] = useState("");
    const [revisionSummary, setRevisionSummary] = useState("");
    const [revisionItemsText, setRevisionItemsText] = useState("");
    const [revisionSubmitting, setRevisionSubmitting] = useState(false);
    const [publicationSubmitting, setPublicationSubmitting] = useState(false);
    const [publicationForm, setPublicationForm] = useState({
        title: "",
        summary: "",
        status: "draft",
        acceptedCount: "",
        rejectedCount: "",
        file: null,
    });

    const isAdmin = currentUserRole === "admin";
    const isDispatcher = currentUserRole === "dispatcher";

    useEffect(() => {
        const token = getAuthToken();
        const userStr = localStorage.getItem("user");

        if (!token && !userStr) {
            navigate("/");
            return;
        }

        const user = JSON.parse(userStr || "{}");
        if (!["admin", "dispatcher"].includes(user.role)) {
            navigate("/");
            return;
        }

        const role = user.role || "admin";
        setCurrentUserRole(role);
        if (role === "dispatcher") {
            setTab("submissions");
        }

        fetchData(role);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (filterStatus === "all") {
            setFilteredSubmissions(submissions);
        } else {
            setFilteredSubmissions(
                submissions.filter((s) => normalizeStatus(s.status) === filterStatus)
            );
        }
    }, [filterStatus, submissions]);

    const fetchData = async (roleFromCaller) => {
        try {
            const token = getAuthToken();
            const activeRole = roleFromCaller || currentUserRole;
            const canManageCalls = activeRole === "admin";

            const wpResponse = await fetch(`${API_BASE_URL}/api/working-papers`);
            const wpData = await wpResponse.json();
            setWorkingPapers(wpData);

            const submissionsEndpoint = canManageCalls
                ? `${API_BASE_URL}/api/admin/submissions`
                : `${API_BASE_URL}/api/dispatcher/submissions`;

            const subResponse = await fetch(submissionsEndpoint, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (subResponse.status === 401 || subResponse.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/");
                return;
            }

            const subData = await subResponse.json();
            const submissionList = Array.isArray(subData) ? subData : [];
            const normalizedSubmissions = submissionList.map((submission) => ({
                ...submission,
                status: normalizeStatus(submission.status),
            }));

            setSubmissions(normalizedSubmissions);
            setFilteredSubmissions(normalizedSubmissions);

            if (canManageCalls) {
                const dispatchersResponse = await fetch(`${API_BASE_URL}/api/admin/dispatchers`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (dispatchersResponse.ok) {
                    const dispatchersData = await dispatchersResponse.json();
                    setDispatchers(Array.isArray(dispatchersData) ? dispatchersData : []);
                }

                const publicationsResponse = await fetch(`${API_BASE_URL}/api/admin/publications`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (publicationsResponse.ok) {
                    const publicationsData = await publicationsResponse.json();
                    setPublications(Array.isArray(publicationsData) ? publicationsData : []);
                }
            } else {
                setDispatchers([]);
                setPublications([]);
            }
        } catch (error) {
            console.error("Erreur:", error);
        } finally {
            setLoading(false);
        }
    };

    const createWorkingPaper = async (e) => {
        e.preventDefault();

        if (!isAdmin) {
            toast.error("Action reservee a l'administration");
            return;
        }

        try {
            const token = getAuthToken();

            const response = await fetch(`${API_BASE_URL}/api/admin/working-papers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newWP),
            });

            if (response.ok) {
                setShowCreateWP(false);
                setNewWP({ title: "", description: "", deadline: "" });
                fetchData();
                toast.success("Appel cree avec succes !");
            } else {
                const errorData = await response.json();
                toast.error(`Erreur: ${errorData.error || "Erreur inconnue"}`);
            }
        } catch (error) {
            toast.error(`Erreur lors de la creation: ${error.message}`);
        }
    };

    const startEditWP = (wp) => {
        setEditWP({
            id: wp._id,
            title: wp.title,
            description: wp.description,
            deadline: wp.deadline.split("T")[0],
            status: wp.status,
        });
        setShowEditWP(true);
    };

    const updateWorkingPaper = async (e) => {
        e.preventDefault();

        if (!isAdmin) {
            toast.error("Action reservee a l'administration");
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(
                `${API_BASE_URL}/api/admin/working-papers/${editWP.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: editWP.title,
                        description: editWP.description,
                        deadline: editWP.deadline,
                        status: editWP.status,
                    }),
                }
            );

            if (response.ok) {
                setShowEditWP(false);
                setEditWP({ id: "", title: "", description: "", deadline: "", status: "ouvert" });
                fetchData();
                toast.success("Appel mis a jour avec succes !");
            }
        } catch (error) {
            console.error("Erreur:", error);
            toast.error("Erreur lors de la mise a jour");
        }
    };

    const deleteWorkingPaper = async (wpId, wpTitle) => {
        if (!isAdmin) {
            toast.error("Action reservee a l'administration");
            return;
        }

        if (!window.confirm(`Etes-vous sur de vouloir supprimer "${wpTitle}" ?\n\nCette action supprimera aussi toutes les soumissions associees !`)) {
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(
                `${API_BASE_URL}/api/admin/working-papers/${wpId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                fetchData();
                toast.success("Appel supprime avec succes !");
            }
        } catch (error) {
            console.error("Erreur:", error);
            toast.error("Erreur lors de la suppression");
        }
    };

    const changeSubmissionStatus = async (submissionId, newStatus) => {
        if (!isDispatcher) {
            toast.error("Seul un dispatcher peut modifier le statut");
            return;
        }

        try {
            const token = getAuthToken();
            await fetch(`${API_BASE_URL}/api/admin/submissions/${submissionId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            fetchData(currentUserRole);
        } catch (error) {
            console.error("Erreur:", error);
        }
    };

    const assignDispatcher = async (submissionId, dispatcherId) => {
        if (!isAdmin) {
            return;
        }

        if (!dispatcherId) {
            toast.error("Veuillez choisir un dispatcher");
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(
                `${API_BASE_URL}/api/admin/submissions/${submissionId}/assign-dispatcher`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ dispatcherId }),
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de l'assignation");
            }

            toast.success("Dispatcher assigne avec succes");
            fetchData(currentUserRole);
        } catch (error) {
            toast.error(error.message || "Erreur lors de l'assignation");
        }
    };

    const closeDispatcherSession = async (dispatcherId, dispatcherLabel) => {
        if (!isAdmin) {
            return;
        }

        if (!window.confirm(`Cloturer la session de ${dispatcherLabel} ?\n\nToutes ses soumissions actives doivent etre acceptees ou rejetees.`)) {
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(
                `${API_BASE_URL}/api/admin/dispatchers/${dispatcherId}/close-session`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Impossible de cloturer la session");
            }

            toast.success("Session dispatcher cloturee");
            fetchData(currentUserRole);
        } catch (error) {
            toast.error(error.message || "Impossible de cloturer la session");
        }
    };

    const openSubmissionDetails = async (submissionId) => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Impossible de charger les details");
            }

            const data = await response.json();
            setSelectedSubmission({
                ...data,
                status: normalizeStatus(data.status),
            });
            setDetailTab("overview");
            setRevisionSummary("");
            setRevisionItemsText("");
            setNewComment("");
        } catch (error) {
            toast.error(error.message || "Erreur lors du chargement des details");
        }
    };

    const resetPublicationForm = () => {
        setPublicationForm({
            title: "",
            summary: "",
            status: "draft",
            acceptedCount: "",
            rejectedCount: "",
            file: null,
        });
    };

    const createPublication = async (e) => {
        e.preventDefault();

        if (!isAdmin) {
            toast.error("Action reservee a l'administration");
            return;
        }

        if (!publicationForm.title.trim()) {
            toast.error("Le titre est obligatoire");
            return;
        }

        if (!publicationForm.file) {
            toast.error("Veuillez selectionner un PDF");
            return;
        }

        try {
            setPublicationSubmitting(true);
            const token = getAuthToken();
            const formData = new FormData();
            formData.append("title", publicationForm.title.trim());
            formData.append("summary", publicationForm.summary.trim());
            formData.append("status", publicationForm.status);
            if (publicationForm.acceptedCount !== "") {
                formData.append("acceptedCount", publicationForm.acceptedCount);
            }
            if (publicationForm.rejectedCount !== "") {
                formData.append("rejectedCount", publicationForm.rejectedCount);
            }
            formData.append("file", publicationForm.file);

            const response = await fetch(`${API_BASE_URL}/api/admin/publications`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de la creation de la publication");
            }

            toast.success(data.message || "Publication enregistree");
            setShowCreatePublication(false);
            resetPublicationForm();
            fetchData(currentUserRole);
        } catch (error) {
            toast.error(error.message || "Erreur lors de la creation de la publication");
        } finally {
            setPublicationSubmitting(false);
        }
    };

    const changePublicationStatus = async (publicationId, status) => {
        if (!isAdmin) {
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(
                `${API_BASE_URL}/api/admin/publications/${publicationId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status }),
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de la mise a jour");
            }

            toast.success(data.message || "Statut mis a jour");
            fetchData(currentUserRole);
        } catch (error) {
            toast.error(error.message || "Erreur lors de la mise a jour");
        }
    };

    const deletePublication = async (publicationId, publicationTitle) => {
        if (!isAdmin) {
            return;
        }

        if (!window.confirm(`Supprimer la publication \"${publicationTitle}\" ?`)) {
            return;
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/admin/publications/${publicationId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de la suppression");
            }

            toast.success(data.message || "Publication supprimee");
            fetchData(currentUserRole);
        } catch (error) {
            toast.error(error.message || "Erreur lors de la suppression");
        }
    };

    const addComment = async (submissionId) => {
        if (!isDispatcher) {
            toast.error("Seul un dispatcher peut ajouter un commentaire");
            return;
        }

        if (!newComment.trim()) return;

        try {
            const token = getAuthToken();
            await fetch(
                `${API_BASE_URL}/api/admin/submissions/${submissionId}/comments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ comment: newComment }),
                }
            );

            setNewComment("");
            await openSubmissionDetails(submissionId);
            toast.success("Commentaire ajoute avec succes !");
        } catch {
            toast.error("Erreur lors de l'ajout du commentaire");
        }
    };

    const requestRevision = async (submissionId) => {
        if (!isDispatcher) {
            toast.error("Seul un dispatcher peut demander une revision");
            return;
        }

        if (!revisionSummary.trim() || !revisionItemsText.trim()) {
            toast.error("Veuillez remplir le resume et les points de revision");
            return;
        }

        setRevisionSubmitting(true);
        try {
            const token = getAuthToken();
            const items = revisionItemsText
                .split("\n")
                .map((item) => item.trim())
                .filter((item) => item.length > 0);

            await fetch(
                `${API_BASE_URL}/api/admin/submissions/${submissionId}/revision-request`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        summary: revisionSummary,
                        items,
                    }),
                }
            );

            setRevisionSummary("");
            setRevisionItemsText("");
            await openSubmissionDetails(submissionId);
            toast.success("Appreciation envoyee !");
        } catch {
            toast.error("Erreur lors de l'envoi de l'appreciation");
        } finally {
            setRevisionSubmitting(false);
        }
    };

    const downloadPDF = async (submissionId) => {
        try {
            const token = getAuthToken();
            const response = await fetch(
                `${API_BASE_URL}/api/submissions/${submissionId}/download`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Erreur lors du telechargement");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const filename = `submission-${submissionId}.pdf`;
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            toast.error("Erreur lors du telechargement du PDF");
        }
    };

    const downloadVersionPDF = async (submissionId, versionNumber) => {
        try {
            const token = getAuthToken();
            const response = await fetch(
                `${API_BASE_URL}/api/submissions/${submissionId}/versions/${versionNumber}/download`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) throw new Error("Erreur lors du telechargement");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const filename = `submission-v${versionNumber}.pdf`;
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            toast.error("Erreur lors du telechargement de la version");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const countByStatus = (status) => {
        return submissions.filter((s) => normalizeStatus(s.status) === status).length;
    };

    const hasNewVersion = (submission) => {
        const currentVersion = Number(submission?.currentVersion || 1);
        return normalizeStatus(submission?.status) === "en_revision" && currentVersion > 1;
    };

    const openWorkingPapers = workingPapers.filter((wp) => wp.status === "ouvert").length;
    const closedWorkingPapers = workingPapers.length - openWorkingPapers;

    if (loading) {
        return <div className="admin-container"><p>Chargement...</p></div>;
    }

    return (
        <div className="admin-container">
            <div className="admin-main">
                <div className="admin-shell-header">
                    <p className="admin-shell-kicker">{isAdmin ? "Administration" : "Dispatcher"}</p>
                    <h1>Working Papers</h1>
                    <p className="admin-shell-subtitle">
                        {isAdmin
                            ? "Assigne les soumissions aux dispatchers, suis leur progression et cloture les sessions finalisees."
                            : "Traite uniquement les soumissions qui te sont attribuees: evaluation, demandes de correction et decision finale."
                        }
                    </p>
                    <div className="admin-stats-grid">
                        <div className="admin-stat-tile">
                            <span className="admin-stat-label">Appels totaux</span>
                            <strong>{workingPapers.length}</strong>
                        </div>
                        <div className="admin-stat-tile">
                            <span className="admin-stat-label">Appels ouverts</span>
                            <strong>{openWorkingPapers}</strong>
                        </div>
                        <div className="admin-stat-tile">
                            <span className="admin-stat-label">Appels clotures</span>
                            <strong>{closedWorkingPapers}</strong>
                        </div>
                        <div className="admin-stat-tile">
                            <span className="admin-stat-label">{isAdmin ? "Dispatchers" : "Mes soumissions"}</span>
                            <strong>{isAdmin ? dispatchers.length : submissions.length}</strong>
                        </div>
                    </div>
                </div>

                <div className="tab-toolbar tab-toolbar-primary">
                    <div className="tab-buttons" role="tablist" aria-label="Navigation administration working papers">
                        {isAdmin && (
                            <button
                                className={tab === "workingPapers" ? "active" : ""}
                                onClick={() => setTab("workingPapers")}
                            >
                                Appels a contributions ({workingPapers.length})
                            </button>
                        )}
                        <button
                            className={tab === "submissions" ? "active" : ""}
                            onClick={() => setTab("submissions")}
                        >
                            {isAdmin ? "Dispatching" : "Mes soumissions"} ({submissions.length})
                        </button>
                        {isAdmin && (
                            <button
                                className={tab === "publications" ? "active" : ""}
                                onClick={() => setTab("publications")}
                            >
                                Publications editoriales ({publications.length})
                            </button>
                        )}
                    </div>
                    {isAdmin && tab === "workingPapers" && (
                        <button
                            className="btn btn-primary btn-small"
                            onClick={() => setShowCreateWP(true)}
                        >
                            + Nouvel appel
                        </button>
                    )}
                    {isAdmin && tab === "publications" && (
                        <button
                            className="btn btn-primary btn-small"
                            onClick={() => setShowCreatePublication(true)}
                        >
                            + Nouvelle publication
                        </button>
                    )}
                </div>

                {/* TAB: Appels a contributions */}
                {isAdmin && tab === "workingPapers" && (
                    <div className="admin-section-card">
                        <div className="wp-table">
                            {workingPapers.length === 0 ? (
                                <div className="admin-empty">Aucun appel pour le moment.</div>
                            ) : (
                                workingPapers.map((wp) => (
                                    <div key={wp._id} className="admin-wp-card">
                                        <div className={`admin-wp-card-accent ${wp.status === "ouvert" ? "ouvert" : "cloture"}`} />
                                        <div className="admin-wp-card-inner">
                                            <div className="admin-wp-info">
                                                <h3>{wp.title}</h3>
                                                <div className="admin-wp-meta">
                                                    <span className="meta-chip">Deadline : <strong>{formatDate(wp.deadline)}</strong></span>
                                                    <span className="meta-chip">
                                                        <span className={`wp-status ${wp.status === "ouvert" ? "open" : "closed"}`}>
                                                            {wp.status === "ouvert" ? "Ouvert" : "Cloture"}
                                                        </span>
                                                    </span>
                                                    <span className="meta-chip">{wp.submissionsCount} soumission{wp.submissionsCount !== 1 ? "s" : ""}</span>
                                                </div>
                                            </div>
                                            <div className="admin-wp-actions">
                                                <button
                                                    className="btn btn-secondary btn-small"
                                                    onClick={() => startEditWP(wp)}
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-small"
                                                    onClick={() => deleteWorkingPaper(wp._id, wp.title)}
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: Soumissions */}
                {tab === "submissions" && (
                    <div className="admin-section-card">
                        {isAdmin && (
                            <div className="dispatcher-panel">
                                <h3>Sessions dispatchers</h3>
                                {dispatchers.length === 0 ? (
                                    <p className="dispatcher-panel-empty">Aucun dispatcher configure pour le moment.</p>
                                ) : (
                                    <div className="dispatcher-grid">
                                        {dispatchers.map((dispatcher) => (
                                            <div key={dispatcher.id} className="dispatcher-card">
                                                <div>
                                                    <p className="dispatcher-name">{dispatcher.firstName} {dispatcher.name}</p>
                                                    <p className="dispatcher-meta">{dispatcher.email}</p>
                                                    <p className="dispatcher-meta">
                                                        Actives: {dispatcher.activeAssignedCount} | Finalisees: {dispatcher.completedCount} | En cours: {dispatcher.pendingCount}
                                                    </p>
                                                </div>
                                                <button
                                                    className="btn btn-secondary btn-small"
                                                    disabled={!dispatcher.canCloseSession}
                                                    onClick={() => closeDispatcherSession(dispatcher.id, `${dispatcher.firstName} ${dispatcher.name}`)}
                                                >
                                                    Cloturer session
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="tab-toolbar tab-toolbar-secondary">
                            <div className="filters">
                                <button className={filterStatus === "all" ? "active" : ""} onClick={() => setFilterStatus("all")}>
                                    Toutes ({submissions.length})
                                </button>
                                <button className={filterStatus === "soumise" ? "active" : ""} onClick={() => setFilterStatus("soumise")}>
                                    Soumises ({countByStatus("soumise")})
                                </button>
                                <button className={filterStatus === "en_revision" ? "active" : ""} onClick={() => setFilterStatus("en_revision")}>
                                    En revision ({countByStatus("en_revision")})
                                </button>
                                <button className={filterStatus === "revision_requise" ? "active" : ""} onClick={() => setFilterStatus("revision_requise")}>
                                    A modifier ({countByStatus("revision_requise")})
                                </button>
                                <button className={filterStatus === "rejetee" ? "active" : ""} onClick={() => setFilterStatus("rejetee")}>
                                    Rejetees ({countByStatus("rejetee")})
                                </button>
                                <button className={filterStatus === "acceptee" ? "active" : ""} onClick={() => setFilterStatus("acceptee")}>
                                    Acceptees ({countByStatus("acceptee")})
                                </button>
                            </div>
                            {filterStatus !== "all" && (
                                <button className="btn btn-secondary btn-small" onClick={() => setFilterStatus("all")}>
                                    Reinitialiser filtre
                                </button>
                            )}
                        </div>

                        <div className="submissions-table">
                            {filteredSubmissions.length === 0 ? (
                                <div className="admin-empty">Aucune soumission ne correspond a ce filtre.</div>
                            ) : (
                                filteredSubmissions.map((sub) => (
                                    <div key={sub._id} className="submission-row">
                                        <div className={`sub-row-accent accent-${normalizeStatus(sub.status)}`} />
                                        <div className="sub-row-inner">
                                            <div className="sub-row-info">
                                                <div className="sub-row-title">
                                                    <h3>{sub.articleTitle}</h3>
                                                    {hasNewVersion(sub) && (
                                                        <span className="new-version-badge">Nouvelle version</span>
                                                    )}
                                                </div>
                                                <div className="sub-row-meta">
                                                    <span>{sub.submittedBy?.name} {sub.submittedBy?.firstName}</span>
                                                    <span>{sub.submittedBy?.email}</span>
                                                    <span>{sub.workingPaper?.title}</span>
                                                    <span>Dispatcher: {sub.assignedDispatcher ? `${sub.assignedDispatcher.firstName} ${sub.assignedDispatcher.name}` : "Non assigne"}</span>
                                                    <span>V{sub.currentVersion || 1}</span>
                                                    <span>{formatDate(sub.createdAt)}</span>
                                                </div>
                                            </div>

                                            <div className="sub-row-actions">
                                                {isDispatcher && (
                                                    <select
                                                        className="sub-status-select"
                                                        value={normalizeStatus(sub.status)}
                                                        onChange={(e) => changeSubmissionStatus(sub._id, e.target.value)}
                                                    >
                                                        {SUBMISSION_STATUS_ORDER.map((status) => (
                                                            <option key={status} value={status}>
                                                                {SUBMISSION_STATUS_LABELS[status]}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}

                                                {isAdmin && (
                                                    <select
                                                        className="sub-status-select"
                                                        value={sub.assignedDispatcher?._id || ""}
                                                        onChange={(e) => assignDispatcher(sub._id, e.target.value)}
                                                    >
                                                        <option value="">Affecter un dispatcher</option>
                                                        {dispatchers.map((dispatcher) => (
                                                            <option key={dispatcher.id} value={dispatcher.id}>
                                                                {dispatcher.firstName} {dispatcher.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}

                                                <button
                                                    className="btn btn-secondary btn-small"
                                                    onClick={() => openSubmissionDetails(sub._id)}
                                                >
                                                    Details
                                                </button>

                                                <button
                                                    className="btn btn-primary btn-small"
                                                    onClick={() => downloadPDF(sub._id)}
                                                >
                                                    PDF
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {isAdmin && tab === "publications" && (
                    <div className="admin-section-card">
                        {publications.length === 0 ? (
                            <div className="admin-empty">Aucune publication editoriale pour le moment.</div>
                        ) : (
                            <div className="wp-table">
                                {publications.map((publication) => (
                                    <div key={publication._id} className="admin-wp-card">
                                        <div className={`admin-wp-card-accent ${publication.status === "published" ? "ouvert" : "cloture"}`} />
                                        <div className="admin-wp-card-inner">
                                            <div className="admin-wp-info">
                                                <h3>{publication.title}</h3>
                                                <div className="admin-wp-meta">
                                                    <span className="meta-chip">
                                                        Statut : <strong>{publication.status === "published" ? "Publie" : "Brouillon"}</strong>
                                                    </span>
                                                    <span className="meta-chip">
                                                        Date : <strong>{formatDate(publication.publishedAt || publication.createdAt)}</strong>
                                                    </span>
                                                </div>
                                                {publication.summary && (
                                                    <p style={{ marginTop: "0.5rem", color: "#475569" }}>
                                                        {publication.summary.length > 220
                                                            ? `${publication.summary.substring(0, 220)}...`
                                                            : publication.summary}
                                                    </p>
                                                )}
                                                {(publication.stats?.acceptedCount !== undefined || publication.stats?.rejectedCount !== undefined) && (
                                                    <div className="admin-wp-meta" style={{ marginTop: "0.5rem" }}>
                                                        {publication.stats?.acceptedCount !== undefined && (
                                                            <span className="meta-chip">
                                                                Acceptes : <strong>{publication.stats.acceptedCount}</strong>
                                                            </span>
                                                        )}
                                                        {publication.stats?.rejectedCount !== undefined && (
                                                            <span className="meta-chip">
                                                                Rejetes : <strong>{publication.stats.rejectedCount}</strong>
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="admin-wp-actions">
                                                {publication.status === "published" ? (
                                                    <a
                                                        className="btn btn-secondary btn-small"
                                                        href={`${API_BASE_URL}/api/publications/${publication._id}/download`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        PDF
                                                    </a>
                                                ) : (
                                                    <span className="meta-chip">PDF prive (brouillon)</span>
                                                )}
                                                <button
                                                    className="btn btn-secondary btn-small"
                                                    onClick={() =>
                                                        changePublicationStatus(
                                                            publication._id,
                                                            publication.status === "published" ? "draft" : "published"
                                                        )
                                                    }
                                                >
                                                    {publication.status === "published" ? "Depublier" : "Publier"}
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-small"
                                                    onClick={() => deletePublication(publication._id, publication.title)}
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Modal: Creer WP */}
                {showCreateWP && (
                    <div className="admin-modal-overlay" onClick={() => setShowCreateWP(false)}>
                        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2>Creer un appel a contribution</h2>
                                <button className="admin-modal-close" onClick={() => setShowCreateWP(false)}>x</button>
                            </div>
                            <div className="admin-modal-body">
                                <form onSubmit={createWorkingPaper}>
                                    <div className="form-group">
                                        <label>Titre de l&apos;appel</label>
                                        <input
                                            type="text"
                                            value={newWP.title}
                                            onChange={(e) => setNewWP({ ...newWP, title: e.target.value })}
                                            required
                                            placeholder="Ex : Appel a contributions - Economie comportementale"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description (texte complet de l&apos;appel)</label>
                                        <textarea
                                            value={newWP.description}
                                            onChange={(e) => setNewWP({ ...newWP, description: e.target.value })}
                                            rows="8"
                                            required
                                            placeholder="Presentation de l'appel, thematiques, consignes..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Date limite de soumission</label>
                                        <input
                                            type="date"
                                            value={newWP.deadline}
                                            onChange={(e) => setNewWP({ ...newWP, deadline: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowCreateWP(false)}>Annuler</button>
                                        <button type="submit" className="btn btn-primary">Creer l&apos;appel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal: Modifier WP */}
                {showEditWP && (
                    <div className="admin-modal-overlay" onClick={() => setShowEditWP(false)}>
                        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2>Modifier l&apos;appel</h2>
                                <button className="admin-modal-close" onClick={() => setShowEditWP(false)}>x</button>
                            </div>
                            <div className="admin-modal-body">
                                <form onSubmit={updateWorkingPaper}>
                                    <div className="form-group">
                                        <label>Titre</label>
                                        <input
                                            type="text"
                                            value={editWP.title}
                                            onChange={(e) => setEditWP({ ...editWP, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={editWP.description}
                                            onChange={(e) => setEditWP({ ...editWP, description: e.target.value })}
                                            rows="8"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Date limite</label>
                                        <input
                                            type="date"
                                            value={editWP.deadline}
                                            onChange={(e) => setEditWP({ ...editWP, deadline: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Statut</label>
                                        <select
                                            value={editWP.status}
                                            onChange={(e) => setEditWP({ ...editWP, status: e.target.value })}
                                        >
                                            <option value="ouvert">Ouvert</option>
                                            <option value={"cl\u00f4tur\u00e9"}>Cloture</option>
                                        </select>
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowEditWP(false)}>Annuler</button>
                                        <button type="submit" className="btn btn-primary">Enregistrer</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {showCreatePublication && (
                    <div className="admin-modal-overlay" onClick={() => setShowCreatePublication(false)}>
                        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2>Nouvelle publication editoriale</h2>
                                <button className="admin-modal-close" onClick={() => setShowCreatePublication(false)}>x</button>
                            </div>
                            <div className="admin-modal-body">
                                <form onSubmit={createPublication}>
                                    <div className="form-group">
                                        <label>Titre</label>
                                        <input
                                            type="text"
                                            value={publicationForm.title}
                                            onChange={(e) => setPublicationForm({ ...publicationForm, title: e.target.value })}
                                            required
                                            placeholder="Ex : Revue trimestrielle AEGC - Juin 2026"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Resume editorial</label>
                                        <textarea
                                            value={publicationForm.summary}
                                            onChange={(e) => setPublicationForm({ ...publicationForm, summary: e.target.value })}
                                            rows="6"
                                            placeholder="Resume des travaux retenus, points saillants et orientation editoriale"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Fichier PDF</label>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(e) => setPublicationForm({ ...publicationForm, file: e.target.files?.[0] || null })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Statistiques (optionnel)</label>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                            <input
                                                type="number"
                                                min="0"
                                                value={publicationForm.acceptedCount}
                                                onChange={(e) => setPublicationForm({ ...publicationForm, acceptedCount: e.target.value })}
                                                placeholder="Nombre acceptes"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                value={publicationForm.rejectedCount}
                                                onChange={(e) => setPublicationForm({ ...publicationForm, rejectedCount: e.target.value })}
                                                placeholder="Nombre rejetes"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Statut initial</label>
                                        <select
                                            value={publicationForm.status}
                                            onChange={(e) => setPublicationForm({ ...publicationForm, status: e.target.value })}
                                        >
                                            <option value="draft">Brouillon</option>
                                            <option value="published">Publie immediatement</option>
                                        </select>
                                    </div>
                                    <div className="form-actions">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowCreatePublication(false);
                                                resetPublicationForm();
                                            }}
                                        >
                                            Annuler
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={publicationSubmitting}>
                                            {publicationSubmitting ? "Publication..." : "Enregistrer"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal: Details soumission avec sous-onglets */}
                {selectedSubmission && (
                    <div className="admin-modal-overlay" onClick={() => setSelectedSubmission(null)}>
                        <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <div className="admin-modal-title-wrap">
                                    <h2>{selectedSubmission.articleTitle}</h2>
                                    {hasNewVersion(selectedSubmission) && (
                                        <span className="new-version-badge">Nouvelle version</span>
                                    )}
                                </div>
                                <button className="admin-modal-close" onClick={() => setSelectedSubmission(null)}>x</button>
                            </div>
                            <div className="admin-modal-body">
                                {/* Sous-onglets */}
                                <div className="admin-detail-tabs" role="tablist" aria-label="Details de la soumission">
                                    <button
                                        className={`admin-detail-tab ${detailTab === "overview" ? "active" : ""}`}
                                        onClick={() => setDetailTab("overview")}
                                        role="tab"
                                        aria-selected={detailTab === "overview"}
                                    >
                                        Vue generale
                                    </button>
                                    <button
                                        className={`admin-detail-tab ${detailTab === "reviews" ? "active" : ""}`}
                                        onClick={() => setDetailTab("reviews")}
                                        role="tab"
                                        aria-selected={detailTab === "reviews"}
                                    >
                                        Appreciations
                                        <span className="tab-count">{selectedSubmission.reviewRequests?.length || 0}</span>
                                    </button>
                                    <button
                                        className={`admin-detail-tab ${detailTab === "versions" ? "active" : ""}`}
                                        onClick={() => setDetailTab("versions")}
                                        role="tab"
                                        aria-selected={detailTab === "versions"}
                                    >
                                        Versions
                                        <span className="tab-count">{selectedSubmission.versions?.length || 0}</span>
                                    </button>
                                </div>

                                {/* Contenu: Vue generale */}
                                {detailTab === "overview" && (
                                    <>
                                        <div className="admin-modal-section">
                                            <h3>Informations cles</h3>
                                            <div className="sub-modal-meta">
                                                <div className="sub-modal-meta-item">
                                                    <strong>Statut</strong>
                                                    <p>{SUBMISSION_STATUS_LABELS[selectedSubmission.status] || selectedSubmission.status}</p>
                                                </div>
                                                <div className="sub-modal-meta-item">
                                                    <strong>Version courante</strong>
                                                    <p>V{selectedSubmission.currentVersion || 1}</p>
                                                </div>
                                                <div className="sub-modal-meta-item">
                                                    <strong>Soumis le</strong>
                                                    <p>{formatDate(selectedSubmission.createdAt)}</p>
                                                </div>
                                                <div className="sub-modal-meta-item">
                                                    <strong>Dispatcher</strong>
                                                    <p>
                                                        {selectedSubmission.assignedDispatcher
                                                            ? `${selectedSubmission.assignedDispatcher.firstName} ${selectedSubmission.assignedDispatcher.name}`
                                                            : "Non assigne"}
                                                    </p>
                                                </div>
                                            </div>
                                            {hasNewVersion(selectedSubmission) && (
                                                <p className="new-version-note">
                                                    Cette soumission a ete modifiee par l'auteur et attend votre traitement.
                                                </p>
                                            )}
                                        </div>

                                        <div className="admin-modal-section">
                                            <h3>Auteur(s)</h3>
                                            <ul>
                                                {selectedSubmission.authors?.map((author, i) => (
                                                    <li key={i}>
                                                        <strong>{author.name}</strong>
                                                        {author.affiliation ? ` - ${author.affiliation}` : ""}
                                                        {author.email ? ` - ${author.email}` : ""}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="admin-modal-section">
                                            <h3>Resume</h3>
                                            <p>{selectedSubmission.abstract}</p>
                                        </div>

                                        <div className="admin-modal-section">
                                            <h3>Mots-cles</h3>
                                            <p>{selectedSubmission.keywords?.join(", ") || "-"}</p>
                                        </div>

                                        {selectedSubmission.jelCodes?.length > 0 && (
                                            <div className="admin-modal-section">
                                                <h3>Codes JEL</h3>
                                                <p>{selectedSubmission.jelCodes.join(", ")}</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Contenu: Appreciations */}
                                {detailTab === "reviews" && (
                                    <>
                                        {isDispatcher && (
                                            <div className="admin-modal-section">
                                                <h3>Ajouter un commentaire</h3>
                                                <textarea
                                                    className="comment-input-area"
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    rows="4"
                                                    placeholder="Votre retour a l'auteur..."
                                                />
                                                <button
                                                    className="btn btn-primary btn-small"
                                                    onClick={() => addComment(selectedSubmission._id)}
                                                >
                                                    Envoyer
                                                </button>
                                            </div>
                                        )}

                                        {isDispatcher && !["acceptee", "rejetee"].includes(selectedSubmission.status) && (
                                            <div className="admin-modal-section">
                                                <h3>Demander une modification (appreciation)</h3>
                                                <div className="form-group">
                                                    <label>Resume de l&apos;appreciation</label>
                                                    <textarea
                                                        className="comment-input-area"
                                                        rows="3"
                                                        value={revisionSummary}
                                                        onChange={(e) => setRevisionSummary(e.target.value)}
                                                        placeholder="Ex: Bon potentiel, mais la methodologie et la discussion doivent etre renforcees."
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Points a corriger (un point par ligne)</label>
                                                    <textarea
                                                        className="comment-input-area"
                                                        rows="5"
                                                        value={revisionItemsText}
                                                        onChange={(e) => setRevisionItemsText(e.target.value)}
                                                        placeholder="Ex:&#10;Clarifier la question de recherche&#10;Renforcer l'analyse econometrique&#10;Ajouter les limites de l'etude"
                                                    />
                                                </div>
                                                <button
                                                    className="btn btn-primary btn-small"
                                                    disabled={revisionSubmitting}
                                                    onClick={() => requestRevision(selectedSubmission._id)}
                                                >
                                                    {revisionSubmitting ? "Envoi..." : "Envoyer l'appreciation et passer a 'A modifier'"}
                                                </button>
                                            </div>
                                        )}

                                        {selectedSubmission.reviewRequests?.length > 0 && (
                                            <div className="admin-modal-section">
                                                <h3>Historique des appreciations</h3>
                                                <div className="admin-comment-list">
                                                    {[...selectedSubmission.reviewRequests]
                                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                                        .map((request, i) => (
                                                            <div key={request._id || i} className="admin-comment-item">
                                                                <p className="comment-date">
                                                                    {formatDate(request.createdAt)} - {request.createdBy?.name || "Admin"} {request.createdBy?.firstName || ""}
                                                                </p>
                                                                <p className="comment-text"><strong>Resume:</strong> {request.summary}</p>
                                                                {request.items?.length > 0 && (
                                                                    <ul>
                                                                        {request.items.map((item, index) => (
                                                                            <li key={`${index}-${item}`}>{item}</li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                                <p className="comment-date">
                                                                    Statut: {request.status === "open" ? "Ouverte" : "Traitee"}
                                                                    {request.addressedByVersion ? ` (Version ${request.addressedByVersion})` : ""}
                                                                </p>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedSubmission.adminComments?.length > 0 && (
                                            <div className="admin-modal-section">
                                                <h3>Historique des commentaires</h3>
                                                <div className="admin-comment-list">
                                                    {selectedSubmission.adminComments.map((comment, i) => (
                                                        <div key={i} className="admin-comment-item">
                                                            <p className="comment-date">{formatDate(comment.date)}</p>
                                                            <p className="comment-text">{comment.comment}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Contenu: Versions */}
                                {detailTab === "versions" && (
                                    <>
                                        {selectedSubmission.versions?.length > 0 ? (
                                            <div className="admin-modal-section">
                                                <h3>Historique des versions</h3>
                                                <div className="admin-comment-list">
                                                    {[...selectedSubmission.versions]
                                                        .sort((a, b) => (b.versionNumber || 1) - (a.versionNumber || 1))
                                                        .map((version, i) => (
                                                            <div key={version._id || i} className="admin-comment-item">
                                                                <p className="comment-date">
                                                                    Version {version.versionNumber} - {formatDate(version.submittedAt || version.pdfFile?.uploadDate || selectedSubmission.createdAt)}
                                                                </p>
                                                                {version.responseNote && (
                                                                    <p className="comment-text"><strong>Reponse auteur:</strong> {version.responseNote}</p>
                                                                )}
                                                                <button
                                                                    className="btn btn-secondary btn-small"
                                                                    onClick={() => downloadVersionPDF(selectedSubmission._id, version.versionNumber)}
                                                                >
                                                                    Telecharger cette version
                                                                </button>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="admin-empty">
                                                Aucune version disponible pour cette soumission.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminWorkingPapers;
