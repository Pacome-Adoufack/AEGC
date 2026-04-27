import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "./Url";
import { getAuthToken } from "../utils/auth";

const emptyForm = {
    fullName: "",
    roleTitle: "",
    affiliation: "",
    displayOrder: 0,
    isActive: true,
};

function WorkingPapersCommittee() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

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

    const canManage = !!token && ["dev", "admin"].includes(storedUser?.role);

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
                fullName: form.fullName.trim(),
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
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (member) => {
        setEditingId(member._id);
        setForm({
            fullName: member.fullName || "",
            roleTitle: member.roleTitle || "",
            affiliation: member.affiliation || "",
            displayOrder: member.displayOrder || 0,
            isActive: member.isActive !== false,
        });
    };

    const handleDelete = async (memberId) => {
        const confirmed = window.confirm("Supprimer ce membre du comité ?");
        if (!confirmed) {
            return;
        }

        setSaving(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/committee-members/${memberId}`, {
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
            if (editingId === memberId) {
                resetForm();
            }
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
            <div className="wp-header" style={{ marginBottom: "1rem" }}>
                <h1>Comité scientifique</h1>
                <p>Liste des membres du comité scientifique AEGC.</p>
            </div>

            {error && <div className="error-message" style={{ marginBottom: "1rem" }}>{error}</div>}

            <div className="submissions-grid" style={{ marginBottom: "1.25rem" }}>
                {members.length === 0 ? (
                    <div className="no-submissions">
                        <p>Aucun membre enregistré pour le moment.</p>
                    </div>
                ) : (
                    members.map((member) => (
                        <div key={member._id} className="submission-card">
                            <div className="sub-card-inner">
                                <div className="submission-header">
                                    <h3>{member.fullName}</h3>
                                    <span className={`sub-status ${member.isActive ? "status-acceptee" : "status-rejetee"}`}>
                                        {member.isActive ? "Actif" : "Inactif"}
                                    </span>
                                </div>
                                <div className="submission-body">
                                    {member.roleTitle && <p><strong>Fonction :</strong> {member.roleTitle}</p>}
                                    {member.affiliation && <p><strong>Affiliation :</strong> {member.affiliation}</p>}
                                    <p><strong>Ordre :</strong> {member.displayOrder || 0}</p>
                                </div>
                                {canManage && (
                                    <div className="submission-footer">
                                        <button className="btn btn-secondary btn-small" onClick={() => handleEdit(member)}>
                                            Modifier
                                        </button>
                                        <button
                                            className="btn btn-primary btn-small"
                                            onClick={() => handleDelete(member._id)}
                                            disabled={saving}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {canManage && (
                <form onSubmit={handleSubmit} className="submission-form">
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="form-section-number">+</span>
                            <h3>{editingId ? "Modifier un membre" : "Ajouter un membre"}</h3>
                        </div>
                        <div className="form-section-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nom complet</label>
                                    <input
                                        type="text"
                                        value={form.fullName}
                                        onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fonction</label>
                                    <input
                                        type="text"
                                        value={form.roleTitle}
                                        onChange={(e) => setForm((prev) => ({ ...prev, roleTitle: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Affiliation</label>
                                    <input
                                        type="text"
                                        value={form.affiliation}
                                        onChange={(e) => setForm((prev) => ({ ...prev, affiliation: e.target.value }))}
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
                    </div>

                    <div className="form-actions">
                        {editingId && (
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Annuler
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? "Enregistrement..." : editingId ? "Enregistrer" : "Ajouter"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default WorkingPapersCommittee;
