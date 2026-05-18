import React from "react";
import "./styles/App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/common/Toast.jsx";
import { useState, useEffect } from "react";
import Home from "./components/pages/Home.jsx";
import About from "./components/pages/About.jsx";
import Committees from "./components/pages/Committees.jsx";
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer.jsx";
import Newspaper from "./components/pages/Newspaper.jsx";
import Activity from "./components/pages/Activity.jsx";
import Research from "./components/pages/Research.jsx";
import Register from "./components/auth/Register.jsx";
import Login from "./components/auth/Login.jsx";
import ForgotPassword from "./components/auth/ForgotPassword.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import Reservation from "./components/reservations/Reservation.jsx";
import JournalsView from "./components/pages/JournalsView.jsx";
import Review from "./components/reviews/Review.jsx";
import JanuarReview from "./components/reviews/JanuarReview.jsx";
import MaiReview from "./components/reviews/MaiReview.jsx";
import DecemberReview from "./components/reviews/DecemberReview.jsx";
import Programmation from "./components/pages/Programmation.jsx";
import Contact from "./components/pages/Contact.jsx";
import Subscribe from "./components/pages/Subscribe.jsx";
import Seminar from "./components/pages/Seminar.jsx";
import Picture from "./components/pages/Picture.jsx";
import OrgChart from "./components/pages/OrgChart.jsx";
import Ethics from "./components/pages/Ethics.jsx";
import Release from "./components/pages/Release.jsx";
import AllAnnouncements from "./components/pages/AllAnnouncements.jsx";
import Faq from "./components/pages/Faq.jsx";
import President from "./components/members/President.jsx";
import VicePresident from "./components/members/VicePresident.jsx";
import SecretaireGeneral from "./components/members/SecretaireGeneral.jsx";
import Tresorier from "./components/members/Tresorier.jsx";
import ResponsableGrh from "./components/members/ResponsableGrh.jsx";
import RelationExterieure from "./components/members/RelationExterieure.jsx";
import CommunicationOne from "./components/members/CommunicationOne.jsx";
import CommunicationTwo from "./components/members/CommunicationTwo.jsx";
import CommissaireCompte from "./components/members/CommissaireCompte.jsx";
import Projet from "./components/members/Projet.jsx";
import Administrative from "./components/members/Administrative.jsx";
import ConseillerOne from "./components/members/ConseillerOne.jsx";
import ConseillerTwo from "./components/members/ConseillerTwo.jsx";
import Images from "./components/pages/Images.jsx";
import Development from "./components/pages/Development.jsx";
import SeminarHome from "./components/pages/SeminarHome.jsx";
import CenseurOne from "./components/members/CenseurOne.jsx";
import CenseurTwo from "./components/members/CenseurTwo.jsx";
import Formation from "./components/pages/Formation.jsx";
import ReservationFormation from "./components/reservations/ReservationFormation.jsx";
import FormationsCard from "./components/pages/FormationsCard.jsx";
import { Bourse } from "./components/pages/Bourse.jsx";
import Price from "./components/pages/Price.jsx";
import UserProfile from "./components/pages/UserProfile.jsx";
import InfoPersonelle from "./components/pages/InfoPersonelle.jsx";
import MesFormationsReservees from "./components/membership/MesFormationsReservees.jsx";
import MesActivitesReservees from "./components/membership/MesActivitesReservees.jsx";
import DevDashboard from "./components/pages/DevDashboard.jsx";
import AdminDashboard from "./components/pages/AdminDashboard.jsx";
import MembershipPayment from "./components/membership/MembershipPayment.jsx";
import MembershipSuccess from "./components/membership/MembershipSuccess.jsx";
import WorkingPapersMain from "./components/working-papers/WorkingPapersMain.jsx";
import WorkingPaperDetail from "./components/working-papers/WorkingPaperDetail.jsx";
import SubmissionForm from "./components/pages/SubmissionForm.jsx";
import MySubmissions from "./components/pages/MySubmissions.jsx";
import AdminWorkingPapers from "./components/pages/AdminWorkingPapers.jsx";
import SubmissionResubmit from "./components/pages/SubmissionResubmit.jsx";

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
    <ToastProvider>
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
              <Route path="/actualites" element={<AllAnnouncements />} />
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
              <Route path="/working-papers" element={<WorkingPapersMain />} />
              <Route path="/working-papers/:id" element={<WorkingPaperDetail />} />
              <Route path="/working-papers/:id/submit" element={<SubmissionForm />} />
              <Route path="/my-submissions" element={<MySubmissions />} />
              <Route path="/my-submissions/:id/resubmit" element={<SubmissionResubmit />} />
              <Route path="/admin/working-papers" element={<AdminWorkingPapers />} />
              <Route path="/dispatcher/working-papers" element={<AdminWorkingPapers />} />
            </Routes>
          </div>
        </Router>
        <Footer />
      </div>
    </ToastProvider>
  );
}

export default App;
