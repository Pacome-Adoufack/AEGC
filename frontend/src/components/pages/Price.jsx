import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../Url";
import AwardCard from "../awards/AwardCard";
import AwardLightbox from "../awards/AwardLightbox";
import useSpotlight from "../awards/useSpotlight";
import "../../styles/Price.css";

export default function Price() {
    const { t } = useTranslation();
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [openYear, setOpenYear] = useState(null);
    // { year, index } du prix ouvert en grand, null si la fenetre est fermee.
    const [open, setOpen] = useState(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/awards`);
                // Sans ce contrôle, une page d'erreur HTML partait dans JSON.parse
                // et l'écran restait bloqué sur « Chargement… ».
                if (!res.ok) throw new Error(`Réponse ${res.status}`);
                const payload = await res.json();
                if (cancelled) return;
                setYears(Array.isArray(payload.data) ? payload.data : []);
            } catch (error) {
                console.error("Erreur chargement des prix:", error);
                if (!cancelled) setFailed(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    // L'édition la plus récente est mise en avant, les autres passent en archive.
    const [current, ...previous] = years;
    const { active, pauseProps } = useSpotlight(current?.prizes.length || 0);

    if (loading) {
        return (
            <div className="awards-page">
                <p className="awards-state">{t("price.loading")}</p>
            </div>
        );
    }

    return (
        <div className="awards-page">
            <header className="awards-header">
                <h1>{t("price.title")}</h1>
                <p>{t("price.subtitle")}</p>
            </header>

            {failed ? (
                <p className="awards-state">
                    {t("price.loadError")}
                </p>
            ) : years.length === 0 ? (
                <p className="awards-state">
                    {t("price.empty")}
                </p>
            ) : (
                <>
                    <section className="awards-current">
                        <div className="awards-year-line">
                            <h2>{t("price.edition", { year: current.year })}</h2>
                            <span className="awards-badge">{t("price.newLaureates")}</span>
                        </div>

                        <div className="awards-grid" {...pauseProps}>
                            {current.prizes.map((prize, i) => (
                                <AwardCard
                                    key={prize.category}
                                    prize={prize}
                                    index={i}
                                    spotlight={i === active}
                                    onOpen={() => setOpen({ year: current.year, index: i })}
                                />
                            ))}
                        </div>
                    </section>

                    {previous.length > 0 && (
                        <section className="awards-archive">
                            <h2>{t("price.previousEditions")}</h2>

                            {previous.map((edition) => {
                                const open = openYear === edition.year;
                                return (
                                    <div key={edition.year} className="awards-edition">
                                        <button
                                            className="awards-edition-head"
                                            aria-expanded={open}
                                            onClick={() => setOpenYear(open ? null : edition.year)}
                                        >
                                            <span className="awards-edition-year">{edition.year}</span>
                                            <span className="awards-edition-count">
                                                {t("price.prizes", { count: edition.prizes.length })}
                                            </span>
                                            <span className={`awards-chevron ${open ? "open" : ""}`} aria-hidden="true">▾</span>
                                        </button>

                                        {open && (
                                            <div className="awards-grid is-archive">
                                                {edition.prizes.map((prize, i) => (
                                                    <AwardCard
                                                        key={prize.category}
                                                        prize={prize}
                                                        index={i}
                                                        onOpen={() => setOpen({ year: edition.year, index: i })}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </section>
                    )}
                </>
            )}

            {open && (() => {
                const edition = years.find((y) => y.year === open.year);
                if (!edition) return null;
                return (
                    <AwardLightbox
                        prizes={edition.prizes}
                        index={open.index}
                        year={edition.year}
                        onClose={() => setOpen(null)}
                        onNavigate={(i) => setOpen({ year: open.year, index: i })}
                    />
                );
            })()}
        </div>
    );
}
