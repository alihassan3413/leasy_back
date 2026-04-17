<script setup lang="ts">
import CompanyRegister from "@/components/company/Register.vue";
import CompanyAdminRegistration from "@/components/company/AdminRegistration.vue";
import Button from "@/components/ui/Button.vue";
import { useB2BStore } from "@/stores/b2b.store";
import { useForm } from "vee-validate";
import { b2bSchema } from "@/validations/b2b.validation";
import RegisterLayout from "@/layouts/RegisterLayout.vue";

const b2bStore = useB2BStore();

interface FormValues {
  company: {
    firmenname: string;
    ustIdNr: string;
    strasse: string;
    nr: string;
    zusaetzlicheAnschrift: string;
    plz: string;
    ort: string;
  };
  admin: {
    anrede: string;
    vorname: string;
    nachname: string;
    email: string;
    vorwahl: string;
    telefon: string;
  };
}

const { handleSubmit } = useForm<FormValues>({
  validationSchema: b2bSchema,
  initialValues: {
    company: {
      firmenname: "",
      ustIdNr: "",
      strasse: "",
      nr: "",
      zusaetzlicheAnschrift: "",
      plz: "",
      ort: "",
    },
    admin: {
      anrede: "herr",
      vorname: "",
      nachname: "",
      email: "",
      vorwahl: "de",
      telefon: "",
    },
  },
});

const prefixMap: Record<string, string> = {
  de: "+49",
  at: "+43",
  ch: "+41",
};

const onSubmit = handleSubmit(async (formValues) => {
  const payload = {
    company_name: formValues.company.firmenname,
    vat_id: formValues.company.ustIdNr,
    logo_url: "",
    contact_email: formValues.admin.email,
    address: {
      street: formValues.company.strasse,
      number: formValues.company.nr,
      zip_code: formValues.company.plz,
      city: formValues.company.ort,
      country: "Germany",
    },
    contact: {
      salutation: formValues.admin.anrede,
      first_name: formValues.admin.vorname,
      last_name: formValues.admin.nachname,
      international_prefix: prefixMap[formValues.admin.vorwahl],
      primary_phone_number: formValues.admin.telefon,
    },
  };

  await b2bStore.create(payload);
});
</script>

<template>
  <RegisterLayout>

    <h1 class="text-white text-[32px] font-bold leading-normal not-italic">
      Firmenkunden - Registration
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

      <CompanyRegister />

      <CompanyAdminRegistration>

        <template #submit-button>

          <Button
            type="submit"
            button-classes="px-8 py-2.5 rounded-[5px] text-sm font-bold leading-normal not-italic"
          >
            Jetzt Registrieren
          </Button>

        </template>

      </CompanyAdminRegistration>

    </form>

  </RegisterLayout>

</template>
