import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import api from '@/api'

// 增強的訂閱接口定義
export interface Subscription {
  id: number
  name: string
  description?: string
  price: number
  currency: string
  billingCycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly'
  nextBilling: string
  status: 'active' | 'paused' | 'cancelled' | 'expired'
  category: string
  website?: string
  logo?: string
  tags?: string[]
  reminderDays?: number
  autoRenew?: boolean
  trialEndDate?: string
  notes?: string
  paymentMethod?: string
  createdAt: string
  updatedAt: string
}

// 錯誤類型定義
export interface StoreError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// 篩選選項
export interface FilterOptions {
  status?: string[]
  categories?: string[]
  priceRange?: { min: number; max: number }
  billingCycles?: string[]
  dateRange?: { start: string; end: string }
}

// 排序選項
export type SortField = 'name' | 'price' | 'nextBilling' | 'createdAt' | 'category'
export type SortOrder = 'asc' | 'desc'

// 統計數據
export interface SubscriptionStats {
  totalActive: number
  totalMonthly: number
  totalYearly: number
  averageMonthlySpend: number
  mostExpensive: Subscription | null
  upcomingRenewals: Subscription[]
  categoryBreakdown: Record<string, { count: number; total: number }>
}

// 用戶狀態
export const useUserStore = defineStore('user', () => {
  const user = ref<any>(null)
  const isLoggedIn = computed(() => !!user.value)
  
  function setUser(userData: any) {
    user.value = userData
  }
  
  function logout() {
    user.value = null
  }
  
  return { user, isLoggedIn, setUser, logout }
})

// 增強的訂閱狀態管理
export const useSubscriptionStore = defineStore('subscription', () => {
  // 基本狀態
  const subscriptions = ref<Subscription[]>([])
  const loading = ref(false)
  const error = ref<StoreError | null>(null)
  const lastSync = ref<string | null>(null)
  
  // 篩選和搜索狀態
  const searchQuery = ref('')
  const filters = ref<FilterOptions>({})
  const sortBy = ref<SortField>('name')
  const sortOrder = ref<SortOrder>('asc')
  
  // 批量操作狀態
  const selectedIds = ref<Set<number>>(new Set())
  const bulkOperationLoading = ref(false)
  
  // 本地存儲鍵
  const STORAGE_KEY = 'subscriptions_data'
  const LAST_SYNC_KEY = 'subscriptions_last_sync'
  
  // 計算屬性
  const filteredSubscriptions = computed(() => {
    let filtered = subscriptions.value
    
    // 搜索過濾
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(sub => 
        sub.name.toLowerCase().includes(query) ||
        sub.description?.toLowerCase().includes(query) ||
        sub.category.toLowerCase().includes(query) ||
        sub.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // 狀態篩選
    if (filters.value.status?.length) {
      filtered = filtered.filter(sub => filters.value.status!.includes(sub.status))
    }
    
    // 分類篩選
    if (filters.value.categories?.length) {
      filtered = filtered.filter(sub => filters.value.categories!.includes(sub.category))
    }
    
    // 價格範圍篩選
    if (filters.value.priceRange) {
      const { min, max } = filters.value.priceRange
      filtered = filtered.filter(sub => sub.price >= min && sub.price <= max)
    }
    
    // 計費週期篩選
    if (filters.value.billingCycles?.length) {
      filtered = filtered.filter(sub => filters.value.billingCycles!.includes(sub.billingCycle))
    }
    
    // 排序
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy.value]
      let bValue: any = b[sortBy.value]
      
      if (sortBy.value === 'nextBilling' || sortBy.value === 'createdAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      return sortOrder.value === 'asc' ? comparison : -comparison
    })
    
    return filtered
  })
  
  const activeSubscriptions = computed(() => 
    subscriptions.value.filter(sub => sub.status === 'active')
  )
  
  const statistics = computed((): SubscriptionStats => {
    const active = activeSubscriptions.value
    
    const monthlySpend = active
      .filter(sub => sub.billingCycle === 'monthly')
      .reduce((total, sub) => total + sub.price, 0)
    
    const yearlySpend = active
      .filter(sub => sub.billingCycle === 'yearly')
      .reduce((total, sub) => total + sub.price, 0)
    
    const quarterlySpend = active
      .filter(sub => sub.billingCycle === 'quarterly')
      .reduce((total, sub) => total + (sub.price * 4), 0)
    
    const weeklySpend = active
      .filter(sub => sub.billingCycle === 'weekly')
      .reduce((total, sub) => total + (sub.price * 4.33), 0)
    
    const totalMonthlyEquivalent = monthlySpend + (yearlySpend / 12) + (quarterlySpend / 3) + weeklySpend
    
    // 即將到期的訂閱（7天內）
    const upcoming = active
      .filter(sub => {
        const nextBilling = new Date(sub.nextBilling)
        const today = new Date()
        const diffTime = nextBilling.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 7 && diffDays >= 0
      })
      .sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime())
    
    // 分類統計
    const categoryBreakdown = active.reduce((acc, sub) => {
      if (!acc[sub.category]) {
        acc[sub.category] = { count: 0, total: 0 }
      }
      acc[sub.category].count++
      
      // 轉換為月度等價金額
      let monthlyEquivalent = sub.price
      if (sub.billingCycle === 'yearly') monthlyEquivalent = sub.price / 12
      else if (sub.billingCycle === 'quarterly') monthlyEquivalent = sub.price / 3
      else if (sub.billingCycle === 'weekly') monthlyEquivalent = sub.price * 4.33
      
      acc[sub.category].total += monthlyEquivalent
      return acc
    }, {} as Record<string, { count: number; total: number }>)
    
    return {
      totalActive: active.length,
      totalMonthly: monthlySpend,
      totalYearly: yearlySpend,
      averageMonthlySpend: totalMonthlyEquivalent,
      mostExpensive: active.reduce((max, sub) => 
        !max || sub.price > max.price ? sub : max, null as Subscription | null
      ),
      upcomingRenewals: upcoming,
      categoryBreakdown
    }
  })
  
  const categories = computed(() => {
    const cats = [...new Set(subscriptions.value.map(sub => sub.category))]
    return cats.sort()
  })
  
  const selectedSubscriptions = computed(() => 
    subscriptions.value.filter(sub => selectedIds.value.has(sub.id))
  )
  
  // 數據持久化
  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions.value))
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString())
    } catch (error) {
      console.warn('無法保存到本地存儲:', error)
    }
  }
  
  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const lastSyncStored = localStorage.getItem(LAST_SYNC_KEY)
      
      if (stored) {
        subscriptions.value = JSON.parse(stored)
      }
      if (lastSyncStored) {
        lastSync.value = lastSyncStored
      }
    } catch (error) {
      console.warn('無法從本地存儲加載:', error)
    }
  }
  
  // 錯誤處理
  function setError(code: string, message: string, details?: any) {
    error.value = {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  }
  
  function clearError() {
    error.value = null
  }
  
  // 數據驗證
  function validateSubscription(subscription: Partial<Subscription>): string[] {
    const errors: string[] = []
    
    if (!subscription.name?.trim()) {
      errors.push('訂閱名稱不能為空')
    }
    
    if (!subscription.price || subscription.price <= 0) {
      errors.push('價格必須大於 0')
    }
    
    if (!subscription.nextBilling) {
      errors.push('下次扣款日期不能為空')
    } else {
      const nextBilling = new Date(subscription.nextBilling)
      if (isNaN(nextBilling.getTime())) {
        errors.push('下次扣款日期格式無效')
      }
    }
    
    if (!subscription.category?.trim()) {
      errors.push('分類不能為空')
    }
    
    return errors
  }
  
  // CRUD 操作
  async function fetchSubscriptions(forceRefresh = false) {
    if (loading.value) return
    
    loading.value = true
    clearError()
    
    try {
      // 如果不是強制刷新且有本地數據，先加載本地數據
      if (!forceRefresh && subscriptions.value.length === 0) {
        loadFromLocalStorage()
      }
      
      const result = await api.getSubscriptions()
      if (result.success && result.data) {
        subscriptions.value = result.data
        saveToLocalStorage()
        lastSync.value = new Date().toISOString()
      } else {
        setError('FETCH_ERROR', result.error || '獲取訂閱列表失敗')
      }
    } catch (err) {
      setError('NETWORK_ERROR', '網絡連接失敗', err)
      // 如果網絡失敗，嘗試加載本地數據
      if (subscriptions.value.length === 0) {
        loadFromLocalStorage()
      }
    } finally {
      loading.value = false
    }
  }
  
  async function addSubscription(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) {
    // 驗證數據
    const validationErrors = validateSubscription(subscription)
    if (validationErrors.length > 0) {
      setError('VALIDATION_ERROR', validationErrors.join(', '))
      throw new Error(validationErrors.join(', '))
    }
    
    loading.value = true
    clearError()
    
    try {
      const newSubscription: Subscription = {
        ...subscription,
        id: Date.now(),
        tags: subscription.tags || [],
        reminderDays: subscription.reminderDays || 3,
        autoRenew: subscription.autoRenew ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // 本地添加
      subscriptions.value.push(newSubscription)
      saveToLocalStorage()
      
      // API 調用
      try {
        const result = await api.createSubscription(newSubscription)
        if (!result.success) {
          // API 失敗，回滾本地更改
          subscriptions.value = subscriptions.value.filter(sub => sub.id !== newSubscription.id)
          saveToLocalStorage()
          setError('API_ERROR', result.error || '創建訂閱失敗')
          throw new Error(result.error || '創建訂閱失敗')
        }
      } catch (apiError) {
        // 網絡錯誤，保留本地更改但標記為未同步
        console.warn('API 調用失敗，數據已保存到本地:', apiError)
      }
      
      return newSubscription
    } catch (err) {
      if (!error.value) {
        setError('ADD_ERROR', err instanceof Error ? err.message : '添加訂閱失敗')
      }
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function updateSubscription(id: number, updates: Partial<Subscription>) {
    // 驗證數據
    const validationErrors = validateSubscription(updates)
    if (validationErrors.length > 0) {
      setError('VALIDATION_ERROR', validationErrors.join(', '))
      throw new Error(validationErrors.join(', '))
    }
    
    loading.value = true
    clearError()
    
    try {
      const index = subscriptions.value.findIndex(sub => sub.id === id)
      if (index === -1) {
        throw new Error('訂閱不存在')
      }
      
      const oldSubscription = { ...subscriptions.value[index] }
      const updatedSubscription = {
        ...oldSubscription,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      // 本地更新
      subscriptions.value[index] = updatedSubscription
      saveToLocalStorage()
      
      // API 調用
      try {
        const result = await api.updateSubscription(id.toString(), updatedSubscription)
        if (!result.success) {
          // API 失敗，回滾本地更改
          subscriptions.value[index] = oldSubscription
          saveToLocalStorage()
          setError('API_ERROR', result.error || '更新訂閱失敗')
          throw new Error(result.error || '更新訂閱失敗')
        }
      } catch (apiError) {
        console.warn('API 調用失敗，數據已保存到本地:', apiError)
      }
      
      return updatedSubscription
    } catch (err) {
      if (!error.value) {
        setError('UPDATE_ERROR', err instanceof Error ? err.message : '更新訂閱失敗')
      }
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function removeSubscription(id: number) {
    loading.value = true
    clearError()
    
    try {
      const index = subscriptions.value.findIndex(sub => sub.id === id)
      if (index === -1) {
        throw new Error('訂閱不存在')
      }
      
      const removedSubscription = subscriptions.value[index]
      
      // 本地刪除
      subscriptions.value.splice(index, 1)
      selectedIds.value.delete(id)
      saveToLocalStorage()
      
      // API 調用
      try {
        const result = await api.deleteSubscription(id.toString())
        if (!result.success) {
          // API 失敗，回滾本地更改
          subscriptions.value.splice(index, 0, removedSubscription)
          saveToLocalStorage()
          setError('API_ERROR', result.error || '刪除訂閱失敗')
          throw new Error(result.error || '刪除訂閱失敗')
        }
      } catch (apiError) {
        console.warn('API 調用失敗，數據已保存到本地:', apiError)
      }
      
      return true
    } catch (err) {
      if (!error.value) {
        setError('DELETE_ERROR', err instanceof Error ? err.message : '刪除訂閱失敗')
      }
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 批量操作
  async function bulkUpdateStatus(ids: number[], status: Subscription['status']) {
    bulkOperationLoading.value = true
    clearError()
    
    try {
      const updates = ids.map(id => updateSubscription(id, { status }))
      await Promise.all(updates)
      selectedIds.value.clear()
    } catch (err) {
      setError('BULK_UPDATE_ERROR', err instanceof Error ? err.message : '批量更新失敗')
      throw err
    } finally {
      bulkOperationLoading.value = false
    }
  }
  
  async function bulkDelete(ids: number[]) {
    bulkOperationLoading.value = true
    clearError()
    
    try {
      const deletions = ids.map(id => removeSubscription(id))
      await Promise.all(deletions)
      selectedIds.value.clear()
    } catch (err) {
      setError('BULK_DELETE_ERROR', err instanceof Error ? err.message : '批量刪除失敗')
      throw err
    } finally {
      bulkOperationLoading.value = false
    }
  }
  
  // 選擇操作
  function toggleSelection(id: number) {
    if (selectedIds.value.has(id)) {
      selectedIds.value.delete(id)
    } else {
      selectedIds.value.add(id)
    }
  }
  
  function selectAll() {
    filteredSubscriptions.value.forEach(sub => selectedIds.value.add(sub.id))
  }
  
  function clearSelection() {
    selectedIds.value.clear()
  }
  
  // 搜索和篩選
  function setSearchQuery(query: string) {
    searchQuery.value = query
  }
  
  function setFilters(newFilters: Partial<FilterOptions>) {
    filters.value = { ...filters.value, ...newFilters }
  }
  
  function clearFilters() {
    filters.value = {}
    searchQuery.value = ''
  }
  
  function setSorting(field: SortField, order: SortOrder) {
    sortBy.value = field
    sortOrder.value = order
  }
  
  // 工具方法
  function getSubscriptionById(id: number) {
    return subscriptions.value.find(sub => sub.id === id)
  }
  
  function exportData() {
    return {
      subscriptions: subscriptions.value,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
  }
  
  function importData(data: { subscriptions: Subscription[] }) {
    if (data.subscriptions && Array.isArray(data.subscriptions)) {
      subscriptions.value = data.subscriptions
      saveToLocalStorage()
      return true
    }
    return false
  }
  
  // 監聽數據變化，自動保存
  watch(
    () => subscriptions.value,
    () => {
      saveToLocalStorage()
    },
    { deep: true }
  )
  
  // 初始化時加載本地數據
  loadFromLocalStorage()
  
  return {
    // 狀態
    subscriptions,
    loading,
    error,
    lastSync,
    searchQuery,
    filters,
    sortBy,
    sortOrder,
    selectedIds,
    bulkOperationLoading,
    
    // 計算屬性
    filteredSubscriptions,
    activeSubscriptions,
    statistics,
    categories,
    selectedSubscriptions,
    
    // CRUD 方法
    fetchSubscriptions,
    addSubscription,
    updateSubscription,
    removeSubscription,
    deleteSubscription: removeSubscription, // 添加別名
    updateSubscriptionStatus: (id: number, status: string) => updateSubscription(id, { status: status as Subscription['status'] }), // 添加狀態更新方法
    getSubscriptionById,
    
    // 批量操作
    bulkUpdateStatus,
    bulkDelete,
    toggleSelection,
    selectAll,
    clearSelection,
    
    // 搜索和篩選
    setSearchQuery,
    setFilters,
    clearFilters,
    setSorting,
    
    // 工具方法
    clearError,
    exportData,
    importData,
    saveToLocalStorage,
    loadFromLocalStorage
  }
})