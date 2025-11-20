import React from "react";
import sgImg from "../assets/sg.png";

const SecretaireGeneral = () => {
  return (
    <div className="relation-container">
      <div className="relation-card">
        <h1 className="relation-title">Secrétaire géneral de l'AEGC</h1>
        <img src={sgImg} alt="SG de l'association" className="relation-image" />
        <p className="relation-description">
          Économiste-statisticien et Data Analyst, Blaise ONDOUA BEYENE est
          titulaire d’un Doctorat (PhD) en économie mathématique, statistique et
          économétrie, avec une formation d’Analyste Statisticien (AS) acquise à
          l’Institut Sous régional de Statistique et d’Economie Appliquée
          (ISSEA). Il est passionné par les problématiques de développement
          socio-économique, de durabilité et d’évaluation d’impact. Auteur de
          plus de dix-sept articles scientifiques publiés dans des revues
          internationales à comité de lecture, il a développé une expertise
          reconnue en data mining, text mining, web mining, analyse causale et
          modélisation économétrique avancée, notamment à partir d’approches
          paramétriques et non paramétriques et à inférence causale. Ses
          compétences en statistique couvrent l’ensemble du cycle de production
          statistique, de la planification et la conception d’outils de collecte
          (quantitatifs et qualitatifs), jusqu’au traitement et à l’analyse
          avancée des données à l’aide de logiciels spécialisés tels que Stata,
          R, SPSS, Python, Nvivo et SQL. Il mobilise ces compétences et celle de
          chercheur pour produire des Policy briefs clairs et orientés vers
          l’action, accessibles aux décideurs des organisations. Consultant
          expert en montage, suivi et évaluation de projets humanitaires et de
          développement, Blaise ONDOUA BEYENE maîtrise également la gestion
          stratégique de projets, la mobilisation de ressources, le
          suivi-évaluation, ainsi que la communication scientifique et
          organisationnelle, essentielle à la prise de décision et à la
          valorisation des résultats. Il a contribué à de nombreux projets
          financés par des bailleurs de fonds et mis en œuvre par des
          organisations nationales et internationales telles que le PNUD,
          UNICEF, CERAPE, PNDP et la Fondation Tri-National de la Sangha (FTNS).
          Blaise ONDOUA BEYENE met ses compétences au service des institutions,
          organisations et centres de recherche qui souhaitent renforcer leur
          capacité analytique, évaluer l’impact de leurs interventions et
          concevoir des solutions durables et inclusives.
        </p>
        <div className="relation-download">
          <a
            href="/pdf/CV ONDOUA BEYENE Blaise.pdf"
            download
            className="relation-button"
          >
            📄 Télécharger le CV du{" "}
            <strong>Secrétaire géneral de l'AEGC</strong>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SecretaireGeneral;
