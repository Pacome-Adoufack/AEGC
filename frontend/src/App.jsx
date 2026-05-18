import React, { lazy, Suspense, useState, useEffect } from "react";
import "./styles/App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/common/Toast.jsx";
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer.jsx";

// Pages
const Home = lazy(() => import("./components/pages/Home.jsx"));
const About = lazy(() => import("./components/pages/About.jsx"));
const Committees = lazy(() => import("./components/pages/Committees.jsx"));
const Newspaper = lazy(() => import("./components/pages/Newspaper.jsx"));
const Activity = lazy(() => import("./components/pages/Activity.jsx"));
const Research = lazy(() => import("./components/pages/Research.jsx"));
const JournalsView = lazy(() => import("./components/pages/JournalsView.jsx"));
const Programmation = lazy(() => import("./components/pages/Programmation.jsx"));
const Contact = lazy(() => import("./components/pages/Contact.jsx"));
const Subscribe = lazy(() => import("./components/pages/Subscribe.jsx"));
const Seminar = lazy(() => import("./components/pages/Seminar.jsx"));
const Picture = lazy(() => import("./components/pages/Picture.jsx"));
const Images = lazy(() => import("./components/pages/Images.jsx"));
const OrgChart = lazy(() => import("./components/pages/OrgChart.jsx"));
const Ethics = lazy(() => import("./components/pages/Ethics.jsx"));
const Release = lazy(() => import("./components/pages/Release.jsx"));
const AllAnnouncements = lazy(() => import("./components/pages/AllAnnouncements.jsx"));
const Faq = lazy(() => import("./components/pages/Faq.jsx"));
const Development = lazy(() => import("./components/pages/Development.jsx"));
const SeminarHome = lazy(() => import("./components/pages/SeminarHome.jsx"));
const Formation = lazy(() => import("./components/pages/Formation.jsx"));
const FormationsCard = lazy(() => import("./components/pages/FormationsCard.jsx"));
const Price = lazy(() => import("./components/pages/Price.jsx"));
const UserProfile = lazy(() => import("./components/pages/UserProfile.jsx"));
const InfoPersonelle = lazy(() => import("./components/pages/InfoPersonelle.jsx"));
const DevDashboard = lazy(() => import("./components/pages/DevDashboard.jsx"));
const AdminDashboard = lazy(() => import("./components/pages/AdminDashboard.jsx"));
const SubmissionForm = lazy(() => import("./components/pages/SubmissionForm.jsx"));
const MySubmissions = lazy(() => import("./components/pages/MySubmissions.jsx"));
const AdminWorkingPapers = lazy(() => import("./components/pages/AdminWorkingPapers.jsx"));
const SubmissionResubmit = lazy(() => import("./components/pages/SubmissionResubmit.jsx"));

// Bourse (named export)
const BourseModule = lazy(() => import("./components/pages/Bourse.jsx").then((m) => ({ default: m.Bourse })));

// Auth
const Register = lazy(() => import("./components/auth/Register.jsx"));
const Login = lazy(() => import("./components/auth/Login.jsx"));
const ForgotPassword = lazy(() => import("./components/auth/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./components/auth/ResetPassword.jsx"));

// Reservations
const Reservation = lazy(() => import("./components/reservations/Reservation.jsx"));
const ReservationFormation = lazy(() => import("./components/reservations/ReservationFormation.jsx"));

// Reviews
const Review = lazy(() => import("./components/reviews/Review.jsx"));
const JanuarReview = lazy(() => import("./components/reviews/JanuarReview.jsx"));
const MaiReview = lazy(() => import("./components/reviews/MaiReview.jsx"));
const DecemberReview = lazy(() => import("./components/reviews/DecemberReview.jsx"));

// Membership
const MesFormationsReservees = lazy(() => import("./components/membership/MesFormationsReservees.jsx"));
const MesActivitesReservees = lazy(() => import("./components/membership/MesActivitesReservees.jsx"));
const MembershipPayment = lazy(() => import("./components/membership/MembershipPayment.jsx"));
const MembershipSuccess = lazy(() => import("./components/membership/MembershipSuccess.jsx"));

// Working papers
const WorkingPapersMain = lazy(() => import("./components/working-papers/WorkingPapersMain.jsx"));
const WorkingPaperDetail = lazy(() => import("./components/working-papers/WorkingPaperDetail.jsx"));

// Members
const President = lazy(() => import("./components/members/President.jsx"));
const VicePresident = lazy(() => import("./components/members/VicePresident.jsx"));
const SecretaireGeneral = lazy(() => import("./components/members/SecretaireGeneral.jsx"));
const Tresorier = lazy(() => import("./components/members/Tresorier.jsx"));
const ResponsableGrh = lazy(() => import("./components/members/ResponsableGrh.jsx"));
const RelationExterieure = lazy(() => import("./components/members/RelationExterieure.jsx"));
const CommunicationOne = lazy(() => import("./components/members/CommunicationOne.jsx"));
const CommunicationTwo = lazy(() => import("./components/members/CommunicationTwo.jsx"));
const CommissaireCompte = lazy(() => import("./components/members/CommissaireCompte.jsx"));
const Projet = lazy(() => import("./components/members/Projet.jsx"));
const Administrative = lazy(() => import("./components/members/Administrative.jsx"));
const ConseillerOne = lazy(() => import("./components/members/ConseillerOne.jsx"));
const ConseillerTwo = lazy(() => import("./components/members/ConseillerTwo.jsx"));
const CenseurOne = lazy(() => import("./components/members/CenseurOne.jsx"));
const CenseurTwo = lazy(() => import("./components/members/CenseurTwo.jsx"));

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <ToastProvider>
      <div className="app-layout">
        <Router>
          <div className="app-container">
            <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
            <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>}>
              <Routes>
                <Route path="/" element={<Home setIsLoggedIn={setIsLoggedIn} />} />
                <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
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
                <Route path="/bourse" element={<BourseModule />} />
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
            </Suspense>
          </div>
        </Router>
        <Footer />
      </div>
    </ToastProvider>
  );
}

export default App;
