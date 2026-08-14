import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "@/styles/Register.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { API_BASE_URL } from "../Url";
import { COUNTRIES } from "../../data/countries";
import logo from "../../assets/logo.png";

export default function Register() {
  const [data, setData] = useState({
    name: "",
    firstName: "",
    email: "",
    gender: "",
    telefonNummer: "",
    country: "",
    city: "",
    university: "",
    password: "",
  });

  const [_phoneCode, setPhoneCode] = useState("");
  const [messageType, setMessageType] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const isPasswordValid = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
    if (name === "country") {
      const selected = COUNTRIES.find((c) => c.name === value);
      setPhoneCode(selected ? selected.callingCode : "");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isPasswordValid(data.password)) {
      setMessageType("error");
      setMessage("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.");
      return;
    }

    fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) return res.text().then((text) => { throw new Error(text); });
        return res.json();
      })
      .then(() => {
        setMessageType("success");
        setMessage("Enregistrement réussi !");
        setTimeout(() => navigate("/login"), 2000);
      })
      .catch((error) => {
        setMessageType("error");
        setMessage("Erreur lors de l'enregistrement : " + error.message);
      });
  };

  const selectedCountry = COUNTRIES.find((c) => c.name === data.country);

  return (
    <div className="reg-page">
      <div className="reg-card">

        {/* Logo + titre */}
        <div className="reg-header">
          <img src={logo} alt="Logo AEGC" className="reg-logo" />
          <h1 className="reg-title">Créer un compte</h1>
          <p className="reg-subtitle">Rejoignez le réseau des économistes et gestionnaires du Cameroun</p>
        </div>

        {/* Message feedback */}
        {message && (
          <div className={`reg-message reg-message--${messageType}`}>{message}</div>
        )}

        <form onSubmit={handleSubmit} className="reg-form">

          {/* Nom + Prénom */}
          <div className="reg-grid-2">
            <div className="reg-field">
              <label htmlFor="name" className="reg-label">Nom</label>
              <input className="reg-input" type="text" id="name" name="name" value={data.name} onChange={handleChange} placeholder="Dupont" required />
            </div>
            <div className="reg-field">
              <label htmlFor="firstName" className="reg-label">Prénom</label>
              <input className="reg-input" type="text" id="firstName" name="firstName" value={data.firstName} onChange={handleChange} placeholder="Jean" required />
            </div>
          </div>

          {/* Email */}
          <div className="reg-field">
            <label htmlFor="email" className="reg-label">Adresse e-mail</label>
            <input className="reg-input" type="email" id="email" name="email" value={data.email} onChange={handleChange} placeholder="jean.dupont@example.com" required />
          </div>

          {/* Sexe + Pays */}
          <div className="reg-grid-2">
            <div className="reg-field">
              <label htmlFor="gender" className="reg-label">Sexe</label>
              <select className="reg-select" id="gender" name="gender" value={data.gender} onChange={handleChange} required>
                <option value="">-- Sélectionner --</option>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </select>
            </div>
            <div className="reg-field">
              <label htmlFor="country" className="reg-label">Pays</label>
              <select className="reg-select" id="country" name="country" value={data.country} onChange={handleChange} required>
                <option value="">-- Sélectionner --</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Téléphone */}
          <div className="reg-field">
            <label htmlFor="telefonNummer" className="reg-label">Numéro de téléphone</label>
            <div className="reg-phone">
              {selectedCountry && (
                <span className="reg-phone-code">{selectedCountry.callingCode}</span>
              )}
              <input
                className="reg-input reg-phone-input"
                type="text"
                id="telefonNummer"
                name="telefonNummer"
                placeholder="699 123 456"
                value={data.telefonNummer}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Ville + Université */}
          <div className="reg-grid-2">
            <div className="reg-field">
              <label htmlFor="city" className="reg-label">Ville</label>
              <input className="reg-input" type="text" id="city" name="city" value={data.city} onChange={handleChange} placeholder="Yaoundé" required />
            </div>
            <div className="reg-field">
              <label htmlFor="university" className="reg-label">Institution / Université</label>
              <input className="reg-input" type="text" id="university" name="university" value={data.university} onChange={handleChange} placeholder="Université de Yaoundé II" required />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="reg-field">
            <label htmlFor="password" className="reg-label">Mot de passe</label>
            <div className="reg-password-wrapper">
              <input
                className="reg-input"
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={data.password}
                onChange={handleChange}
                placeholder="Min. 8 caractères, majuscule, chiffre, symbole"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="reg-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Afficher / masquer mot de passe"
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          <button type="submit" className="reg-submit">S'inscrire</button>
        </form>

        <p className="reg-login-link">
          Déjà membre ?{" "}
          <Link to="/login">Se connecter</Link>
        </p>

      </div>
    </div>
  );
}
