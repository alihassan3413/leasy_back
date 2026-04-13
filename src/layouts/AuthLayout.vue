<script setup lang="ts">
import leasybackLogo from "@/assets/logo/leasyback-logo.svg";
import { useRoute } from "vue-router";
const route = useRoute();
</script>

<template>
  <div class="relative flex md:min-h-screen overflow-hidden">
    <div
      class="absolute left-0 top-0 z-0 h-full w-full md:w-1/2"
      style="background-color: #fafafa"
    />

    <img
      src="@/assets/logo/path-green.svg"
      alt=""
      class="pointer-events-none absolute z-10 hidden md:block"
      style="left: -5.97vw; top: 1vw; width: 111.18vw; height: auto; opacity: 0.54"
    />

    <img
      src="@/assets/logo/path-orange.svg"
      alt=""
      class="pointer-events-none absolute z-10 hidden md:block"
      style="left: -19.44vw; top: -11.85vw; width: 103.68vw; height: auto"
    />

    <div class="relative flex w-full md:w-1/2 items-center justify-center  md:px-6  md:py-12">
      <div class="relative z-20 w-full max-w-105">
        
        <div
          class="rounded-[10px] bg-white border px-9 pb-9 border-green-gray shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
        >
         <!-- Tabs -->
          <div class="flex mb-2 md:hidden">

            <!-- Login Tab -->
            <RouterLink
              to="/auth/login"
              class="flex-1 text-center py-3 font-semibold transition"
              :class="route.path.includes('login')
                ? 'bg-white text-custom-orange'
                : 'bg-gray-200 text-black'"
            >
              Einloggen
            </RouterLink>

            <!-- Register Tab -->
            <RouterLink
              to="/auth/register"
              class="flex-1 text-center py-3 font-semibold transition"
              :class="route.path.includes('register')
                ? 'bg-white text-custom-orange'
                : 'bg-gray-200 text-black'"
            >
              Registrieren
            </RouterLink>

          </div>
          <RouterView />
        </div>
      </div>
    </div>

    <!-- Right side — branding panel (hidden on mobile) -->
    <div
      class="relative z-0 hidden md:flex w-1/2 md:items-center md:justify-center overflow-hidden bg-primary px-12 lg:flex"
    >
      <div
        class="relative z-20 w-full max-w-141.25 flex flex-col items-center text-left"
      >
        <img
          :src="leasybackLogo"
          alt="LeasyBack"
          class="h-auto w-full max-w-55 md:max-w-75 lg:max-w-100 xl:max-w-141.25"
        />

        <p
          class="mt-8 xl:mt-10 2xl:mt-12 w-full max-w-96.5 xl:max-w-113.5 2xl:max-w-133.25 text-[20px] font-normal leading-normal text-white lg:text-[24px] xl:text-[32px]"
        >
          Sicher dir jetzt dein kostenloses Minderwert-Gutachten, erhalte günstige
          <span class="text-custom-orange">Reparaturangebote</span>
          und gib dein Leasingfahrzeug mit bis zu 42% Ersparnis stressfrei zurück!
        </p>
      </div>
    </div>
  </div>
</template>
