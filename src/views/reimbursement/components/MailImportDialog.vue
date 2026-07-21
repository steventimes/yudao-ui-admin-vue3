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
      <el-form-item label="folder"><el-input v-model="formData.folder" /></el-form-item>
      <el-form-item label="回看天数"
        ><el-input-number v-model="formData.lookbackDays" :min="1" :max="365"
      /></el-form-item>
      <el-form-item label="未读"><el-switch v-model="formData.unreadOnly" /></el-form-item>
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
      ><el-button type="primary" :loading="importing" @click="startImport">启动导入</el-button></template
    >
  </Dialog>
</template>
<script setup lang="ts">
import { getClaim, startMailImport } from '@/api/reimbursement'
import { getMailboxPage } from '@/api/reimbursement/mailbox'
const emit = defineEmits(['finished'])
const importing = ref(false)
const visible = ref(false)
const mailboxes = ref<any[]>([])
let timer: number | undefined
const formData = reactive<any>({
  mailboxConnectionId: undefined,
  folder: 'INBOX',
  lookbackDays: 30,
  unreadOnly: false,
  subjectKeywords: '发票,票据,报销,invoice,receipt',
  maxMessages: 20
})
const open = async () => {
  mailboxes.value = (await getMailboxPage({ pageNo: 1, pageSize: 50, status: 1 })).list || []
  visible.value = true
}
const clearPoller = () => {
  if (timer) window.clearInterval(timer)
  timer = undefined
}
const startImport = async () => {
  if (!formData.mailboxConnectionId) return
  importing.value = true
  try {
    const result = await startMailImport(formData)
    visible.value = false
    let count = 0
    clearPoller()
    timer = window.setInterval(async () => {
      count += 1
      try {
        const claim = await getClaim(result.reimbursementId)
        if (claim.status !== 10 || count >= 60) {
          clearPoller()
          emit('finished', claim)
        }
      } catch {
        clearPoller()
      }
    }, 2000)
  } finally {
    importing.value = false
  }
}
onUnmounted(clearPoller)
defineExpose({ open })
</script>
