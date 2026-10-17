import { Link } from "react-router-dom";
import { API_BASE_URL } from "../Url";

// Repli quand un lauréat n'a pas de portrait. Le choix suit le rang de la
// carte, pas le nom du prix : le bureau peut renommer ses prix librement.
const FALLBACK_ICONS = ["🏆", "🌱", "💡", "⭐"];

/**
 * Carte d'un prix. Un prix peut avoir plusieurs lauréats la même année — le
 * Prix du jeune économiste 2026 en compte deux — d'où les portraits côte à
 * côte et les noms séparés.
 *
 * `spotlight` met la carte en avant. `linkTo` rend la carte entièrement
 * cliquable, utilisé sur l'accueil où elle mène à la page des prix. Sur la
 * page des prix elle-même il n'y a nulle part où aller, donc pas de lien.
 */
export default function AwardCard({ prize, spotlight = false, index = 0, compact = false, linkTo = null }) {
    const laureates = prize.laureates || [];
    const multiple = laureates.length > 1;

    const classes = ["award-card"];
    if (spotlight) classes.push("is-spotlight");
    if (compact) classes.push("is-compact");
    if (linkTo) classes.push("is-clickable");
    if (multiple) classes.push("is-multiple");

    // Une seule motivation affichée quand elle est commune, sinon celle de
    // chaque lauréat sous son nom.
    const sharedCitation = !multiple ? laureates[0]?.citation : "";
    const document = laureates.find((l) => l.documentUrl);

    return (
        <Wrapper className={classes.join(" ")} linkTo={linkTo}>
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

                {multiple ? (
                    <ul className="award-laureates">
                        {laureates.map((laureate) => (
                            <li key={laureate._id}>
                                <span className="award-laureate">{laureate.laureate}</span>
                                {laureate.affiliation && (
                                    <span className="award-affiliation">{laureate.affiliation}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <>
                        <h3 className="award-laureate">{laureates[0]?.laureate}</h3>
                        {laureates[0]?.affiliation && (
                            <p className="award-affiliation">{laureates[0].affiliation}</p>
                        )}
                    </>
                )}

                {!compact && sharedCitation && <p className="award-citation">{sharedCitation}</p>}

                {/* Pas de lien dans une carte déjà cliquable : deux cibles
                    imbriquées, c'est invalide en HTML et déroutant à l'usage. */}
                {!linkTo && document && (
                    <a
                        className="award-doc-link"
                        href={`${API_BASE_URL}${document.documentUrl}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Lire le document →
                    </a>
                )}
            </div>

            <span className="award-progress" aria-hidden="true"><i /></span>
        </Wrapper>
    );
}

function Wrapper({ linkTo, className, children }) {
    if (linkTo) {
        return <Link className={className} to={linkTo}>{children}</Link>;
    }
    return <article className={className}>{children}</article>;
}
