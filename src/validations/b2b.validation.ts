import * as yup from 'yup'

export const companySchema = yup.object({
  firmenname: yup.string().required('Firmenname ist erforderlich'),
  ustIdNr: yup.string().required('USt-IdNr. ist erforderlich'),
  strasse: yup.string().required('Straße ist erforderlich'),
  nr: yup.string().required('Hausnummer ist erforderlich'),
  zusaetzlicheAnschrift: yup.string().optional(),
  plz: yup
    .string()
    .required('PLZ ist erforderlich')
    .matches(/^\d{5}$/, 'PLZ muss 5-stellig sein'),
  ort: yup.string().required('Ort ist erforderlich'),
})

export const adminSchema = yup.object({
  anrede: yup.string().required('Anrede ist erforderlich'),
  vorname: yup.string().required('Vorname ist erforderlich'),
  nachname: yup.string().required('Nachname ist erforderlich'),
  email: yup
    .string()
    .email('Ungültige E-Mail-Adresse')
    .required('E-Mail ist erforderlich'),
  vorwahl: yup.string().required('Vorwahl ist erforderlich'),
  telefon: yup.string().required('Telefonnummer ist erforderlich'),
})

export const b2bSchema = yup.object({
  company: companySchema,
  admin: adminSchema,
})