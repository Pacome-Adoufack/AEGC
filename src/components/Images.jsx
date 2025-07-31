import React, { useEffect, useState } from "react";
import "../styles/Picture.css";

const Images = () => {
  const [images, setImages] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");
  const [hoveredImage, setHoveredImage] = useState(null);
  const years = ["all", ...new Set(images.map((img) => img.year))];

  const filteredImages =
    selectedYear === "all"
      ? images
      : images.filter((img) => img.year === selectedYear);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch("http://localhost:3000/images", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        setImages(data);
      } catch (error) {
        console.error(
          "❌ Erreur lors du chargement des images:",
          error.message
        );
      }
    };

    fetchImages();
  }, []);

  return (
    <div className="gallery-container">
      <h2 className="gallery-title">📷 Galerie Photos</h2>
      <div className="year-filters">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`year-filter ${selectedYear === year ? "active" : ""}`}
          >
            {year === "all" ? "Toutes les années" : year}
          </button>
        ))}
      </div>
      <div className="masonry-gallery">
        {images.map((img, index) => (
          <div
            key={index}
            onMouseEnter={() => setHoveredImage(index)}
            onMouseLeave={() => setHoveredImage(null)}
            className="gallery-item"
          >
            <img src={img.img} alt={img.name} className="gallery-image"
            loading="lazy"
             />
             <div>
                <div
                    className={`image-overlay ${
                    hoveredImage === index ? "visible" : ""
                    }`}
                >
                    <h3>{img.name}</h3>
                    <p>{img.year}</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Images;
