import { useEffect, useRef, useState } from "react";
import { CAMPUS_PHOTOS, LICENSE_URLS } from "../../data/campusPhotos";

const SLOT_COUNT = 3;
const ROTATION_MS = 30000;
const FADE_MS = 700;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

// Mosaïque du bandeau : trois emplacements, une photo change toutes les 30 secondes,
// à tour de rôle. Chaque emplacement est donc renouvelé toutes les 90 secondes.
export default function HeroMosaic() {
  const [slots, setSlots] = useState(() =>
    Array.from({ length: SLOT_COUNT }, (_, i) => ({ current: i, previous: null })),
  );
  const nextPhoto = useRef(SLOT_COUNT % CAMPUS_PHOTOS.length);
  const nextSlot = useRef(0);

  useEffect(() => {
    // Rotation inutile s'il n'y a pas plus de photos que d'emplacements, et
    // désactivée pour qui demande de réduire les animations.
    if (CAMPUS_PHOTOS.length <= SLOT_COUNT || prefersReducedMotion()) return undefined;

    const timers = new Set();
    const interval = setInterval(() => {
      // Onglet en arrière-plan : on ne consomme rien et on ne « saute » pas de photos.
      if (document.hidden) return;

      setSlots((current) => {
        const shown = current.map((slot) => slot.current);
        let candidate = nextPhoto.current;
        // On cherche une photo qui n'est affichée nulle part ailleurs.
        for (let i = 0; i < CAMPUS_PHOTOS.length && shown.includes(candidate); i += 1) {
          candidate = (candidate + 1) % CAMPUS_PHOTOS.length;
        }
        nextPhoto.current = (candidate + 1) % CAMPUS_PHOTOS.length;

        const slotIndex = nextSlot.current;
        nextSlot.current = (slotIndex + 1) % SLOT_COUNT;

        return current.map((slot, i) =>
          i === slotIndex ? { current: candidate, previous: slot.current } : slot,
        );
      });

      // L'ancienne photo est retirée du DOM une fois le fondu terminé.
      const cleanup = setTimeout(() => {
        setSlots((current) => current.map((slot) => ({ ...slot, previous: null })));
        timers.delete(cleanup);
      }, FADE_MS);
      timers.add(cleanup);
    }, ROTATION_MS);

    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, []);

  // Les photos non affichées sont chargées une fois la page prête, pour ne pas
  // retarder le premier affichage.
  useEffect(() => {
    const load = () => {
      CAMPUS_PHOTOS.slice(SLOT_COUNT).forEach((photo) => {
        const image = new Image();
        image.src = photo.src;
      });
    };
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(load, { timeout: 4000 })
      : setTimeout(load, 2500);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
    };
  }, []);

  // Crédits des seules photos visibles, sans doublon d'auteur.
  const visible = slots.map((slot) => CAMPUS_PHOTOS[slot.current]);
  const credits = visible.filter(
    (photo, index) => visible.findIndex((p) => p.author === photo.author) === index,
  );

  return (
    <figure className="hero-media">
      <div className="hero-mosaic">
        {slots.map((slot, index) => {
          const photo = CAMPUS_PHOTOS[slot.current];
          const previous = slot.previous !== null ? CAMPUS_PHOTOS[slot.previous] : null;
          return (
            <div
              key={index}
              className={`hero-mosaic-slot ${index === 0 ? "hero-mosaic-main" : ""}`}
            >
              {previous && <img src={previous.src} alt="" aria-hidden="true" />}
              <img
                key={photo.src}
                className="hero-mosaic-enter"
                src={photo.src}
                alt={photo.alt}
                fetchPriority={index === 0 ? "high" : undefined}
              />
            </div>
          );
        })}
      </div>

      <figcaption className="hero-credits">
        Photos :{" "}
        {credits.map((photo, index) => (
          <span key={photo.author}>
            {index > 0 && ", "}
            <a href={photo.source} target="_blank" rel="noopener noreferrer">{photo.author}</a>{" "}
            (<a href={LICENSE_URLS[photo.license]} target="_blank" rel="noopener noreferrer license">{photo.license}</a>)
          </span>
        ))}{" "}
        via Wikimedia Commons
      </figcaption>
    </figure>
  );
}
