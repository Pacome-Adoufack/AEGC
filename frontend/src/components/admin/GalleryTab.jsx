import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../Url";
import {
    ACCEPTED_PHOTO_TYPES,
    formatPhotoDate,
    galleryImageUrl,
    prepareGalleryPhoto,
} from "../../utils/gallery";

const MAX_BATCH = 30;
// Au-delà, même réduite, une image est suspecte (fichier corrompu, scan géant…).
const SOURCE_MAX_MB = 40;

let nextQueueId = 0;

const readJson = async (res) => {
    if (res.status === 413) throw new Error("Photo trop volumineuse pour le serveur.");
    try {
        return await res.json();
    } catch {
        throw new Error(`Réponse inattendue du serveur (code ${res.status}).`);
    }
};

// startCreating : place directement l'admin sur le formulaire d'ajout (raccourci de l'accueil admin).
export default function GalleryTab({ token, setMessage, openConfirm, startCreating = false, onStartHandled }) {
    const [photos, setPhotos] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [queue, setQueue] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState('');

    const flash = (text) => {
        setMessage(text);
        setTimeout(() => setMessage(''), 3000);
    };

    const loadPhotos = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/gallery?limit=500`);
            const data = await readJson(res);
            if (!data.success) throw new Error(data.error || 'Impossible de charger la galerie');
            setPhotos(data.data || []);
            setTotal(data.total || 0);
        } catch (err) {
            setMessage(`Erreur: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPhotos(); }, []);

    const titleInputRef = useRef(null);
    useEffect(() => {
        if (!startCreating) return;
        titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        titleInputRef.current?.focus({ preventScroll: true });
        onStartHandled?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startCreating]);

    // Libère les aperçus locaux quand l'onglet est quitté.
    const queueRef = useRef(queue);
    queueRef.current = queue;
    useEffect(() => () => queueRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)), []);

    const handleFilesSelected = (e) => {
        const picked = Array.from(e.target.files || []);
        e.target.value = '';
        if (picked.length === 0) return;

        const rejected = picked.filter((file) => !ACCEPTED_PHOTO_TYPES.includes(file.type));
        const tooBig = picked.filter((file) => ACCEPTED_PHOTO_TYPES.includes(file.type) && file.size > SOURCE_MAX_MB * 1024 * 1024);
        const accepted = picked.filter((file) => ACCEPTED_PHOTO_TYPES.includes(file.type) && file.size <= SOURCE_MAX_MB * 1024 * 1024);
        const room = MAX_BATCH - queue.length;

        const notes = [];
        if (rejected.length) notes.push(`${rejected.length} fichier(s) ignoré(s) : formats acceptés JPG, PNG, WEBP (les photos iPhone en HEIC doivent être exportées en JPG).`);
        if (tooBig.length) notes.push(`${tooBig.length} fichier(s) de plus de ${SOURCE_MAX_MB} Mo ignoré(s).`);
        if (accepted.length > room) notes.push(`Maximum ${MAX_BATCH} photos par envoi : ${accepted.length - room} photo(s) non ajoutée(s).`);
        setUploadError(notes.join(' '));

        const items = accepted.slice(0, Math.max(room, 0)).map((file) => ({
            id: ++nextQueueId,
            file,
            previewUrl: URL.createObjectURL(file),
            status: 'pending',
            error: '',
        }));
        setQueue((current) => [...current, ...items]);
    };

    const removeFromQueue = (id) =>
        setQueue((current) => {
            const item = current.find((x) => x.id === id);
            if (item) URL.revokeObjectURL(item.previewUrl);
            return current.filter((x) => x.id !== id);
        });

    const updateItem = (id, patch) =>
        setQueue((current) => current.map((x) => (x.id === id ? { ...x, ...patch } : x)));

    const uploadOne = async (item) => {
        const { full, thumb } = await prepareGalleryPhoto(item.file);
        const body = new FormData();
        body.append('title', title.trim());
        body.append('eventDate', eventDate);
        body.append('originalName', item.file.name);
        body.append('width', String(full.width));
        body.append('height', String(full.height));
        body.append('thumbWidth', String(thumb.width));
        body.append('thumbHeight', String(thumb.height));
        body.append('full', full.blob, 'photo.jpg');
        body.append('thumb', thumb.blob, 'miniature.jpg');

        const res = await fetch(`${API_BASE_URL}/api/admin/gallery`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body,
        });
        const data = await readJson(res);
        if (!data.success) throw new Error(data.error || "Échec de l'envoi");
        return data.data;
    };

    const handlePublish = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setUploadError('Ajoutez une légende : elle s\'affiche sous chaque photo.');
            return;
        }
        const pending = queue.filter((item) => item.status !== 'done');
        if (pending.length === 0) return;

        setUploading(true);
        setUploadError('');
        let succeeded = 0;
        // Raison du premier échec, relevée à la source : elle doit être lisible dans
        // le message, sans avoir à survoler les vignettes.
        let firstReason = '';

        // Une photo à la fois : progression visible, et aucune requête ne dépasse
        // la limite de taille du proxy.
        for (const item of pending) {
            updateItem(item.id, { status: 'uploading', error: '' });
            try {
                const photo = await uploadOne(item);
                succeeded += 1;
                updateItem(item.id, { status: 'done' });
                setPhotos((current) => [photo, ...current]);
                setTotal((current) => current + 1);
            } catch (err) {
                if (!firstReason) firstReason = err.message;
                updateItem(item.id, { status: 'error', error: err.message });
            }
        }

        setUploading(false);
        const failed = pending.length - succeeded;
        if (failed === 0) {
            setQueue((current) => {
                current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                return [];
            });
            setTitle('');
            setEventDate('');
            flash(`${succeeded} photo${succeeded > 1 ? 's publiées' : ' publiée'}`);
        } else {
            // Les photos réussies quittent la file ; les échecs restent pour un nouvel essai.
            setQueue((current) => current.filter((item) => {
                if (item.status === 'done') URL.revokeObjectURL(item.previewUrl);
                return item.status !== 'done';
            }));
            setUploadError(
                `${failed} photo${failed > 1 ? 's n\'ont' : ' n\'a'} pas pu être envoyée${failed > 1 ? 's' : ''}.`
                + (firstReason ? ` ${firstReason}` : '')
                + ' Cliquez à nouveau sur « Publier » pour réessayer.'
            );
        }
        await loadPhotos();
    };

    const startEdit = (photo) => {
        setEditingId(photo._id);
        setEditTitle(photo.title);
        setEditDate(photo.eventDate || '');
    };

    const saveEdit = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/gallery/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: editTitle, eventDate: editDate || null }),
            });
            const data = await readJson(res);
            if (!data.success) throw new Error(data.error || 'Erreur lors de la modification');
            setPhotos((current) => current.map((p) => (p._id === id ? data.data : p)));
            setEditingId(null);
            flash('Photo mise à jour');
        } catch (err) {
            flash(`Erreur: ${err.message}`);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/gallery/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await readJson(res);
            if (!data.success) throw new Error(data.error || 'Erreur lors de la suppression');
            setPhotos((current) => current.filter((p) => p._id !== id));
            setTotal((current) => Math.max(0, current - 1));
            flash('Photo supprimée');
        } catch (err) {
            flash(`Erreur: ${err.message}`);
        }
    };

    const askDelete = (photo) =>
        openConfirm({
            title: 'Supprimer la photo',
            message: `Supprimer définitivement « ${photo.title} » de la galerie ?`,
            onConfirm: () => handleDelete(photo._id),
            type: 'danger',
        });

    const doneCount = queue.filter((item) => item.status === 'done').length;
    const pendingCount = queue.filter((item) => item.status !== 'done').length;

    return (
        <div className="gt-section">
            <div className="gt-header">
                <div>
                    <h2>Galerie photos</h2>
                    <p className="gt-subtitle">
                        {total} photo{total > 1 ? 's' : ''} · les 8 dernières ajoutées s'affichent sur l'accueil, toutes sur la page Galerie
                    </p>
                </div>
            </div>

            {/* ===== Ajout ===== */}
            <form className="gt-upload" onSubmit={handlePublish}>
                <h3>Ajouter des photos</h3>
                <div className="gt-upload-fields">
                    <div>
                        <label htmlFor="gt-title">Légende</label>
                        <input
                            ref={titleInputRef}
                            id="gt-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={150}
                            placeholder="Ex. : Séminaire de rentrée 2026, Yaoundé"
                            disabled={uploading}
                        />
                    </div>
                    <div>
                        <label htmlFor="gt-date">Date de l'événement (optionnel)</label>
                        <input
                            id="gt-date"
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            disabled={uploading}
                        />
                    </div>
                </div>
                <p className="gt-hint">La légende et la date s'appliquent à toutes les photos de cet envoi. Vous pourrez modifier chaque photo ensuite.</p>

                {queue.length > 0 && (
                    <div className="gt-queue">
                        {queue.map((item) => (
                            <div key={item.id} className={`gt-queue-item gt-queue-item--${item.status}`} title={item.error || item.file.name}>
                                <img src={item.previewUrl} alt="" />
                                {item.status === 'uploading' && <span className="gt-queue-badge">Envoi…</span>}
                                {item.status === 'done' && <span className="gt-queue-badge gt-queue-badge--done">✓</span>}
                                {item.status === 'error' && <span className="gt-queue-badge gt-queue-badge--error">Échec</span>}
                                {!uploading && item.status !== 'done' && (
                                    <button type="button" className="gt-queue-remove" onClick={() => removeFromQueue(item.id)} aria-label="Retirer">✕</button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="gt-upload-actions">
                    <button type="button" className="gt-btn-add" onClick={() => fileInputRef.current?.click()} disabled={uploading || queue.length >= MAX_BATCH}>
                        + Choisir des photos
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_PHOTO_TYPES.join(',')}
                        multiple
                        hidden
                        onChange={handleFilesSelected}
                    />
                    {pendingCount > 0 && (
                        <button type="submit" className="gt-btn-publish" disabled={uploading}>
                            {uploading
                                ? `Envoi ${doneCount + 1} / ${queue.length}…`
                                : `Publier ${pendingCount} photo${pendingCount > 1 ? 's' : ''}`}
                        </button>
                    )}
                </div>
                <p className="gt-hint">JPG, PNG ou WEBP · jusqu'à {MAX_BATCH} photos par envoi. Les photos sont réduites automatiquement avant l'envoi.</p>

                {uploadError && <div className="gt-error" role="alert">{uploadError}</div>}
            </form>

            {/* ===== Photos publiées ===== */}
            {loading && photos.length === 0 ? (
                <p className="gt-empty">Chargement…</p>
            ) : photos.length === 0 ? (
                <p className="gt-empty">Aucune photo pour l'instant. Tant que la galerie est vide, la section n'apparaît pas sur l'accueil.</p>
            ) : (
                <div className="gt-grid">
                    {photos.map((photo, index) => (
                        <div key={photo._id} className="gt-card">
                            <div className="gt-card-img">
                                <img src={galleryImageUrl(photo, 'thumb')} alt={photo.title} loading="lazy" />
                                {index < 8 && <span className="gt-card-home">Sur l'accueil</span>}
                            </div>
                            {editingId === photo._id ? (
                                <div className="gt-card-edit">
                                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={150} aria-label="Légende" />
                                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} aria-label="Date de l'événement" />
                                    <div className="gt-card-actions">
                                        <button type="button" className="gt-link" onClick={() => saveEdit(photo._id)} disabled={!editTitle.trim()}>Enregistrer</button>
                                        <button type="button" className="gt-link gt-link--muted" onClick={() => setEditingId(null)}>Annuler</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="gt-card-body">
                                    <p className="gt-card-title">{photo.title}</p>
                                    <p className="gt-card-date">{formatPhotoDate(photo) || 'Date non renseignée'}</p>
                                    <div className="gt-card-actions">
                                        <button type="button" className="gt-link" onClick={() => startEdit(photo)}>Modifier</button>
                                        <button type="button" className="gt-link gt-link--danger" onClick={() => askDelete(photo)}>Supprimer</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
