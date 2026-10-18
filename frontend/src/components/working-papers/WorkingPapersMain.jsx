import { useState } from "react";
import { useTranslation } from "react-i18next";
import WorkingPapersList from "./WorkingPapersList";
import WorkingPapersHistory from "./WorkingPapersHistory";
import WorkingPapersCommittee from "./WorkingPapersCommittee";
import "@/styles/wp-base.css";

function WorkingPapersMain() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("papers");

    return (
        <div className="working-papers-container">
            <div className="wp-hero">
                <div className="wp-hero-content">
                    <span className="wp-hero-eyebrow">{t("workingPapers.platform")}</span>
                    <h1>{t("workingPapers.title")}</h1>
                    <p>{t("workingPapers.intro")}</p>
                </div>
            </div>

            <div className="wp-tabs-bar">
                <div className="wp-tabs-inner">
                    <button className={`wp-tab ${activeTab === "papers" ? "active" : ""}`} onClick={() => setActiveTab("papers")}>
                        {t("workingPapers.calls")}
                    </button>
                    <button className={`wp-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
                        {t("workingPapers.history")}
                    </button>
                    <button className={`wp-tab ${activeTab === "committee" ? "active" : ""}`} onClick={() => setActiveTab("committee")}>
                        {t("workingPapers.committee")}
                    </button>
                </div>
            </div>

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
