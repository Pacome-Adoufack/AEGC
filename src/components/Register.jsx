import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

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
  const [messageType, setMessageType] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordValid = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({
      ...data,
      [name]: value,
    });
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

    fetch("http://localhost:3000/register", {
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
        setMessageType("success");
        setMessage("Enregistrement réussi!");
        console.log("Enregistrement réussi", data);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      })
      .catch((error) => {
        setMessageType("error");
        setMessage("Erreur lors de l'enregistrement: " + error.message);
        console.error("Erreur lors de l'enregistrement", error);
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
          <input
            type="text"
            id="gender"
            name="gender"
            value={data.gender}
            onChange={handleChange}
            required
          />

          <label htmlFor="telefonNummer">Numéro de téléphone:</label>
          <input
            type="text"
            id="telefonNummer"
            name="telefonNummer"
            value={data.telefonNummer}
            onChange={handleChange}
            required
          />

          <label htmlFor="country">Pays:</label>
          <input
            type="text"
            id="country"
            name="country"
            value={data.country}
            onChange={handleChange}
            required
          />

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

          <button className="register-button" type="submit">S'inscrire</button>
        </form>
      </div>
    </>
  );
}
