"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/common/Icon";
import { validateContact } from "@/utils/validation";
import { publicApi } from "@/services/api";
import styles from "./Form.module.css";

export default function ContactForm() {
  const initialValues = {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
    consent: false,
    website: ""
  };
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  function update(event) {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    if (status === "submitting") return;
    const nextErrors = validateContact(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus("invalid");
      const firstInvalid = event.currentTarget.querySelector("[aria-invalid='true']");
      firstInvalid?.focus();
      return;
    }
    setStatus("submitting");
    try {
      await publicApi.sendContactMessage(values);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.success} role="status">
        <span className={styles.successMark}><Icon name="check" size={32} /></span>
        <h2>Mesajınız göndərildi</h2>
        <p>Müraciətiniz qeydə alındı. Komandamız iş saatları ərzində sizinlə əlaqə saxlayacaq.</p>
        <button className="button button--soft" type="button" onClick={() => { setValues(initialValues); setStatus("idle"); }}>
          Yeni mesaj
        </button>
      </div>
    );
  }

  const autoComplete = {
    firstName: "given-name",
    lastName: "family-name",
    phone: "tel",
    email: "email"
  };
  const field = (name, label, type = "text", required = false) => (
    <div className={styles.field}>
      <label htmlFor={`contact-${name}`}>{label}{required && <span className={styles.required}>*</span>}</label>
      <div className={styles.control}>
        <input
          id={`contact-${name}`}
          name={name}
          type={type}
          value={values[name]}
          onChange={update}
          autoComplete={autoComplete[name]}
          inputMode={type === "tel" ? "tel" : undefined}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `contact-${name}-error` : undefined}
          required={required}
        />
      </div>
      {errors[name] && <span className={styles.error} id={`contact-${name}-error`} role="alert">{errors[name]}</span>}
    </div>
  );

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="contact-website">Vebsayt</label>
        <input
          id="contact-website"
          name="website"
          value={values.website}
          onChange={update}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className={styles.grid}>
        {field("firstName", "Ad", "text", true)}
        {field("lastName", "Soyad", "text", true)}
        {field("phone", "Telefon", "tel", true)}
        {field("email", "E-mail", "email", true)}
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="contact-subject">Mövzu<span className={styles.required}>*</span></label>
          <div className={styles.control}>
            <select
              id="contact-subject"
              name="subject"
              value={values.subject}
              onChange={update}
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? "contact-subject-error" : undefined}
              required
            >
              <option value="">Mövzu seçin</option>
              <option>Ümumi məlumat</option>
              <option>Xidmət və qiymət</option>
              <option>Pasiyent təcrübəsi</option>
              <option>Korporativ əməkdaşlıq</option>
            </select>
          </div>
          {errors.subject && <span className={styles.error} id="contact-subject-error" role="alert">{errors.subject}</span>}
        </div>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="contact-message">Mesaj<span className={styles.required}>*</span></label>
          <div className={styles.control}>
            <textarea id="contact-message" name="message" value={values.message} onChange={update} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : undefined} required />
          </div>
          {errors.message && <span className={styles.error} id="contact-message-error" role="alert">{errors.message}</span>}
        </div>
      </div>
      <div>
        <label className={styles.consent}>
          <input
            name="consent"
            type="checkbox"
            checked={values.consent}
            onChange={update}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "contact-consent-error" : undefined}
          />
          <span>
            Məlumatlarımın müraciətin cavablandırılması üçün işlənməsinə və{" "}
            <Link href="/privacy-policy">məxfilik siyasətinə</Link> razıyam.
          </span>
        </label>
        {errors.consent && <span className={styles.error} id="contact-consent-error" role="alert">{errors.consent}</span>}
      </div>
      {(status === "invalid" || status === "error") && (
        <div className={styles.submitError} role="alert">
          <Icon name="alert" size={18} />{status === "error" ? "Mesajı göndərmək mümkün olmadı. Zəhmət olmasa yenidən yoxlayın." : "Məlumatları yoxlayın."}
        </div>
      )}
      <div className={styles.actions}>
        <button className="button button--primary" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Göndərilir..." : <>Mesajı göndər <Icon name="arrow" size={17} /></>}
        </button>
      </div>
    </form>
  );
}
