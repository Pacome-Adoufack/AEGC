import React from "react";
import "../styles/Release.css";
import logo from "../assets/logo.png";

const pdfFiles = [
  {
    id: 1,
    title: "Notre Prochain Webinaire",
    date: "02/10/2025",
    description:
      "Mesurer l´impact des politiques publiques : Comprendre le modèle des différences en différences",
    filename: "prochain webinaire.pdf",
    thumbnail: logo,
  },
  {
    id: 2,
    title: "Présentation des Bourses de Mobilité AEGC",
    date: "08/10/2025",
    description: "Encourager la recherche, renforcer les liens universitaires",
    filename: "Bourse_AEGC_International.pdf",
    thumbnail: logo,
  },
  {
    id: 3,
    title: "Appel à candidatures",
    date: "05/03/2025",
    description: "Opportunités de bourses de recherche pour les membres",
    filename: "appel-candidatures-2025.pdf",
    thumbnail: logo,
  },
];

function Release() {
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
      <h1 className="release-title">Communiqués officiels</h1>
      <p className="release-subtitle">
        Retrouvez ici tous les communiqués officiels de l'association
      </p>

      <div className="release-list">
        {pdfFiles.map((item) => (
          <div key={item.id} className="release-card">
            <div className="release-thumbnail">
              <img src={item.thumbnail} alt={`Miniature ${item.title}`} />
              <div className="pdf-label">PDF</div>
            </div>

            <div className="release-content">
              <h2>{item.title}</h2>
              <p className="release-date">Publié le: {item.date}</p>
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
}

export default Release;
