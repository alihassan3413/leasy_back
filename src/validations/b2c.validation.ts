import * as yup from "yup";

export const b2cAccountDetailSchema = yup.object({
  anrede: yup.string(),
  vorname: yup.string(),
  nachname: yup.string(),
  address: yup.object({
    strasse: yup.string(),
    nr: yup.string(),
    zusaetzlicheAnschrift: yup.string(),
    plz: yup.string(),
    ort: yup.string(),
    latitude: yup.number().nullable(),
    longitude: yup.number().nullable(),
  }),
});

export const b2cContactPersonSchema = yup.object({
  anrede: yup.string(),
  vorname: yup.string(),
  nachname: yup.string(),
});
