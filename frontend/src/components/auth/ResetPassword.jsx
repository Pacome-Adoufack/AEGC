import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "@/styles/ResetPassword.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { API_BASE_URL } from "../Url";

export default function ResetPassword() {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [_tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const res = await fetch(`${API_BASE_URL}/reset-password/${token}`);
      if (res.ok) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
      }
    };
    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: newPassword }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        setError(
          data.error ||
          t("auth.resetError")
        );
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(t("auth.resetRequestError"));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reset-success-container">
        <div className="reset-success-box">
          <h2>{t("auth.resetSuccessTitle")}</h2>
          <p>
            {t("auth.resetSuccessText")}
          </p>
          <button onClick={() => navigate("/login")}>{t("auth.login")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2>{t("auth.resetTitle")}</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="newPassword">{t("auth.newPassword")}</label>
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.newPasswordPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="show-password-btn"
              aria-label={t("auth.showPassword")}
            >
              {showPassword ? (
                <i className="fa-regular fa-eye-slash"></i>
              ) : (
                <i className="fa-regular fa-eye"></i>
              )}
            </button>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">
              {t("auth.confirmPassword")}
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="show-password-btn"
              aria-label={t("auth.showPassword")}
            >
              {showPassword ? (
                <i className="fa-regular fa-eye-slash"></i>
              ) : (
                <i className="fa-regular fa-eye"></i>
              )}
            </button>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading
              ? t("auth.resetLoading")
              : t("auth.resetSubmit")}
          </button>
        </form>
      </div>
    </div>
  );
}
