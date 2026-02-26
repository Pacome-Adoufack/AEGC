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
import President from "./member/President.jsx";
import VicePresident from "./member/VicePresident.jsx";
import SecretaireGeneral from "./member/SecretaireGeneral.jsx";
import Tresorier from "./member/Tresorier.jsx";
import ResponsableGrh from "./member/ResponsableGrh.jsx";
import RelationExterieure from "./member/RelationExterieure.jsx";
import CommunicationOne from "./member/CommunicationOne.jsx";
import CommunicationTwo from "./member/CommunicationTwo.jsx";
import CommissaireCompte from "./member/CommissaireCompte.jsx";
import Projet from "./member/Projet.jsx";
import Administrative from "./member/Administrative.jsx";
import ConseillerOne from "./member/ConseillerOne.jsx";
import ConseillerTwo from "./member/ConseillerTwo.jsx";
import Images from "./components/Images.jsx";
import Development from "./components/Development.jsx";
import SeminarHome from "./components/SeminarHome.jsx";
import CenseurOne from "./member/CenseurOne.jsx";
import CenseurTwo from "./member/CenseurTwo.jsx";
import Formation from "./components/Formation.jsx";
import ReservationFormation from "./components/ReservationFormation.jsx";
import FormationsCard from "./components/FormationsCard.jsx";
import { Bourse } from "./components/Bourse.jsx";
import Price from "./components/Price.jsx";
import UserProfile from "./components/UserProfile.jsx";
import InfoPersonelle from "./components/InfoPersonelle.jsx";
import MesFormationsReservees from "./components/MesFormationsReservees.jsx";
import MesActivitesReservees from "./components/MesActivitesReservees.jsx";
import DevDashboard from "./components/DevDashboard.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import MembershipPayment from "./components/MembershipPayment.jsx";
import MembershipSuccess from "./components/MembershipSuccess.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const getToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  };


  useEffect(() => {
    if (getToken()) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
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
            <Route path="/images" element={<Images />} />
            <Route path="/organigrame" element={<OrgChart />} />
            <Route path="/ethique" element={<Ethics />} />
            <Route path="/communiqué" element={<Release />} />
            <Route path="/questionnaire" element={<Faq />} />
            <Route path="/president" element={<President />} />
            <Route path="/vice president" element={<VicePresident />} />
            <Route path="/secretaire general" element={<SecretaireGeneral />} />
            <Route path="/tresorier" element={<Tresorier />} />
            <Route path="/responsable GRH" element={<ResponsableGrh />} />
            <Route path="/relations exterieures" element={<RelationExterieure />} />
            <Route path="/communication one" element={<CommunicationOne />} />
            <Route path="/communication two" element={<CommunicationTwo />} />
            <Route path="/commissaire aux comptes" element={<CommissaireCompte />} />
            <Route path="/charges des projets" element={<Projet />} />
            <Route path="/censeur one" element={<CenseurOne />} />
            <Route path="/censeur two" element={<CenseurTwo />} />
            <Route path="/responsable des affaires administratives et diplomatiques" element={<Administrative />} />
            <Route path="/conseiller one" element={<ConseillerOne />} />
            <Route path="/conseiller two" element={<ConseillerTwo />} />
            <Route path="/development" element={<Development />} />
            <Route path="/webinaire" element={<SeminarHome />} />
            <Route path="/formations" element={<Formation />} />
            <Route path="/price" element={<Price />} />
            <Route path="/bourse" element={<Bourse />} />
            <Route path="/userprofile" element={<UserProfile />} />
            <Route path="/formations-details/:formationId" element={<FormationsCard />} />
            <Route path="/inscription-formation/:formationId" element={<ReservationFormation />} />
            <Route path="/informations personnelles" element={<InfoPersonelle />} />
            <Route path="/appercu des formations" element={<MesFormationsReservees />} />
            <Route path="/appercu des webinaires" element={<MesActivitesReservees />} />
            <Route path="/dev-dashboard" element={<DevDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/membership/payment" element={<MembershipPayment />} />
            <Route path="/membership/success" element={<MembershipSuccess />} />
          </Routes>
        </div>
      </Router>
      <Footer />
    </div>
  );
}

export default App;
