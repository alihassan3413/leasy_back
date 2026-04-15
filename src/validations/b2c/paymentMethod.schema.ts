import * as yup from 'yup'

export const paymentMethodSchema = yup.object({
  zahlungsart: yup.string().required('Bitte wählen Sie eine Zahlungsart aus'),
  iban: yup
    .string()
    .when('zahlungsart', {
      is: 'sepa',
      then: (s) =>
        s
          .required('IBAN ist erforderlich')
          .matches(/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/, 'Bitte geben Sie eine gültige IBAN ein'),
    }),
  kontoinhaber: yup.string().when('zahlungsart', {
    is: 'sepa',
    then: (s) => s.required('Kontoinhaber ist erforderlich'),
  }),
})
