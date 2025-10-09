import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import "../styles/Reservation.css";
import { API_BASE_URL } from "../components/Url";

const Reservation = () => {
  const { activityId } = useParams();
  console.log("Activity ID:", activityId);

  const [data, setData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    gender: "",
    profession: "",
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
  
    fetch(`${API_BASE_URL}/reservation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...data, activityId }),
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
      <h1 className="reservation-title">Réservation</h1>
      <p className="reservation-description">
        Merci de votre intérêt pour nos activités. Veuillez remplir le
        formulaire de réservation ci-dessous.
      </p>
      <form onSubmit={handleSubmit} className="reservation-form">
        <div className="form-group">
          <label htmlFor="firstname">Nom:</label>
          <input
            type="text"
            id="firstname"
            name="firstname"
            value={data.firstname}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastname">Prénom:</label>
          <input
            type="text"
            id="lastname"
            name="lastname"
            value={data.lastname}
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
          <label htmlFor="gender">Sexe:</label>
          <select
            id="gender"
            name="gender"
            value={data.gender}
            onChange={handleChange}
            required
          >
            <option value="">-- Sélectionnez votre sexe --</option>
            <option value="Masculin">Masculin</option>
            <option value="Féminin">Féminin</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="profession">Profession:</label>
          <input
            type="text"
            id="profession"
            name="profession"
            value={data.profession}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="reservation-button">
          Réserver
        </button>
      </form>
    </div>
  );
};

export default Reservation;
