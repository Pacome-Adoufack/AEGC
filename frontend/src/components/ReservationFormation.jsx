import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import "../styles/Reservation.css";
import { API_BASE_URL } from "../components/Url";

const Reservation = () => {
  const { formationId } = useParams();
  console.log("formationId:", formationId);

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
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
  
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  
    if (!token) {
      setMessage("Vous devez être connecté pour réserver.");
      return;
    }
  
    fetch(`${API_BASE_URL}/api/reservation-formation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...data, formationId }),
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
        setMessage("Réservation réussie !");
        console.log("Réservation réussie", data);
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      })
      .catch((error) => {
        console.error("Erreur lors de la réservation", error);
      
        setMessage("Erreur lors de la réservation : " + error.message);
        if (
          error.message.toLowerCase().includes("unauthorized") ||
          error.message.includes("401") ||
          error.message.toLowerCase().includes("non autorisé")
        ) {
          console.log("Redirection vers /register dans 2 secondes...");
          setTimeout(() => {
            navigate("/register");
          }, 2000);
        }
      });
      
  };
  
  return (
    <div className="reservation-container">
      {message && (
        <div
          className={`register-message ${
            message.includes("Fehler") ? "error" : "success"
          }`}
        >
          {message}
        </div>
      )}
      <h1 className="reservation-title">S'inscrire</h1>
      <p className="reservation-description">
        Merci de votre intérêt pour nos Formations. Veuillez remplir le
        formulaire d'inscription ci-dessous.
      </p>
      <form onSubmit={handleSubmit} className="reservation-form">
        <div className="form-group">
          <label htmlFor="firstname">Nom:</label>
          <input
            type="text"
            id="firstname"
            name="firstName"
            value={data.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastname">Prénom:</label>
          <input
            type="text"
            id="lastname"
            name="lastName"
            value={data.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={data.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Numéro de téléphone:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={data.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="message">Message (optionnel):</label>
          <textarea
            id="message"
            name="message"
            value={data.message}
            onChange={handleChange}
          ></textarea>
        </div>
        <button type="submit" className="reservation-button">
          S'inscrire
        </button>
      </form>
    </div>
  );
};

export default Reservation;
