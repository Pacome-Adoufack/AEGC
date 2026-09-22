import { useEffect, useState } from "react";
import { API_BASE_URL } from "../Url";

// Abonnés à la newsletter.
export default function SubscribersPanel({ token, flash, openConfirm, onChange }) {
    const [subscribers, setSubscribers] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE_URL}/subscribe`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`code ${r.status}`))))
            .then((data) => setSubscribers(Array.isArray(data) ? data : []))
            .catch(() => setSubscribers([]));
    }, [token]);

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/subscribe/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`le serveur a répondu ${res.status}`);
            setSubscribers((list) => list.filter((s) => s._id !== id));
            flash("Abonné supprimé");
            onChange?.();
        } catch (err) {
            flash(`Suppression impossible : ${err.message}`);
        }
    };

    if (subscribers === null) return <p className="adm-empty">Chargement…</p>;

    return (
        <div className="subscribers-section">
            <h2>Abonnés à la newsletter ({subscribers.length})</h2>
            {subscribers.length === 0 ? (
                <p className="adm-empty">Aucun abonné pour le moment.</p>
            ) : (
                <div className="subscribers-table">
                    <table>
                        <thead><tr><th>Nom</th><th>Prénom</th><th>Email</th><th>Inscrit le</th><th aria-label="Actions"></th></tr></thead>
                        <tbody>
                            {subscribers.map((s) => (
                                <tr key={s._id}>
                                    <td>{s.name}</td>
                                    <td>{s.lastName}</td>
                                    <td>{s.email}</td>
                                    <td>{new Date(s.createdAt).toLocaleDateString("fr-FR")}</td>
                                    <td>
                                        <button
                                            className="btn-delete"
                                            aria-label={`Supprimer ${s.email}`}
                                            onClick={() => openConfirm({
                                                title: "Supprimer l'abonné",
                                                message: `Désinscrire ${s.email} de la newsletter ?`,
                                                onConfirm: () => handleDelete(s._id),
                                            })}
                                        >🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
