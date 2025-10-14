import React from "react";
import communicationImg from "../assets/communication.jpeg";

const CommunicationOne = () => {
  return (
    <div className="relation-container">
      <div className="relation-card">
        <h1 className="relation-title">Chargé de la communication de l'AEGC</h1>
        <img
          src={communicationImg}
          alt="Président de l'association"
          className="relation-image"
        />
        <p className="relation-description">
          Étudiant chercheur et Analyste financier Erwan Voundi est une jeune
          professionnel du secteur de la finance. Passionné de l'analyse des
          données et de la Business intelligence,Erwan est un économiste junior
          à l'association des Économistes et gestionnaires du Cameroun en tant
          que Responsable de la communication..
        </p>
        <div className="relation-download">
          <a
            href="/pdf/CV_tebou_Marius.pdf"
            download
            className="relation-button"
          >
            📄 Télécharger le CV du{" "}
            <strong>Chargé des relations extérieures de l'AEGC</strong>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CommunicationOne;
