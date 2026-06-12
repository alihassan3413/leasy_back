import * as yup from "yup";

export const b2cAccountDetailSchema = yup.object({
  anrede: yup.string().optional(),
  vorname: yup.string().required("Vorname ist erforderlich"),
  nachname: yup.string().required("Nachname ist erforderlich"),
  address: yup.object({
    strasse: yup.string().required("Straße ist erforderlich"),
    nr: yup.string().required("Hausnummer ist erforderlich"),
    zusaetzlicheAnschrift: yup.string().optional(),
    plz: yup
      .string()
      .required("PLZ ist erforderlich")
      .matches(/^\d{5}$/, "PLZ muss 5-stellig sein"),
    ort: yup.string().required("Ort ist erforderlich"),
    latitude: yup.number().nullable().optional(),
    longitude: yup.number().nullable().optional(),
  }),
});

export const b2cContactPersonSchema = yup.object({
  anrede: yup.string().required("Anrede ist erforderlich"),
  vorname: yup.string().required("Vorname ist erforderlich"),
  nachname: yup.string().required("Nachname ist erforderlich"),
});
