import { useState } from "react";
import { getAuthToken } from "../../utils/auth";
import { API_BASE_URL } from "../Url";
import {
    JEL_OPTIONS, JEL_CODE_REGEX,
    normalizeJelCode, buildUsefulLinksFromText, formatDate,
} from "./wpConstants";

const EMPTY_WP = {
    title: "", subtitle: "", organizer: "", description: "",
    deadline: "", status: "ouvert", manuscriptLength: "", language: "francais",
    submissionRequirements: "", jelCodes: [], contactEmail: "",
    contactPhone: "", contactWebsite: "", contactLinkedin: "", usefulLinksText: "",
};

const TOTAL_STEPS = 3;

export default function WorkingPapersTab({ workingPapers, isAdmin, toast, openConfirm, onRefresh }) {
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [createStep, setCreateStep] = useState(1);
    const [newWP, setNewWP] = useState(EMPTY_WP);
    const [editWP, setEditWP] = useState({ ...EMPTY_WP, id: "" });
    const [newJelSelect, setNewJelSelect] = useState("");
    const [newJelCustom, setNewJelCustom] = useState("");
    const [editJelSelect, setEditJelSelect] = useState("");
    const [editJelCustom, setEditJelCustom] = useState("");

    const setNew = (field) => (e) => setNewWP((p) => ({ ...p, [field]: e.target.value }));
    const setEdit = (field) => (e) => setEditWP((p) => ({ ...p, [field]: e.target.value }));

    const resetCreate = () => {
        setCreateStep(1);
        setNewWP(EMPTY_WP);
        setNewJelSelect("");
        setNewJelCustom("");
    };

    const validate = (step, wp) => {
        if (step === 1) {
            if (!wp.title.trim()) { toast.error("Veuillez renseigner le titre de l'appel"); return false; }
            if (!wp.organizer.trim()) { toast.error("Veuillez renseigner l'organisation porteuse"); return false; }
            if (!wp.deadline) { toast.error("Veuillez renseigner la date limite"); return false; }
        }
        if (step === 2) {
            if (!wp.description.trim()) { toast.error("Veuillez renseigner le résumé de l'appel"); return false; }
            if (!wp.language) { toast.error("Veuillez sélectionner une langue"); return false; }
            if (!wp.submissionRequirements.trim()) { toast.error("Veuillez renseigner les exigences de soumission"); return false; }
        }
        if (step === 3) {
            if (wp.jelCodes.length === 0) { toast.error("Veuillez ajouter au moins un code JEL"); return false; }
            if (!wp.contactEmail.trim()) { toast.error("Veuillez renseigner l'email de contact"); return false; }
        }
        return true;
    };

    const addJelCode = (target, rawCode, isCustom = false) => {
        const code = normalizeJelCode(rawCode);
        if (!code) return;
        if (isCustom && !JEL_CODE_REGEX.test(code)) {
            toast.error("Format JEL invalide. Utilisez une lettre suivie de 2 chiffres (ex: E52)");
            return;
        }
        if (target === "create") {
            if (newWP.jelCodes.includes(code)) return;
            setNewWP((p) => ({ ...p, jelCodes: [...p.jelCodes, code] }));
            isCustom ? setNewJelCustom("") : setNewJelSelect("");
        } else {
            if (editWP.jelCodes.includes(code)) return;
            setEditWP((p) => ({ ...p, jelCodes: [...p.jelCodes, code] }));
            isCustom ? setEditJelCustom("") : setEditJelSelect("");
        }
    };

    const removeJelCode = (target, code) => {
        const norm = normalizeJelCode(code);
        if (target === "create") setNewWP((p) => ({ ...p, jelCodes: p.jelCodes.filter((c) => c !== norm) }));
        else setEditWP((p) => ({ ...p, jelCodes: p.jelCodes.filter((c) => c !== norm) }));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (createStep < TOTAL_STEPS) {
            if (validate(createStep, newWP)) setCreateStep((s) => s + 1);
            return;
        }
        if (!validate(TOTAL_STEPS, newWP)) return;
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_BASE_URL}/api/admin/working-papers`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...newWP, usefulLinks: buildUsefulLinksFromText(newWP.usefulLinksText) }),
            });
            if (res.ok) {
                setShowCreate(false);
                resetCreate();
                onRefresh();
                toast.success("Appel créé avec succès !");
            } else {
                const d = await res.json();
                toast.error(`Erreur: ${d.error || "Erreur inconnue"}`);
            }
        } catch (err) {
            toast.error(`Erreur lors de la création: ${err.message}`);
        }
    };

    const startEdit = (wp) => {
        setEditWP({
            id: wp._id, title: wp.title, subtitle: wp.subtitle || "",
            organizer: wp.organizer || "", description: wp.description,
            deadline: wp.deadline.split("T")[0], status: wp.status,
            manuscriptLength: wp.manuscriptLength || "", language: wp.language || "francais",
            submissionRequirements: wp.submissionRequirements || "",
            jelCodes: Array.isArray(wp.jelCodes) ? wp.jelCodes : [],
            contactEmail: wp.contact?.email || "", contactPhone: wp.contact?.phone || "",
            contactWebsite: wp.contact?.website || "", contactLinkedin: wp.contact?.linkedin || "",
            usefulLinksText: Array.isArray(wp.usefulLinks) ? wp.usefulLinks.join("\n") : "",
        });
        setEditJelSelect("");
        setEditJelCustom("");
        setShowEdit(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = getAuthToken();
            const res = await fetch(`${API_BASE_URL}/api/admin/working-papers/${editWP.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    title: editWP.title, subtitle: editWP.subtitle, organizer: editWP.organizer,
                    description: editWP.description, deadline: editWP.deadline, status: editWP.status,
                    manuscriptLength: editWP.manuscriptLength, language: editWP.language,
                    submissionRequirements: editWP.submissionRequirements, jelCodes: editWP.jelCodes,
                    contactEmail: editWP.contactEmail, contactPhone: editWP.contactPhone,
                    contactWebsite: editWP.contactWebsite, contactLinkedin: editWP.contactLinkedin,
                    usefulLinks: buildUsefulLinksFromText(editWP.usefulLinksText),
                }),
            });
            if (res.ok) { setShowEdit(false); onRefresh(); toast.success("Appel mis à jour !"); }
            else { const d = await res.json(); toast.error(`Erreur: ${d.error || "Erreur inconnue"}`); }
        } catch (err) {
            toast.error(`Erreur: ${err.message}`);
        }
    };

    const handleDelete = (wp) =>
        openConfirm({
            title: "Supprimer l'appel",
            message: `Supprimer le Working Paper "${wp.title}" ?`,
            onConfirm: async () => {
                try {
                    const token = getAuthToken();
                    const res = await fetch(`${API_BASE_URL}/api/admin/working-papers/${wp._id}`, {
                        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error || "Erreur lors de la suppression");
                    toast.success(d.message || "Working Paper supprimé");
                    onRefresh();
                } catch (err) {
                    toast.error(err.message);
                }
            },
            type: "danger",
        });

    const JelField = ({ target, jelSelect, setJelSelect, jelCustom, setJelCustom, jelCodes }) => (
        <div className="form-group">
            <label>Codes JEL</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <select value={jelSelect} onChange={(e) => setJelSelect(e.target.value)}>
                    <option value="">Selectionner un code JEL</option>
                    {JEL_OPTIONS.map((o) => <option key={o.code} value={o.code}>{o.code} - {o.label}</option>)}
                </select>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => addJelCode(target, jelSelect)}>Ajouter</button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <input type="text" value={jelCustom} onChange={(e) => setJelCustom(e.target.value)} placeholder="Autre code (ex: D83)" />
                <button type="button" className="btn btn-secondary btn-small" onClick={() => addJelCode(target, jelCustom, true)}>Ajouter autre</button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {jelCodes.map((code) => (
                    <span key={code} className="meta-chip" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                        {code}
                        <button type="button" onClick={() => removeJelCode(target, code)} style={{ border: "none", background: "transparent", cursor: "pointer" }} aria-label={`Retirer ${code}`}>x</button>
                    </span>
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div className="admin-section-card">
                <div className="wp-table">
                    {workingPapers.length === 0 ? (
                        <div className="admin-empty">Aucun appel pour le moment.</div>
                    ) : workingPapers.map((wp) => (
                        <div key={wp._id} className="admin-wp-card">
                            <div className={`admin-wp-card-accent ${wp.status === "ouvert" ? "ouvert" : "cloture"}`} />
                            <div className="admin-wp-card-inner">
                                <div className="admin-wp-info">
                                    <h3>{wp.title}</h3>
                                    <div className="admin-wp-meta">
                                        <span className="meta-chip">Deadline : <strong>{formatDate(wp.deadline)}</strong></span>
                                        <span className="meta-chip">
                                            <span className={`wp-status ${wp.status === "ouvert" ? "open" : "closed"}`}>
                                                {wp.status === "ouvert" ? "Ouvert" : "Cloturé"}
                                            </span>
                                        </span>
                                        <span className="meta-chip">{wp.submissionsCount} soumission{wp.submissionsCount !== 1 ? "s" : ""}</span>
                                    </div>
                                </div>
                                <div className="admin-wp-actions">
                                    <button className="btn btn-secondary btn-small" onClick={() => startEdit(wp)}>Modifier</button>
                                    <button className="btn btn-danger btn-small" onClick={() => handleDelete(wp)}>Supprimer</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modale création */}
            {showCreate && (
                <div className="admin-modal-overlay" onClick={() => { setShowCreate(false); resetCreate(); }}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>Créer un appel à contribution</h2>
                            <button className="admin-modal-close" onClick={() => { setShowCreate(false); resetCreate(); }}>x</button>
                        </div>
                        <div className="admin-modal-body">
                            <form onSubmit={handleCreate}>
                                <div className="wp-stepper">
                                    {[1, 2, 3].map((s) => (
                                        <div key={s} className={`wp-step ${createStep >= s ? "active" : ""}`}>
                                            <span>{s}</span>
                                            <p>{["Général", "Résumé", "JEL"][s - 1]}</p>
                                        </div>
                                    ))}
                                </div>

                                {createStep === 1 && (
                                    <div className="wp-step-panel">
                                        <p className="wp-step-note">Étape 1 sur 3 - informations principales</p>
                                        <div className="form-group"><label>Titre de l&apos;appel</label><input type="text" value={newWP.title} onChange={setNew("title")} required placeholder="Ex : Appel à contributions - Economie comportementale" /></div>
                                        <div className="form-group"><label>Sous-titre</label><input type="text" value={newWP.subtitle} onChange={setNew("subtitle")} /></div>
                                        <div className="form-group"><label>Organisation porteuse</label><input type="text" value={newWP.organizer} onChange={setNew("organizer")} required /></div>
                                        <div className="form-group"><label>Statut</label><select value={newWP.status} onChange={setNew("status")} required><option value="ouvert">Ouvert</option><option value="clôturé">Clôturé</option></select></div>
                                        <div className="form-group"><label>Date limite</label><input type="date" value={newWP.deadline} onChange={setNew("deadline")} required /></div>
                                    </div>
                                )}

                                {createStep === 2 && (
                                    <div className="wp-step-panel">
                                        <p className="wp-step-note">Étape 2 sur 3 - contenu principal</p>
                                        <div className="form-group"><label>Résumé de l&apos;appel</label><textarea value={newWP.description} onChange={setNew("description")} rows="8" required placeholder="Présentation, objectifs, contexte..." /></div>
                                        <div className="form-group"><label>Longueur des manuscrits</label><input type="text" value={newWP.manuscriptLength} onChange={setNew("manuscriptLength")} placeholder="Ex : 15 à 50 pages" /></div>
                                        <div className="form-group"><label>Langue</label><select value={newWP.language} onChange={setNew("language")} required><option value="francais">🇫🇷 Français</option><option value="anglais">🇬🇧 English</option></select></div>
                                        <div className="form-group"><label>Exigences de soumission</label><textarea value={newWP.submissionRequirements} onChange={setNew("submissionRequirements")} rows="5" required /></div>
                                    </div>
                                )}

                                {createStep === 3 && (
                                    <div className="wp-step-panel">
                                        <p className="wp-step-note">Étape 3 sur 3 - JEL, contact et liens</p>
                                        <JelField target="create" jelSelect={newJelSelect} setJelSelect={setNewJelSelect} jelCustom={newJelCustom} setJelCustom={setNewJelCustom} jelCodes={newWP.jelCodes} />
                                        <div className="form-group"><label>Email de contact</label><input type="email" value={newWP.contactEmail} onChange={setNew("contactEmail")} /></div>
                                        <div className="form-group"><label>Téléphone</label><input type="text" value={newWP.contactPhone} onChange={setNew("contactPhone")} /></div>
                                        <div className="form-group"><label>Site web</label><input type="text" value={newWP.contactWebsite} onChange={setNew("contactWebsite")} /></div>
                                        <div className="form-group"><label>LinkedIn</label><input type="text" value={newWP.contactLinkedin} onChange={setNew("contactLinkedin")} /></div>
                                        <div className="form-group"><label>Liens utiles</label><textarea value={newWP.usefulLinksText} onChange={setNew("usefulLinksText")} rows="4" placeholder="Un lien par ligne" /></div>
                                    </div>
                                )}

                                <div className="wp-step-summary">
                                    <div><strong>Titre:</strong> {newWP.title || "-"}</div>
                                    <div><strong>Organisation:</strong> {newWP.organizer || "-"}</div>
                                    <div><strong>Date limite:</strong> {newWP.deadline || "-"}</div>
                                    <div><strong>JEL:</strong> {newWP.jelCodes.length > 0 ? newWP.jelCodes.join(", ") : "Aucun"}</div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); resetCreate(); }}>Annuler</button>
                                    {createStep > 1 && <button type="button" className="btn btn-secondary" onClick={() => setCreateStep((s) => s - 1)}>Précédent</button>}
                                    {createStep < TOTAL_STEPS
                                        ? <button type="button" className="btn btn-primary" onClick={() => { if (validate(createStep, newWP)) setCreateStep((s) => s + 1); }}>Suivant</button>
                                        : <button type="submit" className="btn btn-primary">Créer l&apos;appel</button>}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modale modification */}
            {showEdit && (
                <div className="admin-modal-overlay" onClick={() => setShowEdit(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h2>Modifier l&apos;appel</h2>
                            <button className="admin-modal-close" onClick={() => setShowEdit(false)}>x</button>
                        </div>
                        <div className="admin-modal-body">
                            <form onSubmit={handleUpdate}>
                                <div className="form-group"><label>Titre</label><input type="text" value={editWP.title} onChange={setEdit("title")} required /></div>
                                <div className="form-group"><label>Sous-titre</label><input type="text" value={editWP.subtitle} onChange={setEdit("subtitle")} /></div>
                                <div className="form-group"><label>Organisation porteuse</label><input type="text" value={editWP.organizer} onChange={setEdit("organizer")} required /></div>
                                <div className="form-group"><label>Résumé</label><textarea value={editWP.description} onChange={setEdit("description")} rows="8" required /></div>
                                <div className="form-group"><label>Longueur des manuscrits</label><input type="text" value={editWP.manuscriptLength} onChange={setEdit("manuscriptLength")} /></div>
                                <div className="form-group"><label>Langue</label><select value={editWP.language} onChange={setEdit("language")}><option value="francais">🇫🇷 Français</option><option value="anglais">🇬🇧 English</option></select></div>
                                <div className="form-group"><label>Exigences de soumission</label><textarea value={editWP.submissionRequirements} onChange={setEdit("submissionRequirements")} rows="5" /></div>
                                <div className="form-group"><label>Date limite</label><input type="date" value={editWP.deadline} onChange={setEdit("deadline")} required /></div>
                                <div className="form-group"><label>Statut</label><select value={editWP.status} onChange={setEdit("status")}><option value="ouvert">Ouvert</option><option value="clôturé">Clôturé</option></select></div>
                                <JelField target="edit" jelSelect={editJelSelect} setJelSelect={setEditJelSelect} jelCustom={editJelCustom} setJelCustom={setEditJelCustom} jelCodes={editWP.jelCodes} />
                                <div className="form-group"><label>Email de contact</label><input type="email" value={editWP.contactEmail} onChange={setEdit("contactEmail")} /></div>
                                <div className="form-group"><label>Téléphone</label><input type="text" value={editWP.contactPhone} onChange={setEdit("contactPhone")} /></div>
                                <div className="form-group"><label>Site web</label><input type="text" value={editWP.contactWebsite} onChange={setEdit("contactWebsite")} /></div>
                                <div className="form-group"><label>LinkedIn</label><input type="text" value={editWP.contactLinkedin} onChange={setEdit("contactLinkedin")} /></div>
                                <div className="form-group"><label>Liens utiles</label><textarea value={editWP.usefulLinksText} onChange={setEdit("usefulLinksText")} rows="4" /></div>
                                <div className="wp-step-summary">
                                    <div><strong>Titre:</strong> {editWP.title || "-"}</div>
                                    <div><strong>Organisation:</strong> {editWP.organizer || "-"}</div>
                                    <div><strong>Date limite:</strong> {editWP.deadline || "-"}</div>
                                    <div><strong>JEL:</strong> {editWP.jelCodes.length > 0 ? editWP.jelCodes.join(", ") : "Aucun"}</div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-primary">Enregistrer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isAdmin && (
                <button className="btn btn-primary btn-small" style={{ display: "none" }} id="wp-tab-create-btn" onClick={() => { resetCreate(); setShowCreate(true); }} />
            )}
        </>
    );
}

export { WorkingPapersTab };
