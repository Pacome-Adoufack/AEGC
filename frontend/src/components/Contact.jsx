import { useState } from "react";
// import { useNavigate } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import "../styles/Contact.css";
import { API_BASE_URL } from "../components/Url";

export default function Contact() {
//   const navigate = useNavigate();
  const [customSubject, setCustomSubject] = useState(false);
  const [message, setMessage] = useState("");
  const [data, setData] = useState({
    email: "",
    subject: "",
    message: "",
  });
  const token = localStorage.getItem("token");

  const handleSubjectChange = (e) => {
    const selectedSubject = e.target.value;
    setData({
      ...data,
      subject: selectedSubject,
    });
    setCustomSubject(selectedSubject === "custom");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      setMessage("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    fetch(`${API_BASE_URL}/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
      .then(() => {
        setData({
          email: "",
          subject: "",
          message: "",
        });
        setMessage("Message envoyé avec succès !");
        setTimeout(() => {
          setMessage("");
        }, 3000);
      })
      .catch((error) => {
        try {
          const err = JSON.parse(error.message);
          setMessage(err.error || "Erreur inconnue.");
        } catch {
          setMessage("Erreur lors de l'envoi du message.");
        }
        setTimeout(() => {
          setMessage("");
        }, 3000);
      });
  };

  return (
    <div className="contact-container">
  {message ? (
    <p className="message-text">{message}</p>
  ) : (
    <form onSubmit={handleSubmit} className="contact-form">
      <h2 className="contact-title">Formulaire de contact</h2>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Adresse Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          className="form-input"
          placeholder="max@musterman.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="subject" className="form-label">
          Objet :
        </label>
        <select
          id="subject"
          name="subject"
          value={data.subject}
          onChange={handleSubjectChange}
          className="form-select"
        >
          <option value="" disabled>
            Sélectionner l'objet de votre message
          </option>
          <option value="support">Demande d'assistance</option>
          <option value="feedback">Réactions</option>
          <option value="profile-change">Modifier le profil</option>
          <option value="profile-delete">Supprimer le profil</option>
          <option value="custom">Autre (veuillez préciser)</option>
        </select>

        {customSubject && (
          <input
            type="text"
            name="customSubject"
            value={data.subject}
            onChange={(e) => setData({ ...data, subject: e.target.value })}
            className="form-input"
            placeholder="Veuillez indiquer l'objet"
            style={{ marginTop: "1rem" }}
          />
        )}
      </div>

      <div className="form-group">
        <label htmlFor="message" className="form-label">
          Votre message :
        </label>
        <textarea
          id="message"
          name="message"
          rows="5"
          value={data.message}
          onChange={(e) => setData({ ...data, message: e.target.value })}
          className="form-textarea"
          placeholder="Décrivez votre demande..."
        />
      </div>

      <button type="submit" className="submit-button">
        Envoyer
      </button>
    </form>
  )}

  {/* <div className="github-links">
    {[
      { name: "Pacome", link: "https://github.com/Pacome-Adoufack" },
      { name: "Sükrü", link: "https://github.com/Okyanuspol" },
      { name: "Bilal", link: "https://github.com/webdevbfb" },
      { name: "Michael", link: "https://github.com/michkffm" },
    ].map(({ name, link }) => (
      <a
        key={name}
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="github-link"
      >
        <FaGithub className="github-icon" />
        <span className="github-name">{name}</span>
      </a>
    ))}
  </div> */}
</div>

  );
}
