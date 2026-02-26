import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { API_BASE_URL } from "../components/Url";

export default function Login({ setIsLoggedIn }) {
  const [data, setData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Lors du changement de l'email, vérifier s'il existe un mot de passe associé
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...data, [name]: value };

    // Si l'email change, chercher un mot de passe associé dans le localStorage
    if (name === "email") {
      const savedCredentials = JSON.parse(localStorage.getItem("savedCredentials") || "{}");
      if (savedCredentials[value]) {
        newData.password = savedCredentials[value];
        setRememberMe(true);
      } else {
        newData.password = "";
        setRememberMe(false);
      }
    }

    setData(newData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      .then((dataRes) => {
        setMessage("Connexion réussie !");
        setIsLoggedIn(true);
        localStorage.setItem("user", JSON.stringify(dataRes.user));

        // Déterminer la route de redirection selon le rôle
        const userRole = dataRes.user.role || 'user';
        let redirectPath = '/home';

        if (userRole === 'dev') {
          redirectPath = '/dev-dashboard';
        } else if (userRole === 'admin') {
          redirectPath = '/admin-dashboard';
        }

        // Stocker les infos dans localStorage ou sessionStorage
        if (rememberMe) {
          localStorage.setItem("token", dataRes.token);
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("userRole", userRole);

          // Sauvegarder le mot de passe par email
          const savedCredentials = JSON.parse(localStorage.getItem("savedCredentials") || "{}");
          savedCredentials[data.email] = data.password;
          localStorage.setItem("savedCredentials", JSON.stringify(savedCredentials));
        } else {
          sessionStorage.setItem("token", dataRes.token);
          sessionStorage.setItem("isLoggedIn", "true");
          sessionStorage.setItem("userRole", userRole);

          // Supprimer mot de passe enregistré si existant
          const savedCredentials = JSON.parse(localStorage.getItem("savedCredentials") || "{}");
          delete savedCredentials[data.email];
          localStorage.setItem("savedCredentials", JSON.stringify(savedCredentials));
        }

        setTimeout(() => {
          navigate(redirectPath);
        }, 2000);
      })
      .catch((error) => {
        setMessage("Erreur lors de la connexion : " + error.message);
      });
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        {message && (
          <div
            className={`login-message ${message.toLowerCase().includes("erreur") ? "error" : "success"
              }`}
          >
            {message}
          </div>
        )}
        <h2 className="login-title">Se connecter</h2>

        <label htmlFor="email">E-Mail :</label>
        <input
          type="email"
          id="email"
          name="email"
          value={data.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Mot de passe :</label>
        <div className="input-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={data.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="show-password-btn"
            aria-label="Afficher / masquer mot de passe"
          >
            {showPassword ? (
              <i className="fa-solid fa-eye-slash"></i>
            ) : (
              <i className="fa-solid fa-eye"></i>
            )}
          </button>
        </div>

        <label className="remember-me">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
          />
          Se souvenir de moi
        </label>

        <button type="submit" className="login-button">
          Se connecter
        </button>

        <a href="/forgotpassword" className="forgot-password">
          Mot de passe oublié?
        </a>
      </form>
    </div>
  );
}
