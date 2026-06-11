import * as yup from 'yup'

export const appointmentSchema = yup.object({
  stadt: yup.string().required('Bitte wählen Sie eine Stadt aus'),
  datum: yup
    .string()
    .required('Datum ist erforderlich')
    .test(
      'min-date',
      'Termine können erst ab 3 Tagen in der Zukunft gebucht werden.',
      (value) => {
        if (!value) return false
        const selected = new Date(value)
        const minDate = new Date()
        minDate.setDate(minDate.getDate() + 3)
        minDate.setHours(0, 0, 0, 0)
        selected.setHours(0, 0, 0, 0)
        return selected >= minDate
      },
    ),
  uhrzeit: yup.string().required('Uhrzeit ist erforderlich'),
  service: yup.string().oneOf(['tuvsud', 'dekra']).required('Service ist erforderlich'),
})
