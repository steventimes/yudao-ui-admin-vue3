<template>
  <Dialog v-model="visible" :title="title" width="900px">
    <el-form ref="formRef" :model="formData" label-width="100px">
      <el-form-item label="报销事由" prop="reason">
        <el-input v-model="formData.reason" maxlength="512" />
      </el-form-item>
      <el-table :data="formData.items" border>
        <el-table-column label="日期" min-width="150">
          <template #default="{ row }"
            ><el-date-picker v-model="row.expenseDate" value-format="YYYY-MM-DD"
          /></template>
        </el-table-column>
        <el-table-column label="类型" min-width="130">
          <template #default="{ row }"
            ><el-select v-model="row.expenseType"
              ><el-option
                v-for="item in expenseTypes"
                :key="item"
                :label="item"
                :value="item" /></el-select
          ></template>
        </el-table-column>
        <el-table-column label="商户" min-width="160"
          ><template #default="{ row }"><el-input v-model="row.merchantName" /></template
        ></el-table-column>
        <el-table-column label="金额" min-width="120"
          ><template #default="{ row }"
            ><el-input-number v-model="row.amount" :min="0.01" :precision="2" /></template
        ></el-table-column>
        <el-table-column label="税额" min-width="120"
          ><template #default="{ row }"
            ><el-input-number v-model="row.taxAmount" :min="0" :precision="2" /></template
        ></el-table-column>
        <el-table-column label="发票号" min-width="160"
          ><template #default="{ row }"><el-input v-model="row.invoiceNumber" /></template
        ></el-table-column>
        <el-table-column label="备注" min-width="180"
          ><template #default="{ row }"><el-input v-model="row.remark" /></template
        ></el-table-column>
        <el-table-column label="操作" width="80"
          ><template #default="{ $index }"
            ><el-button link type="danger" @click="removeItem($index)">删除</el-button></template
          ></el-table-column
        >
      </el-table>
      <el-button class="mt-3" @click="addItem">添加明细</el-button>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submitForm">保存</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { createClaim, updateClaim, confirmClaim } from '@/api/reimbursement'

const emit = defineEmits(['success'])
const visible = ref(false)
const title = ref('新建报销')
const mode = ref<'create' | 'update' | 'confirm'>('create')
const expenseTypes = ['TRANSPORT', 'MEAL', 'LODGING', 'OFFICE', 'OTHER']
const formData = reactive<any>({ id: undefined, reason: '', currency: 'CNY', items: [] })

const addItem = () =>
  formData.items.push({ expenseDate: '', expenseType: 'OTHER', amount: 0.01, taxAmount: 0 })
const removeItem = (index: number) => formData.items.splice(index, 1)
const open = (type: 'create' | 'update' | 'confirm', row?: any) => {
  mode.value = type
  title.value = type === 'create' ? '新建报销' : type === 'confirm' ? 'AI 确认' : '编辑报销'
  Object.assign(formData, {
    id: row?.id,
    reason: row?.reason || '',
    currency: 'CNY',
    items: row?.items?.length ? JSON.parse(JSON.stringify(row.items)) : []
  })
  if (!formData.items.length) addItem()
  visible.value = true
}
const submitForm = async () => {
  if (mode.value === 'create') await createClaim(formData)
  if (mode.value === 'update') await updateClaim(formData)
  if (mode.value === 'confirm') await confirmClaim(formData)
  visible.value = false
  emit('success')
}
defineExpose({ open })
</script>
