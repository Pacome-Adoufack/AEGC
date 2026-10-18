import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../Url";
import "@/styles/wp-base.css";
import "@/styles/wp-history.css";
import "@/styles/wp-components.css";

function WorkingPapersHistory({ embedded = false }) {
    const { t, i18n } = useTranslation();
    const [publications, setPublications] = useState([]);
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupedByYear, setGroupedByYear] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchHistory();
        fetchPapers();
    }, []);

    // Les papiers diffusés : ceux que l'administration a ouverts au public et
    // que RePEc moissonne. Chargés à part des numéros de synthèse, pour qu'une
    // panne sur l'un n'efface pas l'autre.
    const fetchPapers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/working-papers/history/papers`);
            if (!response.ok) return;
            const data = await response.json();
            setPapers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erreur papiers diffusés:", error);
        }
    };

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
        return new Date(date).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    if (loading) {
        return <div className="loading">{t("workingPapers.loading")}</div>;
    }

    const years = Object.keys(groupedByYear).sort((a, b) => b - a);

    return (
        <div className={embedded ? "" : "working-papers-container"}>
            {!embedded && (
                <header className="wp-header">
                    <h1>{t("workingPapers.historyTitle")}</h1>
                    <p>{t("workingPapers.historySubtitle")}</p>
                </header>
            )}

            {!embedded && (
                <button className="btn btn-secondary" onClick={() => navigate("/working-papers")}>
                    {t("workingPapers.backToCalls")}
                </button>
            )}

            {/* Les travaux eux-mêmes, en tête : c'est ce que vient chercher un
                lecteur qui clique sur « historique des travaux publiés ». */}
            {papers.length > 0 && (
                <section className="published-papers">
                    <h2 className="year-title">{t("workingPapers.publishedPapers")}</h2>
                    <div className="papers-grid">
                        {papers.map((paper) => (
                            <article key={paper._id} className="paper-card">
                                <h3>{paper.articleTitle}</h3>
                                <p className="paper-authors">
                                    {paper.authors.length > 0
                                        ? paper.authors
                                            .map((a) => (a.affiliation ? `${a.name} (${a.affiliation})` : a.name))
                                            .join(" · ")
                                        : t("workingPapers.unknownAuthor")}
                                </p>
                                {paper.callTitle && <p className="paper-call">{paper.callTitle}</p>}
                                {paper.abstract && (
                                    <p className="paper-abstract">
                                        {paper.abstract.length > 320
                                            ? `${paper.abstract.substring(0, 320)}…`
                                            : paper.abstract}
                                    </p>
                                )}
                                {(paper.keywords.length > 0 || paper.jelCodes.length > 0) && (
                                    <div className="keywords">
                                        {paper.keywords.map((k) => (
                                            <span key={k} className="keyword-tag">{k}</span>
                                        ))}
                                        {paper.jelCodes.map((c) => (
                                            <span key={c} className="keyword-tag jel">{c}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="paper-footer">
                                    <a
                                        className="btn btn-primary btn-small"
                                        href={`${API_BASE_URL}${paper.downloadUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {t("workingPapers.readPdf")}
                                    </a>
                                    <span className="meta-date">{t("workingPapers.publishedOn", { date: formatDate(paper.publishedAt) })}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {publications.length === 0 ? (
                papers.length === 0 && (
                    <div className="no-submissions">
                        <p>{t("workingPapers.noPublications")}</p>
                    </div>
                )
            ) : (
                <div className="history-container">
                    {papers.length > 0 && <h2 className="year-title">{t("workingPapers.summaryIssues")}</h2>}
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
                                                            {t("workingPapers.accepted")} {publication.stats.acceptedCount}
                                                        </span>
                                                    )}
                                                    {publication.stats?.rejectedCount !== undefined && (
                                                        <span className="keyword-tag">
                                                            {t("workingPapers.rejected")} {publication.stats.rejectedCount}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {publication.summary && (
                                                <div className="abstract-preview">
                                                    <strong>{t("workingPapers.summary")}</strong>
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
                                                        {t("workingPapers.openPublishedPdf")}
                                                    </a>
                                                </div>
                                            )}

                                            <div className="history-meta">
                                                <span className="meta-date">
                                                    {t("workingPapers.publishedOn", { date: formatDate(publication.publishedAt || publication.createdAt) })}
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
                    {t("workingPapers.officialSpace")}
                </p>
                <p>
                    Pour plus d&apos;informations, contactez-nous à{" "}
                    <a href="mailto:info@aegc-web.org">info@aegc-web.org</a>
                </p>
            </div>
        </div>
    );
}

export default WorkingPapersHistory;
