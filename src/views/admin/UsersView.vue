<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { adminUsersApi } from "@/api";
import { formatGermanDate } from "@/lib/formatting";
import type { AdminUser } from "@/types";
import UserDetailModal from "@/components/admin/UserDetail.vue";
import AdminAddVehicleModal from "@/components/admin/AdminAddVehicleModal.vue";

// ── List state ────────────────────────────────────────────────────
const viewType = ref<"B2C" | "B2B">("B2C");
const page = ref(1);
const limit = ref(10);
const total = ref(0);
const totalActive = ref(0);
const totalInactive = ref(0);
const users = ref<AdminUser[]>([]);
const loading = ref(false);
const error = ref("");

// ── Modal state ───────────────────────────────────────────────────
const selectedUser = ref<AdminUser | null>(null);
const modalOpen = ref(false);
const showAddVehicleModal = ref(false);

const pageTitle = computed(() => (viewType.value === "B2C" ? "Privatkunden" : "Firmenkunden"));

function userInitials(u: AdminUser) {
  return ((u.first_name?.[0] ?? "") + (u.last_name?.[0] ?? "")).toUpperCase() || "?";
}

// ── Fetch list ────────────────────────────────────────────────────
async function loadUsers() {
  loading.value = true;
  error.value = "";
  try {
    const res =
      viewType.value === "B2C"
        ? await adminUsersApi.getB2c(page.value, limit.value)
        : await adminUsersApi.getB2b(page.value, limit.value);
    users.value = res.data;
    total.value = res.total;
    totalActive.value = res.total_active;
    totalInactive.value = res.total_inactive;
  } catch {
    error.value = "Kunden konnten nicht geladen werden.";
  } finally {
    loading.value = false;
  }
}

// ── Modal open/close ──────────────────────────────────────────────
function openModal(user: AdminUser) {
  selectedUser.value = user;
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  selectedUser.value = null;
}

function openAddVehicleModal(user: AdminUser, event: MouseEvent) {
  event.stopPropagation(); // Prevent opening the user detail modal
  selectedUser.value = user;
  showAddVehicleModal.value = true;
}

function handleVehicleCreated() {
  // Optionally refresh the list or do nothing since user detail isn't open
}

// ── Pagination ────────────────────────────────────────────────────
const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);

function pageRange(current: number, last: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || Math.abs(i - current) <= 1) out.push(i);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  return out;
}

// ── Watchers ──────────────────────────────────────────────────────
watch(viewType, () => {
  page.value = 1;
});
watch([viewType, page], () => void loadUsers());
onMounted(() => void loadUsers());
</script>

<template>
  <div class="flex flex-col gap-5 h-full">
    <!-- ── FLOATING HEADER ── -->
    <header
      class="flex items-center gap-4 h-[60px] bg-white/70 backdrop-blur border border-[#eaf0ef] rounded-[18px] px-5 shrink-0"
      style="box-shadow: 0 4px 18px rgba(16, 57, 59, 0.04)"
    >
      <div class="flex-1">
        <h1 class="text-[18px] font-extrabold text-[#10393b] tracking-[-0.4px]">
          Kundenverwaltung
        </h1>
      </div>

      <!-- B2C / B2B toggle -->
      <div class="flex gap-0.5 bg-[#f4f7f6] p-[3px] rounded-[12px]">
        <button
          v-for="opt in [
            { label: 'Privatkunden', val: 'B2C' },
            { label: 'Firmenkunden', val: 'B2B' },
          ]"
          :key="opt.val"
          @click="viewType = opt.val as 'B2C' | 'B2B'"
          class="text-[12.5px] font-bold px-4 py-1.5 rounded-[9px] transition-all font-[Manrope,sans-serif]"
          :class="
            viewType === opt.val
              ? 'bg-white text-[#10393b] shadow-[0_1px_5px_rgba(16,57,59,0.1)]'
              : 'text-[#6f8585] hover:text-[#10393b]'
          "
        >
          {{ opt.label }}
        </button>
      </div>
    </header>

    <!-- ── MAIN CARD ── -->
    <section
      class="flex-1 flex flex-col bg-white border border-[#eef3f2] rounded-[24px] p-6 min-h-0"
      style="box-shadow: 0 6px 22px rgba(16, 57, 59, 0.04)"
    >
      <!-- Card header -->
      <div class="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h2 class="text-[20px] font-extrabold text-[#10393b] tracking-[-0.4px]">
            {{ pageTitle }}
          </h2>
          <p class="text-[12px] text-[#9bb0af] mt-0.5 font-medium">{{ total }} Kunden gesamt</p>
        </div>
        <div class="flex gap-2">
          <span
            class="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-[#01B990]/10 text-[#00856a]"
          >
            {{ totalActive }} Aktiv
          </span>
          <span
            class="text-[11.5px] font-bold px-3 py-1.5 rounded-full bg-[#ef8450]/10 text-[#c0622e]"
          >
            {{ totalInactive }} Inaktiv
          </span>
        </div>
      </div>

      <!-- Error banner -->
      <div
        v-if="error"
        class="mb-4 px-4 py-3 rounded-[13px] bg-red-50 border border-red-200 text-[13px] text-red-700 shrink-0"
      >
        {{ error }}
      </div>

      <!-- Table -->
      <div class="flex-1 overflow-auto rounded-[18px] border border-[#eef3f2] min-h-0">
        <table class="min-w-full border-collapse">
          <thead class="sticky top-0 z-10">
            <tr class="bg-[#f8faf9]">
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]"
              >
                Kunde
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]"
              >
                E-Mail
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]"
              >
                Stadt
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]"
              >
                Land
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]"
              >
                Status
              </th>
              <th
                class="text-left text-[11px] font-bold text-[#9bb0af] uppercase tracking-[0.1em] px-5 py-3.5 border-b border-[#eef3f2]"
              >
                Beigetreten
              </th>
              <th class="border-b border-[#eef3f2] w-12"></th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton rows -->
            <template v-if="loading">
              <tr v-for="i in 8" :key="i">
                <td colspan="7" class="px-5 py-4">
                  <div
                    class="h-4 rounded-full bg-[#f4f7f6] animate-pulse"
                    :style="{ width: 55 + (i % 5) * 9 + '%' }"
                  ></div>
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else-if="!users.length">
              <td colspan="7" class="py-16 text-center text-[13px] text-[#9bb0af]">
                Keine Kunden gefunden.
              </td>
            </tr>

            <!-- Data rows -->
            <tr
              v-else
              v-for="u in users"
              :key="u.user_id"
              class="group cursor-pointer border-b border-[#eef3f2] hover:bg-[#f6f9f8] transition-colors"
              @click="openModal(u)"
            >
              <!-- Name + avatar -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-[10px] flex items-center justify-center text-[12px] font-extrabold text-white shrink-0"
                    style="background: linear-gradient(150deg, #01b990, #10393b)"
                  >
                    {{ userInitials(u) }}
                  </div>
                  <div>
                    <div class="text-[13.5px] font-bold text-[#10393b]">
                      {{ u.salutation }} {{ u.first_name }} {{ u.last_name }}
                    </div>
                    <div class="text-[11px] text-[#9bb0af] mt-0.5">ID {{ u.profile_id }}</div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5 text-[13px] text-[#5a6e6c]">{{ u.user_email }}</td>
              <td class="px-5 py-3.5 text-[13px] text-[#5a6e6c]">{{ u.city || "—" }}</td>
              <td class="px-5 py-3.5 text-[13px] text-[#5a6e6c]">{{ u.country || "—" }}</td>
              <td class="px-5 py-3.5">
                <span
                  class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                  :class="
                    u.is_active
                      ? 'bg-[#01B990]/10 text-[#00856a]'
                      : 'bg-[#ef8450]/10 text-[#c0622e]'
                  "
                >
                  <span class="w-[5px] h-[5px] rounded-full bg-current"></span>
                  {{ u.is_active ? "Aktiv" : "Inaktiv" }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-[12.5px] text-[#9bb0af] tabular-nums">
                {{ formatGermanDate(u.created_at) }}
              </td>
              <td class="px-3 py-3.5">
                <div class="flex items-center gap-1">
                  <button
                    @click="openAddVehicleModal(u, $event)"
                    class="w-8 h-8 flex items-center justify-center rounded-[9px] text-[#bcccca] hover:bg-[#EF8450] hover:text-white transition-all"
                    title="Fahrzeug erstellen"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <span
                    class="w-8 h-8 flex items-center justify-center rounded-[9px] text-[#bcccca] group-hover:bg-[#10393b] group-hover:text-white transition-all"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M7 17L17 7M17 7H8M17 7v9" />
                    </svg>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 shrink-0">
        <span class="text-[12px] text-[#9bb0af] font-medium"
          >Seite {{ page }} von {{ totalPages }}</span
        >
        <div class="flex gap-1">
          <button
            @click="page--"
            :disabled="page <= 1"
            class="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#eef3f2] text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            ←
          </button>
          <button
            v-for="p in pageRange(page, totalPages)"
            :key="String(p)"
            @click="typeof p === 'number' && (page = p)"
            class="w-8 h-8 flex items-center justify-center rounded-[8px] border text-[12.5px] font-bold transition-all font-[Manrope,sans-serif]"
            :class="
              p === page
                ? 'bg-[#10393b] border-[#10393b] text-white'
                : p === '…'
                  ? 'border-transparent text-[#9bb0af] cursor-default'
                  : 'border-[#eef3f2] text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b]'
            "
          >
            {{ p }}
          </button>
          <button
            @click="page++"
            :disabled="page >= totalPages"
            class="w-8 h-8 flex items-center justify-center rounded-[8px] border border-[#eef3f2] text-[#6f8585] hover:border-[#10393b] hover:text-[#10393b] disabled:opacity-35 disabled:cursor-not-allowed transition-all"
          >
            →
          </button>
        </div>
      </div>
    </section>
  </div>

  <!-- ── DETAIL MODAL (separate component, Teleports to body) ── -->
  <UserDetailModal :user="selectedUser" :open="modalOpen" @close="closeModal" />
  <!-- ── ADMIN ADD VEHICLE MODAL ── -->
  <AdminAddVehicleModal
    :open="showAddVehicleModal"
    @update:open="showAddVehicleModal = $event"
    :target-user="selectedUser"
    @vehicle-created="handleVehicleCreated"
  />
</template>

<style scoped>
.modal-enter-active {
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active {
  transition: all 0.18s ease;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(4px);
}

.lb-pg-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #eef3f2;
  background: white;
  color: #6f8585;
  font-family: Manrope, sans-serif;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 150ms;
}

.lb-pg-btn:hover:not(:disabled) {
  border-color: #10393b;
  color: #10393b;
}

.lb-pg-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
