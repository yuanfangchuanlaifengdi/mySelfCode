<template>
  <div class="chat-layout">
    <!-- ========== 侧边栏 ========== -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 侧边栏头部 -->
      <div class="sidebar-header">
        <button class="cyber-icon-btn" @click="sidebarCollapsed = !sidebarCollapsed" title="收起侧边栏">
          <span class="icon-hamburger">&#9776;</span>
        </button>
        <button class="new-chat-btn" @click="handleNewChat">
          <span class="new-chat-icon">+</span>
          <span class="new-chat-text">新对话</span>
        </button>
      </div>

      <div class="sidebar-divider"></div>

      <!-- 对话列表 -->
      <div class="conversation-list">
        <!-- 置顶分组 -->
        <template v-for="group in groupedConversations" :key="group.key">
          <div v-if="group.items.length > 0" class="section-label">{{ group.label }}</div>
          <div
            v-for="conv in group.items"
            :key="conv.id"
            class="conv-item"
            :class="{ active: conv.id === activeId }"
            @click="handleSwitchChat(conv.id)"
          >
            <div class="conv-main">
              <span v-if="conv.pinned" class="conv-pin" title="已置顶">&#128278;</span>
              <div class="conv-info">
                <span class="conv-title">{{ conv.title }}</span>
                <span class="conv-time">{{ formatTime(conv.updatedAt) }}</span>
              </div>
            </div>

            <!-- 悬停操作按钮 -->
            <div class="conv-actions" @click.stop>
              <button
                class="conv-action-btn"
                title="重命名"
                @click="startRename(conv)"
              >&#9998;</button>
              <button
                class="conv-action-btn"
                :title="conv.pinned ? '取消置顶' : '置顶'"
                @click="togglePin(conv.id)"
              >{{ conv.pinned ? '&#128279;' : '&#128278;' }}</button>
              <button
                class="conv-action-btn danger"
                title="删除"
                @click="confirmDelete(conv)"
              >&#10005;</button>
            </div>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-if="conversations.length === 0" class="sidebar-empty">
          <p>暂无对话</p>
          <p class="sidebar-empty-hint">点击上方按钮开始</p>
        </div>
      </div>

      <!-- 侧边栏底部 -->
      <div class="sidebar-footer">
        <span class="footer-text">共 {{ conversations.length }} 个对话</span>
      </div>
    </aside>

    <!-- ========== 展开按钮（侧边栏收起时） ========== -->
    <button
      v-if="sidebarCollapsed"
      class="sidebar-toggle"
      @click="sidebarCollapsed = false"
      title="展开侧边栏"
    >&#9776;</button>

    <!-- ========== 主聊天区 ========== -->
    <div class="chat-container">
      <!-- 网格背景 -->
      <div class="grid-bg"></div>
      <div class="scanline"></div>
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>

      <!-- 顶部栏 -->
      <header class="top-bar">
        <button class="back-btn" @click="handleGoBack">
          <span class="back-arrow">&#9664;</span>
          <span class="back-text">返回</span>
        </button>

        <div class="welcome-wrap">
          <span class="prompt-symbol">~$</span>
          <span class="welcome-title">DeepSeek V4 Pro</span>
        </div>

        <div class="status-indicator">
          <span class="status-dot" :class="{ active: !loading }"></span>
          <span class="status-text">{{ loading ? 'PROCESSING' : 'ONLINE' }}</span>
        </div>
      </header>

      <!-- 主聊天区域 -->
      <main class="chat-main" ref="chatMainRef">
        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 80 80" width="64" height="64">
              <polygon points="40,4 72,22 72,58 40,76 8,58 8,22" fill="none" stroke="currentColor" stroke-width="1"/>
              <circle cx="40" cy="40" r="12" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
            </svg>
          </div>
          <p class="empty-title">DEEPSEEK V4 PRO</p>
          <p class="empty-desc">输入消息，开始对话...</p>
        </div>

        <!-- 消息列表 -->
        <div v-else class="message-list">
          <div v-for="(msg, i) in messages" :key="i" class="message-row" :class="msg.role">
            <div v-if="msg.role === 'assistant'" class="msg-avatar assistant-avatar">
              <svg viewBox="0 0 40 40" width="32" height="32">
                <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="currentColor" stroke-width="1.2"/>
              </svg>
            </div>

            <div class="msg-bubble" :class="[msg.role, { streaming: msg.role === 'assistant' && msg.streaming }]">
              <div v-if="msg.role === 'assistant' && msg.streaming" class="stream-header">
                <span class="stream-dot"></span>
                <span class="stream-label">GENERATING</span>
                <span class="stream-dot"></span>
              </div>
              <div v-if="msg.role === 'assistant'" class="msg-content" :class="{ 'is-streaming': msg.streaming }" v-html="renderMarkdown(msg.content, msg.streaming)"></div>
              <div v-else class="msg-content msg-text">{{ msg.content }}</div>
            </div>

            <div v-if="msg.role === 'user'" class="msg-avatar user-avatar"><span>YOU</span></div>
          </div>

          <!-- 加载指示器 -->
          <div v-if="loading && messages.length > 0 && !messages[messages.length - 1]?.streaming" class="message-row assistant">
            <div class="msg-avatar assistant-avatar">
              <svg viewBox="0 0 40 40" width="32" height="32">
                <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="none" stroke="currentColor" stroke-width="1.2"/>
              </svg>
            </div>
            <div class="msg-bubble assistant">
              <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>
      </main>

      <!-- 输入区域 -->
      <footer class="input-area">
        <div class="input-wrapper">
          <textarea ref="inputRef" v-model="inputText" class="chat-input" placeholder="输入消息..." rows="1" @keydown.enter.exact.prevent="handleSend" @input="autoResize" :disabled="loading"></textarea>
          <button class="send-btn" @click="handleSend" :disabled="!inputText.trim() || loading" :class="{ sending: loading }">
            <span v-if="!loading" class="send-icon">&#9654;</span>
            <span v-else class="send-icon pulse">&#9632;</span>
          </button>
        </div>
        <p class="input-hint">Enter 发送 · Shift+Enter 换行</p>
      </footer>

      <!-- 底部状态栏 -->
      <footer class="bottom-bar">
        <span class="bar-item">MODEL::DeepSeek-V4-Pro[1m]</span>
        <span class="bar-divider">|</span>
        <span class="bar-item">TOKENS::{{ totalTokens }}</span>
        <span class="bar-divider">|</span>
        <span class="bar-item glitch-text">SIGNAL::ACTIVE</span>
      </footer>
    </div>

    <!-- ========== 重命名弹窗 ========== -->
    <Teleport to="body">
      <div v-if="renamingConv" class="modal-overlay" @click="cancelRename">
        <div class="modal-box" @click.stop>
          <p class="modal-title">重命名对话</p>
          <input
            ref="renameInputRef"
            v-model="renameText"
            class="modal-input"
            @keydown.enter="confirmRename"
            @keydown.escape="cancelRename"
          />
          <div class="modal-btns">
            <button class="modal-btn cancel" @click="cancelRename">取消</button>
            <button class="modal-btn confirm" @click="confirmRename">确定</button>
          </div>
        </div>
      </div>

      <!-- 删除确认弹窗 -->
      <div v-if="deletingConv" class="modal-overlay" @click="deletingConv = null">
        <div class="modal-box" @click.stop>
          <p class="modal-title">删除「{{ deletingConv.title }}」？</p>
          <p class="modal-desc">删除后无法恢复</p>
          <div class="modal-btns">
            <button class="modal-btn cancel" @click="deletingConv = null">取消</button>
            <button class="modal-btn danger" @click="executeDelete">确认删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import { useConversations } from '@/composables/useConversations'
import type { Message, Conversation } from '@/composables/useConversations'

const router = useRouter()

// ─── 会话管理 ────────────────────────────
const {
  conversations,
  activeId,
  activeConversation,
  createConversation,
  deleteConversation,
  renameConversation,
  togglePin,
  switchConversation,
  updateMessages,
} = useConversations()

// ─── 侧边栏 ──────────────────────────────
const sidebarCollapsed = ref(false)

// 分组：置顶 + 普通
const groupedConversations = computed(() => {
  const pinned = conversations.value.filter((c) => c.pinned)
  const unpinned = conversations.value.filter((c) => !c.pinned)
  const groups: Array<{ key: string; label: string; items: Conversation[] }> = []
  if (pinned.length > 0) {
    groups.push({ key: 'pinned', label: '置顶', items: pinned })
  }
  if (unpinned.length > 0) {
    groups.push({ key: 'unpinned', label: pinned.length > 0 ? '对话' : '', items: unpinned })
  }
  return groups
})

// ─── 当前会话消息 ────────────────────────
const messages = ref<Message[]>([])
const inputText = ref('')
const loading = ref(false)
const totalTokens = ref(0)
const chatMainRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)

// 初始化：如果没有会话则创建，否则加载当前会话消息
if (!activeId.value || !activeConversation.value) {
  const conv = createConversation()
  messages.value = conv.messages
} else {
  messages.value = activeConversation.value.messages || []
}

// 监听活跃会话切换
watch(activeConversation, (conv) => {
  if (conv) {
    messages.value = conv.messages || []
    totalTokens.value = 0
  } else {
    messages.value = []
  }
})

// ─── API 配置 ────────────────────────────
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY
const BASE_URL = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/anthropic'

// ─── Markdown 渲染 ────────────────────────
const renderMarkdown = (text: string, streaming?: boolean): string => {
  if (!text) return streaming ? '<span class="stream-cursor"></span>' : ''
  let html = marked.parse(text, { breaks: true }) as string
  if (streaming) {
    const lastClose = html.lastIndexOf('</')
    if (lastClose !== -1) {
      html = html.slice(0, lastClose) + '<span class="stream-cursor"></span>' + html.slice(lastClose)
    } else {
      html += '<span class="stream-cursor"></span>'
    }
  }
  return html
}

// ─── 新建对话 ────────────────────────────
const handleNewChat = () => {
  const conv = createConversation()
  messages.value = conv.messages
  totalTokens.value = 0
  sidebarCollapsed.value = false
}

// ─── 切换对话 ────────────────────────────
const handleSwitchChat = (id: string) => {
  if (id === activeId.value) return
  switchConversation(id)
}

// ─── 发送消息 ────────────────────────────
const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  resetTextarea()

  // 保存用户消息
  updateMessages(messages.value)

  await scrollToBottom()

  messages.value.push({ role: 'assistant', content: '', streaming: true })
  const aiMsg = messages.value[messages.value.length - 1]!
  loading.value = true

  try {
    // 构建请求历史的上下文（取最近的消息的 role 和 content）
    const historyMsgs = messages.value
      .filter((m) => !m.streaming)
      .map((m) => ({ role: m.role, content: m.content }))

    const response = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'DeepSeek-V4-Pro[1m]',
        max_tokens: 4096,
        system: '你是一个有帮助的AI助手。请用中文回答所有问题。',
        messages: historyMsgs,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`API 请求失败: ${response.status} ${errText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取响应流')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content_block_delta') {
            const deltaText = parsed.delta?.text
            if (deltaText) {
              aiMsg.content += deltaText
              await nextTick()
            }
          }
          if (parsed.type === 'message_delta') {
            const usage = parsed.usage
            if (usage?.total_tokens) {
              totalTokens.value = usage.total_tokens
            }
          }
        } catch { /* skip */ }
      }
      await scrollToBottom()
    }
  } catch (err) {
    aiMsg.content = err instanceof Error ? err.message : '请求失败，请稍后重试'
  } finally {
    aiMsg.streaming = false
    loading.value = false
    updateMessages(messages.value)
    await nextTick()
    await scrollToBottom()
  }
}

// ─── 重命名 ──────────────────────────────
const renamingConv = ref<Conversation | null>(null)
const renameText = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

const startRename = (conv: Conversation) => {
  renamingConv.value = conv
  renameText.value = conv.title
  nextTick(() => renameInputRef.value?.focus())
}

const confirmRename = () => {
  if (renamingConv.value && renameText.value.trim()) {
    renameConversation(renamingConv.value.id, renameText.value.trim())
  }
  renamingConv.value = null
}

const cancelRename = () => {
  renamingConv.value = null
}

// ─── 删除 ────────────────────────────────
const deletingConv = ref<Conversation | null>(null)

const confirmDelete = (conv: Conversation) => {
  deletingConv.value = conv
}

const executeDelete = () => {
  if (deletingConv.value) {
    deleteConversation(deletingConv.value.id)
    // 如果删除的是当前活跃会话，切换到第一个
    if (deletingConv.value.id === activeId.value) {
      const first = conversations.value[0]
      if (first) {
        messages.value = first.messages || []
      } else {
        messages.value = []
      }
    }
  }
  deletingConv.value = null
}

// ─── 时间格式化 ──────────────────────────
const formatTime = (ts: number): string => {
  const diff = Date.now() - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`
  if (diff < 172_800_000) return '昨天'
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ─── 输入框 ──────────────────────────────
const autoResize = () => {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

const resetTextarea = () => {
  if (!inputRef.value) return
  inputRef.value.style.height = 'auto'
}

const scrollToBottom = async () => {
  await nextTick()
  const el = chatMainRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
}

const handleGoBack = () => router.back()
</script>

<style scoped lang="scss">
// ─── 整体布局 ─────────────────────────────
.chat-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: var(--cyber-bg);
  overflow: hidden;
  font-family: var(--font-body);
  position: relative;
}

// ═══════════════════════════════════════════
// 侧边栏
// ═══════════════════════════════════════════
.sidebar {
  width: 280px;
  min-width: 280px;
  height: 100%;
  background: rgba(8, 8, 18, 0.95);
  border-right: 1px solid var(--cyber-border);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;
  z-index: 30;
  overflow: hidden;

  &.collapsed {
    width: 0;
    min-width: 0;
    border-right: none;
    opacity: 0;
    pointer-events: none;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  flex-shrink: 0;
}

.cyber-icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--cyber-border);
  color: var(--cyber-text-dim);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    border-color: var(--cyber-cyan);
    color: var(--cyber-cyan);
    box-shadow: 0 0 8px rgba(0, 240, 255, 0.2);
  }
}

.new-chat-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(0, 240, 255, 0.08);
  border: 1px solid rgba(0, 240, 255, 0.25);
  color: var(--cyber-cyan);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 240, 255, 0.15);
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.25);
  }
}

.new-chat-icon {
  font-size: 1.1rem;
  font-weight: bold;
}

.sidebar-divider {
  height: 1px;
  background: var(--cyber-border);
  margin: 0 12px;
  flex-shrink: 0;
}

// ─── 对话列表 ─────────────────────────────
.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb {
    background: var(--cyber-border-glow);
    border-radius: 1.5px;
  }
}

.section-label {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--cyber-text-dim);
  letter-spacing: 0.2em;
  padding: 6px 8px 4px;
  text-transform: uppercase;
}

.conv-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  position: relative;
  min-height: 44px;

  &:hover {
    background: rgba(0, 240, 255, 0.04);
    border-color: rgba(0, 240, 255, 0.1);

    .conv-actions { opacity: 1; pointer-events: auto; }
  }

  &.active {
    background: rgba(0, 240, 255, 0.06);
    border-color: rgba(0, 240, 255, 0.3);

    .conv-title {
      color: var(--cyber-cyan);
      text-shadow: 0 0 6px rgba(0, 240, 255, 0.3);
    }
  }
}

.conv-main {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.conv-pin {
  font-size: 0.65rem;
  flex-shrink: 0;
  opacity: 0.6;
}

.conv-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.conv-title {
  font-size: 0.82rem;
  color: var(--cyber-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
  transition: color 0.2s ease;
}

.conv-time {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--cyber-text-dim);
}

// 悬停操作按钮
.conv-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.conv-action-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--cyber-text-dim);
  cursor: pointer;
  font-size: 0.7rem;
  border-radius: 3px;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 240, 255, 0.12);
    color: var(--cyber-cyan);
  }

  &.danger:hover {
    background: rgba(255, 0, 68, 0.15);
    color: var(--cyber-red);
  }
}

// 空状态
.sidebar-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--cyber-text-dim);
  font-size: 0.85rem;

  &-hint {
    font-size: 0.7rem;
    margin-top: 6px;
    opacity: 0.6;
  }
}

.sidebar-footer {
  padding: 10px 16px;
  border-top: 1px solid var(--cyber-border);
  flex-shrink: 0;
}

.footer-text {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--cyber-text-dim);
  letter-spacing: 0.1em;
}

// ─── 侧边栏展开按钮 ───────────────────────
.sidebar-toggle {
  position: fixed;
  top: 16px;
  left: 16px;
  width: 34px;
  height: 34px;
  background: rgba(10, 10, 22, 0.9);
  border: 1px solid var(--cyber-cyan);
  color: var(--cyber-cyan);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  z-index: 35;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);

  &:hover {
    box-shadow: 0 0 12px rgba(0, 240, 255, 0.4);
  }
}

// ═══════════════════════════════════════════
// 弹窗
// ═══════════════════════════════════════════
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}

.modal-box {
  background: var(--cyber-bg-card);
  border: 1px solid var(--cyber-border);
  padding: 24px 28px;
  border-radius: 6px;
  min-width: 320px;
  max-width: 420px;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
}

.modal-title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  color: var(--cyber-cyan);
  margin-bottom: 16px;
  text-shadow: var(--glow-cyan);
}

.modal-desc {
  font-size: 0.85rem;
  color: var(--cyber-text-dim);
  margin-bottom: 16px;
}

.modal-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--cyber-border);
  border-radius: 4px;
  color: var(--cyber-text-bright);
  font-family: var(--font-body);
  font-size: 0.9rem;
  outline: none;
  margin-bottom: 16px;
  transition: border-color 0.2s;

  &:focus {
    border-color: var(--cyber-cyan);
    box-shadow: 0 0 8px rgba(0, 240, 255, 0.15);
  }
}

.modal-btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-btn {
  padding: 7px 20px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--cyber-border);
  background: transparent;
  color: var(--cyber-text);

  &.cancel:hover {
    border-color: var(--cyber-text-dim);
    color: var(--cyber-text-bright);
  }

  &.confirm {
    border-color: var(--cyber-cyan);
    color: var(--cyber-cyan);
    &:hover {
      background: rgba(0, 240, 255, 0.1);
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.2);
    }
  }

  &.danger {
    border-color: var(--cyber-red);
    color: var(--cyber-red);
    &:hover {
      background: rgba(255, 0, 68, 0.1);
      box-shadow: 0 0 10px rgba(255, 0, 68, 0.2);
    }
  }
}

// ═══════════════════════════════════════════
// 主聊天区（复用原有样式，微调）
// ═══════════════════════════════════════════
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: var(--cyber-bg);
}

.grid-bg {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 40%, black 40%, transparent 80%);
  pointer-events: none;
}

.scanline {
  position: absolute; top: 0; left: 0; width: 100%; height: 3px;
  background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.06) 20%, rgba(0, 240, 255, 0.12) 50%, rgba(0, 240, 255, 0.06) 80%, transparent);
  animation: scanline-drop 3s linear infinite;
  pointer-events: none; z-index: 10;
}
@keyframes scanline-drop {
  from { transform: translateY(-10px); }
  to { transform: translateY(100vh); }
}

.corner {
  position: absolute; width: 30px; height: 30px;
  pointer-events: none; opacity: 0.5; z-index: 5;
}
.corner-tl { top: 16px; left: 16px; border-top: 1.5px solid var(--cyber-cyan); border-left: 1.5px solid var(--cyber-cyan); }
.corner-tr { top: 16px; right: 16px; border-top: 1.5px solid var(--cyber-magenta); border-right: 1.5px solid var(--cyber-magenta); }

.top-bar {
  display: flex; align-items: center; padding: 14px 24px;
  border-bottom: 1px solid var(--cyber-border);
  background: rgba(10, 10, 22, 0.85); backdrop-filter: blur(12px);
  position: relative; z-index: 20; gap: 16px; flex-shrink: 0;
}

.back-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 16px; background: transparent;
  border: 1px solid var(--cyber-cyan); color: var(--cyber-cyan);
  font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.1em;
  cursor: pointer;
  clip-path: polygon(7px 0, 100% 0, calc(100% - 7px) 100%, 0 100%);
  transition: all 0.3s ease; white-space: nowrap;
  &:hover { box-shadow: 0 0 15px rgba(0, 240, 255, 0.4), 0 0 35px rgba(0, 240, 255, 0.15); text-shadow: var(--glow-cyan); }
  &:active { transform: scale(0.96); }
}

.welcome-wrap { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; }
.prompt-symbol { font-family: var(--font-mono); color: var(--cyber-green); font-size: 1rem; text-shadow: var(--glow-green); }
.welcome-title { font-family: var(--font-display); font-size: 1rem; color: var(--cyber-text-bright); letter-spacing: 0.1em; text-shadow: 0 0 8px rgba(0, 240, 255, 0.4); }

.status-indicator { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--cyber-text-dim); transition: all 0.3s ease;
  &.active { background: var(--cyber-green); box-shadow: 0 0 6px var(--cyber-green), 0 0 14px var(--cyber-green); }
}
.status-text { font-family: var(--font-mono); font-size: 0.7rem; color: var(--cyber-text-dim); letter-spacing: 0.2em; }

.chat-main {
  flex: 1; overflow-y: auto; position: relative; z-index: 1; padding: 20px 0;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--cyber-border-glow); border-radius: 2px; }
}

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; }
.empty-icon { color: var(--cyber-cyan); opacity: 0.3; animation: hex-rotate 20s linear infinite; }
@keyframes hex-rotate { to { transform: rotate(360deg); } }
.empty-title { font-family: var(--font-display); font-size: 1.5rem; color: var(--cyber-cyan); letter-spacing: 0.3em; text-shadow: var(--glow-cyan); animation: neon-flicker 4s linear infinite; }
.empty-desc { font-family: var(--font-mono); font-size: 0.85rem; color: var(--cyber-text-dim); }

.message-list { max-width: 800px; margin: 0 auto; padding: 8px 20px; display: flex; flex-direction: column; gap: 20px; }
.message-row { display: flex; align-items: flex-start; gap: 12px; &.user { flex-direction: row-reverse; } }

.msg-avatar {
  width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.05em;
}
.assistant-avatar { background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); color: var(--cyber-cyan); }
.user-avatar { background: rgba(255, 0, 170, 0.1); border: 1px solid rgba(255, 0, 170, 0.3); color: var(--cyber-magenta); }

.msg-bubble {
  max-width: 78%; padding: 14px 18px; border-radius: 4px; position: relative;
  &.user { background: rgba(255, 0, 170, 0.08); border: 1px solid rgba(255, 0, 170, 0.25); color: var(--cyber-text-bright); clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%); }
  &.assistant { background: rgba(0, 240, 255, 0.05); border: 1px solid rgba(0, 240, 255, 0.2); color: var(--cyber-text); clip-path: polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px); }
}

.msg-text { white-space: pre-wrap; word-break: break-word; line-height: 1.7; font-size: 0.95rem; }

.msg-content {
  line-height: 1.75; font-size: 0.95rem;
  :deep(p) { margin: 0 0 0.6em; &:last-child { margin-bottom: 0; } }
  :deep(strong) { color: var(--cyber-yellow); font-weight: 600; }
  :deep(em) { color: var(--cyber-cyan); }
  :deep(a) { color: var(--cyber-cyan); text-decoration: underline; text-underline-offset: 2px; &:hover { text-shadow: var(--glow-cyan); } }
  :deep(ul), :deep(ol) { padding-left: 1.5em; margin: 0.5em 0; }
  :deep(li) { margin: 0.25em 0; }
  :deep(h1), :deep(h2), :deep(h3) { font-family: var(--font-display); color: var(--cyber-cyan); margin: 1em 0 0.5em; font-size: 1.1em; }
  :deep(blockquote) { border-left: 3px solid var(--cyber-magenta); padding: 6px 14px; margin: 0.6em 0; background: rgba(255, 0, 170, 0.05); color: var(--cyber-text-dim); }
  :deep(code) { font-family: var(--font-mono); font-size: 0.85em; background: rgba(0, 0, 0, 0.4); padding: 2px 6px; border-radius: 3px; color: var(--cyber-green); }
  :deep(pre) {
    background: rgba(0, 0, 0, 0.6); border: 1px solid var(--cyber-border); border-radius: 4px;
    padding: 14px 16px; margin: 0.8em 0; overflow-x: auto; position: relative;
    code { background: none; padding: 0; color: var(--cyber-text); font-size: 0.82em; line-height: 1.6; }
    &::before { content: 'CODE'; position: absolute; top: 4px; right: 10px; font-family: var(--font-mono); font-size: 0.6rem; color: var(--cyber-text-dim); letter-spacing: 0.15em; }
  }
  :deep(table) { border-collapse: collapse; margin: 0.8em 0; width: 100%;
    th, td { border: 1px solid var(--cyber-border); padding: 8px 12px; text-align: left; font-size: 0.9em; }
    th { background: rgba(0, 240, 255, 0.08); color: var(--cyber-cyan); font-family: var(--font-mono); font-size: 0.8em; }
  }
  :deep(hr) { border: none; border-top: 1px solid var(--cyber-border); margin: 1em 0; }
}

// 流式
.stream-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(0, 240, 255, 0.12); }
.stream-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--cyber-cyan); box-shadow: 0 0 6px var(--cyber-cyan), 0 0 12px var(--cyber-cyan); animation: stream-dot-pulse 0.8s ease-in-out infinite; &:last-child { animation-delay: 0.4s; } }
@keyframes stream-dot-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.6); } }
.stream-label { font-family: var(--font-mono); font-size: 0.6rem; color: var(--cyber-cyan); letter-spacing: 0.25em; text-shadow: var(--glow-cyan); animation: neon-flicker 2s linear infinite; }

.msg-bubble.streaming {
  border-color: rgba(0, 240, 255, 0.45) !important;
  animation: stream-glow 1.5s ease-in-out infinite;
}
@keyframes stream-glow {
  0%, 100% { box-shadow: 0 0 15px rgba(0, 240, 255, 0.12), inset 0 0 15px rgba(0, 240, 255, 0.04); border-color: rgba(0, 240, 255, 0.45); }
  50% { box-shadow: 0 0 25px rgba(0, 240, 255, 0.25), 0 0 50px rgba(0, 240, 255, 0.08), inset 0 0 20px rgba(0, 240, 255, 0.06); border-color: rgba(0, 240, 255, 0.7); }
}

.stream-cursor {
  display: inline-block; width: 3px; height: 1.05em;
  background: linear-gradient(180deg, var(--cyber-cyan) 0%, #a0f0ff 50%, var(--cyber-cyan) 100%);
  border-radius: 1px; vertical-align: text-bottom; margin-left: 2px;
  box-shadow: 0 0 6px var(--cyber-cyan), 0 0 14px rgba(0, 240, 255, 0.7), 0 0 28px rgba(0, 240, 255, 0.4), -2px 0 4px rgba(0, 240, 255, 0.3);
  animation: cursor-blink 0.53s step-end infinite;
}
@keyframes cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.typing-dots {
  display: flex; flex-direction: row; align-items: center; gap: 8px; padding: 4px 0;
  &::before { content: 'AWAITING'; font-family: var(--font-mono); font-size: 0.6rem; color: var(--cyber-cyan); letter-spacing: 0.2em; text-shadow: var(--glow-cyan); animation: neon-flicker 3s linear infinite; margin-right: 4px; }
  span { width: 7px; height: 7px; border-radius: 2px; background: var(--cyber-cyan); box-shadow: 0 0 6px var(--cyber-cyan), 0 0 14px var(--cyber-cyan); animation: dot-pulse 1.2s ease-in-out infinite both;
    &:nth-child(1) { animation-delay: 0s; } &:nth-child(2) { animation-delay: 0.2s; } &:nth-child(3) { animation-delay: 0.4s; }
  }
}
@keyframes dot-pulse { 0%, 80%, 100% { transform: scale(0.8); opacity: 0.3; } 40% { transform: scale(1.3); opacity: 1; } }

.input-area { padding: 14px 20px 10px; border-top: 1px solid var(--cyber-border); background: rgba(10, 10, 22, 0.9); backdrop-filter: blur(12px); position: relative; z-index: 20; flex-shrink: 0; }
.input-wrapper { max-width: 800px; margin: 0 auto; display: flex; align-items: flex-end; gap: 10px; background: rgba(15, 15, 37, 0.8); border: 1px solid var(--cyber-border); border-radius: 6px; padding: 8px 12px; transition: border-color 0.3s ease;
  &:focus-within { border-color: var(--cyber-cyan); box-shadow: 0 0 12px rgba(0, 240, 255, 0.15); }
}
.chat-input { flex: 1; background: transparent; border: none; outline: none; color: var(--cyber-text-bright); font-family: var(--font-body); font-size: 0.95rem; line-height: 1.6; resize: none; max-height: 160px; padding: 0; min-height: 24px;
  &::placeholder { color: var(--cyber-text-dim); }
  &:disabled { opacity: 0.5; }
}
.send-btn { width: 36px; height: 36px; border-radius: 4px; background: rgba(0, 240, 255, 0.12); border: 1px solid rgba(0, 240, 255, 0.3); color: var(--cyber-cyan); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.3s ease;
  &:hover:not(:disabled) { background: rgba(0, 240, 255, 0.25); box-shadow: 0 0 15px rgba(0, 240, 255, 0.3); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
  &.sending { border-color: var(--cyber-magenta); color: var(--cyber-magenta); }
}
.send-icon { font-size: 0.7rem; &.pulse { animation: send-pulse 1s ease-in-out infinite; } }
@keyframes send-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.input-hint { text-align: center; font-family: var(--font-mono); font-size: 0.6rem; color: var(--cyber-text-dim); margin-top: 6px; letter-spacing: 0.1em; }

.bottom-bar { display: flex; justify-content: center; align-items: center; gap: 12px; padding: 8px 20px; border-top: 1px solid var(--cyber-border); background: rgba(10, 10, 22, 0.85); backdrop-filter: blur(12px); position: relative; z-index: 20; flex-shrink: 0; }
.bar-item { font-family: var(--font-mono); font-size: 0.6rem; color: var(--cyber-text-dim); letter-spacing: 0.15em; }
.bar-divider { color: var(--cyber-border-glow); font-size: 0.55rem; }
.glitch-text { color: var(--cyber-cyan); text-shadow: var(--glow-cyan); animation: neon-flicker 3s linear infinite; }

@media (max-width: 768px) {
  .sidebar { width: 260px; min-width: 260px; }
  .top-bar { padding: 10px 16px; gap: 10px; }
  .back-btn { padding: 5px 10px; font-size: 0.7rem; }
  .status-text { display: none; }
  .welcome-title { font-size: 0.85rem; }
  .corner { width: 20px; height: 20px; }
  .message-list { padding: 8px 12px; gap: 14px; }
  .msg-bubble { max-width: 88%; padding: 12px 14px; }
  .input-area { padding: 10px 12px 8px; }
}
</style>
