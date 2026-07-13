<script setup lang="ts">
import CompanyRegister from "@/components/company/Register.vue";
import CompanyAdminRegistration from "@/components/company/AdminRegistration.vue";
import Button from "@/components/ui/Button.vue";
import { useB2BStore } from "@/stores/b2b.store";
import { useAuthStore } from "@/stores/auth.store";
import { useForm } from "vee-validate";
import { b2bSchema } from "@/validations/b2b.validation";
import RegisterLayout from "@/layouts/RegisterLayout.vue";

const b2bStore = useB2BStore();
const authStore = useAuthStore();
const router = useRouter();
const showSuccess = ref(false);

const logoFile = ref<File | null>(null);

function onLogoChange(file: File | null): void {
  logoFile.value = file;
}

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
      email: authStore.user && authStore.user.email ? authStore.user.email : "",
      vorwahl: "+49",
      telefon: "",
    },
  },
});

const onSubmit = handleSubmit(async (formValues) => {
  b2bStore.error = "";
  b2bStore.status = "loading";

  try {
    let uploadedLogoUrl = "";

    if (logoFile.value) {
      uploadedLogoUrl = await b2bStore.uploadLogo(logoFile.value);
    }

    const payload = {
      company_name: formValues.company.firmenname,
      vat_id: formValues.company.ustIdNr,
      logo_url: uploadedLogoUrl,
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
        international_prefix: formValues.admin.vorwahl,
        primary_phone_number: formValues.admin.telefon,
      },
    };

    await b2bStore.create(payload);

    b2bStore.status = "success";
    showSuccess.value = true;
  } catch (error) {
    b2bStore.status = "error";
    b2bStore.error = "Registrierung fehlgeschlagen";
    console.error(error);
  }
});

function skipOnboarding(): void {
  b2bStore.error = "";
  b2bStore.status = "idle";
  void router.push({ name: "dashboard-b2b" });
}

async function onSuccessOk(): Promise<void> {
  showSuccess.value = false;
  await router.push({ name: "dashboard-b2b" });
}
</script>

<template>
  <RegisterLayout>
    <h1 class="text-white text-[24px] sm:text-[32px] font-bold leading-normal not-italic">
      Firmenkunden - Registrierung
    </h1>

    <div class="flex flex-wrap mt-8 sm:mt-10 gap-x-7 gap-y-2">
      <p class="text-white text-sm leading-normal not-italic font-normal">
        Sie sind bereits LeasyBack Kunde?
      </p>

      <RouterLink
        to="/account/login"
        class="text-custom-orange text-sm font-bold leading-normal not-italic"
      >
        Jetzt einloggen
      </RouterLink>
    </div>

    <form @submit.prevent="onSubmit" class="w-full">
      <CompanyRegister @logo-change="onLogoChange" />

      <CompanyAdminRegistration>
        <template #submit-button>
          <Button
            type="button"
            variant="outline"
            button-classes="rounded-[5px] py-2 px-8 text-sm font-bold hover:opacity-90 mr-4"
            @click="skipOnboarding"
          >
            Jetzt überspringen
          </Button>

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
  <AppModal
    :open="showSuccess"
    title="Vielen Dank!"
    message="Ihre Registrierung war erfolgreich. Sie werden zum Dashboard weitergeleitet."
    icon="material-symbols:check-circle-outline"
    confirm-text="OK"
    @confirm="onSuccessOk"
    @close="onSuccessOk"
  />
</template>
