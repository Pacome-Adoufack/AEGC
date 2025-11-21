import React from "react";
import "../styles/Release.css"; // On réutilise les mêmes styles
import logo from "../assets/logo.png";

const bourseFiles = [
  {
    id: 1,
    title: "Bourse de Mobilité Internationale AEGC",
    date: "08/10/2025",
    description:
      "Programme de soutien financier permettant aux chercheurs de se déplacer pour des missions scientifiques à l'étranger.",
    filename: "bourse_mobilite_internationale_AEGC.pdf",
    thumbnail: logo,
  },
  {
    id: 2,
    title: "Bourse Jeune Chercheur AEGC",
    date: "18/04/2025",
    description:
      "Financement destiné aux jeunes chercheurs pour leurs travaux et séminaires académiques.",
    filename: "bourse_jeune_chercheur_AEGC.pdf",
    thumbnail: logo,
  },
  {
    id: 3,
    title: "Bourse Excellence Scientifique",
    date: "12/02/2025",
    description:
      "Une bourse attribuée aux membres ayant réalisé des travaux exceptionnels en économie ou gestion.",
    filename: "bourse_excellence_scientifique_AEGC.pdf",
    thumbnail: logo,
  },
];

export const Bourse = () => {
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
      <h1 className="release-title">Les Bourses AEGC</h1>
      <p className="release-subtitle">
        Découvrez les différentes opportunités de financement offertes par l'association
      </p>

      <div className="release-list">
        {bourseFiles.map((item) => (
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
