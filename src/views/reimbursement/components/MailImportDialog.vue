<template>
  <Dialog v-model="visible" title="从邮箱导入报销" width="700px">
    <el-form :model="formData" label-width="120px">
      <el-form-item label="已验证邮箱"
        ><el-select v-model="formData.mailboxConnectionId"
          ><el-option
            v-for="mailbox in mailboxes"
            :key="mailbox.id"
            :label="mailbox.emailNormalized"
            :value="mailbox.id" /></el-select
      ></el-form-item>
      <el-form-item label="邮件文件夹"><el-input v-model="formData.folder" /></el-form-item>
      <el-form-item label="时间筛选">
        <el-radio-group v-model="formData.timeFilterMode">
          <el-radio-button value="lookback">回看天数</el-radio-button>
          <el-radio-button value="range">指定日期</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.timeFilterMode === 'lookback'" label="回看天数">
        <el-input-number v-model="formData.lookbackDays" :min="1" :max="365" />
      </el-form-item>
      <el-form-item v-else label="日期范围">
        <el-date-picker
          v-model="formData.dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="至"
        />
      </el-form-item>
      <el-form-item label="仅未读邮件"><el-switch v-model="formData.unreadOnly" /></el-form-item>
      <el-form-item label="主题关键词"
        ><el-input v-model="formData.subjectKeywords"
      /></el-form-item>
      <el-form-item label="发件人包含"><el-input v-model="formData.senderContains" /></el-form-item>
      <el-form-item label="最大邮件数"
        ><el-input-number v-model="formData.maxMessages" :min="1" :max="50"
      /></el-form-item>
    </el-form>
    <template #footer
      ><el-button @click="visible = false">取消</el-button
      ><el-button type="primary" :loading="importing" @click="startImport"
        >启动导入</el-button
      ></template
    >
  </Dialog>
</template>
<script setup lang="ts">
import { getClaim, startMailImport } from '@/api/reimbursement'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getMailboxPage } from '@/api/reimbursement/mailbox'
import { reimbursementFailureMessageLabel } from '../failureMessage'
const emit = defineEmits(['started', 'finished'])
const MAX_DATE_RANGE_DAYS = 365
const importing = ref(false)
const visible = ref(false)
const mailboxes = ref<any[]>([])
interface ImportPollState {
  timer?: number
  polling: boolean
  consecutiveFailures: number
}
const pollers = new Map<number, ImportPollState>()
const formData = reactive<any>({
  mailboxConnectionId: undefined,
  folder: 'INBOX',
  timeFilterMode: 'lookback',
  lookbackDays: 30,
  dateRange: [],
  unreadOnly: false,
  subjectKeywords: '发票,票据,报销,invoice,receipt,reimbursement',
  senderContains: '',
  maxMessages: 20
})
const open = async () => {
  try {
    mailboxes.value = (await getMailboxPage({ pageNo: 1, pageSize: 50, status: 1 })).list || []
    visible.value = true
  } catch {
    // 请求拦截器已经展示失败原因。
  }
}
const clearPoller = (reimbursementId: number) => {
  const state = pollers.get(reimbursementId)
  if (state?.timer) window.clearInterval(state.timer)
  pollers.delete(reimbursementId)
}
const clearAllPollers = () => {
  for (const reimbursementId of pollers.keys()) clearPoller(reimbursementId)
}
const pollImportResult = async (reimbursementId: number) => {
  const state = pollers.get(reimbursementId)
  if (!state || state.polling) return
  state.polling = true
  try {
    const claim = await getClaim(reimbursementId)
    state.consecutiveFailures = 0
    if (claim.status === 10) return

    clearPoller(reimbursementId)
    if (claim.status === 20) {
      ElMessage.success('邮箱报销明细已生成，请确认后提交')
    } else if (claim.status === 40) {
      ElMessage.success('邮箱报销明细已生成并自动提交')
    } else if (claim.status === 30) {
      ElMessage.error(
        reimbursementFailureMessageLabel(claim.aiFailureMessage) || '邮箱导入失败，请稍后重试'
      )
    } else {
      ElMessage.warning('邮箱导入已结束，当前状态：' + claim.status)
    }
    emit('finished', claim)
  } catch {
    state.consecutiveFailures += 1
    if (state.consecutiveFailures >= 3) {
      clearPoller(reimbursementId)
      ElMessage.warning('暂时无法查询导入进度，请刷新列表查看最新状态')
    }
  } finally {
    state.polling = false
  }
}
const startPoller = (reimbursementId: number) => {
  clearPoller(reimbursementId)
  const state: ImportPollState = { polling: false, consecutiveFailures: 0 }
  pollers.set(reimbursementId, state)
  state.timer = window.setInterval(() => void pollImportResult(reimbursementId), 2000)
  void pollImportResult(reimbursementId)
}
const startImport = async () => {
  if (!formData.mailboxConnectionId) {
    ElMessage.warning('请先选择已验证邮箱')
    return
  }
  if (formData.timeFilterMode === 'range') {
    if (!Array.isArray(formData.dateRange) || formData.dateRange.length !== 2) {
      ElMessage.warning('请选择完整的日期范围')
      return
    }
    const inclusiveDays = dayjs(formData.dateRange[1]).diff(dayjs(formData.dateRange[0]), 'day') + 1
    if (inclusiveDays > MAX_DATE_RANGE_DAYS) {
      ElMessage.warning('日期范围最多包含 365 天')
      return
    }
  }
  importing.value = true
  try {
    const requestData = {
      mailboxConnectionId: formData.mailboxConnectionId,
      folder: formData.folder,
      lookbackDays: formData.timeFilterMode === 'lookback' ? formData.lookbackDays : null,
      fromDate: formData.timeFilterMode === 'range' ? formData.dateRange[0] : undefined,
      toDate: formData.timeFilterMode === 'range' ? formData.dateRange[1] : undefined,
      unreadOnly: formData.unreadOnly,
      subjectKeywords: formData.subjectKeywords,
      senderContains: formData.senderContains,
      maxMessages: formData.maxMessages
    }
    const result = await startMailImport(requestData)
    visible.value = false
    emit('started', result)
    startPoller(result.reimbursementId)
  } catch {
    // 请求拦截器已经向用户展示了失败原因，避免事件处理器产生未处理异常。
  } finally {
    importing.value = false
  }
}
onUnmounted(clearAllPollers)
defineExpose({ open })
</script>
