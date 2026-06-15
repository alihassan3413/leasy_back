import * as yup from 'yup'

export const companySchema = yup.object({
  firmenname: yup.string(),
  ustIdNr: yup.string(),
  address: yup.object({
    strasse: yup.string(),
    nr: yup.string(),
    zusaetzlicheAnschrift: yup.string(),
    plz: yup.string(),
    ort: yup.string(),
  }),
})

export const adminSchema = yup.object({
  anrede: yup.string(),
  vorname: yup.string(),
  nachname: yup.string(),
  email: yup.string(),
  prefix: yup.string(),
  phone: yup.string(),
})

export const b2bSchema = yup.object({
  company: companySchema,
  admin: adminSchema,
})
