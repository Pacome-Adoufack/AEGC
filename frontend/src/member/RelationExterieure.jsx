import React from "react";
import relation from "../assets/relation exterieure.jpeg";

const RelationExterieure = () => {
  return (
    <div className="relation-container">
      <div className="relation-card">
        <h1 className="relation-title">
          Chargé des relations extérieures de l'AEGC
        </h1>

        <img src={relation} alt="Chargé des relations extérieures" className="relation-image" />

        <p className="relation-description">
          Actuaire qualifié et membre de l’Institut des Actuaires de Belgique
          (IA|BE), je suis diplômé en sciences actuarielles de l’Université
          libre de Bruxelles (ULB). Actuellement Risk Underwriting Officer chez
          AXA Partners, j’interviens sur les sujets techniques et de gouvernance
          liés à la tarification, à la souscription et à la performance des
          portefeuilles. Passionné par l’analyse de données et la modélisation
          actuarielle, j’ai développé une expertise approfondie en pricing P&C
          (Automobiles, habitations, etc...), en machine learning, en deep
          learning et en suivi de la rentabilité technique grâce à mes
          expériences précédentes chez Allianz BeNeLux et dans divers projets
          analytiques. Mon approche conjugue rigueur technique, sens des affaires
          et capacité à vulgariser les concepts actuariels pour un public non
          technique.
        </p>

        <p className="relation-description">
          En parallèle, j’assume la fonction de responsable des relations
          extérieures de l’AEGC, où je veille à mettre en relation les organismes
          publics, parapublics et les entreprises avec les projets et le
          savoir-faire de l’association. L’objectif principal est de favoriser
          leur accompagnement, notamment financier, tout en leur garantissant que
          les membres issus de notre association sont hautement qualifiés et
          capables d’apporter rigueur, professionnalisme et expertise technique
          dans divers domaines tels que l’économie, la banque et la finance,
          l’assurance ou le management.
        </p>

        <div className="relation-download">
          <a href="/pdf/CV_tebou_Marius.pdf" download className="relation-button">
            📄 Télécharger le CV du{" "}
            <strong>Chargé des relations extérieures de l'AEGC</strong>
          </a>
        </div>
      </div>
    </div>
  );
};

export default RelationExterieure;
