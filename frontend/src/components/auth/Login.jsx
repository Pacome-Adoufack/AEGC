import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "@/styles/Login.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { API_BASE_URL } from "../Url";
import logo from "../../assets/logo.png";

export default function Login({ setIsLoggedIn }) {
  const { t } = useTranslation();
  const [data, setData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...data, [name]: value };

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
        if (!res.ok) return res.text().then((text) => { throw new Error(text); });
        return res.json();
      })
      .then((dataRes) => {
        setMessageType("success");
        setMessage(t("auth.successLogin"));
        setIsLoggedIn(true);
        localStorage.setItem("user", JSON.stringify(dataRes.user));

        const userRole = dataRes.user.role || "user";
        let redirectPath = "/home";
        if (userRole === "dev") redirectPath = "/dev-dashboard";
        else if (userRole === "admin") redirectPath = "/admin-dashboard";
        else if (userRole === "dispatcher") redirectPath = "/dispatcher/working-papers";

        if (rememberMe) {
          localStorage.setItem("token", dataRes.token);
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("userRole", userRole);
          const saved = JSON.parse(localStorage.getItem("savedCredentials") || "{}");
          saved[data.email] = data.password;
          localStorage.setItem("savedCredentials", JSON.stringify(saved));
        } else {
          sessionStorage.setItem("token", dataRes.token);
          sessionStorage.setItem("isLoggedIn", "true");
          sessionStorage.setItem("userRole", userRole);
          const saved = JSON.parse(localStorage.getItem("savedCredentials") || "{}");
          delete saved[data.email];
          localStorage.setItem("savedCredentials", JSON.stringify(saved));
        }

        setTimeout(() => navigate(redirectPath), 1500);
      })
      .catch(() => {
        setMessageType("error");
        setMessage(t("auth.invalidCredentials"));
      });
  };

  return (
    <div className="lg-page">
      <div className="lg-card">

        <div className="lg-header">
          <img src={logo} alt="Logo AEGC" className="lg-logo" />
          <h1 className="lg-title">{t("auth.loginTitle")}</h1>
          <p className="lg-subtitle">{t("auth.loginSubtitle")}</p>
        </div>

        {message && (
          <div className={`lg-message lg-message--${messageType}`}>{message}</div>
        )}

        <form onSubmit={handleSubmit} className="lg-form">

          <div className="lg-field">
            <label htmlFor="email" className="lg-label">{t("auth.email")}</label>
            <input
              className="lg-input"
              type="email"
              id="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              placeholder="jean.dupont@example.com"
              required
            />
          </div>

          <div className="lg-field">
            <div className="lg-label-row">
              <label htmlFor="password" className="lg-label">{t("auth.password")}</label>
              <Link to="/forgotpassword" className="lg-forgot">{t("auth.forgotPassword")}</Link>
            </div>
            <div className="lg-password-wrapper">
              <input
                className="lg-input"
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={data.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="lg-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={t("auth.showPassword")}
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
          </div>

          <label className="lg-remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            {t("auth.rememberMe")}
          </label>

          <button type="submit" className="lg-submit">{t("auth.login")}</button>
        </form>

        <p className="lg-register-link">
          {t("auth.notMember")}{" "}
          <Link to="/register">{t("auth.register")}</Link>
        </p>

      </div>
    </div>
  );
}
