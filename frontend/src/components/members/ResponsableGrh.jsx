import React from "react";
import "../../styles/Member.css";
import rhImage from "../../assets/rh.png";

function ResponsableGrh() {
  return (
    <div className="relation-container">
      <div className="relation-card">
        <h1 className="relation-title">Responsable GRH de l'AEGC</h1>
        <img
          src={rhImage}
          alt="Président de l'association"
          className="relation-image"
        />
        <p className="relation-description">
          Pierre Cyrille KINFACK est doctorant en Gestion des Ressources
          Humaines à l'Université de Yaoundé II, spécialisé dans les thématiques
          du management humain, des TIC et du télétravail. Sa thèse porte sur le
          lien entre télétravail et bien-être au travail dans le contexte des
          universités camerounaises. Il cumule une solide expérience académique
          et professionnelle : plus de cinq années d'enseignement (IPES et
          université), l'encadrement d'étudiants (rapports de stage, mémoires),
          et des fonctions de direction académique et administrative à l'ISAAPE.
          Son expertise s'étend également à l'analyse de données qualitatives
          (Nvivo, Maxqda). Auteur et co-auteur de plusieurs publications
          scientifiques dans le domaine du management public, du télétravail et
          de la transformation organisationnelle, il est membre actif de
          laboratoires et réseaux de recherche tels que ERMASMOP-Afrique,
          LaReMap et CEDIMES. Doté d'un sens du contact, d'une forte capacité
          d'adaptation et de rigueur scientifique, il allie compétences en
          gestion académique, recherche scientifique et management
          organisationnel.
        </p>
        <div className="relation-download">
          <a
            href="/pdf/CV_tebou_Marius.pdf"
            download
            className="relation-button"
          >
            📄 Télécharger le CV du{" "}
            <strong>Responsable des Ressources Humaines de l'AEGC</strong>
          </a>
        </div>
      </div>
    </div>
  );
}

export default ResponsableGrh;
