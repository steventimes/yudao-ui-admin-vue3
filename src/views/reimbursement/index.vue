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
      <el-table-column label="状态" width="240"
        ><template #default="{ row }">
          <div class="status-cell">
            <el-tag :type="statusTagType(row)">{{ statusLabel(row) }}</el-tag>
            <span
              v-if="
                row.status === 30 &&
                row.aiFailureMessage &&
                !isNoReimbursableDataFailure(row.aiFailureMessage)
              "
              class="status-failure"
            >
              {{ reimbursementFailureMessageLabel(row.aiFailureMessage) }}
            </span>
          </div>
        </template></el-table-column
      >
      <el-table-column label="提交报销时间" min-width="170"
        ><template #default="{ row }">{{
          formatSubmitTime(row.submitTime)
        }}</template></el-table-column
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
  <MailImportDialog ref="mailImportDialogRef" @started="loadList" @finished="loadList" />
</template>
<script setup lang="ts">
import {
  deleteClaim,
  getClaim,
  getClaimPage,
  submitClaim,
  type ReimbursementClaimPageReqVO,
  type ReimbursementClaimResponseVO
} from '@/api/reimbursement'
import { formatNullableDate } from '@/utils/formatTime'
import ReimbursementForm from './components/ReimbursementForm.vue'
import ReimbursementDetailDrawer from './components/ReimbursementDetailDrawer.vue'
import MailboxDialog from './components/MailboxDialog.vue'
import MailImportDialog from './components/MailImportDialog.vue'
import { isNoReimbursableDataFailure, reimbursementFailureMessageLabel } from './failureMessage'
defineOptions({ name: 'ReimbursementClaim' })
const router = useRouter(),
  list = ref<ReimbursementClaimResponseVO[]>([]),
  total = ref(0),
  formRef = ref(),
  detailDrawerRef = ref(),
  mailboxDialogRef = ref(),
  mailImportDialogRef = ref()
let processingRefreshTimer: number | undefined
let listLoading = false
let listReloadPending = false
let componentActive = false
const queryParams = reactive<ReimbursementClaimPageReqVO>({
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
const statusLabel = (row: ReimbursementClaimResponseVO) =>
  row.status === 30 && isNoReimbursableDataFailure(row.aiFailureMessage)
    ? '未找到可报销数据'
    : statusOptions.find((item) => item.value === row.status)?.label || `状态 ${row.status}`
const sourceLabel = (value: string) =>
  sourceOptions.find((item) => item.value === value)?.label || value || '未知'
const formatSubmitTime = (value?: number | null) =>
  formatNullableDate(value === undefined || value === null ? null : new Date(value))
const statusTagType = (row: ReimbursementClaimResponseVO) => {
  if (row.status === 30 && isNoReimbursableDataFailure(row.aiFailureMessage)) return 'warning'
  switch (row.status) {
    case 30:
      return 'danger'
    case 5:
    case 40:
      return 'success'
    case 20:
      return 'warning'
    default:
      return 'info'
  }
}
const stopProcessingRefresh = () => {
  if (processingRefreshTimer) window.clearInterval(processingRefreshTimer)
  processingRefreshTimer = undefined
}
const syncProcessingRefresh = () => {
  if (!componentActive || !list.value.some((row) => row.status === 10)) {
    stopProcessingRefresh()
    return
  }
  if (!processingRefreshTimer) {
    processingRefreshTimer = window.setInterval(() => void loadList(), 2000)
  }
}
const loadList = async () => {
  if (listLoading) {
    listReloadPending = true
    return
  }
  listLoading = true
  try {
    do {
      listReloadPending = false
      const data = await getClaimPage(queryParams)
      list.value = data.list || []
      total.value = data.total || 0
      syncProcessingRefresh()
    } while (listReloadPending && componentActive)
  } catch {
    // 请求拦截器已经展示失败原因；停止自动刷新，避免持续失败时重复提示。
    stopProcessingRefresh()
  } finally {
    listLoading = false
    if (listReloadPending && componentActive) void loadList()
  }
}
const handleQuery = () => {
  queryParams.pageNo = 1
  void loadList()
}
const openCreate = () => formRef.value?.open('create')
const openDetail = async (row: ReimbursementClaimResponseVO) => {
  try {
    detailDrawerRef.value?.open(await getClaim(row.id))
  } catch {
    // 请求拦截器已经展示失败原因。
  }
}
const openEdit = async (row: ReimbursementClaimResponseVO) => {
  try {
    formRef.value?.open('update', await getClaim(row.id))
  } catch {
    // 请求拦截器已经展示失败原因。
  }
}
const submit = async (row: ReimbursementClaimResponseVO) => {
  try {
    await submitClaim({ id: row.id })
    await loadList()
  } catch {
    // 请求拦截器已经展示失败原因。
  }
}
const remove = async (row: ReimbursementClaimResponseVO) => {
  try {
    await ElMessageBox.confirm(
      `确定删除报销单 ${row.reimbursementNo} 吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await deleteClaim(row.id)
    ElMessage.success('删除成功')
    await loadList()
  } catch {
    // 请求拦截器已经展示失败原因。
  }
}
const openProcess = (row: ReimbursementClaimResponseVO) =>
  router.push({ name: 'BpmProcessInstanceDetail', query: { id: row.processInstanceId } })
let initialActivation = true
onMounted(() => {
  componentActive = true
  void loadList()
})
onActivated(() => {
  componentActive = true
  if (initialActivation) {
    initialActivation = false
    return
  }
  void loadList()
})
onDeactivated(() => {
  componentActive = false
  stopProcessingRefresh()
})
onUnmounted(() => {
  componentActive = false
  stopProcessingRefresh()
})
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

.status-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.status-failure {
  font-size: 12px;
  line-height: 1.3;
  color: var(--el-text-color-secondary);
}

@media (width <=1100px) {
  .reimbursement-filter-form .filter-actions {
    margin-left: 0;
  }
}
</style>
