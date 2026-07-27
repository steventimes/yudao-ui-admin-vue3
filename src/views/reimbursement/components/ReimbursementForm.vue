<template>
  <Dialog v-model="visible" :title="title" width="min(1180px, calc(100vw - 32px))">
    <el-form ref="formRef" :model="formData" label-width="100px"
      ><el-form-item label="报销事由" prop="reason"
        ><el-input
          v-model="formData.reason"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 6 }"
          maxlength="512"
          show-word-limit
      /></el-form-item>
      <el-table class="expense-table" :data="formData.items" border table-layout="auto">
        <el-table-column label="日期" width="170"
          ><template #default="{ row }"
            ><el-date-picker
              v-model="row.expenseDate"
              value-format="YYYY-MM-DD"
              class="cell-control" /></template
        ></el-table-column>
        <el-table-column label="类型" width="140"
          ><template #default="{ row }"
            ><el-select v-model="row.expenseType" class="cell-control"
              ><el-option
                v-for="item in expenseTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value" /></el-select></template
        ></el-table-column>
        <el-table-column label="商户" width="180"
          ><template #default="{ row }"
            ><el-input v-model="row.merchantName" class="cell-control" /></template
        ></el-table-column>
        <el-table-column label="金额" width="170"
          ><template #default="{ row }"
            ><el-input-number
              v-model="row.amount"
              :min="0.01"
              :precision="2"
              controls-position="right"
              class="cell-number" /></template
        ></el-table-column>
        <el-table-column label="税额" width="170"
          ><template #default="{ row }"
            ><el-input-number
              v-model="row.taxAmount"
              :min="0"
              :precision="2"
              controls-position="right"
              class="cell-number" /></template
        ></el-table-column>
        <el-table-column label="发票号" width="180"
          ><template #default="{ row }"
            ><el-input v-model="row.invoiceNumber" class="cell-control" /></template
        ></el-table-column>
        <el-table-column label="备注" width="200"
          ><template #default="{ row }"
            ><el-input v-model="row.remark" class="cell-control" /></template
        ></el-table-column>
        <el-table-column label="操作" width="80"
          ><template #default="{ $index }"
            ><el-button link type="danger" @click="removeItem($index)">删除</el-button></template
          ></el-table-column
        > </el-table
      ><el-button class="mt-3" @click="addItem">添加明细</el-button> </el-form
    ><template #footer
      ><el-button @click="visible = false">取消</el-button
      ><el-button type="primary" :loading="saving" :disabled="saving" @click="submitForm"
        >保存</el-button
      ></template
    >
  </Dialog>
</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { createClaim, updateClaim } from '@/api/reimbursement'
const emit = defineEmits(['success']),
  visible = ref(false),
  saving = ref(false),
  title = ref('新建报销'),
  mode = ref<'create' | 'update'>('create')
const expenseTypes = [
    { label: '交通', value: 'TRANSPORT' },
    { label: '餐饮', value: 'MEAL' },
    { label: '住宿', value: 'LODGING' },
    { label: '办公', value: 'OFFICE' },
    { label: '其他', value: 'OTHER' }
  ],
  formData = reactive<any>({ id: undefined, reason: '', currency: 'CNY', items: [] })
const addItem = () =>
  formData.items.push({ expenseDate: '', expenseType: 'OTHER', amount: 0.01, taxAmount: 0 })
const removeItem = (index: number) => formData.items.splice(index, 1)
const normalizeExpenseDate = (value: unknown) => {
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }
  return value || ''
}

const open = (type: 'create' | 'update', row?: any) => {
  mode.value = type
  title.value = type === 'create' ? '新建报销' : '编辑报销'
  Object.assign(formData, {
    id: row?.id,
    reason: row?.reason || '',
    currency: 'CNY',
    items: row?.items?.length
      ? JSON.parse(JSON.stringify(row.items)).map((item: any) => ({
          ...item,
          expenseDate: normalizeExpenseDate(item.expenseDate)
        }))
      : []
  })
  if (!formData.items.length) addItem()
  visible.value = true
}
const submitForm = async () => {
  if (!formData.reason?.trim()) {
    ElMessage.warning('请填写报销事由')
    return
  }
  const invalidItem = formData.items.find(
    (item: any) =>
      !item.expenseDate || !item.expenseType || !item.merchantName?.trim() || item.amount == null
  )
  if (invalidItem) {
    ElMessage.warning('请补完整报销明细：日期、类型、商户和金额不能为空')
    return
  }
  if (saving.value) return
  saving.value = true
  try {
    if (mode.value === 'create') await createClaim(formData)
    if (mode.value === 'update') await updateClaim(formData)
    visible.value = false
    emit('success')
  } catch {
    // 请求拦截器已经向用户展示了失败原因，保持表单内容便于修正。
  } finally {
    saving.value = false
  }
}
defineExpose({ open })
</script>
<style scoped>
.expense-table {
  width: 100%;
}

.expense-table :deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

.cell-control,
.cell-number {
  width: 100%;
}

.expense-table :deep(.el-input-number .el-input__wrapper) {
  padding-right: 42px;
  padding-left: 10px;
}

.expense-table :deep(.el-input-number__decrease),
.expense-table :deep(.el-input-number__increase) {
  width: 34px;
}
</style>
