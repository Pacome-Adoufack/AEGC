import React from "react";
import communicationImg from "../assets/communication.jpeg";

const CommunicationOne = () => {
  return (
    <div className="president-container">
      <h1>Chargé de la communication de l'AEGC</h1>
      <img
        src={communicationImg}
        alt="Président de l'association"
      />
      <p>
        Étudiant chercheur et Analyste financier Erwan Voundi est une jeune
        professionnel du secteur de la finance. Passionné de l'analyse des
        données et de la Business intelligence,Erwan est un économiste junior à
        l'association des Économistes et gestionnaires du Cameroun en tant que
        Responsable de la communication..
      </p>
    </div>
  );
};

export default CommunicationOne;
