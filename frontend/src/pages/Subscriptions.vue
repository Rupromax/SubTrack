<template>
  <div class="px-4 sm:px-0">
    <!-- 頁面標題和操作 -->
    <div class="sm:flex sm:items-center sm:justify-between mb-6">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-semibold text-gray-900">訂閱管理</h1>
        <p class="mt-2 text-sm text-gray-700">管理您的所有訂閱服務</p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button
          @click="showAddForm = true"
          class="btn-primary"
        >
          新增訂閱
        </button>
      </div>
    </div>

    <!-- 統計卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">活躍訂閱</dt>
                <dd class="text-lg font-medium text-gray-900">{{ activeSubscriptions }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">月支出</dt>
                <dd class="text-lg font-medium text-gray-900">{{ formatPrice(monthlySpend) }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">即將到期</dt>
                <dd class="text-lg font-medium text-gray-900">{{ upcomingRenewals }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">總訂閱</dt>
                <dd class="text-lg font-medium text-gray-900">{{ subscriptionStore.subscriptions.length }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 訂閱列表組件 -->
    <SubscriptionList
      :subscriptions="subscriptionStore.subscriptions"
      :loading="subscriptionStore.loading"
      @edit="handleEdit"
      @delete="handleDelete"
      @status-change="handleStatusChange"
    />

    <!-- 新增/編輯表單模態框 -->
    <div
      v-if="showAddForm || showEditForm"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      @click="closeModal"
    >
      <div
        class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
        @click.stop
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            {{ showAddForm ? '新增訂閱' : '編輯訂閱' }}
          </h3>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <SubscriptionForm
          :subscription="editingSubscription"
          :loading="subscriptionStore.loading"
          @submit="handleSubmit"
          @cancel="closeModal"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSubscriptionStore } from '@/stores'
import type { Subscription } from '@/stores'
import SubscriptionList from '@/components/SubscriptionList.vue'
import SubscriptionForm from '@/components/SubscriptionForm.vue'

const subscriptionStore = useSubscriptionStore()

// 表單狀態
const showAddForm = ref(false)
const showEditForm = ref(false)
const editingSubscription = ref<Subscription | undefined>()

// 統計數據
const activeSubscriptions = computed(() => {
  return subscriptionStore.subscriptions.filter(sub => sub.status === 'active').length
})

const monthlySpend = computed(() => {
  return subscriptionStore.subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((total, sub) => {
      const monthlyPrice = sub.billingCycle === 'yearly' ? sub.price / 12 : sub.price
      return total + monthlyPrice
    }, 0)
})

const upcomingRenewals = computed(() => {
  const today = new Date()
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  return subscriptionStore.subscriptions.filter(sub => {
    const nextBilling = new Date(sub.nextBilling)
    return nextBilling >= today && nextBilling <= nextWeek && sub.status === 'active'
  }).length
})

// 事件處理
function handleEdit(subscription: Subscription) {
  editingSubscription.value = subscription
  showEditForm.value = true
}

function handleDelete(id: number) {
  if (confirm('確定要刪除這個訂閱嗎？')) {
    subscriptionStore.deleteSubscription(id)
  }
}

function handleStatusChange(id: number, status: string) {
  subscriptionStore.updateSubscriptionStatus(id, status)
}

async function handleSubmit(data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    if (showEditForm.value && editingSubscription.value) {
      await subscriptionStore.updateSubscription(editingSubscription.value.id, data)
    } else {
      await subscriptionStore.addSubscription(data)
    }
    closeModal()
  } catch (error) {
    console.error('提交失敗:', error)
  }
}

function closeModal() {
  showAddForm.value = false
  showEditForm.value = false
  editingSubscription.value = undefined
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(price)
}

// 初始化
onMounted(() => {
  subscriptionStore.fetchSubscriptions()
})
</script>