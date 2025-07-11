import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Faq from "../components/Faq";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaBell,
  FaUser,
  FaHeart,
  FaShareAlt,
  FaStar,
  FaComment,
} from "react-icons/fa";
import "../styles/Home.css";
import Picture from "./Picture";
import logo from "../assets/logo.png";

const Home = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/activities");
        const result = await response.json();
        setData(result);
        console.log("Fetched data:", result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);
  return (
    <div className="home-container">
      <div className="first-image">
        <img
          src="https://media.istockphoto.com/id/610041376/fr/photo/beau-lever-de-soleil-sur-la-mer.jpg?s=612x612&w=0&k=20&c=q4xfv_aYl3sdiEOCIby1SNdG4ffhd73CRXcyc2J0tV0="
          alt=""
          className="image-first"
        />
        <div className="image-second-container">
          <img
            src={logo}
            alt=""
            className="image-second"
          />
          <h1 className="home-title">Bienvenue sur AEGC</h1>
        </div>
      </div>
      <section className="first-section">
        <h4 className="first-section-title">Nos Prochains Séminaire</h4>
        <div className="activity-images-grid">
          {data.map((data) => (
            <div key={data._id} className="activity-card">
              <img src={data.image} alt={data.name} />
              <div className="activity-card-content">
                <h2>{data.name}</h2>
                <p>{data.description}</p>
                <p className="activity-date">
                  <FaCalendarAlt className="icon" />
                  <span>{new Date(data.date).toLocaleDateString()}</span>
                </p>
                <p className="activity-location">
                  <FaMapMarkerAlt className="icon" />
                  <span>{data.location}</span>
                </p>
                <p>
                  <strong>Présenté par :</strong>{" "}
                  <a className="doctor-link" href="/adoufack">
                    {data.presenter}
                  </a>
                </p>
                <Link
                  to={`/reservation/${data._id}`}
                  className="reserve-button"
                >
                  Réserver
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* <section className="journals-section-modern">
        <h4 className="journals-title">Nos Journaux</h4>
        <div className="journals-grid-modern">
          <div className="icon1">
            <FaUser className="icon-journal" />
            <h3>
              <a href="/review">AEGC Review</a>
            </h3>
          </div>
          <div className="icon1">
            <FaHeart className="icon-journal" />
            <h3>
              <a href="/papers">AEGC Papers and Processing</a>
            </h3>
          </div>
          <div className="icon1">
            <FaStar className="icon-journal" />
            <h3>
              <a href="/economic">AEGC Economic Review</a>
            </h3>
          </div>
          <div className="icon1">
            <FaShareAlt className="icon-journal" />
            <h3>
              <a href="/management">Management Review</a>
            </h3>
          </div>
          <div className="icon1">
            <FaComment className="icon-journal" />
            <h3>
              <a href="/research">Research</a>
            </h3>
          </div>
          <div className="icon1">
            <FaBell className="icon-journal" />
            <h3>
              <a href="/metadata">AEGC Metadata</a>
            </h3>
          </div>
        </div>
      </section> */}
      <section className="picture-section">
        <Picture />
      </section>
      <section className="newsletter-section">
        <h4 className="newsletter-title">Restez informé-e</h4>
        <p className="newsletter-description">
          Vous recevrez des articles exclusifs pour rester informé-e de
          l'actualité du secteur de l'économie.
        </p>
        <a className="newsletter-button" href="/subscribe">
          S’abonner
        </a>
      </section>
    </div>
  );
};

export default Home;
