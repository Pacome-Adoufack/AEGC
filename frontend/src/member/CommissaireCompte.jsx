import React from "react";
import "../styles/Member.css";
import commissaireImage from "../assets/commissaire image.png";

const CommissaireCompte = () => {
  return (
    <div className="relation-container">
      <div className="relation-card">
        <h1 className="relation-title">Commissaire aux comptes de l'AEGC</h1>
        <img
          src={commissaireImage}
          alt="Président de l'association"
          className="relation-image"
        />
        <p className="relation-description">
          MANY Patrick est un Ingénieur Économiste et Financier. Il a soutenu
          son mémoire à l'Université de Yaoundé 2 SOA (Cameroun) sur le thème :
          Effets de la culture sur le capital humain et la croissance économique
          en Afrique subsaharienne . Il est actuellement commissaire aux comptes
          de l'Association des Économistes et Gestionnaires du Cameroun (AEGC).
          Ses travaux portent principalement sur les industries culturelles et
          créatives ainsi que les risques bancaires. Il a récemment participé à
          la 1er édition des olympiades du marché financier d’Afrique Centrale
          organisée par la Commission de surveillance des marchés financiers
          d’Afrique Centrale (COSUMAF) au Cameroun. Parallèlement à ses
          activités de recherche, il intervient régulièrement dans les activités
          de la Conférence Banque Finance (Cobaf) du côté de l’université
          Catholique d’Afrique Centrale. Il est également créateur de visuels
          (flyers, spot vidéo, affiches …). <br /> Coordonnées: (+237) 656367040 <br />
          many_patrick@yahoo.com
        </p>
        <div className="relation-download">
          <a
            href="/pdf/CV Many (2).pdf"
            download
            className="relation-button"
          >
            📄 Télécharger le CV du{" "}
            <strong>Commissaire aux comptes de l'AEGC</strong>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CommissaireCompte;
