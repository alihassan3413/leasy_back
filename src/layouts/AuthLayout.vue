<script setup lang="ts">
import leasybackLogo from "@/assets/logo/leasyback-logo.svg";
</script>

<template>
  <div class="relative flex min-h-screen overflow-hidden">
    <!-- Left background -->
    <div
      class="absolute left-0 top-0 z-0 h-full w-1/2"
      style="background-color: #fafafa"
    />

    <!-- Paths on the LEFT side (behind form) -->
    <img
      src="@/assets/logo/path-green.svg"
      alt=""
      class="pointer-events-none absolute z-10"
      style="left: -6vw; top: 1vw; width: 112vw; height: auto; opacity: 0.54"
    />
    <img
      src="@/assets/logo/path-orange.svg"
      alt=""
      class="pointer-events-none absolute z-10"
      style="left: -19vw; top: -12vw; width: 105vw; height: auto"
    />

    <!-- Left side — form -->
    <div class="relative flex w-1/2 items-center justify-center px-6 py-12">
      <div class="relative z-20 w-full max-w-[420px]">
        <div
          class="rounded-[10px] bg-white border px-9 pb-9 border-green-gray shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
        >
          <RouterView />
        </div>
      </div>
    </div>

    <!-- Right side — branding panel -->
    <div
      class="relative hidden w-1/2 items-center justify-center bg-primary px-12 lg:flex"
    >

      <!-- Logo and text ABOVE the paths -->
      <div
        class="relative z-10 w-full max-w-[565px] flex flex-col items-center text-left"
      >
        <img
          :src="leasybackLogo"
          alt="LeasyBack"
          class="h-auto w-full max-w-[220px] md:max-w-[300px] lg:max-w-[400px] xl:max-w-[565px]"
        />

        <p
          class="mt-8 xl:mt-10 2xl:mt-12 w-full max-w-[386px] xl:max-w-[454px] 2xl:max-w-[533px] text-[20px] font-normal leading-normal text-white lg:text-[24px] xl:text-[32px]"
        >
          Sicher dir jetzt dein kostenloses Minderwert-Gutachten, erhalte günstige
          <span class="text-custom-orange">Reparaturangebote</span>
          und gib dein Leasingfahrzeug mit bis zu 42% Ersparnis stressfrei zurück!
        </p>
      </div>
    </div>
  </div>
</template>
