import React from "react";
import { useEffect, useState, useRef } from "react";
import video from "../assets/video.mp4";
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
import SeminarHome from "./SeminarHome";
import Release from "./Release";
import Images from "./Images";

const Home = () => {
  const [data, setData] = useState([]);
  const videoRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const handlePlay = () => {
    setShowOverlay(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
      }
    }, 100);
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setShowOverlay(false);
  };

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
          <img src={logo} alt="" className="image-second" />
        </div>
        <div>
        <div className="film-container">
        <div className="wave"></div>
        <button className="film-button" onClick={handlePlay}>
          Le Film AEGC
        </button>
      </div>

      {showOverlay && (
        <div className="overlay">
          <div className="video-wrapper">
            <button className="close-button" onClick={handleClose}>✕</button>
            <video
              ref={videoRef}
              width="800"
              controls
            >
              <source src={video} type="video/mp4" />
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
          </div>
        </div>
      )}
        </div>
      </div>
      <section className="first-section">
        <SeminarHome />
      </section>
      <section className="second-section">
        <Release />
      </section>
      <section className="picture-section">
        <Images />
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
