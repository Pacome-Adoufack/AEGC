import React from "react";
import "../styles/Footer.css";
import logo from "../assets/logo.png";
import { FaFacebook, FaLinkedin, FaTwitter, FaWhatsapp } from "react-icons/fa";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top-bar" />

      <div className="footer-body">
        {/* Colonne 1 : marque */}
        <div className="footer-brand">
          <img src={logo} alt="Logo AEGC" className="footer-logo" />
          <div className="footer-brand-text">
            <p className="footer-tagline">
              Association des Economistes et Gestionnaires du Cameroun — promouvoir
              la recherche, l'innovation et le developpement economique.
            </p>
            <a href="/contact" className="footer-contact-link">
              Nous contacter
            </a>
          </div>
        </div>

        {/* Colonnes 2-4 : liens */}
        <div className="footer-cols-grid">
          <div className="footer-col">
            <span className="footer-col-title">Navigation</span>
            <ul>
              <li><a href="/home">Accueil</a></li>
              <li><a href="/working-papers">Journaux</a></li>
              <li><a href="/seminaire">Activites</a></li>
              <li><a href="/development">Comites</a></li>
              <li><a href="/formations">Formations</a></li>
              <li><a href="/about">A propos</a></li>
            </ul>
          </div>

          {/* Colonne 3 : liens utiles */}
          <div className="footer-col">
            <span className="footer-col-title">Liens utiles</span>
            <ul>
              <li><a href="/register">Creer un compte</a></li>
              <li><a href="/login">Se connecter</a></li>
              <li><a href="/forgotpassword">Mot de passe oublie</a></li>
              <li><a href="/my-submissions">Mes soumissions</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          {/* Colonne 4 : reseaux sociaux */}
          <div className="footer-col">
            <span className="footer-col-title">Suivez-nous</span>
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
          &copy; {new Date().getFullYear()} AEGC. Tous droits reserves.
        </p>
        <div className="footer-bottom-links">
          <a href="/about">Mentions legales</a>
          <a href="/ethique">Ethique</a>
          <a href="/contact">Contact</a>
        </div>
        <p className="footer-credit">Made with <span className="footer-heart">&#9829;</span> by Landry</p>
      </div>
    </footer>
  );
}

export default Footer;