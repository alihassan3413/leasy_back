<script setup lang="ts">
import leasybackLogo from '@/assets/logo/leasyback-logo.svg'
</script>

<template>
  <div class="relative flex min-h-screen overflow-hidden">
    <!--
      Decorative dashed paths from Figma.
      Positioned relative to the FULL page (not just right panel)
      since they span across both sides.
    -->
    <!-- Green dashed path — Figma: (-86, 93), 1601×1039, opacity 0.54 -->
    <img
      src="@/assets/logo/path-green.svg"
      alt=""
      class="pointer-events-none absolute z-10"
      style="
        left: -6%;
        top: 9%;
        width: 111%;
        height: auto;
        opacity: 0.54;
      "
    >
    <!-- Orange dashed path — Figma: (-280, -92), 1493×839 -->
    <img
      src="@/assets/logo/path-orange.svg"
      alt=""
      class="pointer-events-none absolute z-10"
      style="left: -19.4%; top: -9%; width: 103.7%; height: auto"
    >

    <!-- Left side — form area -->
    <div
      class="relative z-20 flex w-1/2 items-center justify-center px-6 py-12"
      style="background-color: #fafafa"
    >
      <div class="w-full max-w-[420px]">
        <div
          class="rounded-[10px] bg-white p-10 "
          style="box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1)"
        >
          <RouterView />
        </div>
      </div>
    </div>

    <!-- Right side — branding panel (hidden on mobile) -->
    <div
      class="
        relative z-0 hidden w-1/2 items-center justify-center overflow-hidden
        px-16
        lg:flex
      "
      style="background-color: #10393b"
    >
      <div class="relative z-10 max-w-xl">
        <!-- Logo from Figma — natural size 565×238 -->
        <img
          :src="leasybackLogo"
          alt="LeasyBack"
          class="mb-14"
          style="width: 565px; height: auto"
        >

        <!-- Marketing text — Figma: 533×274 -->
        <p
          class="font-bold leading-snug text-white"
          style="font-size: 1.75rem; max-width: 533px"
        >
          Sicher dir jetzt dein kostenloses Minderwert-Gutachten, erhalte
          günstige
          <span
            style="color: #ef8450"
            class="font-bold"
          >Reparaturangebote</span>
          und gib dein Leasingfahrzeug mit bis zu 42% Ersparnis stressfrei
          zurück!
        </p>
      </div>
    </div>
  </div>
</template>
