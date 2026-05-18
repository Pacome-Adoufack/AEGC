import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../Url";
import "@/styles/wp-base.css";
import "@/styles/wp-detail.css";
import "@/styles/wp-components.css";

const PDF_MAX_SIZE_MB = Number(import.meta.env.VITE_PDF_MAX_SIZE_MB) || 10;

function WorkingPaperDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [wp, setWp] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkingPaper();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchWorkingPaper = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/working-papers/${id}`);
            const data = await response.json();
            setWp(data);
        } catch (error) {
            console.error("Erreur:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const isDeadlinePassed = (deadline) => {
        return new Date() > new Date(deadline);
    };

    if (loading) {
        return <div className="loading">Chargement...</div>;
    }

    if (!wp) {
        return <div className="error">Working Paper non trouvé</div>;
    }

    return (
        <div className="wp-detail-container">
            <div className="wp-detail-inner">
                <button className="btn-back" onClick={() => navigate("/working-papers")}>
                    ← Retour aux appels
                </button>

                <div className="wp-detail-header">
                    <div>
                        <h1>{wp.title}</h1>
                        {wp.subtitle && <p className="wp-detail-subtitle">{wp.subtitle}</p>}
                    </div>
                    <span className={`wp-status ${wp.status === "ouvert" ? "open" : "closed"}`}>
                        {wp.status === "ouvert" ? "Ouvert" : "Clôturé"}
                    </span>
                </div>

                <div className="wp-detail-meta">
                    {wp.organizer && (
                        <div className="meta-item">
                            <strong>Organisateur</strong>
                            <p>{wp.organizer}</p>
                        </div>
                    )}
                    <div className="meta-item">
                        <strong>Deadline</strong>
                        <p>{formatDate(wp.deadline)}</p>
                    </div>
                    <div className="meta-item">
                        <strong>Soumissions</strong>
                        <p>{wp.submissionsCount || 0}</p>
                    </div>
                    <div className="meta-item">
                        <strong>Statut</strong>
                        <p style={{ color: wp.status === "ouvert" ? "#059669" : "#dc2626", fontWeight: 600 }}>
                            {wp.status === "ouvert" ? "Ouvert" : "Clôturé"}
                        </p>
                    </div>
                    <div className="meta-item">
                        <strong>Codes JEL</strong>
                        <p>
                            {Array.isArray(wp.jelCodes) && wp.jelCodes.length > 0
                                ? wp.jelCodes.join(", ")
                                : "Non definis"}
                        </p>
                    </div>
                    {wp.language && (
                        <div className="meta-item">
                            <strong>Langue</strong>
                            <p>{wp.language === "anglais" ? "English" : "Français"}</p>
                        </div>
                    )}
                    {wp.manuscriptLength && (
                        <div className="meta-item">
                            <strong>Longueur attendue</strong>
                            <p>{wp.manuscriptLength}</p>
                        </div>
                    )}
                </div>

                <div className="wp-detail-content">
                    <h2>Description de l’appel</h2>
                    <div
                        className="wp-description-full"
                        dangerouslySetInnerHTML={{ __html: wp.description.replace(/\n/g, "<br/>") }}
                    />
                </div>

                {wp.submissionRequirements && (
                    <div className="wp-detail-content">
                        <h2>Conditions de soumission</h2>
                        <p className="wp-description-full">{wp.submissionRequirements}</p>
                    </div>
                )}

                {(wp.contact?.email || wp.contact?.phone || wp.contact?.website || wp.contact?.linkedin || (Array.isArray(wp.usefulLinks) && wp.usefulLinks.length > 0)) && (
                    <div className="wp-detail-content">
                        <h2>Contact et liens utiles</h2>
                        <div className="wp-detail-contact-grid">
                            {wp.contact?.email && (
                                <div className="meta-item">
                                    <strong>Email</strong>
                                    <p>{wp.contact.email}</p>
                                </div>
                            )}
                            {wp.contact?.phone && (
                                <div className="meta-item">
                                    <strong>Téléphone</strong>
                                    <p>{wp.contact.phone}</p>
                                </div>
                            )}
                            {wp.contact?.website && (
                                <div className="meta-item">
                                    <strong>Site web</strong>
                                    <p>{wp.contact.website}</p>
                                </div>
                            )}
                            {wp.contact?.linkedin && (
                                <div className="meta-item">
                                    <strong>LinkedIn</strong>
                                    <p>{wp.contact.linkedin}</p>
                                </div>
                            )}
                        </div>
                        {Array.isArray(wp.usefulLinks) && wp.usefulLinks.length > 0 && (
                            <div style={{ marginTop: "1rem" }}>
                                <strong>Liens utiles</strong>
                                <ul>
                                    {wp.usefulLinks.map((link, index) => (
                                        <li key={`${link}-${index}`}>
                                            <a href={link} target="_blank" rel="noreferrer">
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {isDeadlinePassed(wp.deadline) ? (
                    <div className="deadline-passed-notice">
                        <p>La deadline pour cet appel est passée.</p>
                        <p>Les soumissions ne sont plus acceptées.</p>
                    </div>
                ) : (
                    <div className="wp-submit-cta">
                        <h3>Soumettre votre travail</h3>
                        <p>Assurez-vous d’avoir préparé les éléments suivants avant de commencer :</p>
                        <ul className="wp-submit-checklist">
                            <li>Votre fichier en format PDF (max {PDF_MAX_SIZE_MB} MB)</li>
                            <li>Titre, résumé et mots-clés de l’article</li>
                            <li>Informations des co-auteurs si applicable</li>
                            <li>Les codes JEL sont définis par le créateur de l’appel</li>
                        </ul>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate(`/working-papers/${id}/submit`)}
                        >
                            Commencer la soumission
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WorkingPaperDetail;
