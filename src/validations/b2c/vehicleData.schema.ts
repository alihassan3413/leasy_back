import * as yup from 'yup'

export const vehicleDataSchema = yup.object({
  marke: yup.string().required('Marke ist erforderlich'),
  modell: yup.string().required('Modell ist erforderlich'),
  fin: yup.string().required('FIN ist erforderlich'),
  erstzulassungsdatum: yup.string().required('Erstzulassungsdatum ist erforderlich'),
  leasingende: yup.string().required('Leasingende ist erforderlich'),
  kennzeichenCity: yup.string().required('Stadtkürzel ist erforderlich'),
  kennzeichenLetters: yup.string().required('Buchstaben sind erforderlich'),
  kennzeichenNumbers: yup.string().required('Ziffern sind erforderlich'),
})
