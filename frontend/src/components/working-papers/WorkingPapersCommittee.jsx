import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../Url";
import { getAuthToken } from "../../utils/auth";
import "@/styles/committee.css";

const emptyForm = {
    fullName: "",
    academicTitle: "",
    roleTitle: "",
    affiliation: "",
    email: "",
    profileLink: "",
    displayOrder: 0,
    isActive: true,
};

const ACADEMIC_TITLES = [
    { value: "", label: "Aucun" },
    { value: "Pr.", label: "Professeur (Pr.)" },
    { value: "Dr.", label: "Docteur (Dr.)" },
    { value: "M.", label: "Monsieur (M.)" },
    { value: "Mme", label: "Madame (Mme)" },
];

const SORT_OPTIONS = [
    { value: "displayOrder_asc", label: "Ordre (croissant)" },
    { value: "displayOrder_desc", label: "Ordre (décroissant)" },
    { value: "fullName_asc", label: "Nom (A-Z)" },
    { value: "fullName_desc", label: "Nom (Z-A)" },
    { value: "roleTitle_asc", label: "Catégorie (A-Z)" },
    { value: "affiliation_asc", label: "Institution (A-Z)" },
];

const detectAcademicTitle = (fullName = "") => {
    const trimmed = String(fullName).trim();
    if (!trimmed) return "";

    const normalized = trimmed.toLowerCase();
    if (normalized.startsWith("pr ") || normalized.startsWith("pr.")) return "Pr.";
    if (normalized.startsWith("prof ") || normalized.startsWith("prof.")) return "Pr.";
    if (normalized.startsWith("dr ") || normalized.startsWith("dr.")) return "Dr.";
    if (normalized.startsWith("docteur ")) return "Dr.";
    if (normalized.startsWith("mme ") || normalized.startsWith("mme.")) return "Mme";
    if (normalized.startsWith("mr ") || normalized.startsWith("mr.")) return "M.";
    if (normalized.startsWith("m ") || normalized.startsWith("m.")) return "M.";
    return "";
};

const stripAcademicTitle = (fullName = "") =>
    String(fullName)
        .trim()
        .replace(/^(pr\.?|prof\.?|professeur|dr\.?|docteur|mme\.?|mr\.?|m\.?)[\s-]+/i, "")
        .trim();

const composeFullName = (title, name) => {
    const cleanedName = stripAcademicTitle(name);
    if (!cleanedName) return "";
    return title ? `${title} ${cleanedName}`.trim() : cleanedName;
};

function WorkingPapersCommittee() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(emptyForm);
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
        const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (!userStr) {
            return null;
        }

        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }, []);

    const canManage = !!token && storedUser?.role === "dev";

    useEffect(() => {
        fetchMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canManage]);

    const fetchMembers = async () => {
        setLoading(true);
        setError("");

        try {
            const endpoint = canManage
                ? `${API_BASE_URL}/api/admin/committee-members`
                : `${API_BASE_URL}/api/committee-members`;

            const response = await fetch(endpoint, {
                headers: canManage
                    ? {
                        Authorization: `Bearer ${token}`,
                    }
                    : undefined,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors du chargement des membres");
            }

            setMembers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        resetForm();
    };

    const openCreateModal = () => {
        setSelectedMember(null);
        resetForm();
        setIsFormModalOpen(true);
    };

    const enrichedMembers = useMemo(
        () => members.map((member) => {
            const detectedTitle = detectAcademicTitle(member.fullName);
            const cleanName = stripAcademicTitle(member.fullName);
            return {
                ...member,
                detectedTitle,
                cleanName,
                displayRank: Number(member.displayOrder || 0),
            };
        }),
        [members],
    );

    const categories = useMemo(() => {
        const values = enrichedMembers
            .map((member) => (member.roleTitle || "").trim())
            .filter(Boolean);
        return [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
    }, [enrichedMembers]);

    const roleOptions = useMemo(() => {
        const values = [...categories];
        const currentRole = String(form.roleTitle || "").trim();

        if (currentRole && !values.includes(currentRole)) {
            values.unshift(currentRole);
        }

        return values;
    }, [categories, form.roleTitle]);

    const academicTitles = useMemo(() => {
        const values = enrichedMembers
            .map((member) => member.detectedTitle)
            .filter(Boolean);
        return [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
    }, [enrichedMembers]);

    const filteredMembers = useMemo(() => {
        const normalize = (value) => String(value || "").toLowerCase();
        const term = normalize(searchTerm.trim());

        const base = enrichedMembers.filter((member) => {
            if (canManage && statusFilter === "active" && member.isActive !== true) return false;
            if (canManage && statusFilter === "inactive" && member.isActive !== false) return false;
            if (categoryFilter !== "all" && (member.roleTitle || "") !== categoryFilter) return false;
            if (canManage && titleFilter !== "all" && member.detectedTitle !== titleFilter) return false;

            if (!term) return true;

            return [
                member.fullName,
                member.cleanName,
                member.roleTitle,
                member.affiliation,
                member.email,
                member.detectedTitle,
            ].some((value) => normalize(value).includes(term));
        });

        const sorted = [...base];
        const [field, direction] = sortBy.split("_");
        const factor = direction === "desc" ? -1 : 1;

        sorted.sort((a, b) => {
            if (field === "displayOrder") {
                const aOrder = Number(a.displayOrder || 0);
                const bOrder = Number(b.displayOrder || 0);

                if (aOrder === 0 && bOrder !== 0) return 1;
                if (aOrder !== 0 && bOrder === 0) return -1;
                return (aOrder - bOrder) * factor;
            }

            const aValue = String(a[field] || "");
            const bValue = String(b[field] || "");
            return aValue.localeCompare(bValue, "fr", { sensitivity: "base" }) * factor;
        });

        return sorted;
    }, [enrichedMembers, searchTerm, categoryFilter, titleFilter, statusFilter, sortBy]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.fullName.trim()) {
            setError("Le nom complet est requis");
            return;
        }

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

            const response = await fetch(endpoint, {
                method: isEdit ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de l'enregistrement");
            }

            await fetchMembers();
            closeFormModal();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (member) => {
        setEditingId(member._id);
        const detectedTitle = detectAcademicTitle(member.fullName);
        setForm({
            fullName: stripAcademicTitle(member.fullName || ""),
            academicTitle: detectedTitle,
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

    const requestDelete = (member) => {
        setDeleteCandidate(member);
    };

    const confirmDelete = async () => {
        if (!deleteCandidate?._id) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/committee-members/${deleteCandidate._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Erreur lors de la suppression");
            }

            await fetchMembers();
            if (editingId === deleteCandidate._id) {
                closeFormModal();
            }
            setDeleteCandidate(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="loading">Chargement des membres du comité...</div>;
    }

    return (
        <div className="working-papers-container" style={{ paddingTop: "0.5rem" }}>
            <p className="committee-intro">
                Le comité scientifique des Working Papers de l’AEGC (Association des Économistes et Gestionnaires du Cameroun)
            </p>
            <p className="committee-intro">
                Il est composé de professeurs, de chercheurs titulaires d’un doctorat (PhD) et de membres internes de l’AEGC,
                issus d’universités et d’institutions académiques nationales et internationales. Il est chargé d’assurer
                l’évaluation scientifique, la rigueur académique et la qualité des travaux soumis, sous la coordination de
                l’éditeur en chef.
            </p>

            <div className="wp-header committee-header" style={{ marginBottom: "1rem" }}>
                <h1>Comité scientifique</h1>
                {canManage && (
                    <button type="button" className="btn btn-primary committee-add-button" onClick={openCreateModal}>
                        + Ajouter un membre
                    </button>
                )}
            </div>

            {error && <div className="error-message" style={{ marginBottom: "1rem" }}>{error}</div>}

            <div className="committee-toolbar">
                <div className="committee-toolbar-item committee-toolbar-search">
                    <label htmlFor="committee-search">Recherche</label>
                    <input
                        id="committee-search"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nom, titre, catégorie, institution..."
                    />
                </div>

                <div className="committee-toolbar-item">
                    <label htmlFor="committee-filter-category">Catégorie</label>
                    <select
                        id="committee-filter-category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">Toutes</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>

                {canManage && (
                    <>
                        <div className="committee-toolbar-item">
                            <label htmlFor="committee-filter-title">Titre académique</label>
                            <select
                                id="committee-filter-title"
                                value={titleFilter}
                                onChange={(e) => setTitleFilter(e.target.value)}
                            >
                                <option value="all">Tous</option>
                                {academicTitles.map((title) => (
                                    <option key={title} value={title}>{title}</option>
                                ))}
                            </select>
                        </div>

                        <div className="committee-toolbar-item">
                            <label htmlFor="committee-filter-status">Statut</label>
                            <select
                                id="committee-filter-status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Tous</option>
                                <option value="active">Actifs</option>
                                <option value="inactive">Inactifs</option>
                            </select>
                        </div>
                    </>
                )}

                <div className="committee-toolbar-item">
                    <label htmlFor="committee-sort">Tri</label>
                    <select
                        id="committee-sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="committee-summary">
                <span><strong>{filteredMembers.length}</strong> membre(s) affiché(s)</span>
                <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                        setSearchTerm("");
                        setCategoryFilter("all");
                        if (canManage) {
                            setTitleFilter("all");
                            setStatusFilter("all");
                        }
                        setSortBy("displayOrder_asc");
                    }}
                >
                    Réinitialiser les filtres
                </button>
            </div>

            <div className="committee-grid" style={{ marginBottom: "1.25rem" }}>
                {filteredMembers.length === 0 ? (
                    <div className="no-submissions">
                        <p>Aucun membre ne correspond aux critères.</p>
                    </div>
                ) : (
                    filteredMembers.map((member) => (
                        <div
                            key={member._id}
                            className="committee-card committee-card-clickable"
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedMember(member)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    setSelectedMember(member);
                                }
                            }}
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
                                <div className="committee-meta-item">
                                    <strong>Nom complet</strong>
                                    <p>{member.fullName}</p>
                                </div>
                                {member.affiliation && (
                                    <div className="committee-meta-item">
                                        <strong>Institution</strong>
                                        <p>{member.affiliation}</p>
                                    </div>
                                )}
                                {member.email && (
                                    <div className="committee-meta-item">
                                        <strong>Email</strong>
                                        <p><a href={`mailto:${member.email}`} onClick={(event) => event.stopPropagation()}>{member.email}</a></p>
                                    </div>
                                )}
                                {member.profileLink && (
                                    <div className="committee-meta-item">
                                        <strong>Lien de profil</strong>
                                        <p>
                                            <a href={member.profileLink} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                                                Ouvrir le profil
                                            </a>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {canManage && (
                                <div className="committee-card-actions">
                                    <button className="btn btn-secondary btn-small" onClick={(event) => { event.stopPropagation(); handleEdit(member); }}>
                                        Modifier
                                    </button>
                                    <button
                                        className="btn btn-danger btn-small"
                                        onClick={(event) => { event.stopPropagation(); requestDelete(member); }}
                                        disabled={saving}
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {selectedMember && (
                <div className="committee-detail-overlay" onClick={() => setSelectedMember(null)}>
                    <div className="committee-detail-panel" onClick={(event) => event.stopPropagation()}>
                        <div className="committee-detail-header">
                            <div>
                                <p className="committee-detail-kicker">Fiche membre</p>
                                <h2>{selectedMember.fullName}</h2>
                            </div>
                            <button className="committee-detail-close" onClick={() => setSelectedMember(null)}>x</button>
                        </div>

                        <div className="committee-detail-grid">
                            <div className="committee-detail-item">
                                <strong>Catégorie / Fonction</strong>
                                <p>{selectedMember.roleTitle || "-"}</p>
                            </div>
                            <div className="committee-detail-item">
                                <strong>Institution</strong>
                                <p>{selectedMember.affiliation || "-"}</p>
                            </div>
                            <div className="committee-detail-item">
                                <strong>Email</strong>
                                <p>
                                    {selectedMember.email ? (
                                        <a href={`mailto:${selectedMember.email}`}>
                                            {selectedMember.email}
                                        </a>
                                    ) : (
                                        "-"
                                    )}
                                </p>
                            </div>
                            <div className="committee-detail-item">
                                <strong>Statut</strong>
                                <p>{selectedMember.isActive ? "Actif" : "Inactif"}</p>
                            </div>
                            <div className="committee-detail-item">
                                <strong>Lien de profil</strong>
                                <p>
                                    {selectedMember.profileLink ? (
                                        <a href={selectedMember.profileLink} target="_blank" rel="noreferrer">
                                            Ouvrir le lien
                                        </a>
                                    ) : (
                                        "-"
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {canManage && isFormModalOpen && (
                <div className="committee-detail-overlay" onClick={closeFormModal}>
                    <div className="committee-detail-panel committee-form-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="committee-detail-header">
                            <div>
                                <p className="committee-detail-kicker">Gestion du comité</p>
                                <h2>{editingId ? "Modifier un membre" : "Ajouter un membre"}</h2>
                            </div>
                            <button className="committee-detail-close" onClick={closeFormModal}>x</button>
                        </div>

                        <form onSubmit={handleSubmit} className="submission-form committee-form committee-form-inline">
                            <div className="form-section-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Titre académique</label>
                                        <select
                                            value={form.academicTitle}
                                            onChange={(e) => setForm((prev) => ({ ...prev, academicTitle: e.target.value }))}
                                        >
                                            {ACADEMIC_TITLES.map((title) => (
                                                <option key={title.value || "none"} value={title.value}>{title.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Nom (sans titre)</label>
                                        <input
                                            type="text"
                                            value={form.fullName}
                                            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Catégorie / Fonction</label>
                                        <select
                                            value={form.roleTitle}
                                            onChange={(e) => setForm((prev) => ({ ...prev, roleTitle: e.target.value }))}
                                        >
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
                                        <input
                                            type="text"
                                            value={form.affiliation}
                                            onChange={(e) => setForm((prev) => ({ ...prev, affiliation: e.target.value }))}
                                            placeholder="Université / Institution"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                            placeholder="adresse@mail.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Lien Google Scholar / ResearchGate</label>
                                        <input
                                            type="url"
                                            value={form.profileLink}
                                            onChange={(e) => setForm((prev) => ({ ...prev, profileLink: e.target.value }))}
                                            placeholder="https://scholar.google.com/..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Ordre d'affichage</label>
                                        <input
                                            type="number"
                                            value={form.displayOrder}
                                            onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
                                        />
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
                                <button type="button" className="btn committee-form-cancel" onClick={closeFormModal}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn committee-form-submit" disabled={saving}>
                                    {saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Ajouter"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {canManage && deleteCandidate && (
                <div className="committee-detail-overlay" onClick={() => setDeleteCandidate(null)}>
                    <div className="committee-delete-panel" onClick={(event) => event.stopPropagation()}>
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
                            <button type="button" className="btn committee-delete-cancel" onClick={() => setDeleteCandidate(null)}>
                                Annuler
                            </button>
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
