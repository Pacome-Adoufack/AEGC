import { useEffect, useState } from "react";
import { getAuthToken } from "../../utils/auth";
import { API_BASE_URL } from "../Url";

// Volontairement hors du composant : une fonction recréée à chaque rendu
// entrerait dans les dépendances de l'effet de chargement et le relancerait
// en boucle.
async function request(url, options = {}) {
    const token = getAuthToken();
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
    let data = {};
    try {
        data = await res.json();
    } catch {
        // Réponse vide ou page d'erreur HTML.
    }
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
}

/**
 * Diffusion des résultats d'un appel.
 *
 * Deux décisions distinctes, volontairement séparées :
 *  1. l'appel ouvre ses résultats (verrou global) ;
 *  2. chaque papier accepté est coché ou non.
 * Un papier n'est réellement publié que si les deux sont vrais. Tant que le
 * verrou est fermé, on peut préparer la sélection sans rien exposer.
 */
export default function DiffusionModal({ workingPaper, toast, onClose, onChanged }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState("");
    const [resultsPublic, setResultsPublic] = useState(false);
    const [publishedAt, setPublishedAt] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loadError, setLoadError] = useState("");

    // Un seul chargement, à l'ouverture. L'erreur est affichée dans la fenêtre
    // plutôt qu'en notification : une notification déclencherait un rendu, donc
    // un nouveau chargement, donc une boucle.
    const callId = workingPaper._id;
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);
            setLoadError("");
            try {
                const data = await request(`${API_BASE_URL}/api/admin/working-papers/${callId}/diffusion`);
                if (cancelled) return;
                setResultsPublic(data.workingPaper.resultsPublic);
                setPublishedAt(data.workingPaper.resultsPublishedAt);
                setSubmissions(data.submissions);
            } catch (err) {
                if (!cancelled) setLoadError(err.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [callId]);

    const toggleCall = async () => {
        const next = !resultsPublic;
        setSaving("call");
        try {
            const data = await request(
                `${API_BASE_URL}/api/admin/working-papers/${workingPaper._id}/diffusion`,
                { method: "PATCH", body: JSON.stringify({ resultsPublic: next }) },
            );
            setResultsPublic(data.resultsPublic);
            setPublishedAt(data.resultsPublic ? new Date().toISOString() : null);
            toast.success(data.message);
            onChanged?.();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving("");
        }
    };

    const togglePaper = async (submission) => {
        const next = !submission.isPublicInHistory;
        setSaving(submission._id);
        try {
            const data = await request(
                `${API_BASE_URL}/api/admin/submissions/${submission._id}/visibility`,
                { method: "PATCH", body: JSON.stringify({ isPublicInHistory: next }) },
            );
            setSubmissions((list) =>
                list.map((s) => (s._id === submission._id ? { ...s, isPublicInHistory: next } : s)),
            );
            toast.success(data.message);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving("");
        }
    };

    const selectedCount = submissions.filter((s) => s.isPublicInHistory).length;

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal diffusion-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>Diffusion des résultats</h2>
                    <button className="admin-modal-close" onClick={onClose}>x</button>
                </div>

                <div className="admin-modal-body">
                    <p className="diffusion-call-title">{workingPaper.title}</p>

                    <div className={`diffusion-gate ${resultsPublic ? "on" : "off"}`}>
                        <div className="diffusion-gate-text">
                            <strong>
                                {resultsPublic
                                    ? "Les résultats de cet appel sont diffusés"
                                    : "Les résultats de cet appel ne sont pas diffusés"}
                            </strong>
                            <span>
                                {resultsPublic
                                    ? "Les papiers cochés ci-dessous sont lisibles par tous et transmis à RePEc."
                                    : "Rien ne sort tant que cet interrupteur est fermé, même les papiers cochés."}
                            </span>
                            {resultsPublic && publishedAt && (
                                <span className="diffusion-date">
                                    Ouvert le {new Date(publishedAt).toLocaleDateString("fr-FR")}
                                </span>
                            )}
                        </div>
                        <button
                            className={`btn btn-small ${resultsPublic ? "btn-secondary" : "btn-primary"}`}
                            onClick={toggleCall}
                            disabled={saving === "call" || loading || Boolean(loadError)}
                        >
                            {saving === "call"
                                ? "…"
                                : resultsPublic
                                    ? "Suspendre la diffusion"
                                    : "Diffuser les résultats"}
                        </button>
                    </div>

                    <div className="diffusion-list-head">
                        <h3>Papiers acceptés</h3>
                        <span>{selectedCount} sur {submissions.length} sélectionné{selectedCount > 1 ? "s" : ""}</span>
                    </div>

                    {loading ? (
                        <div className="admin-empty">Chargement…</div>
                    ) : loadError ? (
                        <div className="admin-empty">{loadError}</div>
                    ) : submissions.length === 0 ? (
                        <div className="admin-empty">
                            Aucun papier accepté pour cet appel. Seuls les papiers acceptés par un
                            gestionnaire peuvent être diffusés.
                        </div>
                    ) : (
                        <ul className="diffusion-list">
                            {submissions.map((s) => (
                                <li key={s._id} className={s.isPublicInHistory ? "selected" : ""}>
                                    <label className="visibility-toggle">
                                        <input
                                            type="checkbox"
                                            checked={s.isPublicInHistory}
                                            disabled={saving === s._id}
                                            onChange={() => togglePaper(s)}
                                        />
                                        <span className="diffusion-paper">
                                            <strong>{s.articleTitle}</strong>
                                            <span className="diffusion-authors">
                                                {s.authors.length > 0 ? s.authors.join(", ") : "Auteur non renseigné"}
                                            </span>
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Rappel volontairement présent : un handle déjà moissonné par RePEc
                        ne disparaît pas d'IDEAS en décochant la case ici. */}
                    <p className="diffusion-warning">
                        Une fois qu&apos;un papier a été moissonné par RePEc, sa notice reste
                        visible sur IDEAS même après retrait. On diffuse lorsque la décision est
                        prise, pas pour essayer.
                    </p>
                </div>

                <div className="admin-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
                </div>
            </div>
        </div>
    );
}
