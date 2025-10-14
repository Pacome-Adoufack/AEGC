import React from "react";
import ConseillerOneImg from "../assets/conseiller one.png";

const ConseillerOne = () => {
  return (
    <div className="relation-container">
      <div className="relation-card">
        <h1 className="relation-title">Conseiller de l'AEGC</h1>
        <img
          src={ConseillerOneImg}
          alt="Président de l'association"
          className="relation-image"
        />
        <p className="relation-description">
          Georges est chercheur au Centre d’Économie de la Sorbonne et affilié à
          l’Université de Sorbonne Paris Nord. Il est également enseignant
          contractuel et chercheur associé à l’institut S4ICE, spécialisé dans
          les questions d’entrepreneuriat et de politiques économiques durables.
          Ses travaux portent sur l’impact des technologies de l’information,
          des réseaux sociaux et des infrastructures sur la croissance, le
          bien-être, la pauvreté et l’autonomisation, avec un intérêt
          particulier pour l'entrepreneuriat et l’économie informelle. Il a
          publié dans des revues internationales sur des sujets comme la
          pauvreté énergétique, les médias sociaux, l’informalité, et la
          participation politique des femmes. Son approche allie rigueur
          empirique et engagement pour des politiques publiques inclusives. Il
          mobilise des approches quantitatives, qualitative et mixtes
          rigoureuses et participe à des réseaux de recherche internationaux en
          faveur de politiques publiques inclusives et durables.
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

export default ConseillerOne;
