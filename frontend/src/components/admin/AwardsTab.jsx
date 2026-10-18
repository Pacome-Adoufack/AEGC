import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../Url";

const EMPTY_FORM = {
    category: "",
    year: new Date().getFullYear(),
    laureate: "",
    affiliation: "",
    profileUrl: "",
    citation: "",
    categoryRank: 0,
    isPublished: false,
};

// Suggestions de départ, utilisées tant qu'aucun prix n'existe en base. Le nom
// reste libre : le bureau peut renommer ou en ajouter sans passer par le code.
const DEFAULT_CATEGORIES = [
    "Prix du meilleur chercheur",
    "Prix jeune talent",
    "Prix innovation scientifique",
];

export default function AwardsTab({ token, setMessage, openConfirm }) {
    const [awards, setAwards] = useState([]);
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [documentFile, setDocumentFile] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

    const set = (field) => (e) =>
        setForm((p) => ({ ...p, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/awards`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || "Chargement impossible");
            setAwards(payload.data || []);
            if (payload.categories?.length) setCategories(payload.categories);
        } catch (err) {
            setMessage(`Erreur: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [token, setMessage]);

    useEffect(() => { load(); }, [load]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setDocumentFile(null);
        setPhotoFile(null);
        setEditingId(null);
        setFormError("");
    };

    const startEdit = (award) => {
        setForm({
            category: award.category,
            year: award.year,
            laureate: award.laureate,
            affiliation: award.affiliation || "",
            profileUrl: award.profileUrl || "",
            citation: award.citation || "",
            categoryRank: award.categoryRank || 0,
            isPublished: award.isPublished,
        });
        setDocumentFile(null);
        setPhotoFile(null);
        setFormError("");
        setEditingId(award._id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category.trim() || !form.laureate.trim()) {
            setFormError("Le prix et le lauréat sont requis");
            return;
        }

        const fd = new FormData();
        fd.append("category", form.category.trim());
        fd.append("year", form.year);
        fd.append("laureate", form.laureate.trim());
        fd.append("affiliation", form.affiliation.trim());
        fd.append("profileUrl", form.profileUrl.trim());
        fd.append("citation", form.citation.trim());
        fd.append("categoryRank", form.categoryRank);
        fd.append("isPublished", form.isPublished);
        if (documentFile) fd.append("document", documentFile);
        if (photoFile) fd.append("photo", photoFile);

        setSubmitting(true);
        setFormError("");
        try {
            const url = editingId
                ? `${API_BASE_URL}/api/admin/awards/${editingId}`
                : `${API_BASE_URL}/api/admin/awards`;
            const res = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload.error || "Enregistrement impossible");

            setMessage(editingId ? "Lauréat mis à jour" : "Lauréat enregistré");
            setShowForm(false);
            resetForm();
            load();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const togglePublished = async (award) => {
        const fd = new FormData();
        fd.append("isPublished", !award.isPublished);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/awards/${award._id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload.error || "Mise à jour impossible");
            setMessage(award.isPublished ? "Lauréat masqué" : "Lauréat visible sur le site");
            load();
        } catch (err) {
            setMessage(`Erreur: ${err.message}`);
        }
        setTimeout(() => setMessage(""), 3000);
    };

    const askDelete = (award) =>
        openConfirm({
            title: "Supprimer ce lauréat",
            message: `Supprimer « ${award.category} ${award.year} — ${award.laureate} » ?`,
            onConfirm: async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/admin/awards/${award._id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const payload = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(payload.error || "Suppression impossible");
                    setMessage("Lauréat supprimé");
                    load();
                } catch (err) {
                    setMessage(`Erreur: ${err.message}`);
                }
                setTimeout(() => setMessage(""), 3000);
            },
        });

    // Groupement par année pour l'affichage, le serveur renvoyant une liste à plat.
    const byYear = awards.reduce((acc, award) => {
        (acc[award.year] = acc[award.year] || []).push(award);
        return acc;
    }, {});
    const years = Object.keys(byYear).sort((a, b) => b - a);

    return (
        <div className="announcements-section">
            <div className="announcements-section-header">
                <div>
                    <h2>Prix et lauréats</h2>
                    <p className="announcements-section-subtitle">
                        {awards.length} lauréat{awards.length !== 1 ? "s" : ""} enregistré{awards.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button
                    className="btn-create-announcement"
                    onClick={() => { resetForm(); setShowForm((v) => !v); }}
                >
                    {showForm ? "Annuler" : "+ Enregistrer un lauréat"}
                </button>
            </div>

            {showForm && (
                <form className="announcements-form" onSubmit={handleSubmit}>
                    <h3>{editingId ? "Modifier le lauréat" : "Nouveau lauréat"}</h3>

                    {formError && <div className="ann-form-error">{formError}</div>}

                    <div className="announcements-grid-2">
                        <div>
                            <label>Prix</label>
                            {/* Liste ouverte : on choisit un prix existant ou on en saisit un nouveau. */}
                            <input type="text" list="award-categories" value={form.category} onChange={set("category")} required />
                            <datalist id="award-categories">
                                {categories.map((c) => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <div>
                            <label>Année</label>
                            <input type="text" inputMode="numeric" value={form.year} onChange={set("year")} required />
                        </div>
                    </div>

                    <div className="announcements-grid-2">
                        <div>
                            <label>Lauréat</label>
                            <input type="text" value={form.laureate} onChange={set("laureate")} required />
                        </div>
                        <div>
                            <label>Affiliation</label>
                            <input type="text" value={form.affiliation} onChange={set("affiliation")} />
                        </div>
                    </div>

                    <div className="announcements-grid-2">
                        <div>
                            <label>Profil académique (facultatif)</label>
                            {/* Champ séparé : collée dans le nom, l'adresse s'affichait
                                en clair sur la carte. */}
                            <input
                                type="text"
                                placeholder="https://scholar.google.com/citations?user=..."
                                value={form.profileUrl}
                                onChange={set("profileUrl")}
                            />
                        </div>
                    </div>

                    <label>Motivation du jury</label>
                    <textarea rows="3" value={form.citation} onChange={set("citation")} />

                    <div className="announcements-grid-2">
                        <div>
                            <label>Photo du lauréat (facultatif)</label>
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhotoFile(e.target.files[0] || null)} />
                        </div>
                        <div>
                            <label>Document PDF (facultatif)</label>
                            <input type="file" accept="application/pdf" onChange={(e) => setDocumentFile(e.target.files[0] || null)} />
                        </div>
                    </div>

                    <div className="announcements-grid-2">
                        <div>
                            <label>Ordre d&apos;affichage</label>
                            <input type="text" inputMode="numeric" value={form.categoryRank} onChange={set("categoryRank")} />
                        </div>
                    </div>

                    <div className="announcements-checkboxes">
                        <label className="visibility-toggle">
                            <input type="checkbox" checked={form.isPublished} onChange={set("isPublished")} />
                            <span>Visible sur le site — décoché, le lauréat reste en brouillon</span>
                        </label>
                    </div>

                    <div className="announcements-actions">
                        <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); resetForm(); }}>Annuler</button>
                        <button type="submit" className="btn-confirm" disabled={submitting}>
                            {submitting ? "Enregistrement…" : "Enregistrer"}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="announcements-empty">Chargement…</div>
            ) : awards.length === 0 ? (
                <div className="announcements-empty">
                    Aucun lauréat enregistré. La page des prix et le bandeau d&apos;accueil
                    restent masqués tant qu&apos;aucun lauréat n&apos;est publié.
                </div>
            ) : (
                years.map((year) => (
                    <div key={year} className="awards-admin-year">
                        <h3>{year}</h3>
                        {byYear[year].map((award) => (
                            <div key={award._id} className="awards-admin-row">
                                <div className="awards-admin-info">
                                    <strong>{award.category}</strong>
                                    <span>{award.laureate}{award.affiliation ? ` — ${award.affiliation}` : ""}</span>
                                </div>
                                <span className={`award-state-chip ${award.isPublished ? "on" : "off"}`}>
                                    {award.isPublished ? "Visible" : "Brouillon"}
                                </span>
                                <div className="awards-admin-actions">
                                    <button className="btn-cancel" onClick={() => togglePublished(award)}>
                                        {award.isPublished ? "Masquer" : "Publier"}
                                    </button>
                                    <button className="btn-cancel" onClick={() => startEdit(award)}>Modifier</button>
                                    <button className="btn-delete" onClick={() => askDelete(award)}>Supprimer</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))
            )}
        </div>
    );
}
