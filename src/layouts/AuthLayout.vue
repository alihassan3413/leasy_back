<script setup lang="ts">
import leasybackLogo from '@/assets/logo/leasyback-logo.svg'
</script>

<template>
  <div class="relative flex min-h-screen overflow-hidden">
    <!-- Left-side background (below paths so they show through) -->
    <div
      class="absolute left-0 top-0 z-0 h-full w-1/2"
      style="background-color: #fafafa"
    />

    <!--
      Decorative dashed paths from Figma.
      z-10: above the left background, but below the form card (z-20).
      Visible on both sides, hidden only behind the form.
    -->
    <!-- Green dashed path — Figma: (-86, 93), 1601×1039, opacity 0.54 -->
    <img
      src="@/assets/logo/path-green.svg"
      alt=""
      class="pointer-events-none absolute z-10"
      style="left: -5.97vw; top: 1vw; width: 111.18vw; height: auto; opacity: 0.54"
    >
    <!-- Orange dashed path — Figma: (-280, -92), 1493×839 -->
    <img
      src="@/assets/logo/path-orange.svg"
      alt=""
      class="pointer-events-none absolute z-10"
      style="left: -19.44vw; top: -11.85vw; width: 103.68vw; height: auto"
    >

    <!-- Left side — form area (transparent bg, card has z-20 to cover paths) -->
    <div
      class="relative flex w-1/2 items-center justify-center px-6 py-12"
    >
      <div class="relative z-20 w-full max-w-[420px]">
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
        px-12
        lg:flex
      "
      style="background-color: #10393b"
    >
      <div class="relative z-20 w-full max-w-[565px]">
        <!-- Logo from Figma — natural size 565×238 -->
        <img
          :src="leasybackLogo"
          alt="LeasyBack"
          class="mb-20 w-full"
        >

        <!-- Marketing text -->
        <p
          class="mt-36 font-normal text-white"
          style="font-size: 32px; line-height: 100%"
        >
          Sicher dir jetzt dein kostenloses Minderwert-Gutachten, erhalte
          günstige
          <span style="color: #ef8450">Reparaturangebote</span>
          und gib dein Leasingfahrzeug mit bis zu 42% Ersparnis stressfrei
          zurück!
        </p>
      </div>
    </div>
  </div>
</template>
