import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ForgotPassword.css"; 
import { API_BASE_URL } from "../components/Url";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez saisir votre adresse e-mail.");
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
        body: JSON.stringify({ email }), // E-Mail korrekt senden
      });
      // Überprüfen, ob die Antwort erfolgreich ist
      const data = await response.json();
      if (!response.ok) {
        // Serverfehler behandeln
        setError(data.message || "Erreur lors de l'envoie de l'Email.");
        return;
      }
      setMessage("L'e-mail de réinitialisation du mot de passe a été envoyé");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      // Fehler, wenn die Antwort nicht im JSON-Format vorliegt
      setError("Une erreur est survenue. Veuillez réessayer plus tard.");
    }
  };
  return (
    <div className="forgot-password-container">
    {message && <div className="message success">{message}</div>}
    {error && <div className="message error">{error}</div>}

    <h2>Mot de passe oublié?</h2>

    <form onSubmit={handleSubmit}>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder=" Saisir l'email"
        required
      />
      <button type="submit">Envoyez</button>
    </form>

    <p>
      Retour à la page <a href="/login">se connecter</a>
    </p>
  </div>
  );
}
