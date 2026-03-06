import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast.js";
import { API_BASE_URL } from "./Url";
import { getAuthToken } from "../utils/auth";
import "../styles/wp-base.css";
import "../styles/wp-admin.css";
import "../styles/wp-components.css";

function AdminWorkingPapers() {
    const toast = useToast();
    const [tab, setTab] = useState("workingPapers"); // workingPapers | submissions
    const [workingPapers, setWorkingPapers] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [filteredSubmissions, setFilteredSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [showCreateWP, setShowCreateWP] = useState(false);
    const [showEditWP, setShowEditWP] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
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

    useEffect(() => {
        const token = getAuthToken();
        const userStr = localStorage.getItem("user");

        // Ne rediriger que si vraiment pas connecté
        if (!token && !userStr) {
            navigate("/");
            return;
        }

        const user = JSON.parse(userStr || "{}");
        if (user.role && user.role !== "admin") {
            navigate("/");
            return;
        }

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Filtrer les soumissions
        if (filterStatus === "all") {
            setFilteredSubmissions(submissions);
        } else {
            setFilteredSubmissions(
                submissions.filter((s) => s.status === filterStatus)
            );
        }
    }, [filterStatus, submissions]);

    const fetchData = async () => {
        try {
            const token = getAuthToken();

            // Fetch Working Papers
            const wpResponse = await fetch(`${API_BASE_URL}/api/working-papers`);
            const wpData = await wpResponse.json();
            setWorkingPapers(wpData);

            // Fetch Submissions
            const subResponse = await fetch(`${API_BASE_URL}/api/admin/submissions`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (subResponse.status === 401 || subResponse.status === 403) {
                // Token invalide ou pas admin
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/");
                return;
            }

            const subData = await subResponse.json();
            setSubmissions(subData);
            setFilteredSubmissions(subData);
        } catch (error) {
            console.error("Erreur:", error);
        } finally {
            setLoading(false);
        }
    };

    const createWorkingPaper = async (e) => {
        e.preventDefault();

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
            } else {
                const errorData = await response.json();
                toast.error(`Erreur: ${errorData.error || "Erreur inconnue"}`);
            }
        } catch (error) {
            toast.error(`Erreur lors de la création: ${error.message}`);
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
                toast.success("Working Paper mis à jour avec succès !");
            }
        } catch (error) {
            console.error("Erreur:", error);
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const deleteWorkingPaper = async (wpId, wpTitle) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${wpTitle}" ?\n\n⚠️ Cette action supprimera aussi toutes les soumissions associées!`)) {
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
                toast.success("Working Paper supprimé avec succès !");
            }
        } catch (error) {
            console.error("Erreur:", error);
            toast.error("Erreur lors de la suppression");
        }
    };

    const changeSubmissionStatus = async (submissionId, newStatus) => {
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

            fetchData();
        } catch (error) {
            console.error("Erreur:", error);
        }
    };

    const toggleVisibility = async (submissionId, currentValue) => {
        try {
            const token = getAuthToken();
            await fetch(
                `${API_BASE_URL}/api/admin/submissions/${submissionId}/visibility`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ isPublicInHistory: !currentValue }),
                }
            );

            fetchData();
        } catch (error) {
            console.error("Erreur:", error);
        }
    };

    const addComment = async (submissionId) => {
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
            fetchData();

            // Refresh soumission sélectionnée si elle existe
            if (selectedSubmission && selectedSubmission._id === submissionId) {
                const updatedSub = submissions.find((s) => s._id === submissionId);
                setSelectedSubmission(updatedSub);
            }
        } catch (error) {
            console.error("Erreur:", error);
        }
    };

    const downloadPDF = (submissionId) => {
        const token = getAuthToken();
        window.open(
            `${API_BASE_URL}/api/submissions/${submissionId}/download?token=${token}`,
            "_blank"
        );
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("fr-FR");
    };

    const countByStatus = (status) => {
        return submissions.filter((s) => s.status === status).length;
    };

    if (loading) {
        return <div className="loading">Chargement...</div>;
    }

    return (
        <div className="admin-wp-container">
            <div className="admin-wp-inner">

                <h1 className="admin-page-title">Gestion Working Papers</h1>

                {/* Stats */}
                <div className="admin-stats">
                    <div className="admin-stat-card">
                        <div className="stat-value">{workingPapers.length}</div>
                        <div className="stat-label">Appels créés</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-value">{workingPapers.filter(w => w.status === "ouvert").length}</div>
                        <div className="stat-label">Ouverts</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-value">{submissions.length}</div>
                        <div className="stat-label">Soumissions</div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-value">{countByStatus("reçue")}</div>
                        <div className="stat-label">Non traitées</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="admin-tab-bar">
                    <button
                        className={`admin-tab-btn ${tab === "workingPapers" ? "active" : ""}`}
                        onClick={() => setTab("workingPapers")}
                    >
                        Working Papers
                        <span className="tab-count">{workingPapers.length}</span>
                    </button>
                    <button
                        className={`admin-tab-btn ${tab === "submissions" ? "active" : ""}`}
                        onClick={() => setTab("submissions")}
                    >
                        Soumissions
                        <span className="tab-count">{submissions.length}</span>
                    </button>
                </div>

                {/* TAB: Working Papers */}
                {tab === "workingPapers" && (
                    <div>
                        <div className="tab-toolbar">
                            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                                {workingPapers.length} appel{workingPapers.length > 1 ? "s" : ""}
                            </span>
                            <button
                                className="btn btn-primary btn-small"
                                onClick={() => setShowCreateWP(true)}
                            >
                                + Nouvel appel
                            </button>
                        </div>

                        <div className="wp-table">
                            {workingPapers.map((wp) => (
                                <div key={wp._id} className="admin-wp-card">
                                    <div className={`admin-wp-card-accent ${wp.status === "ouvert" ? "ouvert" : "cloture"}`} />
                                    <div className="admin-wp-card-inner">
                                        <div className="admin-wp-info">
                                            <h3>{wp.title}</h3>
                                            <div className="admin-wp-meta">
                                                <span className="meta-chip">Deadline : <strong>{formatDate(wp.deadline)}</strong></span>
                                                <span className="meta-chip">
                                                    <span className={`wp-status ${wp.status === "ouvert" ? "open" : "closed"}`}>
                                                        {wp.status === "ouvert" ? "Ouvert" : "Clôturé"}
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
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: Soumissions */}
                {tab === "submissions" && (
                    <div>
                        <div className="tab-toolbar">
                            <div className="filters">
                                <button className={filterStatus === "all" ? "active" : ""} onClick={() => setFilterStatus("all")}>
                                    Toutes ({submissions.length})
                                </button>
                                <button className={filterStatus === "reçue" ? "active" : ""} onClick={() => setFilterStatus("reçue")}>
                                    Reçues ({countByStatus("reçue")})
                                </button>
                                <button className={filterStatus === "en_attente" ? "active" : ""} onClick={() => setFilterStatus("en_attente")}>
                                    En attente ({countByStatus("en_attente")})
                                </button>
                                <button className={filterStatus === "traitée" ? "active" : ""} onClick={() => setFilterStatus("traitée")}>
                                    Traitées ({countByStatus("traitée")})
                                </button>
                                <button className={filterStatus === "terminée" ? "active" : ""} onClick={() => setFilterStatus("terminée")}>
                                    Terminées ({countByStatus("terminée")})
                                </button>
                            </div>
                        </div>

                        <div className="submissions-table">
                            {filteredSubmissions.map((sub) => (
                                <div key={sub._id} className="submission-row">
                                    <div className={`sub-row-accent accent-${sub.status}`} />
                                    <div className="sub-row-inner">
                                        <div className="sub-row-info">
                                            <h3>{sub.articleTitle}</h3>
                                            <div className="sub-row-meta">
                                                <span>{sub.submittedBy?.name} {sub.submittedBy?.firstName}</span>
                                                <span>{sub.submittedBy?.email}</span>
                                                <span>{sub.workingPaper?.title}</span>
                                                <span>{formatDate(sub.createdAt)}</span>
                                            </div>
                                        </div>

                                        <div className="sub-row-actions">
                                            <select
                                                className="sub-status-select"
                                                value={sub.status}
                                                onChange={(e) => changeSubmissionStatus(sub._id, e.target.value)}
                                            >
                                                <option value="reçue">Reçue</option>
                                                <option value="en_attente">En attente</option>
                                                <option value="traitée">Traitée</option>
                                                <option value="terminée">Terminée</option>
                                            </select>

                                            <button
                                                className="btn btn-secondary btn-small"
                                                onClick={() => setSelectedSubmission(sub)}
                                            >
                                                Détails
                                            </button>

                                            <button
                                                className="btn btn-primary btn-small"
                                                onClick={() => downloadPDF(sub._id)}
                                            >
                                                PDF
                                            </button>

                                            <label className="visibility-toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={sub.isPublicInHistory}
                                                    onChange={() => toggleVisibility(sub._id, sub.isPublicInHistory)}
                                                />
                                                Historique public
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Modal: Créer WP */}
                {showCreateWP && (
                    <div className="admin-modal-overlay" onClick={() => setShowCreateWP(false)}>
                        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2>Créer un appel à contribution</h2>
                                <button className="admin-modal-close" onClick={() => setShowCreateWP(false)}>×</button>
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
                                            placeholder="Ex : Appel à contributions — Économie comportementale"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description (texte complet de l&apos;appel)</label>
                                        <textarea
                                            value={newWP.description}
                                            onChange={(e) => setNewWP({ ...newWP, description: e.target.value })}
                                            rows="8"
                                            required
                                            placeholder="Présentation de l'appel, thématiques, consignes..."
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
                                        <button type="submit" className="btn btn-primary">Créer l&apos;appel</button>
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
                                <button className="admin-modal-close" onClick={() => setShowEditWP(false)}>×</button>
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
                                            <option value="clôturé">Clôturé</option>
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

                {/* Modal: Détails soumission */}
                {selectedSubmission && (
                    <div className="admin-modal-overlay" onClick={() => setSelectedSubmission(null)}>
                        <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2>{selectedSubmission.articleTitle}</h2>
                                <button className="admin-modal-close" onClick={() => setSelectedSubmission(null)}>×</button>
                            </div>
                            <div className="admin-modal-body">
                                <div className="admin-modal-section">
                                    <h3>Auteur(s)</h3>
                                    <ul>
                                        {selectedSubmission.authors.map((author, i) => (
                                            <li key={i}>
                                                <strong>{author.name}</strong>
                                                {author.affiliation ? ` — ${author.affiliation}` : ""}
                                                {author.email ? ` · ${author.email}` : ""}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="admin-modal-section">
                                    <h3>Résumé</h3>
                                    <p>{selectedSubmission.abstract}</p>
                                </div>

                                <div className="admin-modal-section">
                                    <h3>Mots-clés</h3>
                                    <p>{selectedSubmission.keywords.join(", ")}</p>
                                </div>

                                {selectedSubmission.jelCodes.length > 0 && (
                                    <div className="admin-modal-section">
                                        <h3>Codes JEL</h3>
                                        <p>{selectedSubmission.jelCodes.join(", ")}</p>
                                    </div>
                                )}

                                <div className="admin-modal-section">
                                    <h3>Ajouter un commentaire</h3>
                                    <textarea
                                        className="comment-input-area"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        rows="4"
                                        placeholder="Votre retour à l'auteur..."
                                    />
                                    <button
                                        className="btn btn-primary btn-small"
                                        onClick={() => addComment(selectedSubmission._id)}
                                    >
                                        Envoyer
                                    </button>
                                </div>

                                {selectedSubmission.adminComments.length > 0 && (
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
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default AdminWorkingPapers;
