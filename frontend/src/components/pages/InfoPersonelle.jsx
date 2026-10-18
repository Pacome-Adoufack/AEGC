import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../Url";
import "../../styles/InfoPersonelle.css";

const InfoPersonelle = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState(storedUser);
  const [membership, setMembership] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('none');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editBuffer, setEditBuffer] = useState(storedUser);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    fetchMembership();
  }, []);

  const fetchMembership = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/membership/my-membership`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.membership) {
        setMembership(data.membership);
        const statusField = data.membership.submissionStatus || data.membership.paymentStatus;
        let status = 'none';
        if (statusField === 'pending') status = 'pending';
        else if (statusField === 'rejected' || statusField === 'cancelled') status = 'rejected';
        else if (statusField === 'approved') status = data.isActive ? 'active' : 'expired';
        else status = data.isActive ? 'active' : 'none';
        setMembershipStatus(status);
      } else {
        setMembershipStatus('none');
      }
      setLoading(false);
    } catch (err) {
      console.error('Erreur chargement membership:', err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEditBuffer({ ...editBuffer, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setEditBuffer({ ...user });
    setSaveMsg('');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditBuffer({ ...user });
    setSaveMsg('');
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editBuffer),
      });
      if (!response.ok) throw new Error(t('profile.serverError'));
      setUser(editBuffer);
      localStorage.setItem('user', JSON.stringify(editBuffer));
      setSaveMsg('saved');
      setIsEditing(false);
    } catch (err) {
      setSaveMsg('error');
    } finally {
      setSaving(false);
    }
  };

  const BADGE_CONFIG = {
    active:   { cls: 'badge--active',   text: t('profile.membershipStatus.active'), icon: '✓' },
    expired:  { cls: 'badge--expired',  text: t('profile.membershipStatus.expired'), icon: '⚠' },
    pending:  { cls: 'badge--pending',  text: t('profile.membershipStatus.pending'), icon: '⏳' },
    rejected: { cls: 'badge--rejected', text: t('profile.membershipStatus.rejected'), icon: '✗' },
    none:     { cls: 'badge--none',     text: t('profile.membershipStatus.none'), icon: '–' },
  };

  const badge = BADGE_CONFIG[membershipStatus] || BADGE_CONFIG.none;

  const formatDate = (d) => {
    if (!d) return '-';
    const t = new Date(d);
    return isNaN(t.getTime()) ? '-' : t.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'fr-FR');
  };

  return (
    <div className="ip-container">
      <h1 className="ip-page-title">{t('profile.title')}</h1>

      {/* Statut de cotisation */}
      <div className="ip-card">
        <div className="ip-card-header">
          <h2 className="ip-card-title">{t('profile.membershipTitle')}</h2>
          <span className={`ip-badge ${badge.cls}`}>
            {badge.icon} {badge.text}
          </span>
        </div>

        {loading ? (
          <p className="ip-loading">{t('profile.loading')}</p>
        ) : membership && membershipStatus === 'active' ? (
          <div className="ip-membership-active">
            <div className="ip-membership-notice ip-membership-notice--green">
              <strong>{t('profile.membershipApproved')}</strong>
              <span>{t('profile.activeUntil', { date: formatDate(membership.endDate) })}</span>
            </div>
            <div className="ip-info-grid">
              <span>{t('profile.paymentNumber')}</span><strong>{membership.paymentNumber}</strong>
              <span>{t('profile.amount')}</span><strong>{membership.amount} {membership.currency}</strong>
              <span>{t('profile.startDate')}</span><strong>{formatDate(membership.startDate)}</strong>
              <span>{t('profile.endDate')}</span><strong>{formatDate(membership.endDate)}</strong>
            </div>
          </div>
        ) : membership && membershipStatus === 'expired' ? (
          <div className="ip-membership-state">
            <p className="ip-state-msg ip-state-msg--red">{t('profile.membershipExpiredOn', { date: formatDate(membership.endDate) })}</p>
            <button className="ip-btn ip-btn--red" onClick={() => navigate('/membership/payment')}>
              {t('profile.renewMembership')}
            </button>
          </div>
        ) : membership && membershipStatus === 'pending' ? (
          <div className="ip-membership-state">
            <p className="ip-state-msg">{t('profile.pendingMembership')}</p>
          </div>
        ) : membership && membershipStatus === 'rejected' ? (
          <div className="ip-membership-state">
            <p className="ip-state-msg ip-state-msg--red">{t('profile.membershipRejected')}</p>
            {membership.rejectionReason && (
              <p className="ip-rejection-reason">{t('profile.rejectionReason')}: {membership.rejectionReason}</p>
            )}
            <button className="ip-btn ip-btn--blue" onClick={() => navigate('/membership/payment', { state: { resubmit: true } })}>
              {t('profile.resubmitMembership')}
            </button>
          </div>
        ) : (
          <div className="ip-membership-state">
            <p className="ip-state-msg">{t('profile.noActiveMembership')}</p>
            <button className="ip-btn ip-btn--green" onClick={() => navigate('/membership/payment')}>
              {t('profile.subscribeMembership')}
            </button>
          </div>
        )}
      </div>

      {/* Informations personnelles */}
      <div className="ip-card">
        <div className="ip-card-header">
          <h2 className="ip-card-title">{t('profile.personalInformation')}</h2>
          {!isEditing && (
            <button type="button" className="ip-btn ip-btn--outline" onClick={handleEdit}>
              ✏ {t('profile.edit')}
            </button>
          )}
        </div>

        {saveMsg && !isEditing && (
          <p className={`ip-save-msg ${saveMsg === 'error' ? 'ip-save-msg--error' : 'ip-save-msg--ok'}`}>
            {saveMsg === 'error' ? t('profile.saveError') : t('profile.saved')}
          </p>
        )}

        {isEditing ? (
          <form className="ip-form" onSubmit={handleSave}>
            <div className="ip-form-grid">
              {[
                { labelKey: 'lastName', name: 'name', type: 'text' },
                { labelKey: 'firstName', name: 'firstName', type: 'text' },
                { labelKey: 'email', name: 'email', type: 'email' },
                { labelKey: 'country', name: 'country', type: 'text' },
                { labelKey: 'city', name: 'city', type: 'text' },
                { labelKey: 'phone', name: 'telefonNummer', type: 'text' },
                { labelKey: 'gender', name: 'gender', type: 'text' },
                { labelKey: 'university', name: 'university', type: 'text' },
              ].map(({ labelKey, name, type }) => (
                <div className="ip-field" key={name}>
                  <label>{t(`profile.fields.${labelKey}`)}</label>
                  <input type={type} name={name} value={editBuffer?.[name] || ''} onChange={handleChange} />
                </div>
              ))}
            </div>
            <div className="ip-form-footer">
              {saveMsg && (
                  <span className={`ip-save-msg ${saveMsg === 'error' ? 'ip-save-msg--error' : 'ip-save-msg--ok'}`}>
                    {saveMsg === 'error' ? t('profile.saveError') : t('profile.saved')}
                </span>
              )}
              <button type="button" className="ip-btn ip-btn--ghost" onClick={handleCancel}>{t('profile.cancel')}</button>
              <button type="submit" className="ip-btn ip-btn--blue" disabled={saving}>
                {saving ? t('profile.saving') : t('profile.save')}
              </button>
            </div>
          </form>
        ) : (
          <div className="ip-form-grid ip-form-grid--readonly">
            {[
                { labelKey: 'lastName', value: user?.name },
              { labelKey: 'firstName', value: user?.firstName },
              { labelKey: 'email', value: user?.email },
              { labelKey: 'country', value: user?.country },
              { labelKey: 'city', value: user?.city },
              { labelKey: 'phone', value: user?.telefonNummer },
              { labelKey: 'gender', value: user?.gender },
              { labelKey: 'university', value: user?.university },
            ].map(({ labelKey, value }) => (
              <div className="ip-field" key={labelKey}>
                <label>{t(`profile.fields.${labelKey}`)}</label>
                <span className="ip-field-value">{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoPersonelle;
