<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Icon } from "@iconify/vue";
import { useB2CStore } from "@/stores/b2c.store";
import AccountDetail from "@/components/account/b2c/AccountDetail.vue";
import ContactPerson from "@/components/account/b2c/ContactPerson.vue";
import ManagePassword from "@/components/account/b2c/ManagePassword.vue";
import DeleteAccount from "@/components/account/b2c/DeleteAccount.vue";

const b2cStore = useB2CStore();

onMounted(async () => {
  await b2cStore.fetchProfile();
});

const fullName = computed(() => {
  const c = b2cStore.profile?.contact;
  if (!c) return "";
  return [c.first_name, c.last_name].filter(Boolean).join(" ");
});

const initials = computed(() => {
  const c = b2cStore.profile?.contact;
  if (!c) return "•";
  return ((c.first_name?.[0] ?? "") + (c.last_name?.[0] ?? "")).toUpperCase() || "•";
});

const sections = [
  { id: "kontodaten", label: "Kontodaten", icon: "mdi:account-circle-outline" },
  { id: "ansprechpartner", label: "Ansprechpartner", icon: "mdi:account-tie-outline" },
  { id: "passwort", label: "Passwort", icon: "mdi:lock-outline" },
  { id: "konto-loeschen", label: "Konto löschen", icon: "mdi:trash-can-outline" },
];

const activeSection = ref("kontodaten");

const scrollTo = (id: string) => {
  activeSection.value = id;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};
</script>

<template>
  <div class="min-h-screen bg-[#FAFAFA]">
    <div class="mx-auto max-w-[1240px] px-6 py-10">
      <!-- Page header -->
      <header class="mb-8">
        <p class="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-custom-green">
          Einstellungen
        </p>
        <h1 class="text-[28px] font-bold leading-tight text-[#10393B]">
          Mein Konto
        </h1>
      </header>

      <div class="flex items-start gap-8">
        <!-- ── Identity rail ───────────────────────────── -->
        <aside class="sticky top-8 hidden w-[264px] shrink-0 lg:block">
          <!-- Identity card -->
          <div class="overflow-hidden rounded-2xl border border-[#D9E2E2] bg-white">
            <!-- Teal banner -->
            <div class="h-[72px] bg-[#10393B]" />
            <div class="-mt-9 flex flex-col items-center px-5 pb-6">
              <div
                class="flex size-[72px] items-center justify-center overflow-hidden rounded-full border-4 border-white bg-custom-green text-xl font-bold text-white shadow-sm"
              >
                <img
                  v-if="b2cStore.profile?.contact?.avatar_url"
                  :src="b2cStore.profile.contact.avatar_url"
                  alt="Profilbild"
                  class="size-full object-cover"
                />
                <span v-else>{{ initials }}</span>
              </div>
              <p class="mt-3 max-w-full truncate text-base font-bold text-[#10393B]">
                {{ fullName || "—" }}
              </p>
              <p class="max-w-full truncate text-[13px] text-[#6B8587]">
                {{ b2cStore.profile?.email }}
              </p>
            </div>
          </div>

          <!-- Section nav -->
          <nav class="mt-4 space-y-0.5">
            <button
              v-for="s in sections"
              :key="s.id"
              type="button"
              @click="scrollTo(s.id)"
              class="group flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors"
              :class="
                activeSection === s.id
                  ? 'bg-white text-[#10393B] shadow-[inset_0_0_0_1px_#D9E2E2]'
                  : 'text-[#6B8587] hover:bg-white/70 hover:text-[#10393B]'
              "
            >
              <Icon
                :icon="s.icon"
                class="size-[18px] transition-colors"
                :class="activeSection === s.id ? 'text-custom-green' : 'text-[#9CB3B4] group-hover:text-custom-green'"
              />
              {{ s.label }}
            </button>
          </nav>
        </aside>

        <!-- ── Content ─────────────────────────────────── -->
        <main class="min-w-0 flex-1 space-y-6 scroll-smooth">
          <section id="kontodaten" class="scroll-mt-8">
            <AccountDetail />
          </section>

          <section id="ansprechpartner" class="scroll-mt-8">
            <ContactPerson />
          </section>

          <section id="passwort" class="scroll-mt-8">
            <ManagePassword />
          </section>

          <section id="konto-loeschen" class="scroll-mt-8">
            <DeleteAccount />
          </section>
        </main>
      </div>
    </div>
  </div>
</template>