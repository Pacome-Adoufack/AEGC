import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./Url";
import "../styles/wp-base.css";
import "../styles/wp-list.css";
import "../styles/wp-components.css";

function WorkingPapersList({ embedded = false }) {
    const [workingPapers, setWorkingPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchWorkingPapers();
    }, []);

    const fetchWorkingPapers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/working-papers`);
            const data = await response.json();
            setWorkingPapers(data);
        } catch (error) {
            console.error("Erreur:", error);
        } finally {
            setLoading(false);
        }
    };

    const isDeadlinePassed = (deadline) => {
        return new Date() > new Date(deadline);
    };

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
        <div className={embedded ? "" : "working-papers-container"}>
            {!embedded && (
                <header className="wp-header">
                    <h1>📚 Working Papers AEGC</h1>
                    <p>Appels à contribution en cours et à venir</p>
                </header>
            )}

            <div className="wp-grid">
                {workingPapers.length === 0 ? (
                    <div className="no-wp">
                        <p>Aucun appel à contribution pour le moment.</p>
                    </div>
                ) : (
                    workingPapers.map((wp) => (
                        <div key={wp._id} className="wp-card">
                            {/* Bande colorée selon le statut */}
                            <div className={`wp-card-accent${wp.status !== "ouvert" ? " closed-accent" : ""}`} />

                            <div className="wp-card-inner">
                                <div className="wp-card-header">
                                    <h2>{wp.title}</h2>
                                    <span className={`wp-status ${wp.status === "ouvert" ? "open" : "closed"}`}>
                                        {wp.status === "ouvert" ? "Ouvert" : "Clôturé"}
                                    </span>
                                </div>

                                <div className="wp-card-body">
                                    <p className="wp-description">
                                        {wp.description.substring(0, 180)}...
                                    </p>

                                    <div className="wp-meta">
                                        <div className="wp-meta-item">
                                            <span className="icon">📅</span>
                                            <span>
                                                Deadline&nbsp;:{" "}
                                                <strong>{formatDate(wp.deadline)}</strong>
                                            </span>
                                        </div>
                                        <div className="wp-meta-item">
                                            <span className="icon">📝</span>
                                            <span>
                                                {wp.submissionsCount || 0} soumission
                                                {wp.submissionsCount > 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    </div>

                                    {isDeadlinePassed(wp.deadline) && (
                                        <div className="deadline-passed">
                                            La deadline est passée
                                        </div>
                                    )}
                                </div>

                                <div className="wp-card-footer">
                                    <button
                                        className="btn btn-secondary btn-small"
                                        onClick={() => navigate(`/working-papers/${wp._id}`)}
                                    >
                                        Voir les détails
                                    </button>
                                    {!isDeadlinePassed(wp.deadline) && wp.status === "ouvert" && (
                                        <button
                                            className="btn btn-primary btn-small"
                                            onClick={() => navigate(`/working-papers/${wp._id}/submit`)}
                                        >
                                            Soumettre
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!embedded && (
                <div className="wp-footer">
                    <button
                        className="btn btn-link"
                        onClick={() => navigate("/working-papers/history")}
                    >
                        📖 Voir l'historique des travaux publiés
                    </button>
                </div>
            )}
        </div>
    );
}

export default WorkingPapersList;
