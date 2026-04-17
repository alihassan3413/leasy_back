import * as yup from 'yup'

export const addressSchema = yup.object({
  strasse: yup.string().required('Straße ist erforderlich'),
  nr: yup.string().required('Hausnummer ist erforderlich'),
  zusaetzlicheAnschrift: yup.string().optional(),
  plz: yup
    .string()
    .required('PLZ ist erforderlich')
    .matches(/^\d{5}$/, 'PLZ muss 5-stellig sein'),
  ort: yup.string().required('Ort ist erforderlich'),
})

export const contactSchema = yup.object({
  anrede: yup.string().required('Anrede ist erforderlich'),
  vorname: yup.string().required('Vorname ist erforderlich'),
  nachname: yup.string().required('Nachname ist erforderlich'),
  vorwahl: yup.string().required('Vorwahl ist erforderlich'),
  telefon: yup.string().required('Telefonnummer ist erforderlich'),
})

export const accountSchema = yup.object({
  hasUstIdNr: yup.string().required(),
  ustIdNr: yup.string().when('hasUstIdNr', {
    is: 'ja',
    then: (schema) => schema.required('USt-IdNr. ist erforderlich'),
    otherwise: (schema) => schema.optional(),
  }),
  kontoinhaber: yup.string().required('Kontoinhaber ist erforderlich'),
  iban: yup.string().required('IBAN ist erforderlich'),
  bic: yup.string().required('BIC ist erforderlich'),
  wantsAbweichendeAdresse: yup.string().required(),
  abweichendeAdresse: yup.string().when('wantsAbweichendeAdresse', {
    is: 'ja',
    then: (schema) => schema.required('Abweichende Adresse ist erforderlich'),
    otherwise: (schema) => schema.optional(),
  }),
})

export const legalSchema = yup.object({
  impressum: yup.string().required('Impressum ist erforderlich'),
})

export const termsSchema = yup.object({
  isProSelected: yup.boolean(),
  isPremiumSelected: yup.boolean(),
  agbAccepted: yup.boolean().oneOf([true], 'Sie müssen den AGB zustimmen'),
  privacyAccepted: yup.boolean().oneOf([true], 'Sie müssen der Datenschutzerklärung zustimmen'),
})

export const workshopSchema = yup.object({
  firmenname: yup.string().required('Firmenname ist erforderlich'),
  email: yup.string().email('Ungültige E-Mail-Adresse').required('E-Mail ist erforderlich'),
  address: addressSchema,
  contact: contactSchema,
  account: accountSchema,
  legal: legalSchema,
  terms: termsSchema,
})
