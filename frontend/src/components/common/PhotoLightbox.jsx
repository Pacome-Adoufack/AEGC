import { useEffect } from "react";
import { formatPhotoDate, galleryImageUrl } from "../../utils/gallery";
import "../../styles/Gallery.css";

// Visionneuse plein écran : flèches du clavier pour naviguer, Échap pour fermer.
export default function PhotoLightbox({ photos, index, onClose, onNavigate }) {
  const photo = photos[index];
  const hasMany = photos.length > 1;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (!hasMany) return;
      if (e.key === "ArrowRight") onNavigate((index + 1) % photos.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + photos.length) % photos.length);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [index, photos.length, hasMany, onClose, onNavigate]);

  if (!photo) return null;
  const date = formatPhotoDate(photo);

  return (
    <div className="gal-lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label={photo.title}>
      <button className="gal-lightbox-close" onClick={onClose} aria-label="Fermer">✕</button>

      {hasMany && (
        <button
          className="gal-lightbox-nav gal-lightbox-nav--prev"
          onClick={(e) => { e.stopPropagation(); onNavigate((index - 1 + photos.length) % photos.length); }}
          aria-label="Photo précédente"
        >‹</button>
      )}

      <figure className="gal-lightbox-figure" onClick={(e) => e.stopPropagation()}>
        <img
          key={photo._id}
          src={galleryImageUrl(photo, "full")}
          alt={photo.title}
          width={photo.width}
          height={photo.height}
        />
        <figcaption>
          <span className="gal-lightbox-title">{photo.title}</span>
          <span className="gal-lightbox-meta">
            {date}
            {hasMany && <>{date ? " · " : ""}{index + 1} / {photos.length}</>}
          </span>
        </figcaption>
      </figure>

      {hasMany && (
        <button
          className="gal-lightbox-nav gal-lightbox-nav--next"
          onClick={(e) => { e.stopPropagation(); onNavigate((index + 1) % photos.length); }}
          aria-label="Photo suivante"
        >›</button>
      )}
    </div>
  );
}
