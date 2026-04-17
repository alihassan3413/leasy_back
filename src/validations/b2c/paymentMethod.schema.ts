import * as yup from 'yup'

export const paymentMethodSchema = yup.object({
  datum: yup.string().required('Datum ist erforderlich'),
  uhrzeit: yup.string().required('Uhrzeit ist erforderlich'),
})
