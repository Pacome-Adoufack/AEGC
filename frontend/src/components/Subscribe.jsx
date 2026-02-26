import React from "react";
import "../styles/Subscripe.css";
import { useState } from "react";
import { API_BASE_URL } from "../components/Url";
import aboner from "../assets/abonement.jpg";

function Subscribe() {
  const [data, setData] = useState({
    email: "",
    name: "",
    lastName: "",
  });
  const [message, setMessage] = useState("");
  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({
      ...data,
      [name]: value,
    });
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    fetch(`${API_BASE_URL}/subscribe`, {
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
        console.log("Abonnement réussi", data);
        setMessage("Abonnement réussi !");
      })
      .catch((error) => {
        console.error("Erreur lors de l'abonnement", error);
        setMessage("Erreur lors de l'abonnement : " + error.message);
      });
  };

  return (
    <div className="subscribe-container">
        {message && (
          <div
            className={`login-message ${
              message.toLowerCase().includes("erreur") ? "error" : "success"
            }`}
          >
            {message}
          </div>
        )}
      <img
        src={aboner}
        alt="newsletter"
        className="subscribe-image"
      />

      <p className="subscribe-description">
        Restez informé des dernières nouvelles et mises à jour de l'AEGC.
      </p>

      <form onSubmit={handleSubmit} className="subscribe-form">
        <input
          type="email"
          id="email"
          name="email"
          value={data.email}
          onChange={handleChange}
          placeholder="Entrez votre adresse e-mail"
          required
          className="subscribe-input"
        />
        <input
          type="text"
          id="name"
          name="name"
          value={data.name}
          onChange={handleChange}
          placeholder="Entrez votre nom"
          required
          className="subscribe-input"
        />
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={data.lastName}
          onChange={handleChange}
          placeholder="Entrez votre prénom"
          required
          className="subscribe-input"
        />
        <button type="submit" className="subscribe-button">
          S'abonner
        </button>
      </form>
    </div>
  );
}

export default Subscribe;
