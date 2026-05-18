import { ACADEMIC_TITLES } from "./committeeUtils";

export default function CommitteeFormModal({ editingId, form, setForm, onClose, onSubmit, saving, error, roleOptions }) {
    const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

    return (
        <div className="committee-detail-overlay" onClick={onClose}>
            <div className="committee-detail-panel committee-form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="committee-detail-header">
                    <div>
                        <p className="committee-detail-kicker">Gestion du comité</p>
                        <h2>{editingId ? "Modifier un membre" : "Ajouter un membre"}</h2>
                    </div>
                    <button className="committee-detail-close" onClick={onClose}>x</button>
                </div>

                {error && <div className="error-message" style={{ marginBottom: "0.75rem" }}>{error}</div>}

                <form onSubmit={onSubmit} className="submission-form committee-form committee-form-inline">
                    <div className="form-section-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Titre académique</label>
                                <select value={form.academicTitle} onChange={set("academicTitle")}>
                                    {ACADEMIC_TITLES.map((t) => (
                                        <option key={t.value || "none"} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Nom (sans titre)</label>
                                <input type="text" value={form.fullName} onChange={set("fullName")} required />
                            </div>
                            <div className="form-group">
                                <label>Catégorie / Fonction</label>
                                <select value={form.roleTitle} onChange={set("roleTitle")}>
                                    <option value="">Choisir une catégorie</option>
                                    {roleOptions.map((role) => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Affiliation</label>
                                <input type="text" value={form.affiliation} onChange={set("affiliation")} placeholder="Université / Institution" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={form.email} onChange={set("email")} placeholder="adresse@mail.com" />
                            </div>
                            <div className="form-group">
                                <label>Lien Google Scholar / ResearchGate</label>
                                <input type="url" value={form.profileLink} onChange={set("profileLink")} placeholder="https://scholar.google.com/..." />
                            </div>
                            <div className="form-group">
                                <label>Ordre d'affichage</label>
                                <input type="number" value={form.displayOrder} onChange={set("displayOrder")} />
                            </div>
                        </div>

                        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input
                                id="committee-active"
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                            />
                            <label htmlFor="committee-active" style={{ margin: 0 }}>Membre actif</label>
                        </div>
                    </div>

                    <div className="committee-form-actions">
                        <button type="button" className="btn committee-form-cancel" onClick={onClose}>Annuler</button>
                        <button type="submit" className="btn committee-form-submit" disabled={saving}>
                            {saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Ajouter"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
