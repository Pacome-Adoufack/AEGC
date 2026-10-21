import { useCallback, useEffect, useState } from "react";
import { getAuthToken } from "../../utils/auth";
import { API_BASE_URL } from "../Url";
import "../../styles/NewsletterConsent.css";

/**
 * Demande son consentement à un membre qui n'a jamais répondu.
 *
 * Les comptes créés avant la case à cocher n'ont pas de préférence
 * enregistrée : on ne peut pas leur écrire sans avoir demandé, et on ne peut
 * pas non plus supposer un refus. Ce bandeau pose la question une fois, à la
 * connexion, et n'apparaît plus ensuite — quelle que soit la réponse.
 *
 * Il ne bloque rien : on peut l'ignorer et continuer à naviguer.
 */
export default function NewsletterConsentBanner() {
    const [visible, setVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState("");

    const token = getAuthToken();

    useEffect(() => {
        if (!token) return undefined;
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/newsletter/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const payload = await res.json();
                // `answered` vient du serveur : il distingue « a refusé » de
                // « n'a jamais été sollicité ».
                if (!cancelled && payload.answered === false) setVisible(true);
            } catch {
                // Silencieux : un bandeau d'abonnement ne doit jamais gêner la
                // navigation si le serveur ne répond pas.
            }
        })();

        return () => { cancelled = true; };
    }, [token]);

    const answer = useCallback(async (optIn) => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/newsletter/me`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ optIn }),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(payload.error || "Enregistrement impossible");
            setDone(payload.message || "Préférence enregistrée");
            setTimeout(() => setVisible(false), 2500);
        } catch {
            setDone("Impossible d'enregistrer votre choix. Réessayez plus tard.");
        } finally {
            setSaving(false);
        }
    }, [token]);

    if (!visible) return null;

    return (
        <div className="nl-consent" role="region" aria-label="Actualités de l'AEGC">
            {done ? (
                <p className="nl-consent-done">{done}</p>
            ) : (
                <>
                    <p className="nl-consent-text">
                        Souhaitez-vous recevoir les actualités de l&apos;AEGC par courriel ?
                        Vous pourrez vous désinscrire à tout moment.
                    </p>
                    <div className="nl-consent-actions">
                        <button className="nl-consent-no" onClick={() => answer(false)} disabled={saving}>
                            Non merci
                        </button>
                        <button className="nl-consent-yes" onClick={() => answer(true)} disabled={saving}>
                            {saving ? "…" : "Oui, je m'abonne"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
