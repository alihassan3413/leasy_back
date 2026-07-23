import * as yup from "yup";
import {
  validatePlateCity,
  validatePlateLetters,
  validatePlateNumber,
  platePartsLength,
  PLATE_MAX_TOTAL,
  PLATE_MESSAGES,
} from "@/utils/licensePlate";

export const vehicleDataSchema = yup
  .object({
    marke: yup.string().required("Marke ist erforderlich"),
    modell: yup.string().required("Modell ist erforderlich"),
    fin: yup
      .string()
      .required("FIN ist erforderlich")
      .length(17, "FIN muss genau 17 Zeichen lang sein"),
    erstzulassungsdatum: yup.string().required("Erstzulassungsdatum ist erforderlich"),
    leasingende: yup.string().required("Leasingende ist erforderlich"),
    kennzeichenCity: yup
      .string()
      .required("Stadtkürzel ist erforderlich")
      .test("plate-city-format", function (value) {
        const err = validatePlateCity(value ?? "");
        return err ? this.createError({ message: err }) : true;
      }),
    kennzeichenLetters: yup
      .string()
      .required("Buchstaben sind erforderlich")
      .test("plate-letters-format", function (value) {
        const err = validatePlateLetters(value ?? "");
        return err ? this.createError({ message: err }) : true;
      }),
    // Digits with an optional single trailing "E" for electric vehicles
    // (e.g. "2026E") — see @/utils/licensePlate for the shared rule.
    kennzeichenNumbers: yup
      .string()
      .required("Ziffern sind erforderlich")
      .test("plate-number-format", function (value) {
        const err = validatePlateNumber(value ?? "");
        return err ? this.createError({ message: err }) : true;
      }),
  })
  .test("kennzeichen-max-length", PLATE_MESSAGES.maxLength, (values) => {
    if (!values) return false;
    return (
      platePartsLength(
        values.kennzeichenCity || "",
        values.kennzeichenLetters || "",
        values.kennzeichenNumbers || "",
      ) <= PLATE_MAX_TOTAL
    );
  });
