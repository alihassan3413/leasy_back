import * as yup from "yup";

export const addressSchema = yup.object({
  strasse: yup.string().required("Straße ist erforderlich"),
  nr: yup.string().required("Hausnummer ist erforderlich"),
  zusaetzlicheAnschrift: yup.string().optional(),
  plz: yup
    .string()
    .required("PLZ ist erforderlich")
    .matches(/^\d{5}$/, "PLZ muss 5-stellig sein"),
  ort: yup.string().required("Ort ist erforderlich"),
});

export const contactSchema = yup.object({
  anrede: yup.string().required("Anrede ist erforderlich"),
  vorname: yup.string().required("Vorname ist erforderlich"),
  nachname: yup.string().required("Nachname ist erforderlich"),
  email: yup
    .string()
    .email("Ungültige E-Mail-Adresse")
    .required("E-Mail ist erforderlich"),
  prefix: yup.string().required("Vorwahl ist erforderlich"),
  phone: yup.string().required("Telefonnummer ist erforderlich"),
});

export const accountSchema = yup.object({
  hasVatId: yup.string().required(),
  vatId: yup.string().when("hasVatId", {
    is: "Ja",
    then: (schema) => schema.required("USt-IdNr. ist erforderlich"),
    otherwise: (schema) => schema.optional(),
  }),
  kontoinhaber: yup.string().optional(),
  iban: yup.string().optional(),
  bic: yup.string().optional(),
  hasAltBilling: yup.string().required(),
  altBillingAddress: yup.string().when("hasAltBilling", {
    is: "Ja",
    then: (schema) => schema.required("Abweichende Adresse ist erforderlich"),
    otherwise: (schema) => schema.optional(),
  }),
});

export const passwordSchema = yup.object({
  email: yup
    .string()
    .email("Ungültige E-Mail")
    .required("E-Mail ist erforderlich"),
  oldPassword: yup.string().required("Altes Passwort ist erforderlich"),
  newPassword: yup
    .string()
    .min(8, "Mindestens 8 Zeichen")
    .required("Neues Passwort ist erforderlich"),
});

export const legalSchema = yup.object({
  impressum: yup.string().required("Impressum ist erforderlich"),
});

export const termsSchema = yup.object({
  isProSelected: yup.boolean(),
  isPremiumSelected: yup.boolean(),
  agbAccepted: yup.boolean().oneOf([true], "Sie müssen den AGB zustimmen"),
  privacyAccepted: yup
    .boolean()
    .oneOf([true], "Sie müssen der Datenschutzerklärung zustimmen"),
});

export const workshopSchema = yup.object({
  firmenname: yup.string().required("Firmenname ist erforderlich"),
  email: yup
    .string()
    .email("Ungültige E-Mail-Adresse")
    .required("E-Mail ist erforderlich"),
  address: addressSchema,
  contact: contactSchema,
  account: accountSchema,
  legal: legalSchema,
  terms: termsSchema,
});
