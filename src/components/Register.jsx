import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";

export default function Register() {
  const [data, setData] = useState({
    name: "",
    firstName: "",
    email: "",
    gender: "",
    telefonNummer: "",
    country: "",
    city: "",
    university: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({
      ...data,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("http://localhost:3000/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            throw new Error(text);
          });
        }
        return res.json();
      })
      .then((data) => {
        setMessage("Enregistremenet réussi!");
        console.log("Enregistrement réussi", data);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      })
      .catch((error) => {
        setMessage("Erreur lors de l'enregistrement: " + error.message);
        console.error("Erreur lors de l'enregistrement", error);
      });
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit}>
        <h2>S'inscrire</h2>
        <label htmlFor="name">Nom:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={data.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="firstName">Prénom:</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={data.firstName}
          onChange={handleChange}
          required
        />

        <label htmlFor="email">E-Mail:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={data.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="gender">Sexe:</label>
        <input
          type="text"
          id="gender"
          name="gender"
          value={data.gender}
          onChange={handleChange}
          required
        />

        <label htmlFor="telefonNummer">Numéro de téléphone:</label>
        <input
          type="text"
          id="telefonNummer"
          name="telefonNummer"
          value={data.telefonNummer}
          onChange={handleChange}
          required
        />

        <label htmlFor="country">Pays:</label>
        <input
          type="text"
          id="country"
          name="country"
          value={data.country}
          onChange={handleChange}
          required
        />

        <label htmlFor="city">Ville:</label>
        <input
          type="text"
          id="city"
          name="city"
          value={data.city}
          onChange={handleChange}
          required
        />

        <label htmlFor="university">Université:</label>
        <input
          type="text"
          id="university"
          name="university"
          value={data.university}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Mot de passe:</label>
        <input
          type="password"
          id="password"
          name="password"
          value={data.password}
          onChange={handleChange}
          required
        />

        <button type="submit">S'inscrire</button>

        {message && (
          <div
            className={`register-message ${
              message.includes("Fehler") ? "error" : "success"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
