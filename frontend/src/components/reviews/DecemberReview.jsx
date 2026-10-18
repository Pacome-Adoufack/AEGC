import React from "react";
import { useTranslation } from "react-i18next";

function DecemberReview() {
  const { t } = useTranslation();

  return <div>{t("reviews.decemberReview")}</div>;
}

export default DecemberReview;