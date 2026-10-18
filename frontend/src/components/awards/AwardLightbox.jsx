import { useEffect } from "react";
import { API_BASE_URL } from "../Url";

/**
 * Détail d'un prix, en grand. Même principe que la visionneuse de la galerie :
 * Échap pour fermer, clic sur le fond pour fermer, flèches pour passer d'un
 * prix à l'autre.
 *
 * Les cartes ne portent que l'essentiel ; tout le reste — affiliations,
 * motivation du jury, liens de profil, document — se lit ici.
 */
export default function AwardLightbox({ prizes, index, year, onClose, onNavigate }) {
    const prize = prizes[index];
    const hasMany = prizes.length > 1;

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Escape") onClose();
            if (!hasMany) return;
            if (e.key === "ArrowRight") onNavigate((index + 1) % prizes.length);
            if (e.key === "ArrowLeft") onNavigate((index - 1 + prizes.length) % prizes.length);
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKey);
        };
    }, [index, prizes.length, hasMany, onClose, onNavigate]);

    if (!prize) return null;
    const laureates = prize.laureates || [];
    // Surtout pas « document » : ce nom masquerait l'objet document du
    // navigateur, utilisé plus haut pour bloquer le défilement de la page.
    const documentLink = laureates.find((l) => l.documentUrl);

    return (
        <div className="award-lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label={prize.category}>
            <button className="award-lightbox-close" onClick={onClose} aria-label="Fermer">✕</button>

            {hasMany && (
                <button
                    className="award-lightbox-nav award-lightbox-nav--prev"
                    onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + prizes.length) % prizes.length); }}
                    aria-label="Prix précédent"
                >‹</button>
            )}

            <div className="award-lightbox-panel" onClick={(e) => e.stopPropagation()}>
                <div className="award-lightbox-images">
                    {laureates.filter((l) => l.photoUrl).map((l) => (
                        <img
                            key={l._id}
                            src={`${API_BASE_URL}${l.photoUrl}`}
                            alt={`Portrait de ${l.laureate}`}
                        />
                    ))}
                </div>

                <div className="award-lightbox-text">
                    {year && <p className="award-lightbox-year">Édition {year}</p>}
                    <h2>{prize.category}</h2>

                    <ul className="award-lightbox-laureates">
                        {laureates.map((l) => (
                            <li key={l._id}>
                                <strong>{l.laureate}</strong>
                                {l.affiliation && <span>{l.affiliation}</span>}
                                {l.citation && <p>{l.citation}</p>}
                                {l.profileUrl && (
                                    <a href={l.profileUrl} target="_blank" rel="noreferrer noopener">
                                        Profil académique ↗
                                    </a>
                                )}
                            </li>
                        ))}
                    </ul>

                    {documentLink && (
                        <a
                            className="award-doc-link"
                            href={`${API_BASE_URL}${documentLink.documentUrl}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Lire le document →
                        </a>
                    )}
                </div>
            </div>

            {hasMany && (
                <button
                    className="award-lightbox-nav award-lightbox-nav--next"
                    onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % prizes.length); }}
                    aria-label="Prix suivant"
                >›</button>
            )}
        </div>
    );
}
