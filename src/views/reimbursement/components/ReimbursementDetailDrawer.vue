<template>
  <el-drawer v-model="visible" title="报销详情" size="60%">
    <el-descriptions :column="2" border v-if="record">
      <el-descriptions-item label="单号">{{ record.reimbursementNo }}</el-descriptions-item>
      <el-descriptions-item label="状态">{{ record.status }}</el-descriptions-item>
      <el-descriptions-item label="来源">{{ record.source }}</el-descriptions-item>
      <el-descriptions-item label="总金额">{{ record.totalAmount }}</el-descriptions-item>
      <el-descriptions-item label="事由" :span="2">{{ record.reason }}</el-descriptions-item>
    </el-descriptions>
    <el-table :data="record?.items || []" class="mt-4" border>
      <el-table-column prop="expenseDate" label="日期" />
      <el-table-column prop="expenseType" label="类型" />
      <el-table-column prop="merchantName" label="商户" />
      <el-table-column prop="amount" label="金额" />
      <el-table-column prop="invoiceNumber" label="发票号" />
    </el-table>
    <el-table :data="record?.attachments || []" class="mt-4" border>
      <el-table-column prop="fileName" label="附件" />
      <el-table-column prop="mimeType" label="类型" />
      <el-table-column prop="sha256" label="SHA-256" min-width="220" />
      <el-table-column label="预览"
        ><template #default="{ row }"
          ><el-link :href="row.fileUrl" target="_blank">打开</el-link></template
        ></el-table-column
      >
    </el-table>
  </el-drawer>
</template>
<script setup lang="ts">
const visible = ref(false)
const record = ref<any>()
const open = (row: any) => {
  record.value = row
  visible.value = true
}
defineExpose({ open })
</script>
