<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import AppIcon from "../../components/base/AppIcon.vue";

const router = useRouter();
const auth = useAuthStore();
const nrp = ref("");
async function submit() {
  if (await auth.login(nrp.value)) router.replace("/dashboard");
}
</script>
<template>
  <section class="login-screen">
    <form class="login-card" @submit.prevent="submit">
      <div class="login-emblem">LOGO</div>
      <h1>LAPKUAT PERS</h1>
      <p class="login-subtitle">TENTARA NASIONAL INDONESIA</p>
      <label
        >NOMOR REGISTRASI POKOK (NRP)<input
          v-model="nrp"
          class="login-input"
          inputmode="numeric"
          autocomplete="off"
          placeholder="Masukkan NRP Anda"
      /></label>
      <p v-if="auth.error" class="login-error">{{ auth.error }}</p>
      <button class="login-button" type="submit" :disabled="auth.loading"><AppIcon name="login" :size="19" />
        {{ auth.loading ? "MEMERIKSA..." : "MASUK" }}
      </button>
      <div class="login-divider" />
    </form>
    <small class="login-footer"
      >V4.0.2-SECURE&nbsp;</small
    >
  </section>
</template>
