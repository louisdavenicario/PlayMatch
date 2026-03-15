<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref(null)
const showPassword = ref(false)

const handleDevLogin = async () => {
  errorMessage.value = null

  if (!email.value || !password.value) {
    errorMessage.value = 'All fields required.'
    return
  }

  loading.value = true

  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (signInError) throw signInError

    const user = signInData.user || signInData.session?.user
    if (!user) throw new Error('No user returned.')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) throw profileError

    if (!profile || profile.role.toLowerCase() !== 'developer') {
      errorMessage.value = 'Access denied.'
      await supabase.auth.signOut()
      return
    }

    router.push({ name: 'developer-dashboard' })
  } catch (err) {
    errorMessage.value = err.message || 'Authentication failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="dev-login-root">
    <!-- Scanline overlay -->
    <div class="scanlines" />
    <!-- Grid background -->
    <div class="grid-bg" />

    <div class="login-wrapper">
      <!-- Terminal-style header -->
      <div class="terminal-header">
        <span class="dot red" />
        <span class="dot yellow" />
        <span class="dot green" />
        <span class="terminal-title">playmatch_devportal — bash</span>
      </div>

      <div class="terminal-body">
        <div class="boot-text">
          <p class="line">PlayMatch DevPortal v1.0.0</p>
          <p class="line dim">System initialized. Authentication required.</p>
          <p class="line dim">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
        </div>

        <div class="form-section">
          <div class="field-group">
            <label class="field-label"> <span class="prompt">$</span> email </label>
            <input
              v-model="email"
              type="email"
              class="terminal-input"
              placeholder="dev@playmatch.io"
              autocomplete="username"
              @keyup.enter="handleDevLogin"
            />
          </div>

          <div class="field-group">
            <label class="field-label"> <span class="prompt">$</span> password </label>
            <div class="input-row">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="terminal-input"
                placeholder="••••••••••••"
                autocomplete="current-password"
                @keyup.enter="handleDevLogin"
              />
              <button class="toggle-pw" @click="showPassword = !showPassword" tabindex="-1">
                {{ showPassword ? 'hide' : 'show' }}
              </button>
            </div>
          </div>

          <div v-if="errorMessage" class="error-line">
            <span class="prompt err">✗</span> {{ errorMessage }}
          </div>

          <button class="execute-btn" :disabled="loading" @click="handleDevLogin">
            <span v-if="loading" class="blink">_</span>
            <span v-else>▶ authenticate</span>
          </button>
        </div>

        <p class="footer-note">Authorized personnel only. Activity is monitored and logged.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');

* {
  box-sizing: border-box;
}

.dev-login-root {
  min-height: 100dvh;
  background: #0a0e14;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  position: relative;
  overflow: hidden;
}

/* Scanlines */
.scanlines {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(0, 255, 136, 0.015) 3px,
    rgba(0, 255, 136, 0.015) 4px
  );
  pointer-events: none;
  z-index: 10;
}

/* Grid bg */
.grid-bg {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 255, 136, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

/* Login wrapper */
.login-wrapper {
  width: 100%;
  max-width: 520px;
  margin: 24px;
  border: 1px solid #1e3a2f;
  border-radius: 8px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(0, 255, 136, 0.08),
    0 0 40px rgba(0, 255, 136, 0.06),
    0 24px 80px rgba(0, 0, 0, 0.8);
  position: relative;
  z-index: 2;
  animation: fadeUp 0.5s ease both;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Terminal header bar */
.terminal-header {
  background: #111820;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #1a2e24;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.dot.red {
  background: #ff5f57;
}
.dot.yellow {
  background: #febc2e;
}
.dot.green {
  background: #28c840;
}

.terminal-title {
  color: #4a6a58;
  font-size: 11px;
  margin-left: 8px;
  letter-spacing: 0.05em;
}

/* Terminal body */
.terminal-body {
  background: #0d1117;
  padding: 28px 32px 24px;
}

.boot-text {
  margin-bottom: 28px;
}

.line {
  font-size: 13px;
  color: #00ff88;
  margin: 0 0 4px 0;
  line-height: 1.6;
}

.line.dim {
  color: #2a4a38;
}

/* Form */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  color: #4a9a6a;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompt {
  color: #00ff88;
  font-weight: 700;
}

.prompt.err {
  color: #ff4444;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.terminal-input {
  flex: 1;
  background: #0a0e14;
  border: 1px solid #1a3a2a;
  border-radius: 4px;
  color: #00ff88;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  width: 100%;
}

.terminal-input::placeholder {
  color: #1e3a2a;
}

.terminal-input:focus {
  border-color: #00ff88;
  box-shadow: 0 0 0 2px rgba(0, 255, 136, 0.08);
}

.toggle-pw {
  background: transparent;
  border: 1px solid #1a3a2a;
  border-radius: 4px;
  color: #2a6a48;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 10px 10px;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
  white-space: nowrap;
}

.toggle-pw:hover {
  color: #00ff88;
  border-color: #00ff88;
}

.error-line {
  font-size: 13px;
  color: #ff4444;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 68, 68, 0.06);
  border: 1px solid rgba(255, 68, 68, 0.2);
  border-radius: 4px;
  padding: 10px 14px;
}

.execute-btn {
  background: transparent;
  border: 1px solid #00ff88;
  border-radius: 4px;
  color: #00ff88;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 500;
  padding: 12px 20px;
  cursor: pointer;
  letter-spacing: 0.08em;
  transition:
    background 0.2s,
    box-shadow 0.2s,
    color 0.2s;
  width: 100%;
  margin-top: 4px;
}

.execute-btn:hover:not(:disabled) {
  background: rgba(0, 255, 136, 0.08);
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.15);
}

.execute-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.blink {
  animation: blink 0.8s step-start infinite;
  font-size: 18px;
  line-height: 1;
}

.footer-note {
  font-size: 10px;
  color: #1e3a2a;
  text-align: center;
  margin: 28px 0 0;
  letter-spacing: 0.05em;
}
</style>
