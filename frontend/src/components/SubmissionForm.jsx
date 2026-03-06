import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast.js";
import { API_BASE_URL } from "./Url";
import { getAuthToken } from "../utils/auth";
import "../styles/wp-base.css";
import "../styles/wp-submission.css";
import "../styles/wp-components.css";

function SubmissionForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [wp, setWp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        articleTitle: "",
        keywords: "",
        jelCodes: "",
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
            setError("Impossible de charger l'appel à contribution");
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
            if (file.type !== "application/pdf") {
                setError("Seuls les fichiers PDF sont acceptés");
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError("Le fichier ne doit pas dépasser 10 MB");
                return;
            }
            setPdfFile(file);
            setError("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            // Chercher le token dans localStorage ET sessionStorage
            const token = getAuthToken();
            const user = localStorage.getItem("user");

            console.log("DEBUG Soumission - Token présent:", !!token);

            // Ne rediriger que si vraiment pas connecté
            if (!token && !user) {
                toast.warning("Vous devez être connecté pour soumettre");
                navigate("/login", { state: { from: `/working-papers/${id}/submit` } });
                return;
            }

            // Vérifier que le token est valide avant d'envoyer
            if (!token || token === "" || token === "null" || token === "undefined") {
                console.error("Token invalide détecté:", token);
                localStorage.removeItem("token");
                sessionStorage.removeItem("token");
                localStorage.removeItem("user");
                toast.error("Votre session n'est pas valide. Veuillez vous reconnecter.");
                navigate("/login", { state: { from: `/working-papers/${id}/submit` } });
                return;
            }

            // Vérifier les champs requis
            if (!formData.articleTitle || !formData.abstract || !pdfFile) {
                setError("Veuillez remplir tous les champs obligatoires");
                setSubmitting(false);
                return;
            }

            // Vérifier qu'au moins un auteur est renseigné
            if (!authors[0].name || !authors[0].email) {
                setError("Veuillez renseigner au moins un auteur");
                setSubmitting(false);
                return;
            }

            // Préparer le FormData
            const submitData = new FormData();
            submitData.append("workingPaperId", id);
            submitData.append("articleTitle", formData.articleTitle);
            submitData.append("keywords", formData.keywords);
            submitData.append("jelCodes", formData.jelCodes);
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
                localStorage.removeItem("user");
                toast.error("Votre session a expiré. Veuillez vous reconnecter.");
                navigate("/login", { state: { from: `/working-papers/${id}/submit` } });
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de la soumission");
            }

            setSuccess(true);
            setTimeout(() => {
                navigate("/my-submissions");
            }, 2000);
        } catch (err) {
            // Ne pas afficher d'erreur si on a déjà redirigé
            if (err.message !== "Failed to fetch") {
                setError(err.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">Chargement...</div>;
    }

    if (!wp) {
        return <div className="error">Working Paper non trouvé</div>;
    }

    if (success) {
        return (
            <div className="submission-form-container">
                <div className="submission-success">
                    <div className="submission-success-icon">✓</div>
                    <h2>Soumission envoyée !</h2>
                    <p>Votre travail a été soumis avec succès et est en attente de traitement.</p>
                    <p>Vous serez notifié par email dès que l’équipe AEGC l’aura examiné.</p>
                    <p className="redirect-hint">Redirection vers vos soumissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="submission-form-container">
            <div className="submission-inner">
                <button className="btn-back" onClick={() => navigate(`/working-papers/${id}`)}
                >
                    ← Retour au détail
                </button>

                <div className="submission-page-header">
                    <h1>Soumettre mon travail</h1>
                    <p className="submission-wp-title">{wp.title}</p>
                </div>

                {error && <div className="error-message" style={{ marginBottom: "1rem" }}>{error}</div>}

                <form onSubmit={handleSubmit} className="submission-form">

                    {/* Section 1 — Article */}
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="form-section-number">1</span>
                            <h3>Informations sur l’article</h3>
                        </div>
                        <div className="form-section-body">
                            <div className="form-group">
                                <label htmlFor="articleTitle">
                                    Titre de l’article <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="articleTitle"
                                    name="articleTitle"
                                    value={formData.articleTitle}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Le titre complet de votre travail"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="keywords">Mots-clés</label>
                                    <input
                                        type="text"
                                        id="keywords"
                                        name="keywords"
                                        value={formData.keywords}
                                        onChange={handleInputChange}
                                        placeholder="COVID-19, Finance, Afrique (séparés par des virgules)"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="jelCodes">Codes JEL</label>
                                    <input
                                        type="text"
                                        id="jelCodes"
                                        name="jelCodes"
                                        value={formData.jelCodes}
                                        onChange={handleInputChange}
                                        placeholder="E24, O55"
                                    />
                                    <small>
                                        <a href="https://www.aeaweb.org/jel/guide/jel.php" target="_blank" rel="noopener noreferrer">
                                            Trouver les codes JEL
                                        </a>
                                    </small>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="abstract">
                                    Résumé <span className="required">*</span>
                                </label>
                                <textarea
                                    id="abstract"
                                    name="abstract"
                                    value={formData.abstract}
                                    onChange={handleInputChange}
                                    required
                                    rows="8"
                                    placeholder="Résumé complet de votre travail (abstract)..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2 — Auteurs */}
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="form-section-number">2</span>
                            <h3>Auteur(s) <span className="required">*</span></h3>
                        </div>
                        <div className="form-section-body">
                            {authors.map((author, index) => (
                                <div key={index} className="author-group">
                                    <div className="author-header">
                                        <h4>Auteur {index + 1}</h4>
                                        {authors.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-small"
                                                onClick={() => removeAuthor(index)}
                                            >
                                                Retirer
                                            </button>
                                        )}
                                    </div>
                                    <div className="author-fields">
                                        <div className="form-group">
                                            <label>Nom complet</label>
                                            <input
                                                type="text"
                                                value={author.name}
                                                onChange={(e) => handleAuthorChange(index, "name", e.target.value)}
                                                required={index === 0}
                                                placeholder="Dr. Jean Dupont"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Affiliation</label>
                                            <input
                                                type="text"
                                                value={author.affiliation}
                                                onChange={(e) => handleAuthorChange(index, "affiliation", e.target.value)}
                                                placeholder="Université de Yaoundé I"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                value={author.email}
                                                onChange={(e) => handleAuthorChange(index, "email", e.target.value)}
                                                required={index === 0}
                                                placeholder="jean.dupont@univ.cm"
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
                                + Ajouter un co-auteur
                            </button>
                        </div>
                    </div>

                    {/* Section 3 — Publication (optionnel) */}
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="form-section-number">3</span>
                            <h3>Publication existante <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optionnel)</span></h3>
                        </div>
                        <div className="form-section-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="publicationJournal">Nom de la revue</label>
                                    <input
                                        type="text"
                                        id="publicationJournal"
                                        name="publicationJournal"
                                        value={formData.publicationJournal}
                                        onChange={handleInputChange}
                                        placeholder="Revue Africaine d’Économie"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="publicationNumber">Volume / Numéro</label>
                                    <input
                                        type="text"
                                        id="publicationNumber"
                                        name="publicationNumber"
                                        value={formData.publicationNumber}
                                        onChange={handleInputChange}
                                        placeholder="Vol. 12, No. 3"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 4 — Fichier PDF */}
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="form-section-number">4</span>
                            <h3>Fichier PDF <span className="required">*</span></h3>
                        </div>
                        <div className="form-section-body">
                            <div className="pdf-drop-zone">
                                <input
                                    type="file"
                                    id="pdf"
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    required={!pdfFile}
                                />
                                <span className="pdf-drop-icon">📎</span>
                                <p className="pdf-drop-label">Glissez votre PDF ici ou cliquez pour sélectionner</p>
                                <p className="pdf-drop-hint">Format PDF uniquement — maximum 10 MB</p>
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
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? "Envoi en cours..." : "Soumettre"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SubmissionForm;
