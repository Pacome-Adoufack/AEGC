import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./Url";
import "../styles/wp-base.css";
import "../styles/wp-history.css";
import "../styles/wp-components.css";

function WorkingPapersHistory({ embedded = false }) {
    const [submissions, setSubmissions] = useState([]);
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
            setSubmissions(data);

            // Grouper par année
            const grouped = data.reduce((acc, sub) => {
                const year = new Date(sub.createdAt).getFullYear();
                if (!acc[year]) {
                    acc[year] = [];
                }
                acc[year].push(sub);
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
                    <h1>📖 Historique des Working Papers AEGC</h1>
                    <p>Travaux académiques validés et publiés par nos membres</p>
                </header>
            )}

            {!embedded && (
                <button className="btn btn-secondary" onClick={() => navigate("/working-papers")}>
                    ← Retour aux appels en cours
                </button>
            )}

            {submissions.length === 0 ? (
                <div className="no-submissions">
                    <p>Aucun travail publié pour le moment.</p>
                </div>
            ) : (
                <div className="history-container">
                    {years.map((year) => (
                        <div key={year} className="year-section">
                            <h2 className="year-title">{year}</h2>

                            <div className="history-grid">
                                {groupedByYear[year].map((submission) => (
                                    <div key={submission._id} className="history-card">
                                        <div className="history-card-header">
                                            <h3>{submission.articleTitle}</h3>
                                            <p className="wp-theme">{submission.workingPaper?.title}</p>
                                        </div>

                                        <div className="history-card-body">
                                            <div className="authors-list">
                                                <strong>Auteur(s) :</strong>
                                                <ul>
                                                    {submission.authors.map((author, i) => (
                                                        <li key={i}>
                                                            {author.name}
                                                            {author.affiliation && ` (${author.affiliation})`}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {submission.abstract && (
                                                <div className="abstract-preview">
                                                    <strong>Résumé :</strong>
                                                    <p>
                                                        {submission.abstract.length > 300
                                                            ? `${submission.abstract.substring(0, 300)}...`
                                                            : submission.abstract}
                                                    </p>
                                                </div>
                                            )}

                                            {submission.keywords && submission.keywords.length > 0 && (
                                                <div className="keywords">
                                                    {submission.keywords.slice(0, 5).map((keyword, i) => (
                                                        <span key={i} className="keyword-tag">
                                                            {keyword}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="history-meta">
                                                <span className="meta-date">
                                                    Publié le {formatDate(submission.createdAt)}
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
                    Les PDF des travaux sont disponibles uniquement pour les auteurs et
                    l'administration AEGC.
                </p>
                <p>
                    Pour plus d'informations sur un travail spécifique, contactez-nous à{" "}
                    <a href="mailto:contact@aegc.org">contact@aegc.org</a>
                </p>
            </div>
        </div>
    );
}

export default WorkingPapersHistory;
