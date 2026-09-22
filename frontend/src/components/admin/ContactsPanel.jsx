import { useEffect, useState } from "react";
import { API_BASE_URL } from "../Url";

// Messages reçus via le formulaire de contact du site.
export default function ContactsPanel({ token, flash, openConfirm, onChange }) {
    const [contacts, setContacts] = useState(null);

    useEffect(() => {
        fetch(`${API_BASE_URL}/contact`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`code ${r.status}`))))
            .then((data) => setContacts(Array.isArray(data) ? data : []))
            .catch(() => setContacts([]));
    }, [token]);

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/contact/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`le serveur a répondu ${res.status}`);
            setContacts((list) => list.filter((c) => c._id !== id));
            flash("Message supprimé");
            onChange?.();
        } catch (err) {
            flash(`Suppression impossible : ${err.message}`);
        }
    };

    if (contacts === null) return <p className="adm-empty">Chargement…</p>;

    return (
        <div className="contacts-section">
            <h2>Messages reçus ({contacts.length})</h2>
            {contacts.length === 0 ? (
                <p className="adm-empty">Aucun message pour le moment.</p>
            ) : (
                <div className="contacts-list">
                    {contacts.map((c) => (
                        <div key={c._id} className="contact-card">
                            <div className="contact-header">
                                <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject}`)}`}>
                                    <strong>{c.email}</strong>
                                </a>
                                <button
                                    className="btn-delete-small"
                                    aria-label="Supprimer le message"
                                    onClick={() => openConfirm({
                                        title: "Supprimer le message",
                                        message: `Supprimer le message de ${c.email} ?`,
                                        onConfirm: () => handleDelete(c._id),
                                    })}
                                >🗑️</button>
                            </div>
                            <div className="contact-subject"><strong>Sujet :</strong> {c.subject}</div>
                            <div className="contact-message">{c.message}</div>
                            <div className="contact-date">{new Date(c.createdAt).toLocaleString("fr-FR")}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
