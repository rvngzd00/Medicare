"use client";

import { cloneElement, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/common/Icon";
import { getBakuDateInput, validateAppointment } from "@/utils/validation";
import { publicApi } from "@/services/api";
import styles from "./Form.module.css";

const initialValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  department: "",
  doctor: "",
  branch: "",
  date: "",
  time: "",
  message: "",
  consent: false,
  website: ""
};

export default function AppointmentForm({ departments, doctors, branches }) {
  const searchParams = useSearchParams();
  const requestedDoctor = searchParams.get("doctor") || "";
  const requestedDepartment = searchParams.get("department") || "";
  const initialDoctor = doctors.find((doctor) => doctor.slug === requestedDoctor);
  const initialDepartment = departments.find((item) => item.slug === requestedDepartment);
  const [values, setValues] = useState({
    ...initialValues,
    doctor: initialDoctor?.value || "",
    department:
      initialDoctor?.departmentValue ||
      initialDepartment?.value ||
      ""
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const availableDoctors = useMemo(
    () =>
      doctors.filter(
        (doctor) =>
          !values.department ||
          doctor.departmentValue === values.department
      ),
    [doctors, values.department]
  );

  function update(event) {
    const { name, value, type, checked } = event.target;
    setValues((current) => {
      const next = { ...current, [name]: type === "checkbox" ? checked : value };
      if (
        name === "department" &&
        !doctors.some(
          (doctor) =>
            doctor.value === current.doctor &&
            doctor.departmentValue === value
        )
      ) {
        next.doctor = "";
      }
      return next;
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    if (status === "submitting") return;
    const validationErrors = validateAppointment(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      setStatus("invalid");
      const firstInvalid = event.currentTarget.querySelector("[aria-invalid='true']");
      firstInvalid?.focus();
      return;
    }

    setStatus("submitting");
    try {
      await publicApi.createAppointment({
        ...values,
        departmentLabel: departments.find((item) => item.value === values.department)?.name,
        doctorLabel: doctors.find((item) => item.value === values.doctor)?.name,
        branchLabel: branches.find((item) => item.value === values.branch)?.name
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={styles.success} role="status" aria-live="polite">
        <span className={styles.successMark}><Icon name="check" size={34} /></span>
        <h2>Sorğunuz qəbul edildi</h2>
        <p>
          Təşəkkür edirik, {values.firstName}. Operatorumuz seçdiyiniz vaxtı dəqiqləşdirmək
          üçün qısa zamanda sizinlə əlaqə saxlayacaq.
        </p>
        <button className="button button--soft" type="button" onClick={() => { setValues(initialValues); setStatus("idle"); }}>
          Yeni sorğu yarat
        </button>
      </div>
    );
  }

  const minDate = getBakuDateInput(1);
  const maxDate = getBakuDateInput(365);

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="appointment-website">Vebsayt</label>
        <input
          id="appointment-website"
          name="website"
          value={values.website}
          onChange={update}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <div className={styles.grid}>
        <Field label="Ad" name="firstName" required error={errors.firstName}>
          <input name="firstName" value={values.firstName} onChange={update} placeholder="Məsələn, Aysel" autoComplete="given-name" />
        </Field>
        <Field label="Soyad" name="lastName" required error={errors.lastName}>
          <input name="lastName" value={values.lastName} onChange={update} placeholder="Məsələn, Əliyeva" autoComplete="family-name" />
        </Field>
        <Field label="Telefon" name="phone" required error={errors.phone}>
          <input name="phone" type="tel" value={values.phone} onChange={update} placeholder="+994 50 000 00 00" autoComplete="tel" inputMode="tel" />
        </Field>
        <Field label="E-mail" name="email" error={errors.email}>
          <input name="email" type="email" value={values.email} onChange={update} placeholder="ad@domain.az" autoComplete="email" />
        </Field>
        <Field label="Şöbə" name="department" required error={errors.department}>
          <select name="department" value={values.department} onChange={update}>
            <option value="">Şöbə seçin</option>
            {departments.map((item) => <option value={item.value} key={item.value}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="Həkim" name="doctor">
          <select name="doctor" value={values.doctor} onChange={update}>
            <option value="">Fərqi yoxdur</option>
            {availableDoctors.map((item) => <option value={item.value} key={item.value}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="Filial" name="branch" required error={errors.branch}>
          <select name="branch" value={values.branch} onChange={update}>
            <option value="">Filial seçin</option>
            {branches.map((item) => <option value={item.value} key={item.value}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="İstədiyiniz tarix" name="date" required error={errors.date}>
          <input name="date" type="date" min={minDate} max={maxDate} value={values.date} onChange={update} />
        </Field>
        <Field label="İstədiyiniz saat" name="time" required error={errors.time}>
          <select name="time" value={values.time} onChange={update}>
            <option value="">Saat seçin</option>
            {["09:00", "10:00", "11:30", "13:00", "14:30", "16:00", "17:30"].map((time) => <option key={time}>{time}</option>)}
          </select>
        </Field>
        <Field label="Əlavə qeyd" name="message" className={styles.fieldFull}>
          <textarea name="message" value={values.message} onChange={update} placeholder="Şikayətiniz və ya xüsusi ehtiyacınız barədə qısa məlumat..." />
        </Field>
      </div>
      <div>
        <label className={styles.consent}>
          <input
            name="consent"
            type="checkbox"
            checked={values.consent}
            onChange={update}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "appointment-consent-error" : undefined}
          />
          <span>
            Şəxsi məlumatlarımın qəbul sorğusunun işlənməsi məqsədilə istifadə edilməsinə və{" "}
            <Link href="/privacy-policy">məxfilik siyasətinə</Link> razıyam.
          </span>
        </label>
        {errors.consent && <span className={styles.error} id="appointment-consent-error" role="alert">{errors.consent}</span>}
      </div>
      {(status === "invalid" || status === "error") && (
        <div className={styles.submitError} role="alert">
          <Icon name="alert" size={19} /> {status === "error" ? "Sorğunu göndərmək mümkün olmadı. Bir qədər sonra yenidən yoxlayın və ya bizə zəng edin." : "Zəhmət olmasa işarələnmiş sahələri yoxlayın."}
        </div>
      )}
      <div className={styles.actions}>
        <button className="button button--primary button--large" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? <><span className="buttonSpinner" /> Göndərilir</> : <>Sorğunu göndər <Icon name="arrow" size={18} /></>}
        </button>
        <small>Sorğu qəbul rezervasiyası deyil. Vaxt operator təsdiqindən sonra qüvvəyə minir.</small>
      </div>
    </form>
  );
}

function Field({ label, name, required = false, error, className = "", children }) {
  return (
    <div className={`${styles.field} ${className}`}>
      <label htmlFor={name}>{label}{required && <span className={styles.required} aria-hidden="true">*</span>}</label>
      <div className={styles.control}>
        {typeof children.type === "string"
          ? cloneElement(children, {
              id: name,
              required,
              "aria-required": required || undefined,
              "aria-invalid": Boolean(error),
              "aria-describedby": error ? `${name}-error` : undefined
            })
          : children}
      </div>
      {error && <span className={styles.error} id={`${name}-error`} role="alert">{error}</span>}
    </div>
  );
}
