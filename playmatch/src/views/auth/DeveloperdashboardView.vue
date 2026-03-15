<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabaseClient'

const router = useRouter()

// --- State ---
const loading = ref(true)
const totalCustomers = ref(0)
const totalOwners = ref(0)
const totalRegistered = ref(0)
const registrationsByDay = ref([])
const recentUsers = ref([])
const activeUsers = ref([])

// --- Fetch Data ---
const fetchStats = async () => {
  loading.value = true
  try {
    // 1. All profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('role, created_at, full_name, last_seen_at')

    if (error) throw error

    if (profiles) {
      totalCustomers.value = profiles.filter((p) => p.role?.toLowerCase() === 'customer').length
      totalOwners.value = profiles.filter((p) => p.role?.toLowerCase() === 'owner').length

      // Recent 5 users by registration
      recentUsers.value = [...profiles]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)

      // Active users — last_seen_at within last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      activeUsers.value = [...profiles]
        .filter((p) => p.last_seen_at && new Date(p.last_seen_at) >= sevenDaysAgo)
        .sort((a, b) => new Date(b.last_seen_at) - new Date(a.last_seen_at))

      // New registrations — last 14 days
      const now = new Date()
      const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - (13 - i))
        return d
      })

      registrationsByDay.value = days.map((day) => {
        const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const count = profiles.filter((p) => {
          const created = new Date(p.created_at)
          return (
            created.getFullYear() === day.getFullYear() &&
            created.getMonth() === day.getMonth() &&
            created.getDate() === day.getDate()
          )
        }).length
        return { date: label, count }
      })
    }

    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    totalRegistered.value = count ?? 0
  } catch (err) {
    console.error('Stats fetch error:', err)
  } finally {
    loading.value = false
  }
}

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/dev')
}

// --- Helpers ---
const maxCount = computed(() => Math.max(...registrationsByDay.value.map((d) => d.count), 1))
const chartHeight = 120
const barWidth = computed(() => {
  const total = registrationsByDay.value.length
  return total ? Math.floor(600 / total) - 4 : 30
})

const formatLastSeen = (ts) => {
  if (!ts) return '—'
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const isToday = (ts) => {
  return new Date(ts) >= new Date(Date.now() - 86400000)
}

onMounted(fetchStats)
</script>

<template>
  <div class="dev-dash-root">
    <div class="scanlines" />
    <div class="grid-bg" />

    <!-- Top bar -->
    <header class="topbar">
      <div class="topbar-left">
        <span class="topbar-label">PlayMatch</span>
        <span class="topbar-sep">/</span>
        <span class="topbar-page">devportal</span>
      </div>
      <div class="topbar-right">
        <span class="live-dot" />
        <span class="live-text">LIVE</span>
        <button class="logout-btn" @click="handleLogout">⏻ logout</button>
      </div>
    </header>

    <main class="dash-main">
      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <span class="blink-cursor">▌</span>
        <span>Fetching system data…</span>
      </div>

      <template v-else>
        <!-- Stat Cards -->
        <div class="stat-grid">
          <div class="stat-card">
            <p class="stat-label">Total Customers</p>
            <p class="stat-value">{{ totalCustomers.toLocaleString() }}</p>
            <p class="stat-sub">role: customer</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Total Owners</p>
            <p class="stat-value accent-yellow">{{ totalOwners.toLocaleString() }}</p>
            <p class="stat-sub">role: owner</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Total Users</p>
            <p class="stat-value accent-cyan">
              {{ (totalCustomers + totalOwners).toLocaleString() }}
            </p>
            <p class="stat-sub">all roles</p>
          </div>
          <div class="stat-card">
            <p class="stat-label">Active (7 days)</p>
            <p class="stat-value accent-green">{{ activeUsers.length.toLocaleString() }}</p>
            <p class="stat-sub">logged in recently</p>
          </div>
        </div>

        <!-- Active Users Panel -->
        <section class="panel">
          <div class="panel-header">
            <div class="panel-header-left">
              <span class="active-indicator" />
              <span class="panel-title">Active Users — Last 7 Days</span>
            </div>
            <span class="panel-badge">{{ activeUsers.length }} active</span>
          </div>

          <div class="table-wrap">
            <table class="dev-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Last Seen</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="activeUsers.length === 0">
                  <td colspan="5" class="empty-row">
                    No active users yet — last_seen_at will populate after users log in.
                  </td>
                </tr>
                <tr v-for="(u, i) in activeUsers" :key="i">
                  <td class="dim">{{ i + 1 }}</td>
                  <td>{{ u.full_name ?? '—' }}</td>
                  <td>
                    <span class="role-badge" :class="u.role?.toLowerCase()">
                      {{ u.role ?? '—' }}
                    </span>
                  </td>
                  <td class="dim">{{ formatLastSeen(u.last_seen_at) }}</td>
                  <td>
                    <span
                      class="status-badge"
                      :class="isToday(u.last_seen_at) ? 'online' : 'recent'"
                    >
                      {{ isToday(u.last_seen_at) ? '● today' : '○ this week' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Registration Chart -->
        <section class="panel">
          <div class="panel-header">
            <span class="panel-title">New Registrations — Last 14 Days</span>
            <span class="panel-badge">registrations</span>
          </div>

          <div class="chart-wrap">
            <svg
              :viewBox="`0 0 640 ${chartHeight + 40}`"
              xmlns="http://www.w3.org/2000/svg"
              class="bar-chart"
              preserveAspectRatio="xMidYMid meet"
            >
              <line
                v-for="n in 4"
                :key="n"
                x1="0"
                :y1="(chartHeight / 4) * n"
                x2="640"
                :y2="(chartHeight / 4) * n"
                stroke="rgba(0,255,136,0.07)"
                stroke-width="1"
              />
              <g v-for="(day, i) in registrationsByDay" :key="i">
                <rect
                  :x="i * (barWidth + 4) + 10"
                  :y="chartHeight - (day.count / maxCount) * chartHeight"
                  :width="barWidth"
                  :height="(day.count / maxCount) * chartHeight || 2"
                  rx="2"
                  :fill="day.count > 0 ? '#00ff88' : '#1a3a2a'"
                  opacity="0.85"
                />
                <text
                  v-if="day.count > 0"
                  :x="i * (barWidth + 4) + 10 + barWidth / 2"
                  :y="chartHeight - (day.count / maxCount) * chartHeight - 5"
                  text-anchor="middle"
                  font-size="9"
                  fill="#00ff88"
                  font-family="JetBrains Mono, monospace"
                >
                  {{ day.count }}
                </text>
                <text
                  v-if="i % 2 === 0"
                  :x="i * (barWidth + 4) + 10 + barWidth / 2"
                  :y="chartHeight + 16"
                  text-anchor="middle"
                  font-size="8"
                  fill="#2a5a40"
                  font-family="JetBrains Mono, monospace"
                >
                  {{ day.date }}
                </text>
              </g>
            </svg>
          </div>
        </section>

        <!-- Recent Registrations Table -->
        <section class="panel">
          <div class="panel-header">
            <span class="panel-title">Recent Registrations</span>
            <span class="panel-badge">latest 5</span>
          </div>

          <div class="table-wrap">
            <table class="dev-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="recentUsers.length === 0">
                  <td colspan="4" class="empty-row">No users found.</td>
                </tr>
                <tr v-for="(u, i) in recentUsers" :key="i">
                  <td class="dim">{{ i + 1 }}</td>
                  <td>{{ u.full_name ?? '—' }}</td>
                  <td>
                    <span class="role-badge" :class="u.role?.toLowerCase()">
                      {{ u.role ?? '—' }}
                    </span>
                  </td>
                  <td class="dim">
                    {{
                      u.created_at
                        ? new Date(u.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <p class="dash-footer">PlayMatch DevPortal — data pulled from Supabase in real-time</p>
      </template>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.dev-dash-root {
  min-height: 100dvh;
  background: #0a0e14;
  font-family: 'JetBrains Mono', monospace;
  color: #00ff88;
  position: relative;
}

.scanlines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(0, 255, 136, 0.012) 3px,
    rgba(0, 255, 136, 0.012) 4px
  );
}

.grid-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(10, 14, 20, 0.95);
  border-bottom: 1px solid #0e2a1e;
  padding: 12px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(8px);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.topbar-label {
  color: #00ff88;
  font-weight: 700;
}
.topbar-sep {
  color: #1e3a2a;
}
.topbar-page {
  color: #2a6a48;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ff88;
  animation: pulse 2s ease infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.4);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 0 5px rgba(0, 255, 136, 0);
  }
}

.live-text {
  font-size: 11px;
  color: #00ff88;
  letter-spacing: 0.1em;
}

.logout-btn {
  background: transparent;
  border: 1px solid #1a3a2a;
  color: #2a6a48;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 0.05em;
  transition:
    color 0.2s,
    border-color 0.2s;
}
.logout-btn:hover {
  color: #ff4444;
  border-color: #ff4444;
}

.dash-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 20px 60px;
  position: relative;
  z-index: 1;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 80px 0;
  justify-content: center;
  font-size: 14px;
  color: #2a6a48;
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
.blink-cursor {
  animation: blink 0.8s step-start infinite;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
  animation: fadeUp 0.4s ease both;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card {
  background: #0d1117;
  border: 1px solid #0e2a1e;
  border-radius: 8px;
  padding: 20px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
.stat-card:hover {
  border-color: #00ff8855;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.06);
}

.stat-label {
  font-size: 10px;
  color: #2a5a40;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #00ff88;
  line-height: 1;
  margin-bottom: 6px;
}
.stat-value.accent-yellow {
  color: #ffd700;
}
.stat-value.accent-cyan {
  color: #00cfff;
}
.stat-value.accent-pink {
  color: #ff6eb4;
}
.stat-value.accent-green {
  color: #00ff88;
}
.stat-sub {
  font-size: 10px;
  color: #1e4a30;
}

.panel {
  background: #0d1117;
  border: 1px solid #0e2a1e;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  animation: fadeUp 0.5s ease both;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #0e2a1e;
}

.panel-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.active-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ff88;
  animation: pulse 2s ease infinite;
  flex-shrink: 0;
}

.panel-title {
  font-size: 12px;
  color: #4a9a6a;
  letter-spacing: 0.06em;
}
.panel-badge {
  font-size: 10px;
  color: #1e4a30;
  background: #0a1a10;
  border: 1px solid #0e2a1e;
  border-radius: 999px;
  padding: 2px 10px;
  letter-spacing: 0.06em;
}

.chart-wrap {
  padding: 20px;
  overflow-x: auto;
}
.bar-chart {
  width: 100%;
  min-width: 400px;
  display: block;
}

.table-wrap {
  overflow-x: auto;
}

.dev-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.dev-table th {
  text-align: left;
  padding: 10px 20px;
  color: #2a5a40;
  font-weight: 400;
  letter-spacing: 0.08em;
  font-size: 10px;
  text-transform: uppercase;
  border-bottom: 1px solid #0e2a1e;
}
.dev-table td {
  padding: 12px 20px;
  color: #5aaa78;
  border-bottom: 1px solid #0a1a10;
}
.dev-table tr:last-child td {
  border-bottom: none;
}
.dev-table tr:hover td {
  background: rgba(0, 255, 136, 0.02);
}

.dim {
  color: #2a5a40 !important;
}

.empty-row {
  text-align: center;
  color: #1e3a2a !important;
  padding: 28px !important;
}

.role-badge {
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.06em;
}
.role-badge.customer {
  background: rgba(0, 207, 255, 0.1);
  color: #00cfff;
  border: 1px solid rgba(0, 207, 255, 0.2);
}
.role-badge.owner {
  background: rgba(255, 215, 0, 0.1);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.2);
}
.role-badge.developer {
  background: rgba(255, 110, 180, 0.1);
  color: #ff6eb4;
  border: 1px solid rgba(255, 110, 180, 0.2);
}

.status-badge {
  font-size: 10px;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.06em;
}
.status-badge.online {
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
  border: 1px solid rgba(0, 255, 136, 0.25);
}
.status-badge.recent {
  background: rgba(255, 215, 0, 0.08);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.dash-footer {
  text-align: center;
  font-size: 10px;
  color: #1a3a28;
  letter-spacing: 0.06em;
  margin-top: 40px;
}
</style>
