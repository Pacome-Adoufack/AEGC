import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../Url";
import {
    attachmentUrl,
    categoryLabel,
    formatFileSize,
} from "../../utils/announcements";

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

const SUMMARY_MAX = 500;
const CONTENT_MAX = 10000;
const MAX_FILES = 5;
const FILE_MAX_MB = Number(import.meta.env.VITE_PDF_MAX_SIZE_MB) || 10;
// Le proxy nginx refuse les requêtes de plus de 25 Mo : on garde une marge.
const REQUEST_MAX_MB = 24;

const ACCEPTED_FILES = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
};
const ACCEPT_ATTRIBUTE = Object.entries(ACCEPTED_FILES).flatMap(([type, exts]) => [type, ...exts]).join(',');

const isAcceptedFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return (ACCEPTED_FILES[file.type] || []).includes(ext);
};

// startCreating : ouvre directement le formulaire de création (raccourci de l'accueil admin).
export default function AnnouncementsTab({ token, setMessage, openConfirm, startCreating = false, onStartHandled }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [sending, setSending] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [removedIds, setRemovedIds] = useState([]);
    const [newFiles, setNewFiles] = useState([]);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const set = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setExistingAttachments([]);
        setRemovedIds([]);
        setNewFiles([]);
        setFormError('');
    };

    const closeModal = () => {
        resetForm();
        setShowModal(false);
    };

    const openCreate = () => {
        resetForm();
        setShowModal(true);
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

    useEffect(() => {
        if (!startCreating) return;
        openCreate();
        onStartHandled?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startCreating]);

    const keptCount = existingAttachments.length - removedIds.length;
    const totalFiles = keptCount + newFiles.length;

    const handleFilesSelected = (e) => {
        const picked = Array.from(e.target.files || []);
        // Réinitialise le champ pour pouvoir resélectionner le même fichier après un retrait.
        e.target.value = '';
        if (picked.length === 0) return;

        const rejected = picked.find((file) => !isAcceptedFile(file));
        if (rejected) {
            setFormError(`« ${rejected.name} » n'est pas accepté. Formats possibles : PDF, JPG, PNG, WEBP.`);
            return;
        }
        const tooBig = picked.find((file) => file.size > FILE_MAX_MB * 1024 * 1024);
        if (tooBig) {
            setFormError(`« ${tooBig.name} » dépasse ${FILE_MAX_MB} Mo. Compressez-le avant de l'ajouter.`);
            return;
        }
        if (totalFiles + picked.length > MAX_FILES) {
            setFormError(`Une annonce peut contenir au maximum ${MAX_FILES} fichiers.`);
            return;
        }
        const nextFiles = [...newFiles, ...picked];
        const totalBytes = nextFiles.reduce((sum, file) => sum + file.size, 0);
        if (totalBytes > REQUEST_MAX_MB * 1024 * 1024) {
            setFormError(`Les nouveaux fichiers dépassent ${REQUEST_MAX_MB} Mo au total. Enregistrez en plusieurs fois.`);
            return;
        }
        setFormError('');
        setNewFiles(nextFiles);
    };

    const removeNewFile = (index) => setNewFiles((files) => files.filter((_, i) => i !== index));

    const toggleExistingRemoval = (id) =>
        setRemovedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);
        try {
            const body = new FormData();
            body.append('title', form.title);
            body.append('summary', form.summary);
            body.append('content', form.content);
            body.append('category', form.category);
            body.append('isPublished', String(form.isPublished));
            body.append('isPinned', String(form.isPinned));
            body.append('expiresAt', form.expiresForever ? '' : (form.expiresAt || ''));
            if (editingId) body.append('removeAttachmentIds', JSON.stringify(removedIds));
            newFiles.forEach((file) => body.append('attachments', file));

            const url = editingId
                ? `${API_BASE_URL}/api/admin/announcements/${editingId}`
                : `${API_BASE_URL}/api/admin/announcements`;
            // Pas de Content-Type manuel : le navigateur ajoute la frontière multipart.
            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body,
            });

            if (res.status === 413) {
                throw new Error(`Envoi trop volumineux pour le serveur. Réduisez la taille des fichiers (${REQUEST_MAX_MB} Mo max au total).`);
            }
            let data;
            try {
                data = await res.json();
            } catch {
                throw new Error(`Réponse inattendue du serveur (code ${res.status}). L'annonce n'a pas été enregistrée.`);
            }
            if (!data.success) throw new Error(data.error || data.message || "Erreur lors de l'enregistrement");

            setMessage(editingId ? 'Annonce mise à jour' : 'Annonce créée');
            setTimeout(() => setMessage(''), 3000);
            closeModal();
            await loadAnnouncements();
        } catch (err) {
            // Affichée dans la fenêtre : un message en haut du dashboard serait caché derrière.
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (a) => {
        resetForm();
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
        setExistingAttachments(a.attachments || []);
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

    // Envoi aux abonnés. On demande le nombre de destinataires d'abord : on ne
    // confirme pas un envoi en masse sans savoir à combien de personnes il part.
    const askSendNewsletter = async (annonce) => {
        let compte = null;
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/newsletter/recipients`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) compte = await res.json();
        } catch {
            // Le compteur n'est qu'une aide : son échec ne bloque pas l'envoi.
        }

        const combien = compte ? `${compte.total} destinataire${compte.total > 1 ? "s" : ""}` : "les abonnés";
        const dejaEnvoye = annonce.newsletter?.sentAt
            ? `\n\nAttention : déjà envoyée le ${new Date(annonce.newsletter.sentAt).toLocaleDateString("fr-FR")}.`
            : "";

        openConfirm({
            title: "Envoyer aux abonnés",
            message: `Envoyer « ${annonce.title} » à ${combien} ?${dejaEnvoye}`,
            type: "warning",
            onConfirm: async () => {
                setSending(annonce._id);
                try {
                    const res = await fetch(`${API_BASE_URL}/api/admin/announcements/${annonce._id}/newsletter`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ force: Boolean(annonce.newsletter?.sentAt) }),
                    });
                    const payload = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(payload.error || "Envoi impossible");
                    setMessage(
                        payload.echecs
                            ? `${payload.message}, ${payload.echecs} échec(s)`
                            : payload.message,
                    );
                    loadAnnouncements();
                } catch (err) {
                    setMessage(`Erreur: ${err.message}`);
                } finally {
                    setSending(null);
                    setTimeout(() => setMessage(""), 6000);
                }
            },
        });
    };

    const askDelete = (id) =>
        openConfirm({
            title: "Supprimer l'annonce",
            message: 'Confirmer la suppression de cette annonce et de ses fichiers joints ?',
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
                <button className="btn-create-announcement" onClick={openCreate}>
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
                                    <span className="announcement-tag">{categoryLabel(a.category)}</span>
                                    <span className={`badge-status ${a.isPublished ? 'published' : 'pending'}`}>
                                        {a.isPublished ? 'Publié' : 'Brouillon'}
                                    </span>
                                </div>
                                <h4>{a.title}</h4>
                                <p>{a.summary}</p>
                                <small>
                                    {a.isPinned ? '📌 Épinglé · ' : ''}
                                    {a.attachments?.length > 0
                                        ? `📎 ${a.attachments.length} fichier${a.attachments.length > 1 ? 's' : ''} · `
                                        : ''}
                                    Créé le {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                                </small>
                                <div className="announcement-card-actions">
                                    <button className="btn-approve" onClick={() => handleEdit(a)}>Modifier</button>
                                    {/* L'envoi est un geste explicite, jamais déclenché par la
                                        publication : une correction relancerait sinon un envoi. */}
                                    {a.isPublished && (
                                        <button
                                            className="btn-cancel"
                                            disabled={sending === a._id}
                                            onClick={() => askSendNewsletter(a)}
                                        >
                                            {sending === a._id
                                                ? "Envoi…"
                                                : a.newsletter?.sentAt
                                                    ? `Renvoyer (${a.newsletter.recipients} envoyés)`
                                                    : "Envoyer aux abonnés"}
                                        </button>
                                    )}
                                    <button className="btn-delete" onClick={() => askDelete(a._id)}>Supprimer</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={submitting ? undefined : closeModal}>
                    <div className="ann-form-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ann-form-modal-header">
                            <h3>{editingId ? "Modifier l'annonce" : 'Nouvelle annonce'}</h3>
                            <button className="ann-form-close" onClick={closeModal} disabled={submitting}>✕</button>
                        </div>
                        <form className="announcements-form" onSubmit={handleSubmit}>
                            <div className="announcements-grid-2">
                                <div>
                                    <label>Titre</label>
                                    <input type="text" value={form.title} onChange={set('title')} maxLength={180} required />
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
                                <textarea rows={3} value={form.summary} onChange={set('summary')} maxLength={SUMMARY_MAX} required />
                                <p className="ann-field-hint">
                                    <span>Quelques phrases affichées sur la carte de l'annonce.</span>
                                    <span className={form.summary.length >= SUMMARY_MAX ? 'ann-counter ann-counter--full' : 'ann-counter'}>
                                        {form.summary.length}/{SUMMARY_MAX}
                                    </span>
                                </p>
                            </div>

                            <div>
                                <label>Texte complet (optionnel)</label>
                                <textarea
                                    rows={9}
                                    value={form.content}
                                    onChange={set('content')}
                                    maxLength={CONTENT_MAX}
                                    placeholder={"Affiché quand le visiteur clique sur « Lire la suite ».\n\nLaissez une ligne vide entre deux paragraphes. Les liens (https://…) deviennent cliquables."}
                                />
                                <p className="ann-field-hint">
                                    <span>Paragraphes et retours à la ligne conservés tels que saisis.</span>
                                    <span className="ann-counter">{form.content.length}/{CONTENT_MAX}</span>
                                </p>
                            </div>

                            <div>
                                <label>Fichiers joints (optionnel)</label>
                                <div className="ann-attachments">
                                    {existingAttachments.map((att) => {
                                        const removed = removedIds.includes(att._id);
                                        return (
                                            <div key={att._id} className={`ann-att-row ${removed ? 'ann-att-row--removed' : ''}`}>
                                                <span className={`ann-att-kind ann-att-kind--${att.kind}`}>{att.kind === 'pdf' ? 'PDF' : 'IMG'}</span>
                                                <a className="ann-att-name" href={attachmentUrl(att)} target="_blank" rel="noopener noreferrer">
                                                    {att.originalName}
                                                </a>
                                                <span className="ann-att-size">{formatFileSize(att.size)}</span>
                                                <button type="button" className="ann-att-action" onClick={() => toggleExistingRemoval(att._id)}>
                                                    {removed ? 'Annuler' : 'Retirer'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {newFiles.map((file, index) => (
                                        <div key={`${file.name}-${index}`} className="ann-att-row ann-att-row--new">
                                            <span className={`ann-att-kind ann-att-kind--${file.type === 'application/pdf' ? 'pdf' : 'image'}`}>
                                                {file.type === 'application/pdf' ? 'PDF' : 'IMG'}
                                            </span>
                                            <span className="ann-att-name">{file.name}</span>
                                            <span className="ann-att-size">{formatFileSize(file.size)}</span>
                                            <button type="button" className="ann-att-action" onClick={() => removeNewFile(index)}>
                                                Retirer
                                            </button>
                                        </div>
                                    ))}
                                    {totalFiles < MAX_FILES && (
                                        <button type="button" className="ann-att-add" onClick={() => fileInputRef.current?.click()}>
                                            + Ajouter un PDF ou une image
                                        </button>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept={ACCEPT_ATTRIBUTE}
                                        onChange={handleFilesSelected}
                                        hidden
                                    />
                                </div>
                                <p className="ann-field-hint">
                                    <span>PDF, JPG, PNG ou WEBP · {FILE_MAX_MB} Mo max par fichier · {MAX_FILES} fichiers max. La première image sert de couverture.</span>
                                </p>
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

                            {formError && <div className="ann-form-error" role="alert">{formError}</div>}

                            <div className="announcements-actions">
                                <button type="submit" className="btn-confirm" disabled={submitting}>
                                    {submitting ? 'Enregistrement…' : editingId ? 'Mettre à jour' : form.isPublished ? 'Publier' : 'Enregistrer le brouillon'}
                                </button>
                                <button type="button" className="btn-cancel" onClick={closeModal} disabled={submitting}>
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
