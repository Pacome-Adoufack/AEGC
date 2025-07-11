import React from "react";
import "./styles/App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./components/Home.jsx";
import About from "./components/About.jsx";
import Committees from "./components/Committees.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Newspaper from "./components/Newspaper.jsx";
import Activity from "./components/Activity.jsx";
import Research from "./components/Research.jsx";
import Register from "./components/Register.jsx";
import Login from "./components/Login.jsx";
import ForgotPassword from "./components/ForgotPassword.jsx";
import ResetPassword from "./components/ResetPassword.jsx";
import Reservation from "./components/Reservation.jsx";
import JournalsView from "./components/JournalsView.jsx";
import Review from "./components/Review.jsx";
import JanuarReview from "./components/JanuarReview.jsx";
import MaiReview from "./components/MaiReview.jsx";
import DecemberReview from "./components/DecemberReview.jsx";
import Programmation from "./components/Programmation.jsx";
import Contact from "./components/Contact.jsx";
import Subscribe from "./components/Subscribe.jsx";
import Seminar from "./components/Seminar.jsx";
import Picture from "./components/Picture.jsx";
import OrgChart from "./components/OrgChart.jsx";
import Ethics from "./components/Ethics.jsx";
import Release from "./components/Release.jsx";
import Faq from "./components/Faq.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
    }
  }, []);
  return (
    <div className="app-layout">
      <Router>
        {" "}
        {/* <== Manquait aussi ! */}
        <div className="app-container">
        <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
          <Routes>
            <Route path="/" element={<Home setIsLoggedIn={setIsLoggedIn} />} />
            <Route
              path="/login"
              element={<Login setIsLoggedIn={setIsLoggedIn} />}
            />
             
            <Route path="/home" element={<Home isLoggedIn={isLoggedIn} />} />
            <Route path="/newspaper" element={<Newspaper />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/passwort-reset/:token" element={<ResetPassword />} />
            <Route path="/committees" element={<Committees />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/research" element={<Research />} />
            <Route path="/about" element={<About />} />
            <Route path="/reservation/:activityId" element={<Reservation />} />
            <Route path="/journal view" element={<JournalsView />} />
            <Route path="/review" element={<Review />} />
            <Route path="/review/:janvier" element={<JanuarReview />} />
            <Route path="/review/:mai" element={<MaiReview />} />
            <Route path="/review/:décembre" element={<DecemberReview />} />
            <Route path="/programmation" element={<Programmation />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/seminaire" element={<Seminar />} />
            <Route path="/picture" element={<Picture />} />
            <Route path="/organigrame" element={<OrgChart />} />
            <Route path="/ethique" element={<Ethics />} />
            <Route path="/communiqué" element={<Release />} />
            <Route path="/questionnaire" element={<Faq />} />

          </Routes>
        </div>
      </Router>
      <Footer />
    </div>
  );
}

export default App;
