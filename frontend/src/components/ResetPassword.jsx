import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/ResetPassword.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { API_BASE_URL } from "../components/Url";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
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
      setError("Les mots de passe ne correspondent pas");
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
            "Le mot de passe n'a pas pu être réinitialisé. Essayez à nouveau."
        );
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError("Une erreur s'est produite. Veuillez réessayer.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reset-success-container">
        <div className="reset-success-box">
          <h2>Mot de passe réinitialisé avec succès !</h2>
          <p>
            Vous pouvez maintenant vous connecter avec votre nouveau mot de
            passe.
          </p>
          <button onClick={() => navigate("/login")}>Se connecter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h2>Réinitialiser le mot de passe</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="newPassword">Nouveau mot de passe</label>
            <input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Saisir un nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="show-password-btn"
              aria-label="Passwort anzeigen/verbergen"
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
              Confirmez le nouveau mot de passe
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Confirmer le nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="show-password-btn"
              aria-label="Passwort anzeigen/verbergen"
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
              ? "En cours de chargement..."
              : "Réinitialiser le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
