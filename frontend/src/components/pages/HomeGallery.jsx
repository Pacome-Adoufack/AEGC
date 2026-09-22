import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../Url";
import PhotoLightbox from "../common/PhotoLightbox";
import { galleryImageUrl } from "../../utils/gallery";
import "../../styles/Gallery.css";

const HOME_PHOTO_COUNT = 8;

// Section « L'AEGC en images » de l'accueil : les photos les plus récentes de la galerie.
export default function HomeGallery() {
  const [photos, setPhotos] = useState([]);
  const [total, setTotal] = useState(0);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/gallery?limit=${HOME_PHOTO_COUNT}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) return;
        setPhotos(result.data || []);
        setTotal(result.total || 0);
      })
      .catch((error) => console.error("Erreur galerie:", error));
  }, []);

  const closeLightbox = useCallback(() => setOpenIndex(null), []);

  // Pas de section vide sur l'accueil tant qu'aucune photo n'est publiée.
  if (photos.length === 0) return null;

  return (
    <section className="home-section gal-home">
      <div className="section-inner">
        <div className="section-header">
          <h2>L'AEGC en images</h2>
          {total > photos.length && (
            <Link to="/picture" className="section-link">Toutes les photos ({total}) →</Link>
          )}
        </div>

        <div className="gal-home-grid">
          {photos.map((photo, index) => (
            <button
              key={photo._id}
              type="button"
              className="gal-home-item"
              onClick={() => setOpenIndex(index)}
              aria-label={`Agrandir : ${photo.title}`}
            >
              <img
                src={galleryImageUrl(photo, "thumb")}
                alt={photo.title}
                width={photo.thumbWidth}
                height={photo.thumbHeight}
                loading="lazy"
              />
              <span className="gal-home-caption">{photo.title}</span>
            </button>
          ))}
        </div>
      </div>

      {openIndex !== null && (
        <PhotoLightbox photos={photos} index={openIndex} onClose={closeLightbox} onNavigate={setOpenIndex} />
      )}
    </section>
  );
}
