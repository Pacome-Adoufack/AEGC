import React from "react";
import "../styles/Release.css";
import logo from "../assets/logo.png";

const pdfFiles = [
  {
    id: 1,
    title: "Web Binaire de Novembre 2025",
    date: "20/11/2025",
    description:
      "De la donnée à la décision: Néttoyage, Instruments, Estimations et Prévisions en Micro et Macroéconomie - Applications en Santé de Banque",
    filename: "Communiqué_AEGC_Novembre_2025 (1).pdf",
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
    title: "Web Binaire de Decembre 2025",
    date: "20/11/2025",
    description: "La place de la femme dans le d´eveloppement scientifique en Afrique : réalités,parcours et perspectives",
    filename: "Communiqué_AEGC_30_Décembre_2025 (1) (1).pdf",
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
