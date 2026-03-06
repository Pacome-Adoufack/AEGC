import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./Url";
import "../styles/wp-base.css";
import "../styles/wp-detail.css";
import "../styles/wp-components.css";

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
                    <h1>{wp.title}</h1>
                    <span className={`wp-status ${wp.status === "ouvert" ? "open" : "closed"}`}>
                        {wp.status === "ouvert" ? "Ouvert" : "Clôturé"}
                    </span>
                </div>

                <div className="wp-detail-meta">
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
                </div>

                <div className="wp-detail-content">
                    <h2>Description de l’appel</h2>
                    <div
                        className="wp-description-full"
                        dangerouslySetInnerHTML={{ __html: wp.description.replace(/\n/g, "<br/>") }}
                    />
                </div>

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
                            <li>Votre fichier en format PDF (max 10 MB)</li>
                            <li>Titre, résumé et mots-clés de l’article</li>
                            <li>Informations des co-auteurs si applicable</li>
                            <li>Codes JEL correspondant à votre domaine</li>
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
