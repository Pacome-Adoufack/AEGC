import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../Url";
import { getAuthToken } from "../../utils/auth";
import CommitteeFormModal from "./CommitteeFormModal";
import {
    EMPTY_FORM, SORT_OPTIONS,
    detectAcademicTitle, stripAcademicTitle, composeFullName,
} from "./committeeUtils";
import "@/styles/committee.css";

function WorkingPapersCommittee() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [titleFilter, setTitleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("displayOrder_asc");
    const [selectedMember, setSelectedMember] = useState(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [deleteCandidate, setDeleteCandidate] = useState(null);

    const token = getAuthToken();
    const storedUser = useMemo(() => {
        try { return JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null"); }
        catch { return null; }
    }, []);

    const canManage = !!token && storedUser?.role === "dev";

    useEffect(() => { fetchMembers(); }, [canManage]);

    const fetchMembers = async () => {
        setLoading(true);
        setError("");
        try {
            const endpoint = canManage
                ? `${API_BASE_URL}/api/admin/committee-members`
                : `${API_BASE_URL}/api/committee-members`;
            const res = await fetch(endpoint, { headers: canManage ? { Authorization: `Bearer ${token}` } : undefined });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors du chargement des membres");
            setMembers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const closeFormModal = () => { setIsFormModalOpen(false); setEditingId(null); setForm(EMPTY_FORM); setError(""); };
    const openCreateModal = () => { setSelectedMember(null); setEditingId(null); setForm(EMPTY_FORM); setIsFormModalOpen(true); };

    const handleEdit = (member) => {
        setEditingId(member._id);
        setForm({
            fullName: stripAcademicTitle(member.fullName || ""),
            academicTitle: detectAcademicTitle(member.fullName),
            roleTitle: member.roleTitle || "",
            affiliation: member.affiliation || "",
            email: member.email || "",
            profileLink: member.profileLink || "",
            displayOrder: member.displayOrder || 0,
            isActive: member.isActive !== false,
        });
        setSelectedMember(null);
        setIsFormModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.fullName.trim()) { setError("Le nom complet est requis"); return; }
        setSaving(true);
        setError("");
        try {
            const payload = {
                ...form,
                fullName: composeFullName(form.academicTitle, form.fullName),
                profileLink: form.profileLink.trim(),
                email: form.email.trim(),
                displayOrder: Number(form.displayOrder) || 0,
            };
            const isEdit = Boolean(editingId);
            const endpoint = isEdit
                ? `${API_BASE_URL}/api/admin/committee-members/${editingId}`
                : `${API_BASE_URL}/api/admin/committee-members`;
            const res = await fetch(endpoint, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement");
            await fetchMembers();
            closeFormModal();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteCandidate?._id) return;
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/committee-members/${deleteCandidate._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de la suppression");
            await fetchMembers();
            if (editingId === deleteCandidate._id) closeFormModal();
            setDeleteCandidate(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const enrichedMembers = useMemo(() =>
        members.map((m) => ({
            ...m,
            detectedTitle: detectAcademicTitle(m.fullName),
            cleanName: stripAcademicTitle(m.fullName),
            displayRank: Number(m.displayOrder || 0),
        })),
        [members],
    );

    const categories = useMemo(() => {
        const values = enrichedMembers.map((m) => (m.roleTitle || "").trim()).filter(Boolean);
        return [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
    }, [enrichedMembers]);

    const roleOptions = useMemo(() => {
        const values = [...categories];
        const current = String(form.roleTitle || "").trim();
        if (current && !values.includes(current)) values.unshift(current);
        return values;
    }, [categories, form.roleTitle]);

    const academicTitles = useMemo(() => {
        const values = enrichedMembers.map((m) => m.detectedTitle).filter(Boolean);
        return [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
    }, [enrichedMembers]);

    const filteredMembers = useMemo(() => {
        const norm = (v) => String(v || "").toLowerCase();
        const term = norm(searchTerm.trim());

        const base = enrichedMembers.filter((m) => {
            if (canManage && statusFilter === "active" && m.isActive !== true) return false;
            if (canManage && statusFilter === "inactive" && m.isActive !== false) return false;
            if (categoryFilter !== "all" && (m.roleTitle || "") !== categoryFilter) return false;
            if (canManage && titleFilter !== "all" && m.detectedTitle !== titleFilter) return false;
            if (!term) return true;
            return [m.fullName, m.cleanName, m.roleTitle, m.affiliation, m.email, m.detectedTitle]
                .some((v) => norm(v).includes(term));
        });

        const sorted = [...base];
        const [field, direction] = sortBy.split("_");
        const factor = direction === "desc" ? -1 : 1;
        sorted.sort((a, b) => {
            if (field === "displayOrder") {
                const aO = Number(a.displayOrder || 0), bO = Number(b.displayOrder || 0);
                if (aO === 0 && bO !== 0) return 1;
                if (aO !== 0 && bO === 0) return -1;
                return (aO - bO) * factor;
            }
            return String(a[field] || "").localeCompare(String(b[field] || ""), "fr", { sensitivity: "base" }) * factor;
        });
        return sorted;
    }, [enrichedMembers, searchTerm, categoryFilter, titleFilter, statusFilter, sortBy, canManage]);

    if (loading) return <div className="loading">Chargement des membres du comité...</div>;

    return (
        <div className="working-papers-container" style={{ paddingTop: "0.5rem" }}>
            <p className="committee-intro">
                Le comité scientifique des Working Papers de l'AEGC (Association des Économistes et Gestionnaires du Cameroun)
            </p>
            <p className="committee-intro">
                Il est composé de professeurs, de chercheurs titulaires d'un doctorat (PhD) et de membres internes de l'AEGC,
                issus d'universités et d'institutions académiques nationales et internationales. Il est chargé d'assurer
                l'évaluation scientifique, la rigueur académique et la qualité des travaux soumis, sous la coordination de
                l'éditeur en chef.
            </p>

            <div className="wp-header committee-header" style={{ marginBottom: "1rem" }}>
                <h1>Comité scientifique</h1>
                {canManage && (
                    <button type="button" className="btn btn-primary committee-add-button" onClick={openCreateModal}>
                        + Ajouter un membre
                    </button>
                )}
            </div>

            {error && !isFormModalOpen && <div className="error-message" style={{ marginBottom: "1rem" }}>{error}</div>}

            {/* Toolbar filtres */}
            <div className="committee-toolbar">
                <div className="committee-toolbar-item committee-toolbar-search">
                    <label htmlFor="committee-search">Recherche</label>
                    <input id="committee-search" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nom, titre, catégorie, institution..." />
                </div>
                <div className="committee-toolbar-item">
                    <label htmlFor="committee-filter-category">Catégorie</label>
                    <select id="committee-filter-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="all">Toutes</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                {canManage && (
                    <>
                        <div className="committee-toolbar-item">
                            <label htmlFor="committee-filter-title">Titre académique</label>
                            <select id="committee-filter-title" value={titleFilter} onChange={(e) => setTitleFilter(e.target.value)}>
                                <option value="all">Tous</option>
                                {academicTitles.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="committee-toolbar-item">
                            <label htmlFor="committee-filter-status">Statut</label>
                            <select id="committee-filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">Tous</option>
                                <option value="active">Actifs</option>
                                <option value="inactive">Inactifs</option>
                            </select>
                        </div>
                    </>
                )}
                <div className="committee-toolbar-item">
                    <label htmlFor="committee-sort">Tri</label>
                    <select id="committee-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="committee-summary">
                <span><strong>{filteredMembers.length}</strong> membre(s) affiché(s)</span>
                <button
                    type="button" className="btn btn-secondary btn-small"
                    onClick={() => { setSearchTerm(""); setCategoryFilter("all"); setTitleFilter("all"); setStatusFilter("all"); setSortBy("displayOrder_asc"); }}
                >
                    Réinitialiser les filtres
                </button>
            </div>

            {/* Grille membres */}
            <div className="committee-grid" style={{ marginBottom: "1.25rem" }}>
                {filteredMembers.length === 0 ? (
                    <div className="no-submissions"><p>Aucun membre ne correspond aux critères.</p></div>
                ) : (
                    filteredMembers.map((member) => (
                        <div
                            key={member._id}
                            className="committee-card committee-card-clickable"
                            role="button" tabIndex={0}
                            onClick={() => setSelectedMember(member)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedMember(member); } }}
                        >
                            <div className="committee-card-head">
                                <div>
                                    <h3 className="committee-name">{member.cleanName || member.fullName}</h3>
                                    <div className="committee-tags">
                                        {member.detectedTitle && <span className="committee-tag committee-tag-title">{member.detectedTitle}</span>}
                                        {member.roleTitle && <span className="committee-tag">{member.roleTitle}</span>}
                                    </div>
                                </div>
                                <span className={`sub-status ${member.isActive ? "status-acceptee" : "status-rejetee"}`}>
                                    {member.isActive ? "Actif" : "Inactif"}
                                </span>
                            </div>
                            <div className="committee-card-body">
                                <div className="committee-meta-item"><strong>Nom complet</strong><p>{member.fullName}</p></div>
                                {member.affiliation && <div className="committee-meta-item"><strong>Institution</strong><p>{member.affiliation}</p></div>}
                                {member.email && (
                                    <div className="committee-meta-item">
                                        <strong>Email</strong>
                                        <p><a href={`mailto:${member.email}`} onClick={(e) => e.stopPropagation()}>{member.email}</a></p>
                                    </div>
                                )}
                                {member.profileLink && (
                                    <div className="committee-meta-item">
                                        <strong>Lien de profil</strong>
                                        <p><a href={member.profileLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Ouvrir le profil</a></p>
                                    </div>
                                )}
                            </div>
                            {canManage && (
                                <div className="committee-card-actions">
                                    <button className="btn btn-secondary btn-small" onClick={(e) => { e.stopPropagation(); handleEdit(member); }}>Modifier</button>
                                    <button className="btn btn-danger btn-small" onClick={(e) => { e.stopPropagation(); setDeleteCandidate(member); }} disabled={saving}>Supprimer</button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Fiche détail */}
            {selectedMember && (
                <div className="committee-detail-overlay" onClick={() => setSelectedMember(null)}>
                    <div className="committee-detail-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="committee-detail-header">
                            <div>
                                <p className="committee-detail-kicker">Fiche membre</p>
                                <h2>{selectedMember.fullName}</h2>
                            </div>
                            <button className="committee-detail-close" onClick={() => setSelectedMember(null)}>x</button>
                        </div>
                        <div className="committee-detail-grid">
                            <div className="committee-detail-item"><strong>Catégorie / Fonction</strong><p>{selectedMember.roleTitle || "-"}</p></div>
                            <div className="committee-detail-item"><strong>Institution</strong><p>{selectedMember.affiliation || "-"}</p></div>
                            <div className="committee-detail-item">
                                <strong>Email</strong>
                                <p>{selectedMember.email ? <a href={`mailto:${selectedMember.email}`}>{selectedMember.email}</a> : "-"}</p>
                            </div>
                            <div className="committee-detail-item"><strong>Statut</strong><p>{selectedMember.isActive ? "Actif" : "Inactif"}</p></div>
                            <div className="committee-detail-item">
                                <strong>Lien de profil</strong>
                                <p>{selectedMember.profileLink ? <a href={selectedMember.profileLink} target="_blank" rel="noreferrer">Ouvrir le lien</a> : "-"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modale formulaire */}
            {canManage && isFormModalOpen && (
                <CommitteeFormModal
                    editingId={editingId}
                    form={form}
                    setForm={setForm}
                    onClose={closeFormModal}
                    onSubmit={handleSubmit}
                    saving={saving}
                    error={error}
                    roleOptions={roleOptions}
                />
            )}

            {/* Confirmation suppression */}
            {canManage && deleteCandidate && (
                <div className="committee-detail-overlay" onClick={() => setDeleteCandidate(null)}>
                    <div className="committee-delete-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="committee-detail-header">
                            <div>
                                <p className="committee-detail-kicker">Confirmation</p>
                                <h2>Supprimer ce membre ?</h2>
                            </div>
                            <button className="committee-detail-close" onClick={() => setDeleteCandidate(null)}>x</button>
                        </div>
                        <p className="committee-delete-message">
                            Cette action supprimera <strong>{deleteCandidate.fullName}</strong> du comité.
                        </p>
                        <div className="committee-delete-actions">
                            <button type="button" className="btn committee-delete-cancel" onClick={() => setDeleteCandidate(null)}>Annuler</button>
                            <button type="button" className="btn committee-delete-confirm" onClick={confirmDelete} disabled={saving}>
                                {saving ? "Suppression..." : "Supprimer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WorkingPapersCommittee;
