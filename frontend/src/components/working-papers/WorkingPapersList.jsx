import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../Url";
import "@/styles/wp-base.css";
import "@/styles/wp-list.css";
import "@/styles/wp-components.css";

function WorkingPapersList({ embedded = false }) {
    const { t, i18n } = useTranslation();
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

    const isDeadlinePassed = (deadline) => new Date() > new Date(deadline);
    const formatDate = (date) => new Date(date).toLocaleDateString(
        i18n.language === "en" ? "en-US" : "fr-FR",
        { day: "numeric", month: "long", year: "numeric" },
    );

    if (loading) return <div className="loading">{t("workingPapers.loading")}</div>;

    return (
        <div className={embedded ? "" : "working-papers-container"}>
            {!embedded && (
                <header className="wp-header">
                    <h1>{t("workingPapers.listTitle")}</h1>
                    <p>{t("workingPapers.listSubtitle")}</p>
                </header>
            )}

            <div className="wp-grid">
                {workingPapers.length === 0 ? (
                    <div className="no-wp"><p>{t("workingPapers.emptyCalls")}</p></div>
                ) : (
                    workingPapers.map((wp) => (
                        <div key={wp._id} className="wp-card">
                            <div className={`wp-card-accent${wp.status !== "ouvert" ? " closed-accent" : ""}`} />
                            <div className="wp-card-inner">
                                <div className="wp-card-header">
                                    <div>
                                        <h2>{wp.title}</h2>
                                        {wp.subtitle && <p className="wp-subtitle">{wp.subtitle}</p>}
                                    </div>
                                    <span className={`wp-status ${wp.status === "ouvert" ? "open" : "closed"}`}>
                                        {wp.status === "ouvert" ? t("workingPapers.open") : t("workingPapers.closed")}
                                    </span>
                                </div>

                                <div className="wp-card-body">
                                    <p className="wp-description">{String(wp.description || "").substring(0, 180)}...</p>
                                    <div className="wp-meta">
                                        <div className="wp-meta-item">
                                            <span className="icon">📅</span>
                                            <span>{t("workingPapers.deadline")}&nbsp; <strong>{formatDate(wp.deadline)}</strong></span>
                                        </div>
                                        <div className="wp-meta-item">
                                            <span className="icon">📝</span>
                                            <span>{t("workingPapers.submissions", { count: wp.submissionsCount || 0 })}</span>
                                        </div>
                                        {wp.organizer && <div className="wp-meta-item"><span className="icon">🏛️</span><span>{wp.organizer}</span></div>}
                                        {wp.language && <div className="wp-meta-item"><span className="icon">🌐</span><span>{wp.language === "anglais" ? t("workingPapers.languageEnglish") : t("workingPapers.languageFrench")}</span></div>}
                                    </div>

                                    {(wp.manuscriptLength || wp.submissionRequirements) && (
                                        <div className="wp-card-extra">
                                            {wp.manuscriptLength && <p><strong>{t("workingPapers.expectedLength")}</strong> {wp.manuscriptLength}</p>}
                                            {wp.submissionRequirements && <p><strong>{t("workingPapers.submission")}</strong> {wp.submissionRequirements}</p>}
                                        </div>
                                    )}
                                    {isDeadlinePassed(wp.deadline) && <div className="deadline-passed">{t("workingPapers.deadlinePassedShort")}</div>}
                                </div>

                                <div className="wp-card-footer">
                                    <button className="btn btn-secondary btn-small" onClick={() => navigate(`/working-papers/${wp._id}`)}>
                                        {t("workingPapers.details")}
                                    </button>
                                    {!isDeadlinePassed(wp.deadline) && wp.status === "ouvert" && (
                                        <button className="btn btn-primary btn-small" onClick={() => navigate(`/working-papers/${wp._id}/submit`)}>
                                            {t("workingPapers.submit")}
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
                    <button className="btn btn-link" onClick={() => navigate("/working-papers/history")}>
                        {t("workingPapers.historyLink")}
                    </button>
                </div>
            )}
        </div>
    );
}

export default WorkingPapersList;
