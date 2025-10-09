import React from "react";
import censeur1 from "../assets/censeurOne.png";

const CenseurOne = () => {
  return (
    <div className="president-container">
      <h1>Censeur Principal de l'AEGC</h1>
      <img src={censeur1} alt="Président de l'association" />
      <p>
        <strong>Yazid Hamed Salim</strong> est docteur en sciences économiques, option ingénierie
        économique et financière, diplômé de l’Université de Yaoundé II. Sa
        thèse de doctorat, intitulée « Essais sur la finance islamique dans les
        pays membres de l’Organisation de la Coopération Islamique (OCI) »,
        porte sur les déterminants de la performance des banques islamiques,
        l’impact des financements islamiques sur la croissance économique, ainsi
        que leur rôle dans la réduction des inégalités. Chercheur en économie
        appliquée et en finance, ses travaux s’articulent autour de la finance
        islamique, de la gouvernance bancaire, des politiques de développement
        financier dans les pays de l’OCI, ainsi que des enjeux institutionnels
        et éthiques liés à l’intégration des principes de la charia dans les
        systèmes financiers contemporains. Auteur de plusieurs publications
        scientifiques, il est également engagé dans la formation aux outils
        d’analyse et de traitement des données économiques et sociales,
        notamment les logiciels Stata, SPSS, EViews, R, et Kobotoolbox. En
        parallèle de ses activités de recherche, il occupe la fonction de
        censeur au sein de l’Association des Économistes et Gestionnaires du
        Cameroun (AEGC), où il œuvre pour la promotion de l’analyse économique
        rigoureuse et le renforcement des capacités des jeunes chercheurs. <br />
        Tèl:+237 696 076 012
        / +237 670 111 189 <br />
        hamedyazid1992@gmail.com
      </p>
    </div>
  );
};

export default CenseurOne;
