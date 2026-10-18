import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast.js";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../Url";
import { getAuthToken } from "../../utils/auth";
import "../../styles/wp-base.css";
import "../../styles/wp-submission.css";
import "../../styles/wp-components.css";

const PDF_MAX_SIZE_MB = Number(import.meta.env.VITE_PDF_MAX_SIZE_MB) || 10;
const PDF_MAX_SIZE_BYTES = PDF_MAX_SIZE_MB * 1024 * 1024;

function SubmissionForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { t } = useTranslation();
    const [wp, setWp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        articleTitle: "",
        keywords: "",
        abstract: "",
        publicationJournal: "",
        publicationNumber: "",
    });

    const [authors, setAuthors] = useState([
        { name: "", affiliation: "", email: "" },
    ]);

    const [pdfFile, setPdfFile] = useState(null);

    useEffect(() => {
        // Vérifier si l'utilisateur est connecté (chercher dans localStorage ET sessionStorage)
        const token = getAuthToken();
        const user = localStorage.getItem("user");

        // Ne rediriger que si vraiment pas de token ET pas d'utilisateur
        if (!token && !user) {
            navigate("/login", { state: { from: `/working-papers/${id}/submit` } });
            return;
        }

        fetchWorkingPaper();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchWorkingPaper = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/working-papers/${id}`);

            if (response.status === 401 || response.status === 403) {
                // Token invalide - rediriger vers login
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login", { state: { from: `/working-papers/${id}/submit` } });
                return;
            }

            const data = await response.json();
            setWp(data);
        } catch (error) {
            console.error("Erreur:", error);
            setError(t("submissions.loadCallError"));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleAuthorChange = (index, field, value) => {
        const newAuthors = [...authors];
        newAuthors[index][field] = value;
        setAuthors(newAuthors);
    };

    const addAuthor = () => {
        setAuthors([...authors, { name: "", affiliation: "", email: "" }]);
    };

    const removeAuthor = (index) => {
        if (authors.length > 1) {
            setAuthors(authors.filter((_, i) => i !== index));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const acceptedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
            const acceptedExtensions = [".pdf", ".doc", ".docx"];
            const fileExt = "." + file.name.split(".").pop().toLowerCase();

            if (!acceptedTypes.includes(file.type) || !acceptedExtensions.includes(fileExt)) {
                setError(t("submissions.invalidFileType"));
                return;
            }
            if (file.size > PDF_MAX_SIZE_BYTES) {
                setError(t("submissions.fileTooLarge", { size: PDF_MAX_SIZE_MB }));
                return;
            }
            setPdfFile(file);
            setError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            // Chercher le token dans localStorage ET sessionStorage
            const token = getAuthToken();
            const user = localStorage.getItem("user");

            console.log("DEBUG Soumission - Token présent:", !!token);

            // Ne rediriger que si vraiment pas connecté
            if (!token && !user) {
                toast.warning(t("submissions.loginRequired"));
                navigate("/login", { state: { from: `/working-papers/${id}/submit` } });
                return;
            }

            // Vérifier que le token est valide avant d'envoyer
            if (!token || token === "" || token === "null" || token === "undefined") {
                console.error("Token invalide détecté:", token);
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                localStorage.removeItem("user");
                sessionStorage.removeItem("user");
                toast.error(t("submissions.invalidSession"));
                navigate("/login", { state: { from: `/working-papers/${id}/submit` } });
                return;
            }

            // Vérifier les champs requis
            if (!formData.articleTitle || !formData.abstract || !pdfFile) {
                toast.error(t("submissions.requiredFields"));
                return;
            }

            // Vérifier qu'au moins un auteur est renseigné
            if (!authors[0].name || !authors[0].email) {
                toast.error(t("submissions.authorRequired"));
                return;
            }

            setSubmitting(true);

            // Préparer le FormData
            const submitData = new FormData();
            submitData.append("workingPaperId", id);
            submitData.append("articleTitle", formData.articleTitle);
            submitData.append("keywords", formData.keywords);
            submitData.append("abstract", formData.abstract);
            submitData.append("authors", JSON.stringify(authors));
            submitData.append("pdf", pdfFile);

            // Ajouter publication si renseigné
            if (formData.publicationJournal || formData.publicationNumber) {
                submitData.append(
                    "publication",
                    JSON.stringify({
                        journal: formData.publicationJournal,
                        number: formData.publicationNumber,
                    })
                );
            }

            const response = await fetch(`${API_BASE_URL}/api/submissions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: submitData,
            });

            // Gérer les erreurs d'authentification avant de parser le JSON
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                localStorage.removeItem("user");
                sessionStorage.removeItem("user");
                toast.error(t("submissions.sessionExpired"));
                navigate("/login", { state: { from: `/working-papers/${id}/submit` } });
                return;
            }

            // Le proxy peut rejeter l'envoi avant d'atteindre l'API (413) et
            // répondre en HTML : ne jamais parser du JSON à l'aveugle.
            if (response.status === 413) {
                throw new Error(
                    t("submissions.uploadTooLarge", { size: PDF_MAX_SIZE_MB })
                );
            }

            let data;
            try {
                data = await response.json();
            } catch {
                throw new Error(
                    t("submissions.unexpectedResponse", { status: response.status })
                );
            }

            if (!response.ok) {
                throw new Error(data.error || t("submissions.submitError"));
            }

            setSuccess(true);
            setTimeout(() => {
                navigate("/my-submissions");
            }, 2000);
        } catch (err) {
            toast.error(err.message || t("submissions.submitError"));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">{t("submissions.loading")}</div>;
    }

    if (!wp) {
        return <div className="error">{t("submissions.notFound")}</div>;
    }

    if (success) {
        return (
            <div className="submission-form-container">
                <div className="submission-success">
                    <div className="submission-success-icon">✓</div>
                    <h2>{t("submissions.successTitle")}</h2>
                    <p>{t("submissions.successMessage")}</p>
                    <p>{t("submissions.successNotification")}</p>
                    <p className="redirect-hint">{t("submissions.redirecting")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="submission-form-container">
            <div className="submission-inner">
                <button className="btn-back" onClick={() => navigate(`/working-papers/${id}`)}
                >
                    {t("submissions.backToDetails")}
                </button>

                <div className="submission-page-header">
                    <h1>{t("submissions.submitWork")}</h1>
                    <p className="submission-wp-title">{wp.title}</p>
                    {Array.isArray(wp.jelCodes) && wp.jelCodes.length > 0 && (
                        <p className="submission-wp-title">
                            {t("submissions.callJelCodes", { codes: wp.jelCodes.join(", ") })}
                        </p>
                    )}
                </div>

                {error && <div className="error-message" style={{ marginBottom: "1rem" }}>{error}</div>}

                <form onSubmit={handleSubmit} className="submission-form">

                    {/* Section 1 — Article */}
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="form-section-number">1</span>
                            <h3>{t("submissions.articleInformation")}</h3>
                        </div>
                        <div className="form-section-body">
                            <div className="form-group">
                                <label htmlFor="articleTitle">
                                    {t("submissions.articleTitle")} <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="articleTitle"
                                    name="articleTitle"
                                    value={formData.articleTitle}
                                    onChange={handleInputChange}
                                    required
                                    placeholder={t("submissions.articleTitlePlaceholder")}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="keywords">{t("submissions.keywords")}</label>
                                <input
                                    type="text"
                                    id="keywords"
                                    name="keywords"
                                    value={formData.keywords}
                                    onChange={handleInputChange}
                                    placeholder={t("submissions.keywordsPlaceholder")}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="abstract">
                                    {t("submissions.abstract")} <span className="required">*</span>
                                </label>
                                <textarea
                                    id="abstract"
                                    name="abstract"
                                    value={formData.abstract}
                                    onChange={handleInputChange}
                                    required
                                    rows="8"
                                    placeholder={t("submissions.abstractPlaceholder")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2 — Auteurs */}
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="form-section-number">2</span>
                            <h3>{t("submissions.authors")} <span className="required">*</span></h3>
                        </div>
                        <div className="form-section-body">
                            {authors.map((author, index) => (
                                <div key={index} className="author-group">
                                    <div className="author-header">
                                        <h4>{t("submissions.authorNumber", { number: index + 1 })}</h4>
                                        {authors.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-small"
                                                onClick={() => removeAuthor(index)}
                                            >
                                                {t("submissions.remove")}
                                            </button>
                                        )}
                                    </div>
                                    <div className="author-fields">
                                        <div className="form-group">
                                            <label>{t("submissions.fullName")}</label>
                                            <input
                                                type="text"
                                                value={author.name}
                                                onChange={(e) => handleAuthorChange(index, "name", e.target.value)}
                                                required={index === 0}
                                                placeholder={t("submissions.fullNamePlaceholder")}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>{t("submissions.affiliation")}</label>
                                            <input
                                                type="text"
                                                value={author.affiliation}
                                                onChange={(e) => handleAuthorChange(index, "affiliation", e.target.value)}
                                                placeholder={t("submissions.affiliationPlaceholder")}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>{t("submissions.email")}</label>
                                            <input
                                                type="email"
                                                value={author.email}
                                                onChange={(e) => handleAuthorChange(index, "email", e.target.value)}
                                                required={index === 0}
                                                placeholder={t("submissions.emailPlaceholder")}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn btn-secondary btn-small"
                                onClick={addAuthor}
                            >
                                {t("submissions.addCoauthor")}
                            </button>
                        </div>
                    </div>

                    {/* Section 3 — Publication (optionnel) */}
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="form-section-number">3</span>
                            <h3>{t("submissions.existingPublication")} <span style={{ fontWeight: 400, color: "#9ca3af" }}>({t("submissions.optional")})</span></h3>
                        </div>
                        <div className="form-section-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="publicationJournal">{t("submissions.journalName")}</label>
                                    <input
                                        type="text"
                                        id="publicationJournal"
                                        name="publicationJournal"
                                        value={formData.publicationJournal}
                                        onChange={handleInputChange}
                                        placeholder={t("submissions.journalPlaceholder")}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="publicationNumber">{t("submissions.volumeNumber")}</label>
                                    <input
                                        type="text"
                                        id="publicationNumber"
                                        name="publicationNumber"
                                        value={formData.publicationNumber}
                                        onChange={handleInputChange}
                                        placeholder={t("submissions.volumePlaceholder")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4 — Document */}
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="form-section-number">4</span>
                            <h3>{t("submissions.document")} <span className="required">*</span></h3>
                        </div>
                        <div className="form-section-body">
                            <div className="pdf-drop-zone">
                                <input
                                    type="file"
                                    id="pdf"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleFileChange}
                                    required={!pdfFile}
                                />
                                <span className="pdf-drop-icon">📎</span>
                                <p className="pdf-drop-label">{t("submissions.selectDocument")}</p>
                                <p className="pdf-drop-hint">{t("submissions.acceptedFormats", { size: PDF_MAX_SIZE_MB })}</p>
                            </div>
                            {pdfFile && (
                                <div className="file-info">
                                    <span>✓</span>
                                    <span>{pdfFile.name} — {(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate(`/working-papers/${id}`)}
                        >
                            {t("submissions.cancel")}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? t("submissions.sending") : t("submissions.submit")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SubmissionForm;
