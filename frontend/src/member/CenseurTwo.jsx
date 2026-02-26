import React from "react";
import censeur2 from "../assets/censeur two.png";

const CenseurTwo = () => {
  return (
    <div className="relation-container">
      <div className="relation-card">
        <h1 className="relation-title">Censeur Adjoint de l'AEGC</h1>
        <img
          src={censeur2}
          alt="Président de l'association"
          className="relation-image"
        />
        <p className="relation-description">
          <strong>M BALLA MEKONGO Gaëtan Aime</strong> est maître en ingénierie
          économie et financière,soutenue à l’université de Yaoundé 2 soa
          (Cameroun) et en partenariat avec l’université de Rennes (France) sur
          l’impact de l’innovation financière sur la croissance économique en
          zone CEMAC: une spécification du modèle de PAGANO. il est un jeune
          entrepreneur et membre de l’association des économistes et
          gestionnaires du Cameroun (AEGC) Coordonnées <br />
          Tel:237 697258504 <br />
          Mail:
          <br />
          Mekongogaetan@gmail.com <br />
          Gaetanmekongo@iCloud.com
        </p>
        <div className="relation-download">
          <a
            href="/pdf/CV_tebou_Marius.pdf"
            download
            className="relation-button"
          >
            📄 Télécharger le CV du{" "}
            <strong>Censeur Adjoint de l'AEGC</strong>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CenseurTwo;
