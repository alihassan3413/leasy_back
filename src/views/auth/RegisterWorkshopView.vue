<script setup lang="ts">
import AdressDetails from "@/components/Workshop/AdressDetails.vue";
import { Button } from "@/components/ui/button";
import ContactPerson from "@/components/Workshop/ContactPerson.vue";
import AccountDetail from "@/components/Workshop/AccountDetail.vue";
import LegalNotice from "@/components/Workshop/LegalNotice.vue";
import GeneralTerms from "@/components/Workshop/GeneralTerms.vue";
import { useWorkshopStore } from "@/stores/workshop.store";
import { useForm } from "vee-validate";
import { workshopSchema } from "@/validations/workshop.validation";
import { useRouter } from "vue-router";
import type { WorkshopCreatePayload } from "@/types";

const workshopStore = useWorkshopStore();
const router = useRouter();

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: workshopSchema,
  initialValues: {
    firmenname: "",
    email: "",
    address: {
      strasse: "",
      nr: "",
      zusaetzlicheAnschrift: "",
      plz: "",
      ort: "",
    },
    contact: {
      anrede: "Herr",
      vorname: "",
      nachname: "",
      vorwahl: "de",
      telefon: "",
    },
    account: {
      hasUstIdNr: "nein",
      ustIdNr: "",
      kontoinhaber: "",
      iban: "",
      bic: "",
      wantsAbweichendeAdresse: "nein",
      abweichendeAdresse: "",
    },
    legal: {
      impressum: "",
    },
    terms: {
      isProSelected: true,
      isPremiumSelected: false,
      agbAccepted: false,
      privacyAccepted: false,
    },
  },
});

const onSubmit = handleSubmit(async (values: any) => {
  const payload: WorkshopCreatePayload = {
    workshop_name: values.firmenname,
    contact_email: values.email,
    has_vat_id: values.account.hasUstIdNr === "ja",
    vat_id: values.account.ustIdNr,
    iban: values.account.iban,
    bic: values.account.bic,
    account_holder: values.account.kontoinhaber,
    packages_selected: values.terms.isPremiumSelected ? "Premium" : "Pro",
    terms_accepted: values.terms.agbAccepted,
    privacy_accepted: values.terms.privacyAccepted,
    address: {
      street: values.address.strasse,
      number: values.address.nr,
      zip_code: values.address.plz,
      city: values.address.ort,
      country: "Germany",
      longitude: 0.0,
      latitude: 0.0,
    },
    contact: {
      salutation: values.contact.anrede,
      first_name: values.contact.vorname,
      last_name: values.contact.nachname,
      international_prefix:
        values.contact.vorwahl === "de"
          ? "+49"
          : values.contact.vorwahl === "at"
            ? "+43"
            : "+41",
      primary_phone_number: values.contact.telefon,
      phone_numbers: [],
    },
  };

  try {
    await workshopStore.create(payload);
  } catch (err) {
    console.log(err)
  }
});
</script>

<template>
  <div class="relative min-h-screen bg-primary overflow-hidden">
    <img
      src="/src/assets/logo/path-green.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="left: -6vw; top: 1vw; width: 114vw; height: auto; opacity: 0.54"
    />
    <img
      src="/src/assets/logo/path-orange.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="left: -19vw; top: -4vw; width: 105vw; height: auto"
    />

    <div
      class="relative z-10 flex items-center justify-center min-h-screen pt-16"
    >
      <div class="w-full max-w-200 flex flex-col items-start min-h-screen">
        <h1 class="text-white text-[32px] font-bold leading-normal not-italic">
          Registrierung - Werkstattpartner
        </h1>

        <div class="flex mt-10 gap-7">
          <p class="text-white text-sm leading-normal not-italic font-normal">
            Sie sind bereits LeasyBack Kunde?
          </p>
          <RouterLink
            to="/auth/login"
            class="text-custom-orange text-sm font-bold leading-normal not-italic"
          >
            Jetzt einloggen
          </RouterLink>
        </div>

        <form @submit.prevent="onSubmit" class="w-full">
          <AdressDetails />
          <ContactPerson />
          <AccountDetail />
          <LegalNotice />
          <GeneralTerms />

          <div class="flex justify-center w-full py-10">
            <Button
              type="submit"
              class="w-[240px] h-[40px] rounded-[5px] text-[15px] font-bold transition-all bg-custom-orange hover:bg-custom-orange/90 text-white"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? "Wird registriert..." : "Jetzt Registrieren" }}
            </Button>
          </div>
        </form>
      </div>
    </div>

    <img
      src="/src/assets/logo/path-green.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="right: -10vw; bottom: -50vw; width: 114vw; height: auto"
    />
    <img
      src="/src/assets/logo/path-orange.svg"
      alt=""
      class="pointer-events-none absolute z-0"
      style="right: 0; bottom: -30vw; width: 114vw; height: auto"
    />
  </div>
</template>
