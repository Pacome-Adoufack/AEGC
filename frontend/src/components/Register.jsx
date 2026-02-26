import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { API_BASE_URL } from "../components/Url";

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

  const [countries, setCountries] = useState([]);
  const [phoneCode, setPhoneCode] = useState("");
  const [messageType, setMessageType] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ✅ Charger la liste des pays depuis l'API
  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2,flags,idd")
      .then((res) => res.json())
      .then((data) => {
        console.log("Pays chargés:", data);

        const sortedCountries = data
          .map((country) => {
            const root = country.idd?.root;
            const suffix = country.idd?.suffixes?.[0];
            return {
              name: country.name?.common || "Inconnu",
              code: country.cca2,
              flag: country.flags?.png,
              callingCode: root && suffix ? `${root}${suffix}` : root || "",
            };
          })
          .filter((c) => c.callingCode !== "")
          .sort((a, b) => a.name.localeCompare(b.name));

        setCountries(sortedCountries);
      })
      .catch((err) =>
        console.error("Erreur lors du chargement des pays:", err)
      );
  }, []);

  const isPasswordValid = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });

    if (name === "country") {
      const selected = countries.find((c) => c.name === value);
      setPhoneCode(selected ? selected.callingCode : "");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isPasswordValid(data.password)) {
      setMessageType("error");
      setMessage(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial."
      );
      return;
    }

    fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok)
          return res.text().then((text) => {
            throw new Error(text);
          });
        return res.json();
      })
      .then((data) => {
        setMessageType("success");
        setMessage("Enregistrement réussi!");
        setTimeout(() => navigate("/login"), 2000);
      })
      .catch((error) => {
        setMessageType("error");
        setMessage("Erreur lors de l'enregistrement: " + error.message);
      });
  };

  return (
    <>
      {message && (
        <div className={`register-message ${messageType}`}>{message}</div>
      )}
      <div className="register-container">
        <form onSubmit={handleSubmit}>
          <h2>S'inscrire</h2>

          <label htmlFor="name">Nom:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={data.name}
            onChange={handleChange}
            required
          />

          <label htmlFor="firstName">Prénom:</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={data.firstName}
            onChange={handleChange}
            required
          />

          <label htmlFor="email">E-Mail:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={data.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="gender">Sexe:</label>
          <select
            id="gender"
            name="gender"
            value={data.gender}
            onChange={handleChange}
            required
          >
            <option value="">-- Sélectionnez votre sexe --</option>
            <option value="Masculin">Masculin</option>
            <option value="Féminin">Féminin</option>
          </select>

          <label htmlFor="country">Pays:</label>
          <select
            id="country"
            name="country"
            value={data.country}
            onChange={handleChange}
            required
          >
            <option value="">-- Sélectionnez un pays --</option>
            {countries.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <label htmlFor="telefonNummer">Numéro de téléphone:</label>
          <div
            className="phone-input"
            style={{ display: "flex", alignItems: "center" }}
          >
            {/* On récupère le pays sélectionné */}
            {data.country &&
              (() => {
                const selectedCountry = countries.find(
                  (c) => c.name === data.country
                );
                return selectedCountry ? (
                  <img
                    src={selectedCountry.flag}
                    alt={selectedCountry.name}
                    width="30"
                    style={{ marginRight: "8px" }}
                  />
                ) : null;
              })()}

            {/* Indicatif du pays */}
            <span
              className="phone-code"
              style={{ marginRight: "8px", color: "black" }}
            >
              {data.country
                ? countries.find((c) => c.name === data.country)?.callingCode
                : ""}
            </span>

            <input
              type="text"
              id="telefonNummer"
              name="telefonNummer"
              placeholder="Ex: 699123456"
              value={data.telefonNummer}
              onChange={handleChange}
              required
            />
          </div>

          <label htmlFor="city">Ville:</label>
          <input
            type="text"
            id="city"
            name="city"
            value={data.city}
            onChange={handleChange}
            required
          />

          <label htmlFor="university">Université:</label>
          <input
            type="text"
            id="university"
            name="university"
            value={data.university}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">Mot de passe:</label>
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

          <button className="register-button" type="submit">
            S'inscrire
          </button>
        </form>
      </div>
    </>
  );
}
