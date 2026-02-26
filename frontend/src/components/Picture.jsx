import React, { useState } from "react";
import "../styles/Picture.css";

// Structure des images avec métadonnées (année)
const images = [
  {
    src: "https://www.exordo.com/hubfs/Imported_Blog_Media/Resized-image-4.jpg",
    year: 2025,
    title: "Événement d'été",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-4gWHd92vku_iKTC4ZzCMAz5J_C6wvzIFcw&s",
    year: 2025,
    title: "Réunion d'équipe",
  },
  {
    src: "https://www.cio.com/wp-content/uploads/2025/03/217732-0-86829000-1742807934-shutterstock_2347235209.jpg?quality=50&strip=all&w=1024",
    year: 2025,
    title: "Conférence",
  },
  {
    src: "https://www.mon-evenement.net/wp-content/uploads/2017/05/conference.jpg",
    year: 2024,
    title: "Projet Alpha",
  },
  {
    src: "https://www.undp.org/sites/g/files/zskgke326/files/2022-12/UNDPAfrica_AEC_Closing%20Diginitaries%20Group%20Photo.jpg",
    year: 2024,
    title: "Lancement produit",
  },
  {
    src: "https://express.converia.de/custom/media/conrad_25/Gruppenfoto_druck_ok_.jpg",
    year: 2023,
    title: "Atelier créatif",
  },
  {
    src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxqlsEbwqsBygsIShg9tyNt2e9vxqyPc4VVA&s",
    year: 2023,
    title: "Formation",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5f075d33e4ac9c3b05ca695e/1608135598073-SP8USL4632R82D136QQO/19264733_690328184505668_6606660888089315828_o.jpg",
    year: 2023,
    title: "Équipe en action",
  },
];

function Picture() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [hoveredImage, setHoveredImage] = useState(null);

  // Extraire les années uniques pour les filtres
  const years = ["all", ...new Set(images.map((img) => String(img.year)))];


  // Filtrer les images selon l'année sélectionnée
  const filteredImages =
    selectedYear === "all"
      ? images
      : images.filter((img) => img.year === Number(selectedYear));

  return (
    <div className="gallery-container">
      <h1 className="gallery-title">Galerie Photos</h1>

      {/* Filtres par année */}
      <div className="year-filters">
  {years.map((year) => (
    <button
      key={year}
      onClick={() => setSelectedYear(year === "all" ? "all" : Number(year))}
      className={`year-filter ${
        selectedYear === (year === "all" ? "all" : Number(year)) ? "active" : ""
      }`}
    >
      {year === "all" ? "Toutes les années" : year}
    </button>
  ))}
</div>


      {/* Galerie d'images */}
      <div className="masonry-gallery">
        {filteredImages.map((image, index) => (
          <div
            key={index}
            className="gallery-item"
            onMouseEnter={() => setHoveredImage(index)}
            onMouseLeave={() => setHoveredImage(null)}
          >
            <img
              src={image.src}
              alt={image.title}
              className="gallery-image"
              loading="lazy"
            />
            <div
              className={`image-overlay ${
                hoveredImage === index ? "visible" : ""
              }`}
            >
              <h3>{image.title}</h3>
              <p>{image.year}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Picture;
