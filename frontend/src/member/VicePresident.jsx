import React from "react";
import VicePresidentImg from "../assets/vice president.png";

const VicePresident = () => {
  return (
    <div className="president-container">
      <h1>Vice-Président de l'AEGC</h1>
      <img
        src={VicePresidentImg}
        alt="Vice Président de l'association"
      />
      <p>
        Daave Franklin MVOGO II OSSEDE est un chercheur en économie, titulaire
        d’un doctorat PhD obtenu à l’université de Dschang (à l’ouest Cameroun)
        option : analyse des politiques économiques. Il analyse dans sa thèse
        l’effet du développement financier sur l’entrepreneuriat dans les pays
        en développement se situant dans un dualisme entre l’entrepreneuriat
        d’opportunité et l’entrepreneuriat de nécessité. Dès lors, ses travaux
        de recherche portent sur l’économie du développement en général, et sur
        l’entrepreneuriat en particulier. Son objectif est d’amener les pays en
        développement à booster leur production nationale au moyen de certains
        instruments économiques, afin d’assurer la consommation interne et
        accroitre la compétitivité internationale. Outre ses recherches, il est
        actuellement enseignant assistant à l’Institut Universitaire Siantou
        (IUS) où il concilie recherche, enseignement et tâches administratives.
        Grâce à son grand amour pour la recherche et sa passion à la promouvoir
        dans son pays et dans l’ensemble des pays africains, il est également
        vice-président de l’Association des Economistes et Gestionnaires du
        Cameroun (AEGC). Avec toute l’équipe, il travaille en étroite
        collaboration valorisant ainsi la recherche à partir de plusieurs
        activités qu’organise l’association. Il a aussi travaillé au sein du
        gouvernement où il a exercé en qualité de chargé des études
        économétriques au cabinet du Ministère des petites et Moyennes
        Entreprises, de l’Economie Sociale et de l’Artisanat (MINPEMEESA).
      </p>
    </div>
  );
};

export default VicePresident;
