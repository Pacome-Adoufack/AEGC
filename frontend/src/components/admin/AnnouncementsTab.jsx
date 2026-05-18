import { useEffect, useState } from "react";
import { API_BASE_URL } from "../Url";

const EMPTY_FORM = {
    title: '',
    summary: '',
    content: '',
    category: 'ANNOUNCEMENT',
    isPublished: true,
    isPinned: false,
    expiresAt: '',
    expiresForever: true,
};

export default function AnnouncementsTab({ token, setMessage, openConfirm }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const set = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const closeModal = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowModal(false);
    };

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/announcements`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setAnnouncements(data.data || []);
            else setMessage(`Erreur: ${data.error || 'Impossible de récupérer les annonces'}`);
        } catch (err) {
            setMessage(`Erreur: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAnnouncements(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, expiresAt: form.expiresForever ? null : (form.expiresAt || null) };
            const url = editingId
                ? `${API_BASE_URL}/api/admin/announcements/${editingId}`
                : `${API_BASE_URL}/api/admin/announcements`;
            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || data.message || "Erreur lors de l'enregistrement");
            setMessage(editingId ? 'Annonce mise à jour' : 'Annonce créée');
            closeModal();
            await loadAnnouncements();
        } catch (err) {
            setMessage(`Erreur: ${err.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleEdit = (a) => {
        setEditingId(a._id);
        setForm({
            title: a.title || '',
            summary: a.summary || '',
            content: a.content || '',
            category: a.category || 'ANNOUNCEMENT',
            isPublished: Boolean(a.isPublished),
            isPinned: Boolean(a.isPinned),
            expiresAt: a.expiresAt || '',
            expiresForever: !a.expiresAt,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || data.message || 'Erreur lors de la suppression');
            setAnnouncements((prev) => prev.filter((a) => a._id !== id));
            setMessage('Annonce supprimée');
        } catch (err) {
            setMessage(`Erreur: ${err.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const askDelete = (id) =>
        openConfirm({
            title: "Supprimer l'annonce",
            message: 'Confirmer la suppression de cette annonce ?',
            onConfirm: () => handleDelete(id),
            type: 'danger',
        });

    return (
        <div className="announcements-section">
            <div className="announcements-section-header">
                <div>
                    <h2>Gestion des annonces</h2>
                    <p className="announcements-section-subtitle">
                        {announcements.length} annonce{announcements.length !== 1 ? 's' : ''} au total
                    </p>
                </div>
                <button className="btn-create-announcement" onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); }}>
                    + Créer une annonce
                </button>
            </div>

            <div className="announcements-list">
                {loading ? (
                    <p>Chargement…</p>
                ) : announcements.length === 0 ? (
                    <p className="announcements-empty">Aucune annonce pour le moment. Cliquez sur "Créer une annonce" pour commencer.</p>
                ) : (
                    <div className="announcements-cards">
                        {announcements.map((a) => (
                            <div key={a._id} className="announcement-card">
                                <div className="announcement-card-top">
                                    <span className="announcement-tag">{a.category}</span>
                                    <span className={`badge-status ${a.isPublished ? 'published' : 'pending'}`}>
                                        {a.isPublished ? 'Publié' : 'Brouillon'}
                                    </span>
                                </div>
                                <h4>{a.title}</h4>
                                <p>{a.summary}</p>
                                <small>
                                    {a.isPinned ? '📌 Épinglé · ' : ''}
                                    Créé le {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                                </small>
                                <div className="announcement-card-actions">
                                    <button className="btn-approve" onClick={() => handleEdit(a)}>Modifier</button>
                                    <button className="btn-delete" onClick={() => askDelete(a._id)}>Supprimer</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="ann-form-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ann-form-modal-header">
                            <h3>{editingId ? "Modifier l'annonce" : 'Nouvelle annonce'}</h3>
                            <button className="ann-form-close" onClick={closeModal}>✕</button>
                        </div>
                        <form className="announcements-form" onSubmit={handleSubmit}>
                            <div className="announcements-grid-2">
                                <div>
                                    <label>Titre</label>
                                    <input type="text" value={form.title} onChange={set('title')} required />
                                </div>
                                <div>
                                    <label>Catégorie</label>
                                    <select value={form.category} onChange={set('category')}>
                                        <option value="ANNOUNCEMENT">Annonce</option>
                                        <option value="INFO">Information</option>
                                        <option value="EVENT">Événement</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label>Résumé</label>
                                <textarea rows={3} value={form.summary} onChange={set('summary')} required />
                            </div>

                            <div>
                                <label>Contenu détaillé (optionnel)</label>
                                <textarea rows={5} value={form.content} onChange={set('content')} />
                            </div>

                            <div className="announcements-grid-2">
                                <div>
                                    <label>Date d'expiration</label>
                                    <input type="date" value={form.expiresAt} onChange={set('expiresAt')} disabled={form.expiresForever} />
                                    <div className="forever-label-wrapper">
                                        <label className="forever-label">
                                            <input type="checkbox" checked={form.expiresForever} onChange={set('expiresForever')} />
                                            À vie (par défaut)
                                        </label>
                                    </div>
                                </div>
                                <div className="announcements-checkboxes">
                                    <label>
                                        <input type="checkbox" checked={form.isPublished} onChange={set('isPublished')} />
                                        Publier
                                    </label>
                                    <label>
                                        <input type="checkbox" checked={form.isPinned} onChange={set('isPinned')} />
                                        Épingler en haut
                                    </label>
                                </div>
                            </div>

                            <div className="announcements-actions">
                                <button type="submit" className="btn-confirm">
                                    {editingId ? 'Mettre à jour' : 'Publier'}
                                </button>
                                <button type="button" className="btn-cancel" onClick={closeModal}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
