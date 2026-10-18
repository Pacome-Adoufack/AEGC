import React, { useCallback, useEffect, useMemo, useState } from "react";
import "../../styles/Picture.css";
import { API_BASE_URL } from "../Url";
import PhotoLightbox from "../common/PhotoLightbox";
import { formatPhotoDate, galleryImageUrl, photoYear } from "../../utils/gallery";
import { useTranslation } from "react-i18next";

function Picture() {
  const { t, i18n } = useTranslation();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedYear, setSelectedYear] = useState("all");
  const [hoveredId, setHoveredId] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/gallery?limit=500`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setPhotos(result.data || []);
        else setLoadError(true);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  // Années présentes, de la plus récente à la plus ancienne
  const years = useMemo(
    () => [...new Set(photos.map(photoYear))].sort((a, b) => b - a),
    [photos],
  );

  // L'API renvoie l'ordre d'ajout (utile pour l'accueil) ; ici, archive classée
  // par date d'événement, la plus récente d'abord.
  const filteredPhotos = useMemo(() => {
    const photoTime = (photo) => new Date(photo.eventDate || photo.createdAt).getTime();
    const inYear = selectedYear === "all" ? photos : photos.filter((photo) => photoYear(photo) === selectedYear);
    return [...inYear].sort((a, b) => photoTime(b) - photoTime(a));
  }, [photos, selectedYear]);

  const closeLightbox = useCallback(() => setOpenIndex(null), []);

  const formatDate = (photo) => {
    const date = photo.eventDate || photo.createdAt;
    if (!date) return "";
    return new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(date));
  };

  return (
    <div className="gallery-container">
      <h1 className="gallery-title">{t("gallery.title")}</h1>

      {loading ? (
        <p className="gallery-state">{t("gallery.loading")}</p>
      ) : loadError ? (
        <p className="gallery-state">{t("gallery.loadError")}</p>
      ) : photos.length === 0 ? (
        <p className="gallery-state">{t("gallery.empty")}</p>
      ) : (
        <>
          {years.length > 1 && (
            <div className="year-filters">
              {["all", ...years].map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`year-filter ${selectedYear === year ? "active" : ""}`}
                >
                  {year === "all" ? t("gallery.allYears") : year}
                </button>
              ))}
            </div>
          )}

          <div className="masonry-gallery">
            {filteredPhotos.map((photo, index) => (
              <button
                key={photo._id}
                type="button"
                className="gallery-item"
                onClick={() => setOpenIndex(index)}
                onMouseEnter={() => setHoveredId(photo._id)}
                onMouseLeave={() => setHoveredId(null)}
                aria-label={t("gallery.enlarge", { title: photo.title })}
              >
                <img
                  src={galleryImageUrl(photo, "thumb")}
                  alt={photo.title}
                  width={photo.thumbWidth}
                  height={photo.thumbHeight}
                  className="gallery-image"
                  loading="lazy"
                />
                <div className={`image-overlay ${hoveredId === photo._id ? "visible" : ""}`}>
                  <h3>{photo.title}</h3>
                  <p>{formatDate(photo) || formatPhotoDate(photo) || photoYear(photo)}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {openIndex !== null && (
        <PhotoLightbox
          photos={filteredPhotos}
          index={openIndex}
          onClose={closeLightbox}
          onNavigate={setOpenIndex}
        />
      )}
    </div>
  );
}

export default Picture;
