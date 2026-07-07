<template>
  <div class="hero-container" ref="heroRef" @mousemove="handleMouseMove">
    <!-- 网格背景 -->
    <div class="grid-bg"></div>

    <!-- 浮动霓虹粒子 -->
    <div
      class="neon-particle"
      v-for="(p, i) in particles"
      :key="i"
      :style="{
        left: p.x + '%',
        top: p.y + '%',
        width: p.size + 'px',
        height: p.size + 'px',
        animationDelay: p.delay + 's',
        animationDuration: p.duration + 's',
        '--particle-color': p.color,
      }"
    ></div>

    <!-- 扫描线 -->
    <div class="scanline"></div>

    <!-- 装饰性边框角标 -->
    <div class="corner corner-tl"></div>
    <div class="corner corner-tr"></div>
    <div class="corner corner-bl"></div>
    <div class="corner corner-br"></div>

    <!-- 主体内容 -->
    <div class="content">
      <!-- 头像带霓虹环 -->
      <div class="avatar-wrap">
        <div class="avatar-ring"></div>
        <img
          src="https://picsum.photos/200/200"
          alt="头像"
          class="avatar"
        />
      </div>

      <!-- 姓名：Glitch 效果 -->
      <h1 class="name" data-text="MR.SHU">MR.SHU</h1>

      <!-- 简介：终端风格 -->
      <div class="career-wrap">
        <span class="career-prompt">></span>
        <p class="career">{{ displayCareer }}</p>
        <span class="career-cursor">_</span>
      </div>

      <!-- 社交链接：霓虹边框 -->
      <div class="social-links">
        <a
          v-for="(link, i) in socialLinks"
          :key="i"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="social-link"
          :style="{ animationDelay: `${1.5 + i * 0.1}s` }"
        >
          <i :class="link.icon"></i>
          <span class="social-label">{{ link.label }}</span>
        </a>
      </div>

      <!-- 个人中心按钮 -->
      <div class="btn-wrap">
        <button class="cyber-btn" @click="$router.push('/chat')">
          <span class="cyber-btn-text">进入个人中心</span>
          <span class="cyber-btn-glitch"></span>
        </button>
      </div>

      <!-- 底部滚动提示 -->
      <div class="scroll-tip">
        <div class="scroll-chevron"></div>
        <p class="tip-text">SCROLL_DOWN</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const heroRef = ref<HTMLElement | null>(null)
const displayCareer = ref('')
const fullCareer = '前端工程师 | 热爱技术与创作'

// 霓虹粒子数据
const particles = ref<
  Array<{ x: number; y: number; size: number; delay: number; duration: number; color: string }>
>([])

const socialLinks = [
  { url: 'https://github.com', icon: 'fa fa-github', label: 'GITHUB' },
  { url: 'https://juejin.cn', icon: 'fa fa-book', label: 'BLOG' },
  { url: 'mailto:xxx@xxx.com', icon: 'fa fa-envelope', label: 'EMAIL' },
  { url: 'https://weixin.qq.com', icon: 'fa fa-weixin', label: 'WECHAT' },
]

// 终端打字效果
const typeCareer = () => {
  let i = 0
  const type = () => {
    if (i < fullCareer.length) {
      displayCareer.value += fullCareer.charAt(i)
      i++
      setTimeout(type, 60 + Math.random() * 40)
    }
  }
  setTimeout(type, 1200)
}

// 生成霓虹粒子
const generateParticles = () => {
  const colors = ['#00f0ff', '#ff00aa', '#ffe600', '#00ff41', '#ff6600']
  const items: typeof particles.value = []
  for (let i = 0; i < 40; i++) {
    items.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)]!,
    })
  }
  particles.value = items
}

// 鼠标视差
const handleMouseMove = (e: MouseEvent) => {
  if (!heroRef.value) return
  const rect = heroRef.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  heroRef.value.style.setProperty('--mouse-x', String(x * 10))
  heroRef.value.style.setProperty('--mouse-y', String(y * 10))
}

onMounted(() => {
  generateParticles()
  typeCareer()
})
</script>

<style scoped>
/* ─── 容器 ──────────────────────────────── */
.hero-container {
  width: 100vw;
  height: 100vh;
  background: #05050a;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  font-family: var(--font-body);
  --mouse-x: 0px;
  --mouse-y: 0px;
}

/* ─── 网格背景 ──────────────────────────── */
.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  background-position: center center;
  mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 70%);
  pointer-events: none;
}

/* ─── 扫描线 ────────────────────────────── */
.scanline {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 240, 255, 0.03) 50%,
    transparent 100%
  );
  height: 4px;
  animation: scanline-sweep 4s linear infinite;
  pointer-events: none;
}

@keyframes scanline-sweep {
  from { transform: translateY(-100%); }
  to { transform: translateY(100vh); }
}

/* ─── 霓虹粒子 ──────────────────────────── */
.neon-particle {
  position: absolute;
  border-radius: 50%;
  background: var(--particle-color, #00f0ff);
  box-shadow:
    0 0 6px var(--particle-color, #00f0ff),
    0 0 12px var(--particle-color, #00f0ff),
    0 0 24px var(--particle-color, #00f0ff);
  opacity: 0;
  animation: particle-float var(--duration, 6s) ease-in-out infinite;
}

@keyframes particle-float {
  0%, 100% { opacity: 0; transform: translateY(0) translateX(0); }
  20% { opacity: 0.8; }
  50% { opacity: 0.4; transform: translateY(-40px) translateX(10px); }
  80% { opacity: 0.6; }
}

/* ─── 四角装饰 ──────────────────────────── */
.corner {
  position: absolute;
  width: 40px;
  height: 40px;
  pointer-events: none;
  opacity: 0.6;
}
.corner-tl { top: 30px; left: 30px; border-top: 2px solid var(--cyber-cyan); border-left: 2px solid var(--cyber-cyan); }
.corner-tr { top: 30px; right: 30px; border-top: 2px solid var(--cyber-magenta); border-right: 2px solid var(--cyber-magenta); }
.corner-bl { bottom: 30px; left: 30px; border-bottom: 2px solid var(--cyber-magenta); border-left: 2px solid var(--cyber-magenta); }
.corner-br { bottom: 30px; right: 30px; border-bottom: 2px solid var(--cyber-cyan); border-right: 2px solid var(--cyber-cyan); }

/* ─── 主内容区 ──────────────────────────── */
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  transform: translate(
    calc(var(--mouse-x) * 0.5 * 1px),
    calc(var(--mouse-y) * 0.5 * 1px)
  );
  transition: transform 0.1s ease-out;
}

/* ─── 头像 + 霓虹环 ─────────────────────── */
.avatar-wrap {
  position: relative;
  margin-bottom: 2rem;
  animation: fadeUp 1s ease forwards;
}

.avatar-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #00f0ff, #ff00aa, #ffe600, #00f0ff);
  animation: ring-spin 4s linear infinite;
  filter: blur(4px);
  opacity: 0.7;
}
@keyframes ring-spin {
  to { transform: rotate(360deg); }
}

.avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 1;
  border: 3px solid rgba(0, 0, 0, 0.8);
  transition: all 0.3s ease;
}

.avatar-wrap:hover .avatar {
  transform: scale(1.06);
}
.avatar-wrap:hover .avatar-ring {
  opacity: 1;
  filter: blur(2px);
}

/* ─── 姓名 Glitch ───────────────────────── */
.name {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: var(--cyber-text-bright);
  text-shadow: var(--glow-cyan);
  letter-spacing: 0.15em;
  position: relative;
  margin-bottom: 0.5rem;
  animation:
    fadeUp 1s ease 0.3s forwards,
    neon-flicker 5s linear infinite 1s;
  opacity: 0;
}

.name::before,
.name::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}
.name::before {
  color: #00f0ff;
  animation: glitch-1 2s infinite;
  z-index: -1;
}
.name::after {
  color: #ff00aa;
  animation: glitch-2 2s infinite;
  z-index: -2;
}

/* ─── 终端风格简介 ──────────────────────── */
.career-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2.5rem;
  animation: fadeUp 1s ease 0.6s forwards;
  opacity: 0;
}

.career-prompt {
  color: var(--cyber-green);
  font-family: var(--font-mono);
  font-size: 1.1rem;
}

.career {
  font-family: var(--font-mono);
  font-size: 1.1rem;
  color: var(--cyber-green);
  text-shadow: var(--glow-green);
}

.career-cursor {
  color: var(--cyber-green);
  font-family: var(--font-mono);
  font-size: 1.1rem;
  animation: cursor-blink 1s step-end infinite;
}
@keyframes cursor-blink {
  50% { opacity: 0; }
}

/* ─── 社交链接 ──────────────────────────── */
.social-links {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  justify-content: center;
  animation: fadeUp 1s ease 0.9s forwards;
  opacity: 0;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--cyber-border);
  color: var(--cyber-text);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.social-link::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.social-link:hover {
  color: var(--cyber-cyan);
  text-shadow: var(--glow-cyan);
  border-color: var(--cyber-cyan);
  box-shadow:
    0 0 10px rgba(0, 240, 255, 0.3),
    inset 0 0 10px rgba(0, 240, 255, 0.05);
  transform: translateY(-3px);
}

.social-link i {
  font-size: 1rem;
}

/* ─── 赛博按钮 ──────────────────────────── */
.btn-wrap {
  animation: fadeUp 1s ease 1.2s forwards;
  opacity: 0;
}

.cyber-btn {
  position: relative;
  padding: 14px 40px;
  background: transparent;
  border: 2px solid var(--cyber-cyan);
  color: var(--cyber-cyan);
  font-family: var(--font-display);
  font-size: 0.9rem;
  letter-spacing: 0.15em;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  text-transform: uppercase;
  clip-path: polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%);
}

.cyber-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 240, 255, 0.08);
  transform: translateX(-100%);
  transition: transform 0.4s ease;
}

.cyber-btn:hover::before {
  transform: translateX(0);
}
.cyber-btn:hover {
  box-shadow:
    0 0 20px rgba(0, 240, 255, 0.5),
    0 0 50px rgba(0, 240, 255, 0.2),
    inset 0 0 20px rgba(0, 240, 255, 0.1);
  text-shadow: var(--glow-cyan);
  color: #fff;
}

.cyber-btn-glitch {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 40%, rgba(255, 0, 170, 0.3) 50%, transparent 60%);
  transform: translateX(-100%);
  transition: none;
}
.cyber-btn:hover .cyber-btn-glitch {
  animation: btn-glitch 0.3s linear;
}
@keyframes btn-glitch {
  to { transform: translateX(100%); }
}

/* ─── 滚动提示 ──────────────────────────── */
.scroll-tip {
  position: absolute;
  bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: fadeUp 1s ease 1.5s forwards, bounce 2s ease 2s infinite;
  opacity: 0;
}

.scroll-chevron {
  width: 12px;
  height: 12px;
  border-right: 2px solid var(--cyber-cyan);
  border-bottom: 2px solid var(--cyber-cyan);
  transform: rotate(45deg);
}

.tip-text {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--cyber-text-dim);
  letter-spacing: 0.3em;
}

/* ─── 复用全局 keyframes ────────────────── */
@keyframes fadeUp {
  to { transform: translateY(0); opacity: 1; }
}
@keyframes bounce {
  0%, 100%, 50% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
}

@media (max-width: 768px) {
  .avatar { width: 110px; height: 110px; }
  .social-link { padding: 6px 12px; font-size: 0.7rem; }
}
@media (max-width: 480px) {
  .name { font-size: 2rem; }
  .social-links { gap: 0.5rem; }
  .corner { width: 24px; height: 24px; }
}
</style>
