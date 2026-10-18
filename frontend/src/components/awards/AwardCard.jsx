import { API_BASE_URL } from "../Url";

// Repli quand un lauréat n'a pas de portrait. Le choix suit le rang de la
// carte, pas le nom du prix : le bureau peut renommer ses prix librement.
const FALLBACK_ICONS = ["🏆", "🌱", "💡", "⭐"];

/**
 * Carte d'un prix. Volontairement sobre : la photo, le nom du prix, le ou les
 * lauréats. Tout le détail — affiliations, motivation du jury, liens de profil,
 * document — s'ouvre dans AwardLightbox au clic.
 *
 * C'est aussi ce qui garde les cartes à la même hauteur : un prix à deux
 * lauréats n'est plus deux fois plus haut que les autres.
 *
 * `spotlight` met la carte en avant (projecteur tournant).
 */
export default function AwardCard({ prize, spotlight = false, index = 0, compact = false, onOpen }) {
    const laureates = prize.laureates || [];
    const multiple = laureates.length > 1;

    const classes = ["award-card"];
    if (spotlight) classes.push("is-spotlight");
    if (compact) classes.push("is-compact");
    if (onOpen) classes.push("is-clickable");
    if (multiple) classes.push("is-multiple");

    // « Untel et Unetelle » sur une seule ligne : les noms détaillés, avec leur
    // affiliation, sont dans la fenêtre de détail.
    const names = laureates.map((l) => l.laureate).join(" et ");
    const affiliations = [...new Set(laureates.map((l) => l.affiliation).filter(Boolean))].join(" · ");

    const content = (
        <>
            <div className="award-cover">
                {laureates.map((laureate, i) => (
                    <span className="award-cover-slot" key={laureate._id}>
                        {laureate.photoUrl ? (
                            <img
                                src={`${API_BASE_URL}${laureate.photoUrl}`}
                                alt={`Portrait de ${laureate.laureate}`}
                                loading="lazy"
                            />
                        ) : (
                            <span className="award-cover-fallback" aria-hidden="true">
                                {FALLBACK_ICONS[(index + i) % FALLBACK_ICONS.length]}
                            </span>
                        )}
                    </span>
                ))}
            </div>

            <div className="award-body">
                <p className="award-category">{prize.category}</p>
                <h3 className="award-laureate">{names}</h3>
                {affiliations && <p className="award-affiliation">{affiliations}</p>}
            </div>

            <span className="award-progress" aria-hidden="true"><i /></span>
        </>
    );

    if (onOpen) {
        return (
            <button type="button" className={classes.join(" ")} onClick={onOpen}>
                {content}
            </button>
        );
    }

    return <article className={classes.join(" ")}>{content}</article>;
}
