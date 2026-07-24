<template>
  <ContentWrap>
    <el-form :model="queryParams" class="reimbursement-filter-form" @submit.prevent="handleQuery">
      <el-form-item label="状态"
        ><el-select v-model="queryParams.status" clearable placeholder="全部状态"
          ><el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value" /></el-select
      ></el-form-item>
      <el-form-item label="来源"
        ><el-select v-model="queryParams.source" clearable placeholder="全部来源"
          ><el-option
            v-for="item in sourceOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value" /></el-select
      ></el-form-item>
      <el-form-item label="事由"
        ><el-input
          v-model="queryParams.reason"
          clearable
          placeholder="搜索报销事由"
          @keyup.enter="handleQuery"
      /></el-form-item>
      <el-form-item class="filter-actions"
        ><el-button type="primary" @click="handleQuery">查询</el-button
        ><el-button v-hasPermi="['reimbursement:claim:create']" @click="openCreate"
          >新建报销</el-button
        ><el-button v-hasPermi="['reimbursement:mailbox:manage']" @click="mailboxDialogRef?.open()"
          >邮箱设置</el-button
        ><el-button
          v-hasPermi="['reimbursement:mail-import:start']"
          @click="mailImportDialogRef?.open()"
          >从邮箱导入</el-button
        ></el-form-item
      >
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table :data="list" border>
      <el-table-column prop="reimbursementNo" label="单号" min-width="140" /><el-table-column
        prop="reason"
        label="事由"
        min-width="220"
      /><el-table-column prop="totalAmount" label="金额" width="120" />
      <el-table-column label="来源" width="150"
        ><template #default="{ row }">{{ sourceLabel(row.source) }}</template></el-table-column
      >
      <el-table-column label="状态" width="160"
        ><template #default="{ row }"
          ><el-tag :type="statusTagType(row.status)">{{
            statusLabel(row.status)
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column label="操作" width="260" fixed="right"
        ><template #default="{ row }"
          ><el-button link @click="openDetail(row)">详情</el-button
          ><el-button
            v-if="row.status === 0 || row.status === 20 || row.status === 30"
            v-hasPermi="['reimbursement:claim:update']"
            link
            @click="openEdit(row)"
            >编辑</el-button
          ><el-button
            v-if="row.status === 0 || row.status === 20"
            v-hasPermi="['reimbursement:claim:submit']"
            link
            type="primary"
            @click="submit(row)"
            >提交</el-button
          ><el-button v-if="row.status === 40" link @click="openProcess(row)">进度</el-button
          ><el-button
            v-if="row.status === 0 || row.status === 20 || row.status === 30"
            link
            v-hasPermi="['reimbursement:claim:delete']"
            type="danger"
            @click="remove(row)"
            >删除</el-button
          ></template
        ></el-table-column
      >
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="loadList"
    />
  </ContentWrap>
  <ReimbursementForm ref="formRef" @success="loadList" />
  <ReimbursementDetailDrawer ref="detailDrawerRef" />
  <MailboxDialog ref="mailboxDialogRef" />
  <MailImportDialog ref="mailImportDialogRef" @finished="loadList" />
</template>
<script setup lang="ts">
import { deleteClaim, getClaim, getClaimPage, submitClaim } from '@/api/reimbursement'
import ReimbursementForm from './components/ReimbursementForm.vue'
import ReimbursementDetailDrawer from './components/ReimbursementDetailDrawer.vue'
import MailboxDialog from './components/MailboxDialog.vue'
import MailImportDialog from './components/MailImportDialog.vue'
defineOptions({ name: 'ReimbursementClaim' })
const router = useRouter(),
  list = ref<any[]>([]),
  total = ref(0),
  formRef = ref(),
  detailDrawerRef = ref(),
  mailboxDialogRef = ref(),
  mailImportDialogRef = ref()
const queryParams = reactive<any>({
  pageNo: 1,
  pageSize: 10,
  status: undefined,
  source: undefined,
  reason: ''
})
const statusOptions = [
  { label: '草稿', value: 0 },
  { label: 'AI 处理中', value: 10 },
  { label: 'AI 待确认', value: 20 },
  { label: 'AI 失败', value: 30 },
  { label: '已提交', value: 40 },
  { label: '已完成（历史数据）', value: 5 }
]
const sourceOptions = [
  { label: '人工创建', value: 'MANUAL' },
  { label: 'AI 邮件', value: 'AI_EMAIL' },
  { label: 'AI 邮件（历史数据）', value: 'AI' }
]
const statusLabel = (value: number) =>
  statusOptions.find((item) => item.value === value)?.label || `状态 ${value}`
const sourceLabel = (value: string) =>
  sourceOptions.find((item) => item.value === value)?.label || value || '未知'
const statusTagType = (value: number) =>
  value === 30
    ? 'danger'
    : value === 40 || value === 5
      ? 'success'
      : value === 20
        ? 'warning'
        : 'info'
const loadList = async () => {
  const data = await getClaimPage(queryParams)
  list.value = data.list || []
  total.value = data.total || 0
}
const handleQuery = () => {
  queryParams.pageNo = 1
  loadList()
}
const openCreate = () => formRef.value?.open('create')
const openDetail = async (row: any) => detailDrawerRef.value?.open(await getClaim(row.id))
const openEdit = async (row: any) => formRef.value?.open('update', await getClaim(row.id))
const submit = async (row: any) => {
  await submitClaim({ id: row.id })
  await loadList()
}
const remove = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定删除报销单 ${row.reimbursementNo} 吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning' }
    )
  } catch (action) {
    if (action === 'cancel' || action === 'close') return
    throw action
  }
  await deleteClaim(row.id)
  ElMessage.success('删除成功')
  await loadList()
}
const openProcess = (row: any) =>
  router.push({ name: 'BpmProcessInstanceDetail', query: { id: row.processInstanceId } })
onMounted(loadList)
</script>
<style scoped>
.reimbursement-filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 12px;
}

.reimbursement-filter-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 12px;
}

.reimbursement-filter-form :deep(.el-select) {
  width: 168px;
}

.reimbursement-filter-form :deep(.el-input) {
  width: 220px;
}

.reimbursement-filter-form .filter-actions {
  margin-left: auto;
}

@media (width <= 1100px) {
  .reimbursement-filter-form .filter-actions {
    margin-left: 0;
  }
}
</style>
