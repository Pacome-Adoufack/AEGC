import React from "react";
import { useTranslation } from "react-i18next";

function MaiReview() {
  const { t } = useTranslation();

  return <div>{t("reviews.mayReview")}</div>;
}

export default MaiReview;