import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import "@/styles/Reservation.css";
import { API_BASE_URL } from "../Url";
import { useTranslation } from "react-i18next";

const Reservation = () => {
  const { t } = useTranslation();
  const reservationT = (key, options = {}) => t(`reservation.${key}`, options);
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
      setMessage(reservationT("authRequired"));
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
        setMessage(reservationT("success"));
        console.log("Réservation réussie", data);
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      })
      .catch((error) => {
        console.error("Erreur lors de la réservation", error);

        setMessage(reservationT("error", { message: error.message }));
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
          className={`register-message ${message.includes("Fehler") ? "error" : "success"
            }`}
        >
          {message}
        </div>
      )}
      <h1 className="reservation-title">{reservationT("formationTitle")}</h1>
      <p className="reservation-description">
        {reservationT("formationDescription")}
      </p>
      <form onSubmit={handleSubmit} className="reservation-form">
        <div className="form-group">
          <label htmlFor="firstname">{reservationT("lastName")}</label>
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
          <label htmlFor="lastname">{reservationT("firstName")}</label>
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
          <label htmlFor="email">{reservationT("email")}</label>
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
          <label htmlFor="phone">{reservationT("phone")}</label>
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
          <label htmlFor="message">{reservationT("message")}</label>
          <textarea
            id="message"
            name="message"
            value={data.message}
            onChange={handleChange}
          ></textarea>
        </div>
        <button type="submit" className="reservation-button">
          {reservationT("register")}
        </button>
      </form>
    </div>
  );
};

export default Reservation;
