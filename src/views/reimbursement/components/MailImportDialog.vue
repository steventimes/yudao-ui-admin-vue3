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
import { getMailboxPage } from '@/api/reimbursement/mailbox'
const emit = defineEmits(['finished'])
const importing = ref(false)
const visible = ref(false)
const mailboxes = ref<any[]>([])
let timer: number | undefined
let polling = false
const formData = reactive<any>({
  mailboxConnectionId: undefined,
  folder: 'INBOX',
  timeFilterMode: 'lookback',
  lookbackDays: 30,
  dateRange: [],
  unreadOnly: false,
  subjectKeywords: '发票,票据,报销,invoice,receipt',
  senderContains: '',
  maxMessages: 20
})
const open = async () => {
  mailboxes.value = (await getMailboxPage({ pageNo: 1, pageSize: 50, status: 1 })).list || []
  visible.value = true
}
const clearPoller = () => {
  if (timer) window.clearInterval(timer)
  timer = undefined
  polling = false
}
const startImport = async () => {
  if (!formData.mailboxConnectionId) {
    ElMessage.warning('请先选择已验证邮箱')
    return
  }
  if (formData.timeFilterMode === 'range' && formData.dateRange.length !== 2) {
    ElMessage.warning('请选择完整的日期范围')
    return
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
    let count = 0
    clearPoller()
    timer = window.setInterval(async () => {
      if (polling) return
      polling = true
      count += 1
      try {
        const claim = await getClaim(result.reimbursementId)
        if (claim.status !== 10 || count >= 60) {
          clearPoller()
          emit('finished', claim)
        }
      } catch {
        clearPoller()
      } finally {
        polling = false
      }
    }, 2000)
  } finally {
    importing.value = false
  }
}
onUnmounted(clearPoller)
defineExpose({ open })
</script>
