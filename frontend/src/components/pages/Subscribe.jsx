import React from "react";
import "../../styles/Subscripe.css";
import { useState } from "react";
import { API_BASE_URL } from "../Url";
import aboner from "../../assets/abonement.jpg";
import { useTranslation } from "react-i18next";

function Subscribe() {
  const { t } = useTranslation();
  const [data, setData] = useState({
    email: "",
    name: "",
    lastName: "",
  });
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
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
        setHasError(false);
        setMessage(t("subscribe.success"));
      })
      .catch((error) => {
        console.error("Erreur lors de l'abonnement", error);
        setHasError(true);
        setMessage(t("subscribe.error", { message: error.message }));
      });
  };

  return (
    <div className="subscribe-container">
        {message && (
          <div
            className={`login-message ${hasError ? "error" : "success"}`}
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
        {t("subscribe.description")}
      </p>

      <form onSubmit={handleSubmit} className="subscribe-form">
        <input
          type="email"
          id="email"
          name="email"
          value={data.email}
          onChange={handleChange}
          placeholder={t("subscribe.emailPlaceholder")}
          required
          className="subscribe-input"
        />
        <input
          type="text"
          id="name"
          name="name"
          value={data.name}
          onChange={handleChange}
          placeholder={t("subscribe.namePlaceholder")}
          required
          className="subscribe-input"
        />
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={data.lastName}
          onChange={handleChange}
          placeholder={t("subscribe.firstNamePlaceholder")}
          required
          className="subscribe-input"
        />
        <button type="submit" className="subscribe-button">
          {t("subscribe.submit")}
        </button>
      </form>
    </div>
  );
}

export default Subscribe;
