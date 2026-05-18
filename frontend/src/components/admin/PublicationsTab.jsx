import { useState } from "react";
import { getAuthToken } from "../../utils/auth";
import { API_BASE_URL } from "../Url";
import { formatDate } from "./wpConstants";

const EMPTY_FORM = { title: "", summary: "", status: "draft", acceptedCount: "", rejectedCount: "", file: null };

export default function PublicationsTab({ publications, toast, openConfirm, onRefresh }) {
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);

    const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { toast.error("Le titre est obligatoire"); return; }
        if (!form.file) { toast.error("Veuillez sélectionner un PDF"); return; }
        try {
            setSubmitting(true);
            const token = getAuthToken();
            const fd = new FormData();
            fd.append("title", form.title.trim());
            fd.append("summary", form.summary.trim());
            fd.append("status", form.status);
            if (form.acceptedCount !== "") fd.append("acceptedCount", form.acceptedCount);
            if (form.rejectedCount !== "") fd.append("rejectedCount", form.rejectedCount);
            fd.append("file", form.file);
            const res = await fetch(`${API_BASE_URL}/api/admin/publications`, {
                method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error || "Erreur lors de la création");
            toast.success(d.message || "Publication enregistrée");
            setShowCreate(false);
            setForm(EMPTY_FORM);
            onRefresh();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (pub) => {
        try {
            const token = getAuthToken();
            const newStatus = pub.status === "published" ? "draft" : "published";
            const res = await fetch(`${API_BASE_URL}/api/admin/publications/${pub._id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.error || "Erreur lors de la mise à jour");
            toast.success(d.message || "Statut mis à jour");
            onRefresh();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = (pub) =>
        openConfirm({
            title: "Supprimer la publication",
            message: `Supprimer la publication "${pub.title}" ?`,
            onConfirm: async () => {
                try {
                    const token = getAuthToken();
                    const res = await fetch(`${API_BASE_URL}/api/admin/publications/${pub._id}`, {
                        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || "Erreur lors de la suppression");
                    toast.success(d.message || "Publication supprimée");
                    onRefresh();
                } catch (err) {
                    toast.error(err.message);
                }
            },
            type: "danger",
        });

    return (
        <>
            <div className="admin-section-card">
                {publications.length === 0 ? (
                    <div className="admin-empty">Aucune publication éditoriale pour le moment.</div>
                ) : (
                    <div className="wp-table">
                        {publications.map((pub) => (
                            <div key={pub._id} className="admin-wp-card">
                                <div className={`admin-wp-card-accent ${pub.status === "published" ? "ouvert" : "cloture"}`} />
                                <div className="admin-wp-card-inner">
                                    <div className="admin-wp-info">
                                        <h3>{pub.title}</h3>
                                        <div className="admin-wp-meta">
                                            <span className="meta-chip">Statut : <strong>{pub.status === "published" ? "Publié" : "Brouillon"}</strong></span>
                                            <span className="meta-chip">Date : <strong>{formatDate(pub.publishedAt || pub.createdAt)}</strong></span>
                                        </div>
                                        {pub.summary && (
                                            <p style={{ marginTop: "0.5rem", color: "#475569" }}>
                                                {pub.summary.length > 220 ? `${pub.summary.substring(0, 220)}...` : pub.summary}
                                            </p>
                                        )}
                                        {(pub.stats?.acceptedCount !== undefined || pub.stats?.rejectedCount !== undefined) && (
                                            <div className="admin-wp-meta" style={{ marginTop: "0.5rem" }}>
                                                {pub.stats?.acceptedCount !== undefined && <span className="meta-chip">Acceptés : <strong>{pub.stats.acceptedCount}</strong></span>}
                                                {pub.stats?.rejectedCount !== undefined && <span className="meta-chip">Rejetés : <strong>{pub.stats.rejectedCount}</strong></span>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="admin-wp-actions">
                                        {pub.status === "published" ? (
                                            <a className="btn btn-secondary btn-small" href={`${API_BASE_URL}/api/publications/${pub._id}/download`} target="_blank" rel="noreferrer">PDF</a>
                                        ) : (
                                            <span className="meta-chip">PDF privé (brouillon)</span>
                                        )}
                                        <button className="btn btn-secondary btn-small" onClick={() => toggleStatus(pub)}>
                                            {pub.status === "published" ? "Dépublier" : "Publier"}
                                        </button>
                                        <button className="btn btn-danger btn-small" onClick={() => handleDelete(pub)}>Supprimer</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreate && (
                <div className="admin-modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>Nouvelle publication éditoriale</h2>
                            <button className="admin-modal-close" onClick={() => setShowCreate(false)}>x</button>
                        </div>
                        <div className="admin-modal-body">
                            <form onSubmit={handleCreate}>
                                <div className="form-group"><label>Titre</label><input type="text" value={form.title} onChange={set("title")} required placeholder="Ex : Revue trimestrielle AEGC - Juin 2026" /></div>
                                <div className="form-group"><label>Résumé éditorial</label><textarea value={form.summary} onChange={set("summary")} rows="6" placeholder="Résumé des travaux retenus..." /></div>
                                <div className="form-group"><label>Fichier PDF</label><input type="file" accept="application/pdf" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} required /></div>
                                <div className="form-group">
                                    <label>Statistiques (optionnel)</label>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                        <input type="number" min="0" value={form.acceptedCount} onChange={set("acceptedCount")} placeholder="Nombre acceptés" />
                                        <input type="number" min="0" value={form.rejectedCount} onChange={set("rejectedCount")} placeholder="Nombre rejetés" />
                                    </div>
                                </div>
                                <div className="form-group"><label>Statut initial</label><select value={form.status} onChange={set("status")}><option value="draft">Brouillon</option><option value="published">Publié immédiatement</option></select></div>
                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }}>Annuler</button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Publication..." : "Enregistrer"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <button id="pub-tab-create-btn" style={{ display: "none" }} onClick={() => setShowCreate(true)} />
        </>
    );
}
