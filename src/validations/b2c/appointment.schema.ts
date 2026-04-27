import * as yup from 'yup'

export const appointmentSchema = yup.object({
  stadt: yup.string().required('Bitte wählen Sie eine Stadt aus'),
  datum: yup.string().required('Datum ist erforderlich'),
  uhrzeit: yup.string().required('Uhrzeit ist erforderlich'),
})
