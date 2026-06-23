import * as yup from 'yup'

export const customerDataSchema = yup.object({
  anrede: yup.string().required('Bitte wählen Sie eine Anrede aus'),
  vorname: yup.string().required('Vorname ist erforderlich'),
  nachname: yup.string().required('Nachname ist erforderlich'),
  email: yup
    .string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .required('E-Mail-Adresse ist erforderlich'),
  strasse: yup.string().required('Straße ist erforderlich'),
  hausnummer: yup.string().required('Hausnummer ist erforderlich'),
  zusatz: yup.string().optional(),
  plz: yup.string().required('PLZ ist erforderlich'),
  ort: yup.string().required('Ort ist erforderlich'),
  land: yup.string().required('Land ist erforderlich'),
})
