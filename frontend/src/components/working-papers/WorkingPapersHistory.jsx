import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../Url";
import "@/styles/wp-base.css";
import "@/styles/wp-history.css";
import "@/styles/wp-components.css";

function WorkingPapersHistory({ embedded = false }) {
    const [publications, setPublications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupedByYear, setGroupedByYear] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/working-papers/history/public`
            );
            const data = await response.json();
            setPublications(data);

            // Grouper par année
            const grouped = data.reduce((acc, publication) => {
                const referenceDate = publication.publishedAt || publication.createdAt;
                const year = new Date(referenceDate).getFullYear();
                if (!acc[year]) {
                    acc[year] = [];
                }
                acc[year].push(publication);
                return acc;
            }, {});

            setGroupedByYear(grouped);
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

    if (loading) {
        return <div className="loading">Chargement...</div>;
    }

    const years = Object.keys(groupedByYear).sort((a, b) => b - a);

    return (
        <div className={embedded ? "" : "working-papers-container"}>
            {!embedded && (
                <header className="wp-header">
                    <h1>📖 Historique des publications AEGC</h1>
                    <p>Numéros éditoriaux de synthèse préparés et publiés par l&apos;administration.</p>
                </header>
            )}

            {!embedded && (
                <button className="btn btn-secondary" onClick={() => navigate("/working-papers")}>
                    ← Retour aux appels en cours
                </button>
            )}

            {publications.length === 0 ? (
                <div className="no-submissions">
                    <p>Aucune publication de synthèse pour le moment.</p>
                </div>
            ) : (
                <div className="history-container">
                    {years.map((year) => (
                        <div key={year} className="year-section">
                            <h2 className="year-title">{year}</h2>

                            <div className="history-grid">
                                {groupedByYear[year].map((publication) => (
                                    <div key={publication._id} className="history-card">
                                        <div className="history-card-header">
                                            <h3>{publication.title}</h3>
                                            <p className="wp-theme">Publication éditoriale</p>
                                        </div>

                                        <div className="history-card-body">
                                            {(publication.stats?.acceptedCount !== undefined || publication.stats?.rejectedCount !== undefined) && (
                                                <div className="keywords" style={{ marginBottom: "0.75rem" }}>
                                                    {publication.stats?.acceptedCount !== undefined && (
                                                        <span className="keyword-tag">
                                                            Acceptes: {publication.stats.acceptedCount}
                                                        </span>
                                                    )}
                                                    {publication.stats?.rejectedCount !== undefined && (
                                                        <span className="keyword-tag">
                                                            Rejetes: {publication.stats.rejectedCount}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {publication.summary && (
                                                <div className="abstract-preview">
                                                    <strong>Résumé :</strong>
                                                    <p>
                                                        {publication.summary.length > 300
                                                            ? `${publication.summary.substring(0, 300)}...`
                                                            : publication.summary}
                                                    </p>
                                                </div>
                                            )}

                                            {publication.downloadUrl && (
                                                <div style={{ marginTop: "0.75rem" }}>
                                                    <a
                                                        className="btn btn-primary btn-small"
                                                        href={`${API_BASE_URL}${publication.downloadUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Ouvrir le PDF publié
                                                    </a>
                                                </div>
                                            )}

                                            <div className="history-meta">
                                                <span className="meta-date">
                                                    Publié le {formatDate(publication.publishedAt || publication.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="history-footer">
                <p>
                    Cet espace présente les documents de synthèse officiels publiés par l&apos;administration AEGC.
                </p>
                <p>
                    Pour plus d&apos;informations, contactez-nous à{" "}
                    <a href="mailto:contact@aegc.org">contact@aegc.org</a>
                </p>
            </div>
        </div>
    );
}

export default WorkingPapersHistory;
