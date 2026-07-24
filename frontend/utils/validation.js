const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+]?[\d\s()-]{9,20}$/;

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
