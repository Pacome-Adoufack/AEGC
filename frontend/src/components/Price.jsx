import React from "react";
import "../styles/Release.css"; // On réutilise le même style
import logo from "../assets/logo.png";

const priceFiles = [
  {
    id: 1,
    title: "Prix du Meilleur Chercheur AEGC",
    date: "12/01/2025",
    description:
      "Récompense pour les contributions exceptionnelles en économie et gestion.",
    filename: "prix_meilleur_chercheur_AEGC.pdf",
    thumbnail: logo,
  },
  {
    id: 2,
    title: "Prix Jeune Talent AEGC",
    date: "05/06/2025",
    description:
      "Distinction accordée aux jeunes chercheurs prometteurs.",
    filename: "prix_jeune_talent_AEGC.pdf",
    thumbnail: logo,
  },
  {
    id: 3,
    title: "Prix Innovation Scientifique AEGC",
    date: "21/09/2025",
    description:
      "Pour les projets innovants dans la recherche économique.",
    filename: "prix_innovation_scientifique_AEGC.pdf",
    thumbnail: logo,
  },
];

const Price = () => {
  const handleDownload = (filename) => {
    const fileUrl = `/pdf/${filename}`;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (filename) => {
    const fileUrl = `/pdf/${filename}`;
    window.open(fileUrl, "_blank");
  };

  return (
    <div className="release-container">
      <h1 className="release-title">Les Différents Prix AEGC</h1>
      <p className="release-subtitle">
        Découvrez les distinctions et prix décernés par l'association
      </p>

      <div className="release-list">
        {priceFiles.map((item) => (
          <div key={item.id} className="release-card">
            <div className="release-thumbnail">
              <img src={item.thumbnail} alt={`Miniature ${item.title}`} />
              <div className="pdf-label">PDF</div>
            </div>

            <div className="release-content">
              <h2>{item.title}</h2>
              <p className="release-date">Publié le : {item.date}</p>
              <p className="release-description">{item.description}</p>

              <div className="release-actions">
                <button
                  className="view-button"
                  onClick={() => handleView(item.filename)}
                >
                  Visualiser
                </button>

                <button
                  className="download-button"
                  onClick={() => handleDownload(item.filename)}
                >
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Price;
