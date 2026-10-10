import { useEffect, useState } from "react";

/**
 * Fait tourner un « projecteur » d'un élément à l'autre.
 * Renvoie l'index mis en avant, et les gestionnaires à poser sur le conteneur
 * pour suspendre la rotation au survol — sinon la carte se déplace au moment
 * précis où l'on veut cliquer dessus.
 *
 * Respecte le réglage système « réduire les animations » : dans ce cas rien ne
 * bouge et le premier élément reste en avant.
 */
// 7 s : à 4 s, la barre filait trop vite pour qu'on ait le temps de lire la
// carte mise en avant. Doit rester synchronisé avec la transition de
// .award-progress i dans Price.css.
export default function useSpotlight(count, intervalMs = 7000) {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        if (count < 2 || paused) return undefined;

        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (reduced) return undefined;

        const timer = setInterval(() => setActive((i) => (i + 1) % count), intervalMs);
        return () => clearInterval(timer);
    }, [count, paused, intervalMs]);

    // Si la liste raccourcit (une publication retirée), l'index doit rester valide.
    useEffect(() => {
        if (active >= count) setActive(0);
    }, [count, active]);

    return {
        active,
        pauseProps: {
            onMouseEnter: () => setPaused(true),
            onMouseLeave: () => setPaused(false),
            onFocusCapture: () => setPaused(true),
            onBlurCapture: () => setPaused(false),
        },
    };
}
