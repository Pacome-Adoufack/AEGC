import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../Url";

/**
 * Désinscription en un clic depuis un courriel, sans connexion.
 *
 * La demande part dès l'ouverture de la page : exiger un clic de confirmation
 * ajoute un obstacle là où la loi demande que ce soit immédiat.
 */
export default function Unsubscribe() {
    const { token } = useParams();
    const [etat, setEtat] = useState("encours");
    const [message, setMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/newsletter/unsubscribe/${token}`);
                const payload = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (res.ok) {
                    setEtat("ok");
                    setMessage(payload.message || "Vous êtes désinscrit des actualités de l'AEGC.");
                } else {
                    setEtat("erreur");
                    setMessage(payload.error || "Ce lien n'est plus valide.");
                }
            } catch {
                if (!cancelled) {
                    setEtat("erreur");
                    setMessage("Impossible de contacter le serveur. Réessayez dans un instant.");
                }
            }
        })();

        return () => { cancelled = true; };
    }, [token]);

    return (
        <div className="awards-page" style={{ maxWidth: 620, textAlign: "center" }}>
            <h1 style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>Désinscription</h1>

            {etat === "encours" && <p className="awards-state">Traitement en cours…</p>}

            {etat !== "encours" && (
                <>
                    <p style={{ fontSize: "1rem", lineHeight: 1.7 }}>{message}</p>
                    {etat === "ok" && (
                        <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6 }}>
                            Vous pouvez vous réabonner à tout moment depuis votre espace membre.
                        </p>
                    )}
                    <p style={{ marginTop: "1.5rem" }}>
                        <Link to="/" style={{ fontWeight: 600 }}>Retour au site</Link>
                    </p>
                </>
            )}
        </div>
    );
}
