import * as yup from 'yup'

export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .required('E-Mail-Adresse ist erforderlich'),

  password: yup
    .string()
    .required('Passwort ist erforderlich'),
})