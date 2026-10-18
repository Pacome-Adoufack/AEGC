import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import "@/styles/Reservation.css";
import { API_BASE_URL } from "../Url";
import { useTranslation } from "react-i18next";

const Reservation = () => {
  const { t } = useTranslation();
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
      setMessage(t("reservation.authRequired"));
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
        setMessage(t("reservation.success"));
        console.log("Réservation réussie", data);
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      })
      .catch((error) => {
        console.error("Erreur lors de la réservation", error);

        setMessage(t("reservation.error", { message: error.message }));
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
      <h1 className="reservation-title">{t("reservation.title")}</h1>
      <p className="reservation-description">
        {t("reservation.activityDescription")}
      </p>
      <form onSubmit={handleSubmit} className="reservation-form">
        <div className="form-group">
          <label htmlFor="firstname">{t("reservation.lastName")}</label>
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
          <label htmlFor="lastname">{t("reservation.firstName")}</label>
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
          <label htmlFor="email">{t("reservation.email")}</label>
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
          <label htmlFor="phone">{t("reservation.phone")}</label>
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
          <label htmlFor="gender">{t("reservation.gender")}</label>
          <select
            id="gender"
            name="gender"
            value={data.gender}
            onChange={handleChange}
            required
          >
            <option value="">{t("reservation.genderPlaceholder")}</option>
            <option value="Masculin">{t("reservation.male")}</option>
            <option value="Féminin">{t("reservation.female")}</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="profession">{t("reservation.profession")}</label>
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
          {t("reservation.submit")}
        </button>
      </form>
    </div>
  );
};

export default Reservation;
