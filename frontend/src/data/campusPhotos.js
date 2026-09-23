import campusYaounde1 from "../assets/campus-yaounde1.jpg";
import campusYaounde2 from "../assets/campus-yaounde2.jpg";
import campusEsstic from "../assets/campus-esstic.jpg";
import campusDouala from "../assets/campus-douala.jpg";
import campusBamenda from "../assets/campus-bamenda.jpg";
import campusBamendaCentre from "../assets/campus-bamenda-centre.jpg";
import campusNgaoundere from "../assets/campus-ngaoundere.jpg";
import campusBuea from "../assets/campus-buea.jpg";
import campusDschang from "../assets/campus-dschang.jpg";
import campusLogbessou from "../assets/campus-logbessou.jpg";

// Campus universitaires camerounais affichés en rotation dans le bandeau d'accueil.
// Toutes ces photos viennent de Wikimedia Commons. Sauf mention CC0, la licence
// CC BY-SA 4.0 impose d'afficher le nom de l'auteur : la ligne de crédits sous la
// mosaïque est obligatoire, ne pas la retirer.
// Les trois premières s'affichent au chargement, les suivantes arrivent en rotation.
export const CAMPUS_PHOTOS = [
  {
    src: campusYaounde1,
    alt: "Allée arborée du campus de l'Université de Yaoundé I",
    author: "Bdx",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Campus_University_of_Yaound%C3%A9_I_(2014)_Amphi_502_and_trees.JPG",
  },
  {
    src: campusBamenda,
    alt: "Bâtiments de l'Université de Bamenda devant les collines",
    author: "Alain Kimbu",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:PBB_Uba.jpg",
  },
  {
    src: campusEsstic,
    alt: "Bâtiment de l'ESSTIC, Université de Yaoundé I",
    author: "Serieminou",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:ESSTIC_Universit%C3%A9_de_Yaound%C3%A9_I.jpg",
  },
  {
    src: campusYaounde2,
    alt: "Bâtiment de l'IFORD, Université de Yaoundé II",
    author: "Bdx",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:IFORD_Yaound%C3%A9_(2014)_front.jpg",
  },
  {
    src: campusDouala,
    alt: "Bâtiment de l'Université de Douala",
    author: "Kondah",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Universit%C3%A9_de_Douala_02.jpg",
  },
  {
    src: campusBuea,
    alt: "Pelouses et bâtiments du campus de l'Université de Buea",
    author: "Adesolive",
    license: "CC0",
    source: "https://commons.wikimedia.org/wiki/File:University_of_Buea_Campus_B.jpg",
  },
  {
    src: campusNgaoundere,
    alt: "Entrée de l'Université de Ngaoundéré",
    author: "Minette Lontsie",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Universit%C3%A9_de_Ngaound%C3%A9r%C3%A9.jpg",
  },
  {
    src: campusBamendaCentre,
    alt: "Cour intérieure de l'Université de Bamenda",
    author: "Persont118",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Uba1a.jpg",
  },
  {
    src: campusDschang,
    alt: "Portail d'entrée de l'Université de Dschang",
    author: "Ulrich237",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Entr%C3%A9e_de_l%27Universit%C3%A9_de_Dschang.jpg",
  },
  {
    src: campusLogbessou,
    alt: "Entrée du campus de Logbessou, Université de Douala",
    author: "Minette Lontsie",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:Universit%C3%A9_de_Douala,_Campus_de_Logbessou.jpg",
  },
];

export const LICENSE_URLS = {
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
  CC0: "https://creativecommons.org/publicdomain/zero/1.0/deed.fr",
};
