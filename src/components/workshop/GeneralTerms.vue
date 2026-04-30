<script setup lang="ts">
import { useField } from "vee-validate";
import { Icon } from "@iconify/vue";

const { value: isProSelected } = useField<boolean>("terms.isProSelected");
const { value: isPremiumSelected } = useField<boolean>(
  "terms.isPremiumSelected",
);
const { value: agbAccepted } = useField<boolean>("terms.agbAccepted");
const { value: privacyAccepted } = useField<boolean>("terms.privacyAccepted");

const proFeatures = [
  "Planbare Aufträge",
  "Kein Kundenkontakt nötig",
  "Faire Preisgestaltung",
  "Geringer Verwaltungsaufwand",
];

const proIncluded = [
  "Regelmäßige Weiterleitung <br> geprüfter Gutachten für gezielte <br> Angebotserstellung.",
  "Der Anbieter übernimmt die <br> Kommunikation und Abstimmung <br> mit dem Kunden.",
  "Werkstatt gibt eigene Angebote ab <br> und bleibt wettbewerbsfähig.",
  "Der Anbieter prüft und koordiniert <br> die gesamte Abwicklung.",
];

const proDuties = [
  "Abgabe eines verbindlichen <br> Angebots für die Instandsetzung <br> basierend auf dem Gutachten, ohne <br> gleichzeitige Garantie für <br> Auftragszusage.",
  "Sicherstellen, dass das <br> Nachgutachten nach der Reparatur <br> in der eigenen Werkstatt <br> durchgeführt werden kann.",
];

const premiumFeatures = [
  "Direkte Fahrzeugvermittlung",
  "Exklusiver Meisterbetrieb",
  "Mehr Umsatzpotenzial",
  "Langfristige Kundenbindung",
];

const premiumIncluded = [
  "Werkstätten erhalten Fahrzeuge <br> direkt zur Instandsetzung.",
  "Positionierung als Premium- <br> Dienstleister mit hoher Qualität.",
  "Durch zusätzliche <br> Serviceleistungen wie Abholung & <br> Rückbringung.",
  "Der Anbieter bleibt zentraler <br> Ansprechpartner für <br> Leasingrückgaben.",
];

const premiumDuties = [
  "Organisation der <br> Fahrzeugabholung beim Kunden <br> nach Terminabsprache.",
  "Durchführung der Instandsetzung <br> gemäß den Vorgaben des <br> Leasinggebers auf Basis des <br> Gutachtens.",
  "Sicherstellen der zertifizierten <br> Nachkontrolle nach der Reparatur.",
  "Rückbringung des Fahrzeugs an <br> das Autohaus ist bis 30 km <br> kostenfrei von der Werkstatt zu <br> übernehmen.",
  "Ab einer Entfernung von über 30 km <br> stellt der Anbieter (LB) einen <br> kostenpflichtigen Fahrdienst.",
];
</script>

<template>
  <div class="w-full rounded bg-white mt-2.5">
    <div class="flex flex-col items-start px-5 py-5">
      <h2 class="text-primary text-[20px] font-bold leading-normal not-italic">
        Allgemeine Vertrags-Bedingungen
      </h2>
      <div class="w-full h-px bg-green-gray mb-4"></div>

      <div class="w-full space-y-4 mt-1">
        <!-- Provision und Gebühren -->
        <div class="space-y-2">
          <h3 class="text-black text-sm font-bold">Provision und Gebühren</h3>
          <p class="text-black text-[13px] leading-normal">
            Hinweis: Für jeden von LeasyBack vermittelten Auftrag berechnen wir
            eine Provision von 12,5 % auf <br />
            die angebotene Reparatursumme. Beispiel: Bei einem KVA
            (Kostenvoranschlag) über 1.500 € <br />
            beträgt die Provision 187,50 €. Weitere Details finden Sie in
            unseren (<a href="#" class="text-custom-green underline">AGB</a>).
          </p>
          <p class="text-black text-[13px] leading-normal">
            Haftung und Gewährleistung finden Sie in unseren (<a
              href="#"
              class="text-custom-green underline"
              >AGB</a
            >).
          </p>
        </div>

        <!-- Kündigung und Ausschluss -->
        <div class="space-y-2">
          <h3 class="text-black text-sm font-bold">Kündigung und Ausschluss</h3>
          <p class="text-black text-[13px] leading-normal">
            Hinweis: LeasyBack behält sich das Recht vor, Werkstätten bei
            mehrfachen Qualitätsmängeln oder <br />
            Vertragsverstößen von der Plattform auszuschließen. (<a
              href="#"
              class="text-custom-green underline"
              >AGB</a
            >)
          </p>
        </div>

        <p class="text-black text-sm text-center w-full py-4 font-normal">
          Bitte wählen Sie aus, welche(s) Paket(e) Sie anbieten möchten
          (Mehrfachauswahl möglich):
        </p>

        <!-- Package Grid -->
        <div class="grid grid-cols-2 gap-6 w-full px-4 pb-8">
          <!-- Pro Partner Card -->
          <div
            class="border rounded-lg p-6 flex flex-col h-full transition-all bg-white"
            :class="isProSelected ? 'border-custom-green' : 'border-gray-200'"
          >
            <h4 class="text-primary text-[20px] font-bold mb-6">Pro Partner</h4>

            <ul class="space-y-2 mb-6">
              <li
                v-for="feature in proFeatures"
                :key="feature"
                class="flex items-center gap-3"
              >
                <div
                  class="bg-custom-green rounded-[3px] size-5 flex items-center justify-center shrink-0"
                >
                  <Icon icon="mdi:check" class="text-white size-4" />
                </div>
                <span class="text-black text-[15px] font-bold">{{
                  feature
                }}</span>
              </li>
            </ul>

            <div class="space-y-4 flex-1">
              <div>
                <p class="text-black text-sm font-normal mb-2">
                  Alles im Pro enthalten:
                </p>
                <ul class="space-y-2">
                  <li
                    v-for="item in proIncluded"
                    :key="item"
                    class="flex items-start gap-2"
                  >
                    <Icon
                      icon="mdi:check"
                      class="text-custom-green size-6 shrink-0 mt-0.5"
                    />
                    <span
                      class="text-black text-sm leading-tight"
                      v-html="item"
                    ></span>
                  </li>
                </ul>
              </div>

              <div>
                <p class="text-black text-sm font-normal mb-2">
                  Pflichten der Werkstatt:
                </p>
                <ul class="space-y-2">
                  <li
                    v-for="duty in proDuties"
                    :key="duty"
                    class="flex items-start gap-2"
                  >
                    <Icon
                      icon="mdi:check"
                      class="text-custom-green size-6 shrink-0 mt-0.5"
                    />
                    <span
                      class="text-black text-sm leading-tight"
                      v-html="duty"
                    ></span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="mt-8 flex justify-center">
              <div
                class="flex items-center gap-2 cursor-pointer group"
                @click="
                  isProSelected = true;
                  isPremiumSelected = false;
                "
              >
                <div
                  class="size-6 rounded-[5px] border-2 flex items-center justify-center transition-colors"
                  :class="
                    isProSelected
                      ? 'bg-custom-green border-custom-green'
                      : 'border-custom-green'
                  "
                >
                  <Icon
                    v-if="isProSelected"
                    icon="mdi:check"
                    class="text-white size-5"
                  />
                </div>
                <span class="text-custom-black text-sm font-bold"
                  >Auswählen</span
                >
              </div>
            </div>
          </div>

          <!-- Premium Partner Card -->
          <div
            class="border rounded-lg p-6 flex flex-col h-full transition-all bg-white"
            :class="
              isPremiumSelected ? 'border-custom-orange' : 'border-gray-200'
            "
          >
            <h4 class="text-primary text-[20px] font-bold mb-6">
              Premium Partner
            </h4>

            <ul class="space-y-2 mb-6">
              <li
                v-for="feature in premiumFeatures"
                :key="feature"
                class="flex items-center gap-3"
              >
                <div
                  class="bg-custom-orange rounded-[3px] size-5 flex items-center justify-center shrink-0"
                >
                  <Icon icon="mdi:check" class="text-white size-4" />
                </div>
                <span class="text-black text-[15px] font-bold">{{
                  feature
                }}</span>
              </li>
            </ul>

            <div class="space-y-4 flex-1">
              <div>
                <p class="text-black text-sm font-normal mb-2">
                  Alles im Premium enthalten:
                </p>
                <ul class="space-y-2">
                  <li
                    v-for="item in premiumIncluded"
                    :key="item"
                    class="flex items-start gap-2"
                  >
                    <Icon
                      icon="mdi:check"
                      class="text-custom-orange size-6 shrink-0 mt-0.5"
                    />
                    <span
                      class="text-black text-sm leading-tight"
                      v-html="item"
                    ></span>
                  </li>
                </ul>
              </div>

              <div>
                <p class="text-black text-sm font-normal mb-2">
                  Pflichten der Werkstatt:
                </p>
                <ul class="space-y-2">
                  <li
                    v-for="duty in premiumDuties"
                    :key="duty"
                    class="flex items-start gap-2"
                  >
                    <Icon
                      icon="mdi:check"
                      class="text-custom-orange size-6 shrink-0 mt-0.5"
                    />
                    <span
                      class="text-black text-sm leading-tight"
                      v-html="duty"
                    ></span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="mt-8 flex justify-center">
              <div
                class="flex items-center gap-2 cursor-pointer group"
                @click="
                  isPremiumSelected = true;
                  isProSelected = false;
                "
              >
                <div
                  class="size-6 rounded-[5px] border-2 flex items-center justify-center transition-colors"
                  :class="
                    isPremiumSelected
                      ? 'bg-custom-orange border-custom-orange'
                      : 'border-custom-orange'
                  "
                >
                  <Icon
                    v-if="isPremiumSelected"
                    icon="mdi:check"
                    class="text-white size-5"
                  />
                </div>
                <span class="text-black text-[14px] font-bold">Auswählen</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Terms Checkboxes -->
        <div class="space-y-4 px-4 pb-4">
          <div
            class="flex items-start gap-3 cursor-pointer"
            @click="agbAccepted = !agbAccepted"
          >
            <div
              class="size-4 border border-black rounded-[2px] mt-1 flex items-center justify-center shrink-0"
            >
              <div
                v-if="agbAccepted"
                class="size-2.5 bg-black rounded-[1px]"
              ></div>
            </div>
            <span class="text-black text-[12px] font-normal">
              Ich habe die AGB gelesen und stimme diesen zu.
            </span>
          </div>

          <div
            class="flex items-start gap-3 cursor-pointer"
            @click="privacyAccepted = !privacyAccepted"
          >
            <div
              class="size-4 border border-black rounded-[2px] mt-1 flex items-center justify-center shrink-0"
            >
              <div
                v-if="privacyAccepted"
                class="size-2.5 bg-black rounded-[1px]"
              ></div>
            </div>
            <span class="text-black text-[12px] font-normal">
              Ich habe die Datenschutzerklärung gelesen und willige in die
              Nutzung meiner Daten gemäß dieser Erklärung ein.
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>