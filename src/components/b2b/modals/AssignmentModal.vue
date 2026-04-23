<script setup lang="ts">

import {
    Dialog,
    DialogContent,
    DialogDescription,
} from '@/components/ui/dialog'
import FormSelectField from '@/components/ui/form/FormSelectField.vue'
import FormTextField from '@/components/ui/form/FormTextField.vue'
import Button from '@/components/ui/Button.vue'
import { Icon } from '@iconify/vue'




const open = defineModel<boolean>('open', { default: false })

const salutaionOptions = [
    {
        label: 'Frau',
        value: 'frau'
    },
    {
        label: 'Herr',
        value: 'herr'
    },
    {
        label: 'Divers',
        value: 'divers'
    }
]

const initialValues = {
    anrede: 'frau',
    vorname: 'Christen',
    nachname: 'Mechtild',
    strasse: '',
    nummer: '',
    zusaetzlicheAnschrift: '',
    plz: '',
    ort: '',
    email: '',
}

const onSubmit = (values: Record<string, any>) => {
    console.log('submitted vlaues', values);

    open.value = false

}
</script>

<template>
    <Dialog v-model:open="open">
        <DialogContent :show-close-button="false" class=" w-full  p-0 ">
            <div class="bg-white w-195   ">
                <!-- Header -->
                 <div class="flex items-center pt-2 h-[50px]  bg-white  border-b border-green-gray justify-between  px-8">
                    <h2 class="text-primary text-[20px] font-bold leading-normal not-italic">Zuweisung an</h2>
                    <button
                    type="button"
                    class="transition-opacity hover:opacity-60 text-green-gray"
                    @click="open = false"
                    >
                       <Icon icon="mdi:close" class="size-5"/> 
                    </button>
                 </div>
                
                <DialogDescription class="pt-4 text-[15px] px-8 text-slate-700">
                        Weisen Sie ganz einfach ein Fahrzeug einem Nutzer zu – bitte tragen
                        Sie dafür alle Angaben im Formular unten ein.
                    </DialogDescription>

                <!-- Form -->
                <div class="px-8 py-6">
                    <form :initial-values="initialValues" @submit.prevent="onSubmit">
                        <div class="space-y-5">
                            <!-- Row 1 -->
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-4">
                                    <FormSelectField name="anrede" label="Andrede" :options="salutaionOptions"
                                        placeholder="Bitte wählen" />
                                </div>

                                <div class="col-span-4">
                                    <FormTextField name="Vorname" label="vorname" placeholder="Vorname"  />
                                </div>

                                <div class="col-span-4">
                                    <FormTextField name="nachname" label="Nachname" placeholder="nachname"  />
                                </div>
                            </div>

                            <!-- Row 2 -->
                            <div class="grid grid-cols-12 gap-4">
                                <div class="col-span-5">
                                    <FormTextField
                                        name="strasse"
                                        label="Straße"
                                        placeholder="Straße"
                                        
                                    />
                                </div>

                                <div class="col-span-2">
                                    <FormTextField
                                         name="nummer"
                                        label="Nr."
                                        placeholder="Nr."
                                        
                                    />
                                </div>

                                <div class="col-span-5">
                                    <FormTextField
                                    name="zusaetzlicheAnschrift"
                                    label="Zusätzliche Anschrift"
                                    placeholder="Zusätzliche Anschrift"
                                    class=""
                                    />
                                </div>
                            </div>

                            <!-- Row 3 -->
                            <div class="grid grid-cols-12 gap-4 items-end">
                                <div class="col-span-2">
                                    <FormTextField
                                    name="plz"
                                    label="PLZ"
                                    placeholder="PLZ"
                                    
                                    />
                                </div>

                                <div class="col-span-6">
                                    <FormTextField
                                    name="ort"
                                    label="Ort"
                                    placeholder="Ort"
                                   
                                    />
                                </div>

                                <div class="col-span-2">

                                    <div class="flex flex-col  w-full">
                                        <label class=" text-base font-bold">Land</label>
                                        <div class="h-10 flex items-center  rounded-md bg-muted/20">
                                        Deutschland
                                        </div>
                                    </div>
                                </div>
                            </div>
                        

                        <!-- Email -->
                        <div>
                            <FormTextField
                             name="email"
                            label="E-Mail-Adresse für Anfragen"
                            placeholder="E-Mail-Adresse"
                            type="email"
                            
                            />
                        </div>

                        <!-- Aktivitaeten -->
                        <div>
                            <Label class="mb-2 block font-semibold">Aktivitäten</Label>
                                <div class="h-10 max-w-[320px] flex items-center gap-8 px-3 border rounded-md">
                                <span>12.03.2025</span>
                                <span>Getankt</span>
                                </div>
                        </div>

                        <!-- Footer button -->
                        <div class="flex justify-end pt-4">
                            <Button type="submit" class="bg-[#ef8750] hover:bg-[#e7763d] text-white px-10">
                                Bestätigen
                            </Button>
                        </div>
                </div>
                </form>
            </div>
            </div>
        </DialogContent>
    </Dialog>
</template>