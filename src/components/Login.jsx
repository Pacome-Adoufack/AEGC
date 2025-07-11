import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function Login({ setIsLoggedIn }) {
  const [data, setData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("http://localhost:3000/login", {
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
      .then((data) => {
        setMessage("Connexion réussie !");
        setIsLoggedIn(true);
        //enregistre le token dans le localstorage
        // ou sessionStorage selon la case à cocher "Se souvenir de moi"

        console.log("Connexion réussie", data);
        if (rememberMe) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("isLoggedIn", "true");
        } else {
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("isLoggedIn", "true");
        }
        

        setTimeout(() => {
          navigate("/home");
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
          className={`login-message ${
            message.toLowerCase().includes("erreur") ? "error" : "success"
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
