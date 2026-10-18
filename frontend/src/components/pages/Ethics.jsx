import React from "react";
import { useTranslation } from "react-i18next";

function Ethics() {
  const { t } = useTranslation();
  return (
    <div>{t("ethics.title")}</div>
  );
}

export default Ethics;
