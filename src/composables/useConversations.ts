import { ref, watch } from 'vue'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  pinned: boolean
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'cyber-chat-conversations'
const ACTIVE_KEY = 'cyber-chat-active-id'

function loadFromStorage(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(list: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// 全局单例状态
const conversations = ref<Conversation[]>(loadFromStorage())
const activeId = ref<string>(localStorage.getItem(ACTIVE_KEY) || '')

// 持久化
watch(conversations, (val) => saveToStorage(val), { deep: true })
watch(activeId, (val) => localStorage.setItem(ACTIVE_KEY, val))

export function useConversations() {
  // 当前活跃会话
  const activeConversation = ref<Conversation | null>(null)

  // 同步活跃会话
  const syncActive = () => {
    const found = conversations.value.find((c) => c.id === activeId.value)
    activeConversation.value = found || null
  }
  syncActive()

  watch(activeId, syncActive)
  watch(conversations, syncActive, { deep: true })

  // 创建新会话
  const createConversation = (): Conversation => {
    const conv: Conversation = {
      id: genId(),
      title: '新对话',
      messages: [],
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    conversations.value.unshift(conv)
    activeId.value = conv.id
    return conv
  }

  // 删除会话
  const deleteConversation = (id: string) => {
    const idx = conversations.value.findIndex((c) => c.id === id)
    if (idx === -1) return
    conversations.value.splice(idx, 1)
    if (activeId.value === id) {
      activeId.value = conversations.value[0]?.id || ''
    }
  }

  // 重命名
  const renameConversation = (id: string, title: string) => {
    const conv = conversations.value.find((c) => c.id === id)
    if (conv) {
      conv.title = title
      conv.updatedAt = Date.now()
    }
  }

  // 置顶/取消置顶
  const togglePin = (id: string) => {
    const conv = conversations.value.find((c) => c.id === id)
    if (!conv) return
    conv.pinned = !conv.pinned
    conv.updatedAt = Date.now()
    // 重新排序：置顶在前，按更新时间降序
    sortList()
  }

  // 切换会话
  const switchConversation = (id: string) => {
    activeId.value = id
  }

  // 更新当前会话消息
  const updateMessages = (messages: Message[]) => {
    const conv = conversations.value.find((c) => c.id === activeId.value)
    if (!conv) return
    conv.messages = messages
    conv.updatedAt = Date.now()
    // 自动标题：取第一条用户消息的前30字
    if (conv.title === '新对话' && messages.length > 0) {
      const firstUser = messages.find((m) => m.role === 'user')
      if (firstUser) {
        conv.title = firstUser.content.slice(0, 30) + (firstUser.content.length > 30 ? '...' : '')
      }
    }
  }

  // 排序：置顶在前，按 updatedAt 降序
  const sortList = () => {
    conversations.value.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
  }

  // 初始化排序
  sortList()

  // 获取排序后的列表
  const sortedConversations = () => {
    const pinned = conversations.value.filter((c) => c.pinned)
    const unpinned = conversations.value.filter((c) => !c.pinned)
    return { pinned, unpinned }
  }

  return {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    togglePin,
    switchConversation,
    updateMessages,
    sortedConversations,
  }
}
