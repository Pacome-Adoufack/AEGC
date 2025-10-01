import React from "react";
import tresorierImg from "../assets/tresorier.png";

const Tresorier = () => {
  return (
    <div className="president-container">
      <h1>Trésorier de l'AEGC</h1>
      <img
        src={tresorierImg}
        alt="tresorier de l'association"
      />
      <p>
        Inès Pérolde ZEH est enseignante à l’Université de Bertoua, Cameroun.
        Après l’obtention d’une licence en Monnaie, Banque et Finance à
        l’Université de Yaoundé 2, elle obtient un Master 2 en Economie des
        Ressource Humaines (Nouveau Programme de Troisième Cycle
        Interuniversitaire-NPTCI CCCO Bénin 2016) et un PhD dans la même option
        (African Economic Research Consortium-AERC, Kenya) à travers le
        programme de PhD Collaboratif. Lors de sa formation JFE (AERC, Kenya
        2018), elle se spécialise en Economie du Développement et en
        Econométrie. Ses domaines d’intérêt actuels sont le genre en relation
        avec l’économie agricole, la microéconométrie du développement mais pas
        que. Elle est responsable du Département de Microéconomie de l’AEGC.
      </p>
    </div>
  );
};

export default Tresorier;
