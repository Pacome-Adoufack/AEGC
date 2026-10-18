import React from 'react'
import { useTranslation } from 'react-i18next';

function Committees() {
  const { t } = useTranslation();

  return (
    <div>{t("committees.title")}</div>
  )
}

export default Committees
