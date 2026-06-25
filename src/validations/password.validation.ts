import * as yup from "yup";

// Used by the "Passwort ändern" forms (B2C / B2B / Workshop account).
// New password: min 8 chars incl. uppercase, lowercase and a number.
export const changePasswordSchema = yup.object({
  oldPassword: yup.string().required("Bitte geben Sie Ihr altes Passwort ein."),
  newPassword: yup
    .string()
    .required("Bitte geben Sie ein neues Passwort ein.")
    .min(8, "Mindestens 8 Zeichen.")
    .matches(/[A-Z]/, "Mindestens ein Großbuchstabe erforderlich.")
    .matches(/[a-z]/, "Mindestens ein Kleinbuchstabe erforderlich.")
    .matches(/[0-9]/, "Mindestens eine Zahl erforderlich.")
    .notOneOf(
      [yup.ref("oldPassword")],
      "Das neue Passwort muss sich vom alten unterscheiden.",
    ),
});
