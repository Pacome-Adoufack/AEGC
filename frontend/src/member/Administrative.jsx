import React from "react";
import "../styles/Member.css";
import administrativeImage from "../assets/administrative.png";

const Administrative = () => {
  return (
    <div className="relation-container">
      <div className="relation-card">
        <h1 className="relation-title">
          Responsable des affaires administrative et diplomatique de l'AEGC
        </h1>
        <img
          src="https:/v3_side_photo/764/side-president-association.png"
          alt="Président de l'association"
          className="relation-image"
        />
        <p className="relation-description">
          Raphael ELOUNDOU NGONO est Magistrat, diplômé de l’École Nationale
          d’Administration et de Magistrature (ENAM). Il a d’abord été chercheur
          à la Direction de Recherche et des Investissements à Afriland First
          Bank avant d’intégrer L’ENAM en 2017. Titulaire de deux (02) Master 2,
          un en Ingénierie Economique et Financière obtenu à l’Université de
          Yaoundé 2- SOA et l’autre en Droit, Economie et Finance obtenu à
          l’Université de Rennes 1 en France. Il est l’auteur de 03 ouvrages de
          qualité à savoir : Finances publiques publié en 2020, Le Baobab en
          Economie aux concours d’entrée dans les grandes écoles publié en 2022
          et Les Grandes Questions Contemporaines en culture générale publié
          2024. Actuellement étudiant en Gestion des Politiques Economiques à
          l’Université de Clermont Ferrand. Avec son engouement, son amour pour
          le travail bien fait et sa passion pour l’économie et les finances
          publiques, il est moniteur dans divers groupes de préparation aux
          concours d’entrée à l’ENAM, à l’EMIA, à l’ENSET et à la NASLA.
        </p>
        <div className="relation-download">
          <a
            href="/pdf/CV_tebou_Marius.pdf"
            download
            className="relation-button"
          >
            📄 Télécharger le CV du{" "}
            <strong>Chargé des affaires administrative de l'AEGC</strong>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Administrative;
