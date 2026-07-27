<template>
  <el-drawer v-model="visible" title="报销详情" size="60%"
    ><el-descriptions v-if="record" :column="2" border>
      <el-descriptions-item label="单号">{{ record.reimbursementNo }}</el-descriptions-item
      ><el-descriptions-item label="状态">{{ statusLabel(record.status) }}</el-descriptions-item
      ><el-descriptions-item label="来源">{{ sourceLabel(record.source) }}</el-descriptions-item
      ><el-descriptions-item label="总金额">{{ record.totalAmount }}</el-descriptions-item
      ><el-descriptions-item label="事由" :span="2">{{ record.reason }}</el-descriptions-item
      ><el-descriptions-item v-if="record.aiWorkflowRunId" label="Dify 运行编号" :span="2">{{
        record.aiWorkflowRunId
      }}</el-descriptions-item> </el-descriptions
    ><el-alert
      v-if="record?.status === 30 && record?.aiFailureMessage"
      class="mt-4"
      type="error"
      show-icon
      :closable="false"
      title="AI 处理失败"
      :description="failureMessageLabel(record.aiFailureMessage)"
    /><el-table :data="record?.items || []" class="mt-4" border table-layout="auto"
      ><el-table-column label="日期" min-width="110"
        ><template #default="{ row }">{{
          formatExpenseDate(row.expenseDate)
        }}</template></el-table-column
      ><el-table-column label="类型" min-width="90"
        ><template #default="{ row }">{{
          expenseTypeLabel(row.expenseType)
        }}</template></el-table-column
      ><el-table-column prop="merchantName" label="商户" min-width="150" /><el-table-column
        prop="amount"
        label="金额"
        min-width="90" /><el-table-column
        prop="taxAmount"
        label="税额"
        min-width="90" /><el-table-column
        prop="invoiceNumber"
        label="发票号"
        min-width="170" /></el-table
    ><el-table :data="record?.attachments || []" class="mt-4" border
      ><el-table-column prop="fileName" label="附件" /><el-table-column
        prop="mimeType"
        label="类型"
      /><el-table-column prop="sha256" label="SHA-256" min-width="220" /><el-table-column
        label="预览"
        ><template #default="{ row }"
          ><el-link @click="openAttachment(row)">打开</el-link></template
        ></el-table-column
      ></el-table
    ></el-drawer
  >
</template>
<script setup lang="ts">
import { getAttachmentAccessUrl } from '@/api/reimbursement'
import { ElMessage } from 'element-plus'
import { reimbursementFailureMessageLabel as failureMessageLabel } from '../failureMessage'
const visible = ref(false),
  record = ref<any>()
const statusLabel = (value: number) =>
  (
    ({
      0: '草稿',
      5: '已完成（历史数据）',
      10: 'AI 处理中',
      20: 'AI 待确认',
      30: 'AI 失败',
      40: '已提交'
    }) as Record<number, string>
  )[value] || `状态 ${value}`
const sourceLabel = (value: string) =>
  (
    ({ MANUAL: '人工创建', AI_EMAIL: 'AI 邮件', AI: 'AI 邮件（历史数据）' }) as Record<
      string,
      string
    >
  )[value] ||
  value ||
  '未知'
const expenseTypeLabel = (value: string) =>
  (
    ({ TRANSPORT: '交通', MEAL: '餐饮', LODGING: '住宿', OFFICE: '办公', OTHER: '其他' }) as Record<
      string,
      string
    >
  )[value] ||
  value ||
  '未知'
const formatExpenseDate = (value: unknown) => {
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return value ? String(value) : '-'
}
const openAttachment = async (row: any) => {
  let url: string
  try {
    url = await getAttachmentAccessUrl(record.value.id, row.id)
  } catch {
    // 请求拦截器已经展示失败原因。
    return
  }
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url, window.location.origin)
  } catch {
    ElMessage.error('附件地址无效')
    return
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    ElMessage.error('附件地址不安全')
    return
  }
  window.open(parsedUrl.toString(), '_blank', 'noopener,noreferrer')
}
const open = (row: any) => {
  record.value = row
  visible.value = true
}
defineExpose({ open })
</script>
