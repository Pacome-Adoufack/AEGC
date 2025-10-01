import React from "react";
import ConseillerTwoImg from "../assets/conseiller two.png";

const ConseillerTwo = () => {
  return (
    <div className="president-container">
      <h1>Conseiller de l'AEGC</h1>
      <img
        src={ConseillerTwoImg}
        alt="Président de l'association"
      />
      <p>
        Michèle Pierrette SIGNIN TCHOUPE est membre et conseiller de
        l’Association des Économistes et des Gestionnaires du Cameroun. Sa tâche
        au sein du bureau exécutif consiste à participer à la définition des
        orientations stratégiques de l’association, intervenir dans
        l’organisation des activités et des évènements organisés par
        l’association et enfin contribuer à la mise en place du système de
        gouvernance de l’association. Elle est également Academic Member de
        l’European Corporate Governance Institute (ECGI). Elle rédige
        actuellement une thèse de Doctorat (Ph.D) en cotutelle entre
        l’Université de Douala au Cameroun et l’Université de Corse Pascal Paoli
        en France. Ses recherches portent sur la gouvernance d’entreprise et le
        management africain, en particulier dans les entreprises familiales, les
        Start-up et les PME. Ses travaux lui ont déjà permis de participer à des
        colloques au niveau national et international, de prendre part à des
        projets de recherche dans d’autres universités africaines et de
        bénéficier d’une bourse de mobilité dans un laboratoire de recherche en
        France grâce au programme « Pépinière Doctorale en SeGes » en zone
        CEMAC.
      </p>
    </div>
  );
};

export default ConseillerTwo;
