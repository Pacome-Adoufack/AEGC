import { useState, useEffect } from "react";
import { getAuthToken } from "../../utils/auth";
import { API_BASE_URL } from "../Url";
import {
    SUBMISSION_STATUS_LABELS, SUBMISSION_STATUS_ORDER,
    normalizeStatus, formatDate,
} from "./wpConstants";

const hasNewVersion = (sub) =>
    normalizeStatus(sub?.status) === "en_revision" && Number(sub?.currentVersion || 1) > 1;

export default function SubmissionsTab({ submissions, managers, isAdmin, isManager, toast, openConfirm, onRefresh }) {
    const [filterStatus, setFilterStatus] = useState("all");
    const [filtered, setFiltered] = useState(submissions);
    const [selected, setSelected] = useState(null);
    const [detailTab, setDetailTab] = useState("overview");
    const [newComment, setNewComment] = useState("");
    const [revisionSummary, setRevisionSummary] = useState("");
    const [revisionItemsText, setRevisionItemsText] = useState("");
    const [revisionSubmitting, setRevisionSubmitting] = useState(false);

    useEffect(() => {
        setFiltered(
            filterStatus === "all"
                ? submissions
                : submissions.filter((s) => normalizeStatus(s.status) === filterStatus)
        );
    }, [filterStatus, submissions]);

    const countBy = (status) => submissions.filter((s) => normalizeStatus(s.status) === status).length;

    const openDetails = async (id) => {
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_BASE_URL}/api/submissions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Impossible de charger les details"); }
            const d = await res.json();
            setSelected({ ...d, status: normalizeStatus(d.status) });
            setDetailTab("overview");
            setRevisionSummary("");
            setRevisionItemsText("");
            setNewComment("");
        } catch (err) {
            toast.error(err.message);
        }
    };

    const downloadPDF = async (submissionId, version = null) => {
        try {
            const token = getAuthToken();
            const url = version
                ? `${API_BASE_URL}/api/submissions/${submissionId}/versions/${version}/download`
                : `${API_BASE_URL}/api/submissions/${submissionId}/download`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Erreur lors du téléchargement");
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = window.URL.createObjectURL(blob);
            a.download = version ? `submission-v${version}.pdf` : `submission-${submissionId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(a.href);
            document.body.removeChild(a);
        } catch {
            toast.error("Erreur lors du téléchargement du PDF");
        }
    };

    const changeStatus = async (submissionId, status) => {
        try {
            const token = getAuthToken();
            await fetch(`${API_BASE_URL}/api/admin/submissions/${submissionId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status }),
            });
            onRefresh();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const assignManager = async (submissionId, dispatcherId) => {
        try {
            const token = getAuthToken();
            await fetch(`${API_BASE_URL}/api/admin/submissions/${submissionId}/assign`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ dispatcherId }),
            });
            onRefresh();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const closeManagerSession = (dispatcher) =>
        openConfirm({
            title: "Clôturer la session",
            message: `Cloturer la session de ${dispatcher.firstName} ${dispatcher.name} ?`,
            onConfirm: async () => {
                try {
                    const token = getAuthToken();
                    const res = await fetch(`${API_BASE_URL}/api/admin/dispatchers/${dispatcher.id}/close-session`, {
                        method: "POST", headers: { Authorization: `Bearer ${token}` },
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || "Impossible de cloturer la session");
                    toast.success("Session du gestionnaire cloturée");
                    onRefresh();
                } catch (err) {
                    toast.error(err.message);
                }
            },
            type: "warning",
        });

    const addComment = async () => {
        if (!newComment.trim()) return;
        try {
            const token = getAuthToken();
            await fetch(`${API_BASE_URL}/api/admin/submissions/${selected._id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ comment: newComment }),
            });
            setNewComment("");
            await openDetails(selected._id);
            toast.success("Commentaire ajouté !");
        } catch {
            toast.error("Erreur lors de l'ajout du commentaire");
        }
    };

    const requestRevision = async () => {
        if (!revisionSummary.trim() || !revisionItemsText.trim()) {
            toast.error("Veuillez remplir le résumé et les points de révision");
            return;
        }
        setRevisionSubmitting(true);
        try {
            const token = getAuthToken();
            const items = revisionItemsText.split("\n").map((i) => i.trim()).filter(Boolean);
            await fetch(`${API_BASE_URL}/api/admin/submissions/${selected._id}/revision-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ summary: revisionSummary, items }),
            });
            setRevisionSummary("");
            setRevisionItemsText("");
            await openDetails(selected._id);
            toast.success("Appréciation envoyée !");
        } catch {
            toast.error("Erreur lors de l'envoi de l'appréciation");
        } finally {
            setRevisionSubmitting(false);
        }
    };

    const FILTERS = [
        { key: "all", label: `Toutes (${submissions.length})` },
        { key: "soumise", label: `Soumises (${countBy("soumise")})` },
        { key: "en_revision", label: `En revision (${countBy("en_revision")})` },
        { key: "revision_requise", label: `A modifier (${countBy("revision_requise")})` },
        { key: "rejetee", label: `Rejetées (${countBy("rejetee")})` },
        { key: "acceptee", label: `Acceptées (${countBy("acceptee")})` },
    ];

    return (
        <div className="admin-section-card">
            {/* Panel gestionnaires (admin seulement) */}
            {isAdmin && (
                <div className="dispatcher-panel">
                    <h3>Sessions des gestionnaires</h3>
                    {managers.length === 0 ? (
                        <p className="dispatcher-panel-empty">Aucun gestionnaire configuré pour le moment.</p>
                    ) : (
                        <div className="dispatcher-grid">
                            {managers.map((d) => (
                                <div key={d.id} className="dispatcher-card">
                                    <div>
                                        <p className="dispatcher-name">{d.firstName} {d.name}</p>
                                        <p className="dispatcher-meta">{d.email}</p>
                                        <p className="dispatcher-meta">Actives: {d.activeAssignedCount} | Finalisées: {d.completedCount} | En cours: {d.pendingCount}</p>
                                    </div>
                                    <button className="btn btn-secondary btn-small" disabled={!d.canCloseSession} onClick={() => closeManagerSession(d)}>
                                        Cloturer session
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Filtres */}
            <div className="tab-toolbar tab-toolbar-secondary">
                <div className="filters">
                    {FILTERS.map((f) => (
                        <button key={f.key} className={filterStatus === f.key ? "active" : ""} onClick={() => setFilterStatus(f.key)}>
                            {f.label}
                        </button>
                    ))}
                </div>
                {filterStatus !== "all" && (
                    <button className="btn btn-secondary btn-small" onClick={() => setFilterStatus("all")}>Réinitialiser</button>
                )}
            </div>

            {/* Liste */}
            <div className="submissions-table">
                {filtered.length === 0 ? (
                    <div className="admin-empty">Aucune soumission ne correspond à ce filtre.</div>
                ) : filtered.map((sub) => (
                    <div key={sub._id} className="submission-row">
                        <div className={`sub-row-accent accent-${normalizeStatus(sub.status)}`} />
                        <div className="sub-row-inner">
                            <div className="sub-row-info">
                                <div className="sub-row-title">
                                    <h3>{sub.articleTitle}</h3>
                                    {hasNewVersion(sub) && <span className="new-version-badge">Nouvelle version</span>}
                                </div>
                                <div className="sub-row-meta">
                                    <span>{sub.submittedBy?.name} {sub.submittedBy?.firstName}</span>
                                    <span>{sub.submittedBy?.email}</span>
                                    <span>{sub.workingPaper?.title}</span>
                                    <span>Gestionnaire: {sub.assignedDispatcher ? `${sub.assignedDispatcher.firstName} ${sub.assignedDispatcher.name}` : "Non assigné"}</span>
                                    <span>V{sub.currentVersion || 1}</span>
                                    <span>{formatDate(sub.createdAt)}</span>
                                </div>
                            </div>
                            <div className="sub-row-actions">
                                {isManager && (
                                    <select className="sub-status-select" value={normalizeStatus(sub.status)} onChange={(e) => changeStatus(sub._id, e.target.value)}>
                                        {SUBMISSION_STATUS_ORDER.map((s) => <option key={s} value={s}>{SUBMISSION_STATUS_LABELS[s]}</option>)}
                                    </select>
                                )}
                                {isAdmin && (
                                    <select className="sub-status-select" value={sub.assignedDispatcher?._id || ""} onChange={(e) => assignManager(sub._id, e.target.value)}>
                                        <option value="">Affecter un gestionnaire</option>
                                        {managers.map((d) => <option key={d.id} value={d.id}>{d.firstName} {d.name}</option>)}
                                    </select>
                                )}
                                <button className="btn btn-secondary btn-small" onClick={() => openDetails(sub._id)}>Détails</button>
                                <button className="btn btn-primary btn-small" onClick={() => downloadPDF(sub._id)}>PDF</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modale détail */}
            {selected && (
                <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
                    <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div className="admin-modal-title-wrap">
                                <h2>{selected.articleTitle}</h2>
                                {hasNewVersion(selected) && <span className="new-version-badge">Nouvelle version</span>}
                            </div>
                            <button className="admin-modal-close" onClick={() => setSelected(null)}>x</button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="admin-detail-tabs" role="tablist">
                                {[
                                    { id: "overview", label: "Vue générale" },
                                    { id: "reviews", label: "Appréciations", count: selected.reviewRequests?.length || 0 },
                                    { id: "versions", label: "Versions", count: selected.versions?.length || 0 },
                                ].map((t) => (
                                    <button key={t.id} className={`admin-detail-tab ${detailTab === t.id ? "active" : ""}`} onClick={() => setDetailTab(t.id)} role="tab">
                                        {t.label}
                                        {t.count !== undefined && <span className="tab-count">{t.count}</span>}
                                    </button>
                                ))}
                            </div>

                            {detailTab === "overview" && (
                                <>
                                    <div className="admin-modal-section">
                                        <h3>Informations clés</h3>
                                        <div className="sub-modal-meta">
                                            <div className="sub-modal-meta-item"><strong>Statut</strong><p>{SUBMISSION_STATUS_LABELS[selected.status] || selected.status}</p></div>
                                            <div className="sub-modal-meta-item"><strong>Version courante</strong><p>V{selected.currentVersion || 1}</p></div>
                                            <div className="sub-modal-meta-item"><strong>Soumis le</strong><p>{formatDate(selected.createdAt)}</p></div>
                                            <div className="sub-modal-meta-item"><strong>Gestionnaire</strong><p>{selected.assignedDispatcher ? `${selected.assignedDispatcher.firstName} ${selected.assignedDispatcher.name}` : "Non assigné"}</p></div>
                                        </div>
                                        {hasNewVersion(selected) && <p className="new-version-note">Cette soumission a été modifiée par l&apos;auteur et attend votre traitement.</p>}
                                    </div>
                                    <div className="admin-modal-section">
                                        <h3>Auteur(s)</h3>
                                        <ul>{selected.authors?.map((a, i) => <li key={i}><strong>{a.name}</strong>{a.affiliation ? ` - ${a.affiliation}` : ""}{a.email ? ` - ${a.email}` : ""}</li>)}</ul>
                                    </div>
                                    <div className="admin-modal-section"><h3>Résumé</h3><p>{selected.abstract}</p></div>
                                    <div className="admin-modal-section"><h3>Mots-clés</h3><p>{selected.keywords?.join(", ") || "-"}</p></div>
                                    {selected.jelCodes?.length > 0 && <div className="admin-modal-section"><h3>Codes JEL</h3><p>{selected.jelCodes.join(", ")}</p></div>}
                                </>
                            )}

                            {detailTab === "reviews" && (
                                <>
                                    {isManager && (
                                        <div className="admin-modal-section">
                                            <h3>Ajouter un commentaire</h3>
                                            <textarea className="comment-input-area" value={newComment} onChange={(e) => setNewComment(e.target.value)} rows="4" placeholder="Votre retour à l'auteur..." />
                                            <button className="btn btn-primary btn-small" onClick={addComment}>Envoyer</button>
                                        </div>
                                    )}
                                    {isManager && !["acceptee", "rejetee"].includes(selected.status) && (
                                        <div className="admin-modal-section">
                                            <h3>Demander une modification (appréciation)</h3>
                                            <div className="form-group">
                                                <label>Résumé de l&apos;appréciation</label>
                                                <textarea className="comment-input-area" rows="3" value={revisionSummary} onChange={(e) => setRevisionSummary(e.target.value)} placeholder="Ex: Bon potentiel, mais la méthodologie doit être renforcée." />
                                            </div>
                                            <div className="form-group">
                                                <label>Points à corriger (un point par ligne)</label>
                                                <textarea className="comment-input-area" rows="5" value={revisionItemsText} onChange={(e) => setRevisionItemsText(e.target.value)} />
                                            </div>
                                            <button className="btn btn-primary btn-small" disabled={revisionSubmitting} onClick={requestRevision}>
                                                {revisionSubmitting ? "Envoi..." : "Envoyer l'appréciation"}
                                            </button>
                                        </div>
                                    )}
                                    {selected.reviewRequests?.length > 0 && (
                                        <div className="admin-modal-section">
                                            <h3>Historique des appréciations</h3>
                                            <div className="admin-comment-list">
                                                {[...selected.reviewRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((r, i) => (
                                                    <div key={r._id || i} className="admin-comment-item">
                                                        <p className="comment-date">{formatDate(r.createdAt)} - {r.createdBy?.name || "Admin"} {r.createdBy?.firstName || ""}</p>
                                                        <p className="comment-text"><strong>Résumé:</strong> {r.summary}</p>
                                                        {r.items?.length > 0 && <ul>{r.items.map((item, idx) => <li key={idx}>{item}</li>)}</ul>}
                                                        <p className="comment-date">Statut: {r.status === "open" ? "Ouverte" : "Traitée"}{r.addressedByVersion ? ` (Version ${r.addressedByVersion})` : ""}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {selected.adminComments?.length > 0 && (
                                        <div className="admin-modal-section">
                                            <h3>Historique des commentaires</h3>
                                            <div className="admin-comment-list">
                                                {selected.adminComments.map((c, i) => (
                                                    <div key={i} className="admin-comment-item">
                                                        <p className="comment-date">{formatDate(c.date)}</p>
                                                        <p className="comment-text">{c.comment}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {detailTab === "versions" && (
                                selected.versions?.length > 0 ? (
                                    <div className="admin-modal-section">
                                        <h3>Historique des versions</h3>
                                        <div className="admin-comment-list">
                                            {[...selected.versions].sort((a, b) => (b.versionNumber || 1) - (a.versionNumber || 1)).map((v, i) => (
                                                <div key={v._id || i} className="admin-comment-item">
                                                    <p className="comment-date">Version {v.versionNumber} - {formatDate(v.submittedAt || selected.createdAt)}</p>
                                                    {v.responseNote && <p className="comment-text"><strong>Réponse auteur:</strong> {v.responseNote}</p>}
                                                    <button className="btn btn-secondary btn-small" onClick={() => downloadPDF(selected._id, v.versionNumber)}>
                                                        Télécharger cette version
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="admin-empty">Aucune version disponible.</div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
