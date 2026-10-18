import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../Url";
import "@/styles/wp-base.css";
import "@/styles/wp-detail.css";
import "@/styles/wp-components.css";

const PDF_MAX_SIZE_MB = Number(import.meta.env.VITE_PDF_MAX_SIZE_MB) || 10;

function WorkingPaperDetail() {
    const { t, i18n } = useTranslation();
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
        return new Date(date).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const isDeadlinePassed = (deadline) => {
        return new Date() > new Date(deadline);
    };

    if (loading) {
        return <div className="loading">{t("workingPapers.detailLoading")}</div>;
    }

    if (!wp) {
        return <div className="error">{t("workingPapers.notFound")}</div>;
    }

    return (
        <div className="wp-detail-container">
            <div className="wp-detail-inner">
                <button className="btn-back" onClick={() => navigate("/working-papers")}>
                    {t("workingPapers.backToCallsShort")}
                </button>

                <div className="wp-detail-header">
                    <div>
                        <h1>{wp.title}</h1>
                        {wp.subtitle && <p className="wp-detail-subtitle">{wp.subtitle}</p>}
                    </div>
                    <span className={`wp-status ${wp.status === "ouvert" ? "open" : "closed"}`}>
                        {wp.status === "ouvert" ? t("workingPapers.open") : t("workingPapers.closed")}
                    </span>
                </div>

                <div className="wp-detail-meta">
                    {wp.organizer && (
                        <div className="meta-item">
                            <strong>{t("workingPapers.organizer")}</strong>
                            <p>{wp.organizer}</p>
                        </div>
                    )}
                    <div className="meta-item">
                        <strong>{t("workingPapers.deadline")}</strong>
                        <p>{formatDate(wp.deadline)}</p>
                    </div>
                    <div className="meta-item">
                        <strong>{t("workingPapers.submissionsLabel")}</strong>
                        <p>{wp.submissionsCount || 0}</p>
                    </div>
                    <div className="meta-item">
                        <strong>{t("workingPapers.status")}</strong>
                        <p style={{ color: wp.status === "ouvert" ? "#059669" : "#dc2626", fontWeight: 600 }}>
                            {wp.status === "ouvert" ? t("workingPapers.open") : t("workingPapers.closed")}
                        </p>
                    </div>
                    <div className="meta-item">
                            <strong>{t("workingPapers.jelCodes")}</strong>
                        <p>
                            {Array.isArray(wp.jelCodes) && wp.jelCodes.length > 0
                                ? wp.jelCodes.join(", ")
                                : t("workingPapers.undefined")}
                        </p>
                    </div>
                    {wp.language && (
                        <div className="meta-item">
                            <strong>{t("workingPapers.language")}</strong>
                            <p>{wp.language === "anglais" ? t("workingPapers.languageEnglish") : t("workingPapers.languageFrench")}</p>
                        </div>
                    )}
                    {wp.manuscriptLength && (
                        <div className="meta-item">
                            <strong>{t("workingPapers.expectedLengthLabel")}</strong>
                            <p>{wp.manuscriptLength}</p>
                        </div>
                    )}
                </div>

                <div className="wp-detail-content">
                    <h2>{t("workingPapers.description")}</h2>
                    <div
                        className="wp-description-full"
                        dangerouslySetInnerHTML={{ __html: wp.description.replace(/\n/g, "<br/>") }}
                    />
                </div>

                {wp.submissionRequirements && (
                    <div className="wp-detail-content">
                        <h2>{t("workingPapers.conditions")}</h2>
                        <p className="wp-description-full">{wp.submissionRequirements}</p>
                    </div>
                )}

                {(wp.contact?.email || wp.contact?.phone || wp.contact?.website || wp.contact?.linkedin || (Array.isArray(wp.usefulLinks) && wp.usefulLinks.length > 0)) && (
                    <div className="wp-detail-content">
                        <h2>{t("workingPapers.contactLinks")}</h2>
                        <div className="wp-detail-contact-grid">
                            {wp.contact?.email && (
                                <div className="meta-item">
                                    <strong>Email</strong>
                                    <p>{wp.contact.email}</p>
                                </div>
                            )}
                            {wp.contact?.phone && (
                                <div className="meta-item">
                                    <strong>{t("about.phone")}</strong>
                                    <p>{wp.contact.phone}</p>
                                </div>
                            )}
                            {wp.contact?.website && (
                                <div className="meta-item">
                                    <strong>{t("workingPapers.website")}</strong>
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
                                <strong>{t("workingPapers.usefulLinks")}</strong>
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
                        <p>{t("workingPapers.deadlinePassed")}</p>
                        <p>{t("workingPapers.submissionsClosed")}</p>
                    </div>
                ) : (
                    <div className="wp-submit-cta">
                        <h3>{t("workingPapers.submitWork")}</h3>
                        <p>{t("workingPapers.prepareBefore")}</p>
                        <ul className="wp-submit-checklist">
                            <li>{t("workingPapers.pdfRequirement", { size: PDF_MAX_SIZE_MB })}</li>
                            <li>{t("workingPapers.articleMetadata")}</li>
                            <li>{t("workingPapers.coauthors")}</li>
                            <li>{t("workingPapers.jelRequirement")}</li>
                        </ul>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate(`/working-papers/${id}/submit`)}
                        >
                            {t("workingPapers.startSubmission")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default WorkingPaperDetail;
