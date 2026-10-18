import React from "react";
import "../../styles/Price.css";
import logo from "../../assets/logo.png";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();
  const translatedFiles = [
    { ...bourseFiles[0], title: t("bourse.files.mobility.title"), description: t("bourse.files.mobility.description") },
    { ...bourseFiles[1], title: t("bourse.files.youngResearcher.title"), description: t("bourse.files.youngResearcher.description") },
    { ...bourseFiles[2], title: t("bourse.files.excellence.title"), description: t("bourse.files.excellence.description") },
  ];
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
      <h1 className="release-title">{t("bourse.title")}</h1>
      <p className="release-subtitle">
        {t("bourse.subtitle")}
      </p>

      <div className="release-list">
        {translatedFiles.map((item) => (
          <div key={item.id} className="release-card">
            <div className="release-thumbnail">
              <img src={item.thumbnail} alt={t("bourse.thumbnailAlt", { title: item.title })} />
              <div className="pdf-label">PDF</div>
            </div>

            <div className="release-content">
              <h2>{item.title}</h2>
              <p className="release-date">{t("bourse.publishedOn", { date: new Intl.DateTimeFormat(i18n.language).format(new Date(item.date.split("/").reverse().join("-"))) })}</p>
              <p className="release-description">{item.description}</p>

              <div className="release-actions">
                <button
                  className="view-button"
                  onClick={() => handleView(item.filename)}
                >
                  {t("bourse.view")}
                </button>
                <button
                  className="download-button"
                  onClick={() => handleDownload(item.filename)}
                >
                  {t("bourse.download")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
