import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./Url";
import { getAuthToken } from "../utils/auth";
import "../styles/wp-base.css";
import "../styles/wp-user.css";
import "../styles/wp-components.css";

function MySubmissions() {
    const [submissions, setSubmissions] = useState([]);
    const [unreadComments, setUnreadComments] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = getAuthToken();
        const user = localStorage.getItem("user");

        // Ne rediriger que si vraiment pas de token ET pas d'utilisateur
        if (!token && !user) {
            navigate("/login");
            return;
        }

        fetchMySubmissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchMySubmissions = async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                navigate("/login");
                return;
            }
            const response = await fetch(`${API_BASE_URL}/api/my-submissions`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401 || response.status === 403) {
                // Token invalide ou expiré
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
                return;
            }

            const data = await response.json();
            setSubmissions(data.submissions);
            setUnreadComments(data.unreadComments);
        } catch (error) {
            console.error("Erreur:", error);
        } finally {
            setLoading(false);
        }
    };

    const viewDetails = async (submissionId) => {
        try {
            const token = getAuthToken();
            const response = await fetch(
                `${API_BASE_URL}/api/submissions/${submissionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            setSelectedSubmission(data);

            // Marquer les commentaires comme lus
            await fetch(
                `${API_BASE_URL}/api/submissions/${submissionId}/read-comments`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Recharger pour mettre à jour le compteur
            fetchMySubmissions();
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

    const getStatusClass = (status) => {
        const map = {
            reçue: "status-reçue",
            en_attente: "status-en_attente",
            traitée: "status-traitée",
            terminée: "status-terminée",
        };
        return map[status] || "";
    };

    const getStatusLabel = (status) => {
        const labels = {
            reçue: "Reçue",
            en_attente: "En attente",
            traitée: "Traitée",
            terminée: "Terminée",
        };
        return labels[status] || status;
    };

    const getAccentClass = (status) => `accent-${status}`;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    if (loading) {
        return <div className="loading">Chargement...</div>;
    }

    return (
        <div className="my-submissions-container">
            <div className="my-submissions-inner">

                <div className="subs-page-header">
                    <h1>Mes Soumissions</h1>
                    {unreadComments > 0 && (
                        <span className="notification-badge">
                            {unreadComments} nouveau{unreadComments > 1 ? "x" : ""} commentaire{unreadComments > 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {submissions.length === 0 ? (
                    <div className="no-submissions">
                        <p>Vous n&apos;avez pas encore soumis de travaux.</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate("/working-papers")}
                        >
                            Voir les appels ouverts
                        </button>
                    </div>
                ) : (
                    <div className="submissions-grid">
                        {submissions.map((submission) => {
                            const newComments = submission.adminComments.filter(
                                (c) => !c.read
                            ).length;

                            return (
                                <div key={submission._id} className="submission-card">
                                    <div className={`sub-card-accent ${getAccentClass(submission.status)}`} />
                                    <div className="sub-card-inner">
                                        <div className="submission-header">
                                            <h3>{submission.articleTitle}</h3>
                                            <span className={`sub-status ${getStatusClass(submission.status)}`}>
                                                {getStatusLabel(submission.status)}
                                            </span>
                                        </div>

                                        <div className="submission-body">
                                            <p className="sub-wp-name">
                                                {submission.workingPaper?.title}
                                            </p>
                                            <p className="submission-date">
                                                Soumis le {formatDate(submission.createdAt)}
                                            </p>
                                            {newComments > 0 && (
                                                <span className="new-comments-badge">
                                                    {newComments} nouveau{newComments > 1 ? "x" : ""} commentaire{newComments > 1 ? "s" : ""}
                                                </span>
                                            )}
                                        </div>

                                        <div className="submission-footer">
                                            <button
                                                className="btn btn-secondary btn-small"
                                                onClick={() => viewDetails(submission._id)}
                                            >
                                                Voir détails
                                            </button>
                                            <button
                                                className="btn btn-primary btn-small"
                                                onClick={() => downloadPDF(submission._id)}
                                            >
                                                Télécharger PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            {/* Modal de détails */}
            {selectedSubmission && (
                <div className="sub-modal-overlay" onClick={() => setSelectedSubmission(null)}>
                    <div className="sub-modal" onClick={(e) => e.stopPropagation()}>

                        <div className="sub-modal-header">
                            <h2>{selectedSubmission.articleTitle}</h2>
                            <button className="sub-modal-close" onClick={() => setSelectedSubmission(null)}>×</button>
                        </div>

                        <div className="sub-modal-body">
                            <div className="sub-modal-meta">
                                <div className="sub-modal-meta-item">
                                    <strong>Statut</strong>
                                    <p>{getStatusLabel(selectedSubmission.status)}</p>
                                </div>
                                <div className="sub-modal-meta-item">
                                    <strong>Soumis le</strong>
                                    <p>{formatDate(selectedSubmission.createdAt)}</p>
                                </div>
                                <div className="sub-modal-meta-item">
                                    <strong>Appel</strong>
                                    <p>{selectedSubmission.workingPaper?.title}</p>
                                </div>
                            </div>

                            <div className="sub-modal-section">
                                <h3>Auteurs</h3>
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

                            <div className="sub-modal-section">
                                <h3>Mots-clés</h3>
                                <div className="keyword-pills">
                                    {selectedSubmission.keywords.map((kw, i) => (
                                        <span key={i} className="keyword-pill">{kw}</span>
                                    ))}
                                </div>
                            </div>

                            {selectedSubmission.jelCodes.length > 0 && (
                                <div className="sub-modal-section">
                                    <h3>Codes JEL</h3>
                                    <p>{selectedSubmission.jelCodes.join(", ")}</p>
                                </div>
                            )}

                            <div className="sub-modal-section">
                                <h3>Résumé</h3>
                                <p>{selectedSubmission.abstract}</p>
                            </div>

                            {selectedSubmission.adminComments.length > 0 && (
                                <div className="sub-modal-section">
                                    <h3>Commentaires de l&apos;administrateur</h3>
                                    {selectedSubmission.adminComments.map((comment, i) => (
                                        <div key={i} className="admin-comment-item">
                                            <p className="comment-date">
                                                {formatDate(comment.date)}{comment.commentedBy?.name ? ` · ${comment.commentedBy.name}` : ""}
                                            </p>
                                            <p className="comment-text">{comment.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MySubmissions;
