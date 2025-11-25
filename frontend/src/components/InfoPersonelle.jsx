import React, { useState } from "react";
import "../styles/InfoPersonelle.css";

const InfoPersonelle = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const [user, setUser] = useState(storedUser);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  return (
    <div className="info-container">
      <h2>Information Personnelle</h2>
      <h4>Mon Profil</h4>

      <div className="info-form">
        <label>Nom:</label>
        <input
          type="text"
          name="name"
          value={user.name}
          onChange={handleChange}
        />

        <label>Prénom:</label>
        <input
          type="text"
          name="firstName"
          value={user.firstName}
          onChange={handleChange}
        />

        <label>Email:</label>
        <input
          type="text"
          name="email"
          value={user.email}
          onChange={handleChange}
        />

        <label>Pays:</label>
        <input
          type="text"
          name="country"
          value={user.country}
          onChange={handleChange}
        />

        <label>Ville:</label>
        <input
          type="text"
          name="city"
          value={user.city}
          onChange={handleChange}
        />

        <label>Numéro de téléphone:</label>
        <input
          type="text"
          name="telefonNummer"
          value={user.telefonNummer}
          onChange={handleChange}
        />

        <label>Sexe:</label>
        <input
          type="text"
          name="gender"
          value={user.gender}
          onChange={handleChange}
        />

        <label>Université / Profession:</label>
        <input
          type="text"
          name="university"
          value={user.university}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default InfoPersonelle;
