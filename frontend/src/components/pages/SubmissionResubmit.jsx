import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../hooks/useToast.js";
import { API_BASE_URL } from "../Url";
import { getAuthToken } from "../../utils/auth";
import "../../styles/wp-base.css";
import "../../styles/wp-submission.css";
import "../../styles/wp-user.css";
import "../../styles/wp-components.css";

const PDF_MAX_SIZE_MB = Number(import.meta.env.VITE_PDF_MAX_SIZE_MB) || 10;
const PDF_MAX_SIZE_BYTES = PDF_MAX_SIZE_MB * 1024 * 1024;

function SubmissionResubmit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [responseNote, setResponseNote] = useState("");
    const [pdfFile, setPdfFile] = useState(null);

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate("/login", { state: { from: `/my-submissions/${id}/resubmit` } });
            return;
        }

        fetchSubmission();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchSubmission = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login", { state: { from: `/my-submissions/${id}/resubmit` } });
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Impossible de charger la soumission");
            }

            setSubmission(data);
        } catch (fetchError) {
            setError(fetchError.message);
        } finally {
            setLoading(false);
        }
    };

    const latestReviewRequest = useMemo(() => {
        if (!submission?.reviewRequests || submission.reviewRequests.length === 0) {
            return null;
        }

        const sortedRequests = [...submission.reviewRequests].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        const openRequest = sortedRequests.find((request) => request.status === "open");
        return openRequest || sortedRequests[0];
    }, [submission]);

    const sortedVersions = useMemo(() => {
        if (!submission?.versions) {
            return [];
        }

        return [...submission.versions].sort(
            (a, b) => (b.versionNumber || 1) - (a.versionNumber || 1),
        );
    }, [submission]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        const acceptedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        const acceptedExtensions = [".pdf", ".doc", ".docx"];
        const fileExt = "." + file.name.split(".").pop().toLowerCase();

        if (!acceptedTypes.includes(file.type) || !acceptedExtensions.includes(fileExt)) {
            setError("Seuls les fichiers PDF et Word (.doc, .docx) sont acceptés");
            return;
        }

        if (file.size > PDF_MAX_SIZE_BYTES) {
            setError(`Le fichier ne doit pas dépasser ${PDF_MAX_SIZE_MB} MB`);
            return;
        }

        setPdfFile(file);
        setError("");
    };

    const handleResubmit = async (e) => {
        e.preventDefault();

        if (!pdfFile) {
            setError("Veuillez sélectionner un fichier document (PDF ou Word) pour resoumettre");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const token = getAuthToken();
            const formData = new FormData();
            formData.append("pdf", pdfFile);
            formData.append("responseNote", responseNote);

            const response = await fetch(`${API_BASE_URL}/api/submissions/${id}/resubmit`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            // Le proxy peut rejeter l'envoi avant d'atteindre l'API (413) et
            // répondre en HTML : ne jamais parser du JSON à l'aveugle.
            if (response.status === 413) {
                throw new Error(
                    `Le document est trop volumineux pour être envoyé (maximum ${PDF_MAX_SIZE_MB} MB). Essayez de compresser votre PDF.`
                );
            }

            let data;
            try {
                data = await response.json();
            } catch {
                throw new Error(
                    `Le serveur a renvoyé une réponse inattendue (code ${response.status}). Votre document n'a pas été enregistré.`
                );
            }

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de la resoumission");
            }

            toast.success("Nouvelle version envoyée avec succès");
            navigate("/my-submissions");
        } catch (submitError) {
            toast.error(submitError.message || "Erreur lors de la resoumission");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">Chargement...</div>;
    }

    if (!submission) {
        return <div className="error">Soumission introuvable</div>;
    }

    const canResubmit = submission.status === "revision_requise";

    return (
        <div className="submission-form-container">
            <div className="submission-inner">
                <button className="btn-back" onClick={() => navigate("/my-submissions")}>← Retour à mes soumissions</button>

                <div className="submission-page-header">
                    <h1>Corriger et resoumettre</h1>
                    <p className="submission-wp-title">{submission.articleTitle}</p>
                    <p style={{ marginTop: "0.5rem", color: "#64748b" }}>
                        Appel : {submission.workingPaper?.title}
                    </p>
                </div>

                {!canResubmit && (
                    <div className="error-message" style={{ marginBottom: "1rem" }}>
                        Cette soumission n'est plus en statut "À modifier". La resoumission est donc bloquée.
                    </div>
                )}

                {error && <div className="error-message" style={{ marginBottom: "1rem" }}>{error}</div>}

                {latestReviewRequest && (
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="form-section-number">1</span>
                            <h3>Appréciation de l&apos;administration</h3>
                        </div>
                        <div className="form-section-body">
                            <p style={{ marginTop: 0 }}><strong>Résumé :</strong> {latestReviewRequest.summary}</p>
                            {latestReviewRequest.items?.length > 0 && (
                                <div>
                                    <p style={{ marginBottom: "0.5rem" }}><strong>Points à corriger :</strong></p>
                                    <ul style={{ marginTop: 0 }}>
                                        {latestReviewRequest.items.map((item, index) => (
                                            <li key={`${index}-${item}`}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="form-section">
                    <div className="form-section-header">
                        <span className="form-section-number">2</span>
                        <h3>Historique des versions</h3>
                    </div>
                    <div className="form-section-body">
                        {sortedVersions.length === 0 ? (
                            <p style={{ margin: 0, color: "#64748b" }}>Aucune version enregistrée.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {sortedVersions.map((version) => (
                                    <div key={version._id || version.versionNumber} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.85rem 1rem" }}>
                                        <p style={{ margin: 0, fontWeight: 600 }}>Version {version.versionNumber}</p>
                                        <p style={{ margin: "0.35rem 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                                            Envoyée le {new Date(version.submittedAt || version.pdfFile?.uploadDate || submission.createdAt).toLocaleDateString("fr-FR")}
                                        </p>
                                        {version.responseNote && (
                                            <p style={{ margin: "0.45rem 0 0", color: "#1f2937" }}>
                                                <strong>Réponse auteur :</strong> {version.responseNote}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleResubmit} className="submission-form">
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="form-section-number">3</span>
                            <h3>Votre réponse et nouveau PDF</h3>
                        </div>
                        <div className="form-section-body">
                            <div className="form-group">
                                <label htmlFor="responseNote">Réponse aux remarques (optionnel)</label>
                                <textarea
                                    id="responseNote"
                                    rows="5"
                                    value={responseNote}
                                    onChange={(e) => setResponseNote(e.target.value)}
                                    placeholder="Expliquez brièvement les corrections apportées..."
                                />
                            </div>

                            <div className="pdf-drop-zone">
                                <input
                                    type="file"
                                    id="pdf-resubmit"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleFileChange}
                                    disabled={!canResubmit}
                                    required
                                />
                                <span className="pdf-drop-icon">📎</span>
                                <p className="pdf-drop-label">Sélectionnez la nouvelle version du document</p>
                                <p className="pdf-drop-hint">Formats acceptés: PDF, Word (.doc, .docx) — maximum {PDF_MAX_SIZE_MB} MB</p>
                            </div>

                            {pdfFile && (
                                <div className="file-info">
                                    <span>✓</span>
                                    <span>{pdfFile.name} — {(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate("/my-submissions")}>Annuler</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting || !canResubmit}>
                            {submitting ? "Envoi en cours..." : "Resoumettre la nouvelle version"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SubmissionResubmit;
