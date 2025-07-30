import React from "react";
import "../styles/Release.css";
import logo from "../assets/logo.png";

// Importation dynamique des PDF depuis le dossier public/pdf
const pdfFiles = [
  {
    id: 1,
    title: "Communiqué de presse - Janvier 2025",
    date: "15/01/2025",
    description: "Annonce des nouveaux projets de recherche pour l'année 2025",
    filename: "Communiqué_AEGC (4).pdf",
    thumbnail: logo,
  },
  {
    id: 2,
    title: "Rapport annuel 2024",
    date: "10/02/2025",
    description: "Bilan des activités et réalisations de l'association pour l'année 2024",
    filename: "rapport-annuel-2024.pdf",
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
    // Chemin vers le dossier public/pdf (utilisation directe du chemin relatif)
    const fileUrl = `/pdf/${filename}`;

    // Création d'un lien temporaire pour le téléchargement
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (filename) => {
    // Ouverture dans un nouvel onglet
    window.open(`/pdf/${filename}`, "_blank");
  };

  return (
    <div className="release-container">
      <h1 className="release-title">Communiqués officiels</h1>
      <p className="release-subtitle">
        Retrouvez ici tous les documents officiels de l'association
      </p>

      <div className="release-list">
        {pdfFiles.map((item) => (
          <div key={item.id} className="release-card">
            <div className="release-thumbnail">
              <img src={logo} alt={`Miniature ${item.title}`} />
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