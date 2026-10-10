import { Link } from "react-router-dom";
import { API_BASE_URL } from "../Url";

// Repli quand le lauréat n'a pas de photo. Le choix suit le rang de la carte,
// pas le nom du prix : le bureau peut renommer ses prix librement.
const FALLBACK_ICONS = ["🏆", "🌱", "💡"];

/**
 * Carte d'un lauréat : couverture pleine largeur, puis le nom du prix en
 * intertitre et le lauréat en titre.
 *
 * `spotlight` met la carte en avant. `linkTo` rend la carte entièrement
 * cliquable — utilisé sur l'accueil, où la carte mène à la page des prix. Sur
 * la page des prix elle-même, il n'y a nulle part où aller : la carte n'est
 * donc pas cliquable, seul le document l'est.
 */
export default function AwardCard({ award, spotlight = false, index = 0, compact = false, linkTo = null }) {
    const classes = ["award-card"];
    if (spotlight) classes.push("is-spotlight");
    if (compact) classes.push("is-compact");
    if (linkTo) classes.push("is-clickable");

    const content = (
        <>
            <div className="award-cover">
                {award.photoUrl ? (
                    <img
                        src={`${API_BASE_URL}${award.photoUrl}`}
                        alt={`Portrait de ${award.laureate}`}
                        loading="lazy"
                    />
                ) : (
                    <span className="award-cover-fallback" aria-hidden="true">
                        {FALLBACK_ICONS[index % FALLBACK_ICONS.length]}
                    </span>
                )}
            </div>

            <div className="award-body">
                {/* Le prix au-dessus du nom plutôt qu'en bandeau sur la photo :
                    il se lit comme une rubrique, et la photo reste entière. */}
                <p className="award-category">{award.category}</p>
                <h3 className="award-laureate">{award.laureate}</h3>
                {award.affiliation && <p className="award-affiliation">{award.affiliation}</p>}

                {!compact && award.citation && <p className="award-citation">{award.citation}</p>}

                {/* Pas de lien dans une carte déjà cliquable : deux cibles
                    imbriquées, c'est invalide en HTML et déroutant à l'usage. */}
                {!linkTo && award.documentUrl && (
                    <a
                        className="award-doc-link"
                        href={`${API_BASE_URL}${award.documentUrl}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Lire le document →
                    </a>
                )}
            </div>

            <span className="award-progress" aria-hidden="true"><i /></span>
        </>
    );

    if (linkTo) {
        return (
            <Link className={classes.join(" ")} to={linkTo}>
                {content}
            </Link>
        );
    }

    return <article className={classes.join(" ")}>{content}</article>;
}
