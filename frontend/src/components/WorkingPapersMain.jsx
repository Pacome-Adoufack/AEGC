import { useState } from "react";
import WorkingPapersList from "./WorkingPapersList";
import WorkingPapersHistory from "./WorkingPapersHistory";
import WorkingPapersCommittee from "./WorkingPapersCommittee";
import "../styles/wp-base.css";

function WorkingPapersMain() {
    const [activeTab, setActiveTab] = useState("papers"); // papers | history | committee

    return (
        <div className="working-papers-container">
            {/* Hero Banner */}
            <div className="wp-hero">
                <div className="wp-hero-content">
                    <span className="wp-hero-eyebrow">Plateforme de recherche</span>
                    <h1>AEGC Papers &amp; Proceedings</h1>
                    <p>
                        Soumettez vos travaux académiques, suivez l’état de vos articles
                        et accédez aux publications validées des membres de l’AEGC.
                    </p>
                </div>
            </div>

            {/* Navigation tabs */}
            <div className="wp-tabs-bar">
                <div className="wp-tabs-inner">
                    <button
                        className={`wp-tab ${activeTab === "papers" ? "active" : ""}`}
                        onClick={() => setActiveTab("papers")}
                    >
                        Appels à contribution
                    </button>
                    <button
                        className={`wp-tab ${activeTab === "history" ? "active" : ""}`}
                        onClick={() => setActiveTab("history")}
                    >
                        Historique des publications
                    </button>
                    <button
                        className={`wp-tab ${activeTab === "committee" ? "active" : ""}`}
                        onClick={() => setActiveTab("committee")}
                    >
                        Comité scientifique
                    </button>
                </div>
            </div>

            {/* Contenu */}
            <div className="wp-tab-content-area">
                {activeTab === "papers" ? (
                    <WorkingPapersList embedded={true} />
                ) : activeTab === "history" ? (
                    <WorkingPapersHistory embedded={true} />
                ) : (
                    <WorkingPapersCommittee />
                )}
            </div>
        </div>
    );
}

export default WorkingPapersMain;
