import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../Url";
import AwardCard from "./AwardCard";
import AwardLightbox from "./AwardLightbox";
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
    const { t } = useTranslation();
    const [prizes, setPrizes] = useState([]);
    const [year, setYear] = useState(null);
    const [openIndex, setOpenIndex] = useState(null);

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
                    <h2>{t("home.awards.laureates", { year })}</h2>
                    <Link className="awards-all-link" to="/price">{t("home.awards.all")}</Link>
                </div>

                <div className="awards-grid" {...pauseProps}>
                    {prizes.map((prize, i) => (
                        <AwardCard
                            key={prize.category}
                            prize={prize}
                            index={i}
                            spotlight={i === active}
                            compact
                            onOpen={() => setOpenIndex(i)}
                        />
                    ))}
                </div>
            </div>

            {openIndex !== null && (
                <AwardLightbox
                    prizes={prizes}
                    index={openIndex}
                    year={year}
                    onClose={() => setOpenIndex(null)}
                    onNavigate={setOpenIndex}
                />
            )}
        </section>
    );
}
