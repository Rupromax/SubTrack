<template>
  <div class="subscription-list">
    <!-- 搜索和篩選區域 -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <!-- 搜索框 -->
      <div class="mb-4">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索訂閱服務..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <!-- 篩選和排序控制 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- 分類篩選 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">分類</label>
          <select
            v-model="filters.category"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">全部分類</option>
            <option value="娛樂">娛樂</option>
            <option value="工具">工具</option>
            <option value="教育">教育</option>
            <option value="健康">健康</option>
            <option value="新聞">新聞</option>
            <option value="其他">其他</option>
          </select>
        </div>

        <!-- 狀態篩選 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">狀態</label>
          <select
            v-model="filters.status"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">全部狀態</option>
            <option value="active">活躍</option>
            <option value="paused">暫停</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        <!-- 排序選項 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">排序方式</label>
          <select
            v-model="sortBy"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="name">名稱</option>
            <option value="price">價格</option>
            <option value="nextBilling">扣款日期</option>
            <option value="createdAt">創建時間</option>
          </select>
        </div>

        <!-- 排序方向 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">排序方向</label>
          <select
            v-model="sortOrder"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="asc">升序</option>
            <option value="desc">降序</option>
          </select>
        </div>
      </div>

      <!-- 清除篩選按鈕 -->
      <div class="mt-4 flex justify-between items-center">
        <button
          @click="clearFilters"
          class="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          清除所有篩選
        </button>
        <div class="text-sm text-gray-600">
          共 {{ filteredSubscriptions.length }} 個結果
        </div>
      </div>
    </div>

    <!-- 列表視圖切換 -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-700">視圖:</span>
        <button
          @click="viewMode = 'grid'"
          :class="[
            'p-2 rounded-md',
            viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'
          ]"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button
          @click="viewMode = 'list'"
          :class="[
            'p-2 rounded-md',
            viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'
          ]"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- 每頁顯示數量 -->
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-700">每頁顯示:</span>
        <select
          v-model="itemsPerPage"
          class="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          <option :value="6">6</option>
          <option :value="12">12</option>
          <option :value="24">24</option>
          <option :value="48">48</option>
        </select>
      </div>
    </div>

    <!-- 訂閱列表 -->
    <div v-if="paginatedSubscriptions.length > 0">
      <!-- 網格視圖 -->
      <div
        v-if="viewMode === 'grid'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <SubscriptionCard
          v-for="subscription in paginatedSubscriptions"
          :key="subscription.id"
          :subscription="subscription"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @status-change="$emit('statusChange', $event)"
        />
      </div>

      <!-- 列表視圖 -->
      <div v-else class="bg-white shadow-sm rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                服務名稱
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                分類
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                價格
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                下次扣款
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="subscription in paginatedSubscriptions"
              :key="subscription.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span class="text-primary-600 font-medium text-sm">
                        {{ subscription.name.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ subscription.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ subscription.description }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ subscription.category }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatPrice(subscription.price) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(subscription.nextBilling) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClasses(subscription.status)">
                  {{ getStatusText(subscription.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button
                    @click="$emit('edit', subscription)"
                    class="text-primary-600 hover:text-primary-900"
                  >
                    編輯
                  </button>
                  <button
                    @click="$emit('delete', subscription.id)"
                    class="text-red-600 hover:text-red-900"
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 空狀態 -->
    <div v-else class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">沒有找到訂閱</h3>
      <p class="mt-1 text-sm text-gray-500">
        {{ searchQuery || filters.category || filters.status ? '嘗試調整搜索條件或篩選器' : '開始添加您的第一個訂閱服務' }}
      </p>
    </div>

    <!-- 分頁控制 -->
    <div v-if="totalPages > 1" class="mt-6 flex items-center justify-between">
      <div class="flex-1 flex justify-between sm:hidden">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一頁
        </button>
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一頁
        </button>
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            顯示第
            <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
            到
            <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredSubscriptions.length) }}</span>
            項，共
            <span class="font-medium">{{ filteredSubscriptions.length }}</span>
            項結果
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                page === currentPage
                  ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
              ]"
            >
              {{ page }}
            </button>
            
            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Subscription } from '@/stores'
import SubscriptionCard from './SubscriptionCard.vue'

interface Props {
  subscriptions: Subscription[]
  loading?: boolean
}

interface Emits {
  edit: [subscription: Subscription]
  delete: [id: number]
  statusChange: [id: number, status: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 搜索和篩選狀態
const searchQuery = ref('')
const filters = ref({
  category: '',
  status: ''
})

// 排序狀態
const sortBy = ref<'name' | 'price' | 'nextBilling' | 'createdAt'>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 視圖模式
const viewMode = ref<'grid' | 'list'>('grid')

// 分頁狀態
const currentPage = ref(1)
const itemsPerPage = ref(12)

// 篩選後的訂閱列表
const filteredSubscriptions = computed(() => {
  let result = [...props.subscriptions]

  // 搜索篩選
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(sub => 
      sub.name.toLowerCase().includes(query) ||
      (sub.description && sub.description.toLowerCase().includes(query))
    )
  }

  // 分類篩選
  if (filters.value.category) {
    result = result.filter(sub => sub.category === filters.value.category)
  }

  // 狀態篩選
  if (filters.value.status) {
    result = result.filter(sub => sub.status === filters.value.status)
  }

  // 排序
  result.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy.value) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'price':
        aValue = a.price
        bValue = b.price
        break
      case 'nextBilling':
        aValue = new Date(a.nextBilling)
        bValue = new Date(b.nextBilling)
        break
      case 'createdAt':
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
        break
      default:
        return 0
    }

    if (aValue < bValue) {
      return sortOrder.value === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortOrder.value === 'asc' ? 1 : -1
    }
    return 0
  })

  return result
})

// 分頁計算
const totalPages = computed(() => {
  return Math.ceil(filteredSubscriptions.value.length / itemsPerPage.value)
})

const paginatedSubscriptions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredSubscriptions.value.slice(start, end)
})

// 可見頁碼
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...', total)
    } else if (current >= total - 3) {
      pages.push(1, '...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1, '...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...', total)
    }
  }
  
  return pages.filter(page => page !== '...')
})

// 監聽篩選變化，重置頁碼
watch([searchQuery, filters, sortBy, sortOrder, itemsPerPage], () => {
  currentPage.value = 1
}, { deep: true })

// 清除篩選
function clearFilters() {
  searchQuery.value = ''
  filters.value = {
    category: '',
    status: ''
  }
  sortBy.value = 'name'
  sortOrder.value = 'asc'
  currentPage.value = 1
}

// 工具函數
function formatPrice(price: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(price)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

function getStatusClasses(status: string): string {
  const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full'
  switch (status) {
    case 'active':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'paused':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    case 'cancelled':
      return `${baseClasses} bg-red-100 text-red-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'active': return '活躍'
    case 'paused': return '暫停'
    case 'cancelled': return '已取消'
    default: return '未知'
  }
}
</script>

<style scoped>
.subscription-list {
  @apply w-full;
}

/* 響應式調整 */
@media (max-width: 768px) {
  .subscription-list {
    @apply px-4;
  }
}
</style>