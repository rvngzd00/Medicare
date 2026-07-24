const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+]?[\d\s()-]{9,20}$/;

export function getBakuDateInput(daysFromToday = 0) {
  const date = new Date(Date.now() + daysFromToday * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export function validateAppointment(values) {
  const errors = {};
  if (!values.firstName?.trim()) errors.firstName = "Adınızı daxil edin.";
  if (!values.lastName?.trim()) errors.lastName = "Soyadınızı daxil edin.";
  if (!phonePattern.test(values.phone || "")) errors.phone = "Düzgün telefon nömrəsi daxil edin.";
  if (values.email && !emailPattern.test(values.email)) errors.email = "E-mail formatını yoxlayın.";
  if (!values.department) errors.department = "Şöbə seçin.";
  if (!values.branch) errors.branch = "Filial seçin.";
  if (!values.date) {
    errors.date = "Tarix seçin.";
  } else if (values.date < getBakuDateInput(1)) {
    errors.date = "Ən tez sabah üçün tarix seçə bilərsiniz.";
  } else if (values.date > getBakuDateInput(365)) {
    errors.date = "Tarix ən çox 1 il sonrakı dövr üçün seçilə bilər.";
  }
  if (!values.time) errors.time = "Saat seçin.";
  if (!values.consent) errors.consent = "Məxfilik şərtlərinə razılıq tələb olunur.";
  return errors;
}

export function validateContact(values) {
  const errors = {};
  if (!values.firstName?.trim()) errors.firstName = "Adınızı daxil edin.";
  if (!values.lastName?.trim()) errors.lastName = "Soyadınızı daxil edin.";
  if (!phonePattern.test(values.phone || "")) errors.phone = "Düzgün telefon nömrəsi daxil edin.";
  if (!emailPattern.test(values.email || "")) errors.email = "Düzgün e-mail ünvanı daxil edin.";
  if (!values.subject) errors.subject = "Mövzu seçin.";
  if (!values.message?.trim() || values.message.trim().length < 10) {
    errors.message = "Mesaj ən azı 10 simvoldan ibarət olmalıdır.";
  }
  if (!values.consent) errors.consent = "Məxfilik şərtlərinə razılıq tələb olunur.";
  return errors;
}
