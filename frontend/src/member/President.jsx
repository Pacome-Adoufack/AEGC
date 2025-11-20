import React from "react";
import "../styles/Member.css";
import presidentImage from "../assets/president image.png";

const President = () => {
  return (
    <div className="relation-container">
      <div className="relation-card">
        <h1 className="relation-title">Président de l'AEGC</h1>
        <img
          src={presidentImage}
          alt="Président de l'association"
          className="relation-image"
        />
        <p className="relation-description">
          Dr Aristide Merlin Ngono est docteur en économie mathématique,
          spécialisé en économie de la santé. Il a soutenu sa thèse à
          l’Université de Dschang (Cameroun) sur le thème : Les effets des
          mesures de lutte contre la COVID-19 sur la résilience économique des
          pays d’Afrique subsaharienne. Il est actuellement chercheur au Centre
          d’Études et de Recherches en Économie et Gestion (CEREG), et président
          de l’Association des Économistes et Gestionnaires du Cameroun (AEGC).
          Ses travaux portent principalement sur l’économie de la santé, la
          résilience économique, les politiques publiques en contexte
          pandémique, les inégalités d’accès aux soins et l’impact
          institutionnel sur le développement. Il est également impliqué dans
          plusieurs projets de recherche internationaux, notamment un programme
          franco-roumain sur l’accès aux soins en Europe, et un partenariat
          scientifique entre la France, le Portugal et le Cameroun sur la
          réponse à la crise COVID-19. Lauréat de plusieurs prix et bourses
          (bourse COIMBRA, Erasmus Mundus, concours de la meilleure thèse en
          économie d’Afrique centrale), Dr Ngono a été chercheur invité dans
          plusieurs institutions académiques, dont l’Université de Poitiers
          (France), l’ENSAE d’Abidjan (Côte d’Ivoire), et a récemment participé
          à des conférences internationales en France, aux États-Unis et en
          Afrique. Parallèlement à ses activités de recherche, il enseigne
          l’analyse économique appliquée et les techniques quantitatives. Il
          intervient régulièrement comme formateur sur des logiciels, notamment
          ceux de conception et d’analyse de données (Stata, SPSS, R-Studio,
          Python, Eviews, NVIVO, SmartPLS, Kobotoolbox, Google Forms). <br />
          Coordonnées : Tél. : 0684215039 / 237697881782  <br />
          aristidemerlin1994@gmail.com
        </p>
        <div className="relation-download">
          <a
            href="/pdf/CV_Aristide_Ngono__ (3).pdf"
            download
            className="relation-button"
          >
            📄 Télécharger le CV du{" "}
            <strong>Président de l'AEGC</strong>
          </a>
        </div>
      </div>
    </div>
  );
};

export default President;
