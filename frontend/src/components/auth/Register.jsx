import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "@/styles/Register.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { API_BASE_URL } from "../Url";
import { COUNTRIES } from "../../data/countries";
import logo from "../../assets/logo.png";

export default function Register() {
  const { t } = useTranslation();
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
    // Case non pre-cochee : le consentement doit etre un acte positif.
    newsletterOptIn: false,
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
    const { name, value, type, checked } = e.target;
    setData({ ...data, [name]: type === "checkbox" ? checked : value });
    if (name === "country") {
      const selected = COUNTRIES.find((c) => c.name === value);
      setPhoneCode(selected ? selected.callingCode : "");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isPasswordValid(data.password)) {
      setMessageType("error");
      setMessage(t("auth.passwordInvalid"));
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
        setMessage(t("auth.successRegister"));
        setTimeout(() => navigate("/login"), 2000);
      })
      .catch((error) => {
        setMessageType("error");
        setMessage(t("auth.registerError") + " " + error.message);
      });
  };

  const selectedCountry = COUNTRIES.find((c) => c.name === data.country);

  return (
    <div className="reg-page">
      <div className="reg-card">

        {/* Logo + titre */}
        <div className="reg-header">
          <img src={logo} alt="Logo AEGC" className="reg-logo" />
          <h1 className="reg-title">{t("auth.registerTitle")}</h1>
          <p className="reg-subtitle">{t("auth.registerSubtitle")}</p>
        </div>

        {/* Message feedback */}
        {message && (
          <div className={`reg-message reg-message--${messageType}`}>{message}</div>
        )}

        <form onSubmit={handleSubmit} className="reg-form">

          {/* Nom + Prénom */}
          <div className="reg-grid-2">
            <div className="reg-field">
              <label htmlFor="name" className="reg-label">{t("auth.lastName")}</label>
              <input className="reg-input" type="text" id="name" name="name" value={data.name} onChange={handleChange} placeholder="Dupont" required />
            </div>
            <div className="reg-field">
              <label htmlFor="firstName" className="reg-label">{t("auth.firstName")}</label>
              <input className="reg-input" type="text" id="firstName" name="firstName" value={data.firstName} onChange={handleChange} placeholder="Jean" required />
            </div>
          </div>

          {/* Email */}
          <div className="reg-field">
            <label htmlFor="email" className="reg-label">{t("auth.email")}</label>
            <input className="reg-input" type="email" id="email" name="email" value={data.email} onChange={handleChange} placeholder="jean.dupont@example.com" required />
          </div>

          {/* Sexe + Pays */}
          <div className="reg-grid-2">
            <div className="reg-field">
              <label htmlFor="gender" className="reg-label">{t("auth.gender")}</label>
              <select className="reg-select" id="gender" name="gender" value={data.gender} onChange={handleChange} required>
                <option value="">{t("auth.select")}</option>
                <option value="Masculin">{t("auth.male")}</option>
                <option value="Féminin">{t("auth.female")}</option>
              </select>
            </div>
            <div className="reg-field">
              <label htmlFor="country" className="reg-label">{t("auth.country")}</label>
              <select className="reg-select" id="country" name="country" value={data.country} onChange={handleChange} required>
                <option value="">{t("auth.select")}</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Téléphone */}
          <div className="reg-field">
            <label htmlFor="telefonNummer" className="reg-label">{t("auth.phone")}</label>
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
              <label htmlFor="city" className="reg-label">{t("auth.city")}</label>
              <input className="reg-input" type="text" id="city" name="city" value={data.city} onChange={handleChange} placeholder="Yaoundé" required />
            </div>
            <div className="reg-field">
              <label htmlFor="university" className="reg-label">{t("auth.institution")}</label>
              <input className="reg-input" type="text" id="university" name="university" value={data.university} onChange={handleChange} placeholder="Université de Yaoundé II" required />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="reg-field">
            <label htmlFor="password" className="reg-label">{t("auth.password")}</label>
            <div className="reg-password-wrapper">
              <input
                className="reg-input"
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={data.password}
                onChange={handleChange}
                placeholder={t("auth.passwordRequirements")}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="reg-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={t("auth.showPassword")}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          {/* Consentement RGPD : case non pré-cochée, et refuser n'empêche pas
              de créer un compte. */}
          <label className="reg-consent">
            <input
              type="checkbox"
              name="newsletterOptIn"
              checked={data.newsletterOptIn}
              onChange={handleChange}
            />
            <span>{t("auth.newsletterConsent")}</span>
          </label>

          <button type="submit" className="reg-submit">{t("auth.submitRegister")}</button>
        </form>

        <p className="reg-login-link">
          {t("auth.alreadyMember")}{" "}
          <Link to="/login">{t("auth.login")}</Link>
        </p>

      </div>
    </div>
  );
}
