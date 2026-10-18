import React from "react";
import { useTranslation } from "react-i18next";
import "@/styles/Footer.css";
import logo from "@/assets/logo.png";
import { FaFacebook, FaLinkedin, FaTwitter, FaWhatsapp } from "react-icons/fa";

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer-top-bar" />

      <div className="footer-body">
        {/* Colonne 1 : marque */}
        <div className="footer-brand">
          <img src={logo} alt="Logo AEGC" className="footer-logo" />
          <div className="footer-brand-text">
            <p className="footer-tagline">{t("footer.tagline")}</p>
            <a href="/contact" className="footer-contact-link">
              {t("footer.contactUs")}
            </a>
          </div>
        </div>

        {/* Colonnes 2-4 : liens */}
        <div className="footer-cols-grid">
          <div className="footer-col">
            <span className="footer-col-title">{t("footer.navigation")}</span>
            <ul>
              <li><a href="/home">{t("footer.home")}</a></li>
              <li><a href="/working-papers">{t("footer.journals")}</a></li>
              <li><a href="/seminaire">{t("footer.activities")}</a></li>
              <li><a href="/development">{t("footer.committees")}</a></li>
              <li><a href="/formations">{t("footer.formations")}</a></li>
              <li><a href="/about">{t("footer.about")}</a></li>
            </ul>
          </div>

          {/* Colonne 3 : liens utiles */}
          <div className="footer-col">
            <span className="footer-col-title">{t("footer.usefulLinks")}</span>
            <ul>
              <li><a href="/register">{t("footer.createAccount")}</a></li>
              <li><a href="/login">{t("footer.login")}</a></li>
              <li><a href="/forgotpassword">{t("footer.forgotPassword")}</a></li>
              <li><a href="/my-submissions">{t("footer.submissions")}</a></li>
              <li><a href="/contact">{t("footer.contact")}</a></li>
            </ul>
          </div>

          {/* Colonne 4 : reseaux sociaux */}
          <div className="footer-col">
            <span className="footer-col-title">{t("footer.followUs")}</span>
            <div className="footer-social-list">
              <a
                href="https://whatsapp.com/channel/0029VaiK9Uh9MF98zYaAId36"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-item"
              >
                <span className="footer-social-icon whatsapp">
                  <FaWhatsapp size={18} color="white" />
                </span>
                WhatsApp
              </a>
              <a
                href="https://www.linkedin.com/company/association-des-economistes-et-gestionnaires-du-cameroun/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-item"
              >
                <span className="footer-social-icon linkedin">
                  <FaLinkedin size={18} color="white" />
                </span>
                LinkedIn
              </a>
              <a href="#" className="footer-social-item">
                <span className="footer-social-icon facebook">
                  <FaFacebook size={18} color="white" />
                </span>
                Facebook
              </a>
              <a href="#" className="footer-social-item">
                <span className="footer-social-icon twitter">
                  <FaTwitter size={18} color="white" />
                </span>
                Twitter / X
              </a>
            </div>
          </div>
        </div>
      </div>

      <hr className="footer-separator" />

      <div className="footer-bottom">
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} AEGC. {t("footer.copyright")}
        </p>
        <div className="footer-bottom-links">
          <a href="/about">{t("footer.legalNotice")}</a>
          <a href="/ethique">{t("footer.ethics")}</a>
          <a href="/contact">{t("footer.contact")}</a>
        </div>
        <p className="footer-credit">
          {t("footer.madeWith")} <span className="footer-heart">&#9829;</span> by <a href="https://landry-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer" className="footer-credit-link">Landry</a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;