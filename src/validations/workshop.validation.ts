import * as yup from "yup";

export const addressSchema = yup.object({
  strasse: yup.string(),
  nr: yup.string(),
  zusaetzlicheAnschrift: yup.string(),
  plz: yup.string(),
  ort: yup.string(),
});

export const contactSchema = yup.object({
  anrede: yup.string(),
  vorname: yup.string(),
  nachname: yup.string(),
  email: yup.string(),
  prefix: yup.string(),
  phone: yup.string(),
});

export const accountSchema = yup.object({
  hasVatId: yup.string(),
  vatId: yup.string(),
  kontoinhaber: yup.string(),
  iban: yup.string(),
  bic: yup.string(),
  hasAltBilling: yup.string(),
  altBillingAddress: yup.string(),
});

export const passwordSchema = yup.object({
  email: yup.string(),
  oldPassword: yup.string(),
  newPassword: yup.string(),
});

export const legalSchema = yup.object({
  impressum: yup.string(),
});

export const termsSchema = yup.object({
  isProSelected: yup.boolean(),
  isPremiumSelected: yup.boolean(),
  agbAccepted: yup.boolean(),
  privacyAccepted: yup.boolean(),
});

export const workshopSchema = yup.object({
  firmenname: yup.string(),
  email: yup.string(),
  address: addressSchema,
  contact: contactSchema,
  account: accountSchema,
  legal: legalSchema,
  terms: termsSchema,
});
