import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "@/styles/ForgotPassword.css";
import { API_BASE_URL } from "../Url";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError(t("auth.emailRequired"));
      return;
    }
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || t("auth.forgotError"));
        return;
      }
      setMessage(t("auth.sentReset"));
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error(err);
      setError(t("auth.retryLater"));
    }
  };
  return (
    <div className="forgot-password-container">
      {message && <div className="message success">{message}</div>}
      {error && <div className="message error">{error}</div>}

      <h2>{t("auth.forgotTitle")}</h2>

      <form onSubmit={handleSubmit}>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.emailPlaceholder")}
          required
        />
        <button type="submit">{t("auth.send")}</button>
      </form>

      <p>
        {t("auth.backTo")} <a href="/login">{t("auth.login")}</a>
      </p>
    </div>
  );
}
