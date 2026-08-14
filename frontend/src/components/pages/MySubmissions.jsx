import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast.js";
import ConfirmDialog from "../common/ConfirmDialog";
import { API_BASE_URL } from "../Url";
import { getAuthToken } from "../../utils/auth";
import "../../styles/wp-base.css";
import "../../styles/wp-user.css";
import "../../styles/wp-components.css";

const LEGACY_STATUS_TO_NEW = {
    "reçue": "soumise",
    en_attente: "en_revision",
    "traitée": "revision_requise",
    "terminée": "acceptee",
};

const normalizeStatus = (status) => LEGACY_STATUS_TO_NEW[status] || status;

function MySubmissions() {
    const [submissions, setSubmissions] = useState([]);
    const [unreadComments, setUnreadComments] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
    const openConfirm = ({ title, message, onConfirm, type = 'danger' }) => setConfirmState({ isOpen: true, title, message, onConfirm, type });
    const navigate = useNavigate();
    const toast = useToast();

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
            const normalizedSubmissions = (data.submissions || []).map((submission) => ({
                ...submission,
                status: normalizeStatus(submission.status),
            }));

            setSubmissions(normalizedSubmissions);
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
            setSelectedSubmission({
                ...data,
                status: normalizeStatus(data.status),
            });

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

    const downloadVersionPDF = (submissionId, versionNumber) => {
        const token = getAuthToken();
        window.open(
            `${API_BASE_URL}/api/submissions/${submissionId}/versions/${versionNumber}/download?token=${token}`,
            "_blank"
        );
    };

    const deleteSubmission = async (submissionId, articleTitle) => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de la suppression");
            }

            if (selectedSubmission?._id === submissionId) {
                setSelectedSubmission(null);
            }

            setSubmissions((current) => current.filter((submission) => submission._id !== submissionId));
            setUnreadComments((current) => Math.max(0, current - 1));
            toast.success(data.message || "Soumission supprimée");
        } catch (error) {
            toast.error(error.message || "Erreur lors de la suppression");
        }
    };

    const askDeleteSubmission = (submissionId, articleTitle) => {
        openConfirm({
            title: 'Supprimer la soumission',
            message: `Supprimer définitivement la soumission "${articleTitle}" ?\n\nCette action est irréversible.`,
            onConfirm: () => deleteSubmission(submissionId, articleTitle),
            type: 'danger',
        });
    };

    const getStatusClass = (status) => {
        const normalizedStatus = normalizeStatus(status);
        const map = {
            soumise: "status-soumise",
            en_revision: "status-en_revision",
            revision_requise: "status-revision_requise",
            rejetee: "status-rejetee",
            acceptee: "status-acceptee",
        };
        return map[normalizedStatus] || "";
    };

    const getStatusLabel = (status) => {
        const normalizedStatus = normalizeStatus(status);
        const labels = {
            soumise: "Soumise",
            en_revision: "En révision",
            revision_requise: "À modifier",
            rejetee: "Rejetée",
            acceptee: "Acceptée",
        };
        return labels[normalizedStatus] || status;
    };

    const getAccentClass = (status) => `accent-${normalizeStatus(status)}`;

    const getLatestReviewRequest = (submission) => {
        if (!submission?.reviewRequests || submission.reviewRequests.length === 0) {
            return null;
        }

        const sortedRequests = [...submission.reviewRequests].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        const openRequest = sortedRequests.find((request) => request.status === "open");
        return openRequest || sortedRequests[0];
    };

    const getSortedVersions = (submission) => {
        if (!submission?.versions) {
            return [];
        }

        return [...submission.versions].sort(
            (a, b) => (b.versionNumber || 1) - (a.versionNumber || 1),
        );
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) {
            return "-";
        }

        return parsed.toLocaleDateString("fr-FR", {
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
                                            {normalizeStatus(submission.status) === "soumise" && (
                                                <button
                                                    className="btn btn-danger btn-small"
                                                    onClick={() => askDeleteSubmission(submission._id, submission.articleTitle)}
                                                >
                                                    Supprimer
                                                </button>
                                            )}
                                            {normalizeStatus(submission.status) === "revision_requise" && (
                                                <button
                                                    className="btn btn-primary btn-small"
                                                    onClick={() => navigate(`/my-submissions/${submission._id}/resubmit`)}
                                                >
                                                    Corriger et resoumettre
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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

                            {getLatestReviewRequest(selectedSubmission) && (
                                <div className="sub-modal-section">
                                    <h3>Dernière appréciation de l&apos;administration</h3>
                                    <p><strong>Résumé :</strong> {getLatestReviewRequest(selectedSubmission).summary}</p>
                                    {getLatestReviewRequest(selectedSubmission).items?.length > 0 && (
                                        <ul>
                                            {getLatestReviewRequest(selectedSubmission).items.map((item, index) => (
                                                <li key={`${index}-${item}`}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                    {normalizeStatus(selectedSubmission.status) === "revision_requise" && (
                                        <button
                                            className="btn btn-primary btn-small"
                                            onClick={() => navigate(`/my-submissions/${selectedSubmission._id}/resubmit`)}
                                        >
                                            Corriger et resoumettre
                                        </button>
                                    )}
                                </div>
                            )}

                            {getSortedVersions(selectedSubmission).length > 0 && (
                                <div className="sub-modal-section">
                                    <h3>Historique des versions</h3>
                                    {getSortedVersions(selectedSubmission).map((version) => (
                                        <div key={version._id || version.versionNumber} className="admin-comment-item">
                                            <p className="comment-date">
                                                Version {version.versionNumber} · {formatDate(version.submittedAt || version.pdfFile?.uploadDate || selectedSubmission.createdAt)}
                                            </p>
                                            {version.responseNote && (
                                                <p className="comment-text"><strong>Réponse auteur :</strong> {version.responseNote}</p>
                                            )}
                                            <button
                                                className="btn btn-secondary btn-small"
                                                onClick={() => downloadVersionPDF(selectedSubmission._id, version.versionNumber)}
                                            >
                                                Télécharger cette version
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

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

                            {normalizeStatus(selectedSubmission.status) === "soumise" && (
                                <div className="sub-modal-section">
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => askDeleteSubmission(selectedSubmission._id, selectedSubmission.articleTitle)}
                                    >
                                        Supprimer cette soumission
                                    </button>
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
