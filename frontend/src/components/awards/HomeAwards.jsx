import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../Url";
import AwardCard from "./AwardCard";
import useSpotlight from "./useSpotlight";
import "../../styles/Price.css";

/**
 * Bandeau des lauréats de l'année civile en cours, sur la page d'accueil.
 *
 * Il se met en place tout seul le jour où un lauréat est publié, et disparaît
 * de lui-même au changement d'année tant que les nouveaux ne sont pas saisis —
 * c'est ce qui évite de laisser « Prix 2026 » affiché en juillet 2027.
 */
export default function HomeAwards() {
    const [prizes, setPrizes] = useState([]);
    const [year, setYear] = useState(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/awards/current`);
                if (!res.ok) return;
                const payload = await res.json();
                if (cancelled) return;
                setPrizes(Array.isArray(payload.data) ? payload.data : []);
                setYear(payload.year);
            } catch (error) {
                console.error("Erreur chargement des lauréats:", error);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    const { active, pauseProps } = useSpotlight(prizes.length);

    if (prizes.length === 0) return null;

    return (
        <section className="home-section home-awards">
            <div className="section-inner">
                <div className="awards-year-line">
                    <h2>Lauréats {year}</h2>
                    <Link className="awards-all-link" to="/price">Tous les prix</Link>
                </div>

                <div className="awards-grid" {...pauseProps}>
                    {prizes.map((prize, i) => (
                        <AwardCard
                            key={prize.category}
                            prize={prize}
                            index={i}
                            spotlight={i === active}
                            compact
                            linkTo="/price"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
