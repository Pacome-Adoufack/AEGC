import { useState } from "react";
import { useTranslation } from "react-i18next";
// import { useNavigate } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import "../../styles/Contact.css";
import { API_BASE_URL } from "../Url";

export default function Contact() {
//   const navigate = useNavigate();
  const { t } = useTranslation();
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
      setMessage(t("contact.invalidEmail"));
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
        setMessage(t("contact.sent"));
        setTimeout(() => {
          setMessage("");
        }, 3000);
      })
      .catch((error) => {
        try {
          const err = JSON.parse(error.message);
          setMessage(err.error || t("contact.unknownError"));
        } catch {
          setMessage(t("contact.sendError"));
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
      <h2 className="contact-title">{t("contact.title")}</h2>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          {t("contact.email")}
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
          {t("contact.subject")}
        </label>
        <select
          id="subject"
          name="subject"
          value={data.subject}
          onChange={handleSubjectChange}
          className="form-select"
        >
          <option value="" disabled>
            {t("contact.chooseSubject")}
          </option>
          <option value="support">{t("contact.support")}</option>
          <option value="feedback">{t("contact.feedback")}</option>
          <option value="profile-change">{t("contact.profileChange")}</option>
          <option value="profile-delete">{t("contact.profileDelete")}</option>
          <option value="custom">{t("contact.custom")}</option>
        </select>

        {customSubject && (
          <input
            type="text"
            name="customSubject"
            value={data.subject}
            onChange={(e) => setData({ ...data, subject: e.target.value })}
            className="form-input"
            placeholder={t("contact.customPlaceholder")}
            style={{ marginTop: "1rem" }}
          />
        )}
      </div>

      <div className="form-group">
        <label htmlFor="message" className="form-label">
          {t("contact.message")}
        </label>
        <textarea
          id="message"
          name="message"
          rows="5"
          value={data.message}
          onChange={(e) => setData({ ...data, message: e.target.value })}
          className="form-textarea"
          placeholder={t("contact.messagePlaceholder")}
        />
      </div>

      <button type="submit" className="submit-button">
        {t("contact.send")}
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

  <p className="contact-dev-credit">
    {t("contact.developedBy")}{' '}
    <a href="https://landry-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer">
      Landry Atikeng
    </a>
  </p>
</div>

  );
}
