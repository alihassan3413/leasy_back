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
  <div class="min-h-screen bg-[#F5F7F7]">
    <div class="mx-auto max-w-[1240px] px-6 py-10">
      <!-- Page header -->
      <header class="mb-8">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="h-px w-4 bg-custom-green"></span>
          <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-custom-green">
            Einstellungen
          </p>
        </div>
        <h1 class="text-[26px] font-bold leading-tight text-[#10393B]">
          Mein Konto
        </h1>
      </header>

      <div class="flex items-start gap-8">
        <!-- ── Identity rail ───────────────────────────── -->
        <aside class="sticky top-8 hidden w-[264px] shrink-0 lg:block">
          <!-- Identity card -->
          <div class="overflow-hidden rounded-2xl border border-[#D1DCDC] bg-white shadow-sm">
            <!-- Gradient banner -->
            <div class="h-[80px] bg-linear-to-br from-[#10393B] via-[#155254] to-[#1e6568]" />
            <div class="-mt-10 flex flex-col items-center px-5 pb-6">
              <div
                class="flex size-[76px] items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-custom-green text-xl font-bold text-white shadow-lg"
              >
                <img
                  v-if="b2cStore.profile?.contact?.avatar_url"
                  :src="b2cStore.profile.contact.avatar_url"
                  alt="Profilbild"
                  class="size-full object-cover"
                />
                <span v-else>{{ initials }}</span>
              </div>
              <p class="mt-3 max-w-full truncate text-[15px] font-bold text-[#10393B]">
                {{ fullName || "—" }}
              </p>
              <p class="max-w-full truncate text-[12px] text-[#7A9699]">
                {{ b2cStore.profile?.email }}
              </p>
            </div>
          </div>

          <!-- Section nav -->
          <nav class="mt-3 space-y-0.5">
            <button
              v-for="s in sections"
              :key="s.id"
              type="button"
              @click="scrollTo(s.id)"
              class="group flex w-full items-center gap-3 rounded-lg py-2.5 text-left text-sm font-medium transition-all"
              :class="
                activeSection === s.id
                  ? 'border-l-2 border-custom-green bg-white pl-[calc(0.875rem-2px)] pr-3.5 text-[#10393B] shadow-sm'
                  : 'px-3.5 text-[#6B8587] hover:bg-white/80 hover:text-[#10393B]'
              "
            >
              <Icon
                :icon="s.icon"
                class="size-[18px] shrink-0 transition-colors"
                :class="activeSection === s.id ? 'text-custom-green' : 'text-[#9CB3B4] group-hover:text-custom-green'"
              />
              {{ s.label }}
            </button>
          </nav>
        </aside>

        <!-- ── Content ─────────────────────────────────── -->
        <main class="min-w-0 flex-1 space-y-5 scroll-smooth">
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