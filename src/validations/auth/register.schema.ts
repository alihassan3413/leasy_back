import * as yup from 'yup'

export const registerSchema = yup.object({
  role: yup.string().required('Bitte wählen Sie eine Rolle aus'),

  email: yup
    .string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .required('E-Mail-Adresse ist erforderlich'),

  password: yup
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .matches(/[A-Z]/, 'Passwort muss mindestens 1 Großbuchstaben enthalten')
    .matches(/[^a-zA-Z0-9]/, 'Passwort muss mindestens 1 Sonderzeichen enthalten')
    .required('Passwort ist erforderlich'),
})