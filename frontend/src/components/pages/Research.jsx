import React from "react";
import { useTranslation } from "react-i18next";

function Research() {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t("research.title")}</h2>
    </div>
  );
}

export default Research;
