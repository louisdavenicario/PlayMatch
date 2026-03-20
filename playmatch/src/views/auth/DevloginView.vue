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
    <!-- Subtle grid background -->
    <div class="grid-bg" />
    <!-- Blue accent blob -->
    <div class="blob blob-1" />
    <div class="blob blob-2" />

    <div class="login-wrapper">
      <!-- Header bar -->
      <div class="terminal-header">
        <div class="header-left">
          <span class="dot red" />
          <span class="dot yellow" />
          <span class="dot green" />
        </div>
        <span class="terminal-title">PlayMatch_devportal</span>
        <div class="header-right" />
      </div>

      <div class="terminal-body">
        <div class="boot-text">
          <div class="logo-mark">
            <span class="logo-icon">⬡</span>
            <span class="logo-text">DevPortal</span>
          </div>
          <p class="line">PlayMatch DevPortal</p>
          <p class="line dim">System initialized. Authentication required.</p>
          <div class="divider-line" />
        </div>

        <div class="form-section">
          <div class="field-group">
            <label class="field-label"> <span class="prompt">$</span> email </label>
            <input
              v-model="email"
              type="email"
              class="terminal-input"
              placeholder="username"
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
            <span class="err-icon">✗</span> {{ errorMessage }}
          </div>

          <button class="execute-btn" :disabled="loading" @click="handleDevLogin">
            <span v-if="loading" class="loading-dots">
              <span />
              <span />
              <span />
            </span>
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
  background: #f0f4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'JetBrains Mono', monospace;
  position: relative;
  overflow: hidden;
}

/* Grid background */
.grid-bg {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(37, 99, 235, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.06) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

/* Decorative blobs */
.blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0.5;
}
.blob-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #bfdbfe, #3b82f6);
  top: -100px;
  right: -100px;
}
.blob-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #dbeafe, #1d4ed8);
  bottom: -80px;
  left: -80px;
}

/* Login wrapper */
.login-wrapper {
  width: 100%;
  max-width: 520px;
  margin: 24px;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(59, 130, 246, 0.1),
    0 4px 24px rgba(59, 130, 246, 0.12),
    0 24px 80px rgba(37, 99, 235, 0.08);
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
  background: #1d4ed8;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 60px;
}

.header-right {
  justify-content: flex-end;
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
  color: rgba(255, 255, 255, 0.75);
  font-size: 11px;
  letter-spacing: 0.05em;
  text-align: center;
  flex: 1;
}

/* Terminal body */
.terminal-body {
  background: #ffffff;
  padding: 32px 36px 28px;
}

/* Logo */
.logo-mark {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.logo-icon {
  font-size: 28px;
  color: #2563eb;
  line-height: 1;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #1e3a8a;
  letter-spacing: -0.02em;
}

.boot-text {
  margin-bottom: 28px;
}

.line {
  font-size: 13px;
  color: #1e40af;
  margin: 0 0 4px 0;
  line-height: 1.6;
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-badge {
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.line.dim {
  color: #93c5fd;
  font-size: 12px;
}

.divider-line {
  height: 1px;
  background: linear-gradient(to right, #bfdbfe, transparent);
  margin-top: 12px;
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
  color: #3b82f6;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.prompt {
  color: #2563eb;
  font-weight: 700;
  font-size: 14px;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.terminal-input {
  flex: 1;
  background: #f8faff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e3a8a;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background 0.2s;
  width: 100%;
}

.terminal-input::placeholder {
  color: #bfdbfe;
}

.terminal-input:focus {
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.toggle-pw {
  background: #f0f7ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #3b82f6;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 10px 12px;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s,
    background 0.2s;
  white-space: nowrap;
}

.toggle-pw:hover {
  color: #1d4ed8;
  border-color: #3b82f6;
  background: #dbeafe;
}

.error-line {
  font-size: 13px;
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 10px 14px;
}

.err-icon {
  color: #dc2626;
  font-weight: 700;
}

.execute-btn {
  background: #2563eb;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  padding: 13px 20px;
  cursor: pointer;
  letter-spacing: 0.08em;
  transition:
    background 0.2s,
    box-shadow 0.2s,
    transform 0.1s;
  width: 100%;
  margin-top: 4px;
}

.execute-btn:hover:not(:disabled) {
  background: #1d4ed8;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);
}

.execute-btn:active:not(:disabled) {
  transform: translateY(0);
}

.execute-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading dots */
.loading-dots {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  height: 20px;
}

.loading-dots span {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  animation: dotBounce 1.2s ease-in-out infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotBounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.footer-note {
  font-size: 10px;
  color: #bfdbfe;
  text-align: center;
  margin: 28px 0 0;
  letter-spacing: 0.05em;
}
</style>
