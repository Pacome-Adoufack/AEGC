import React from "react";
import "../../styles/Development.css";
import { useTranslation } from "react-i18next";

const Development = () => {
  const { t } = useTranslation();

  return (
    <div className="journal-notice">
      <p>
        {t("development.notice")}
      </p>
    </div>
  );
};

export default Development;
