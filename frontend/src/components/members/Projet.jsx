import React from "react";

const Projet = () => {
  return (
    <div className="relation-container">
      <div className="relation-card">
        <h1 className="relation-title">Chargé des projets de l'AEGC</h1>
        <img
          src="https://res.cloudinary.com/sedomicilier/image/upload/f_auto,q_auto/v1626092684/fiche/page/v3_side_photo/764/side-president-association.png"
          alt="Président de l'association"
          className="relation-image"
        />
        <p className="relation-description">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Iure id qui
          doloribus nobis. Doloribus totam sint porro consectetur tempore
          voluptatem amet, delectus illo animi soluta quod mollitia corporis
          quas recusandae similique laboriosam nobis fugit in praesentium
          dolorem facere illum harum ducimus. Aut facere cum minima perspiciatis
          assumenda mollitia cupiditate repudiandae debitis ratione autem
          accusantium reprehenderit, praesentium, dolor ad laborum animi!
          Assumenda natus, omnis placeat eos blanditiis odit explicabo sapiente,
          fugit fuga, aliquam magni minima magnam. Laboriosam fugiat, ipsam
          voluptates quo maxime perspiciatis ut enim consequuntur, fugit nam
          quae quisquam ex voluptatem non temporibus illo vel, eius officia
          voluptatibus quia iusto voluptas? Cupiditate ipsam nihil dolores unde
          voluptatum porro mollitia deleniti, minus at enim modi possimus ipsa
          fugiat, incidunt, perspiciatis iure animi magnam accusantium nostrum.
          Nobis sapiente ducimus necessitatibus eaque maxime repellat vitae
          impedit est illo odit. Voluptatibus nam doloribus soluta odit
          reiciendis quidem porro libero atque, est ipsa repudiandae quisquam?
        </p>
        <div className="relation-download">
          <a
            href="/pdf/CV_tebou_Marius.pdf"
            download
            className="relation-button"
          >
            📄 Télécharger le CV du{" "}
            <strong>Chargé des relations extérieures de l'AEGC</strong>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Projet;
