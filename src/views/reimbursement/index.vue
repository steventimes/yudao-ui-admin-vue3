<template>
  <ContentWrap>
    <el-form :model="queryParams" inline>
      <el-form-item label="状态"
        ><el-select v-model="queryParams.status" clearable style="width: 160px"
          ><el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value" /></el-select
      ></el-form-item>
      <el-form-item label="来源"
        ><el-select v-model="queryParams.source" clearable style="width: 160px"
          ><el-option label="人工" value="MANUAL" /><el-option
            label="AI 邮件"
            value="AI_EMAIL" /></el-select
      ></el-form-item>
      <el-form-item label="事由"><el-input v-model="queryParams.reason" clearable /></el-form-item>
      <el-form-item
        ><el-button type="primary" @click="loadList">查询</el-button
        ><el-button @click="openCreate">新建报销</el-button
        ><el-button @click="mailboxDialogRef?.open()">邮箱设置</el-button
        ><el-button @click="mailImportDialogRef?.open()">从邮箱导入</el-button></el-form-item
      >
    </el-form>
  </ContentWrap>
  <ContentWrap>
    <el-table :data="list" border>
      <el-table-column prop="reimbursementNo" label="单号" min-width="140" />
      <el-table-column prop="reason" label="事由" min-width="220" />
      <el-table-column prop="totalAmount" label="金额" width="120" />
      <el-table-column prop="source" label="来源" width="120" />
      <el-table-column prop="status" label="状态" width="120" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button link @click="openDetail(row)">详情</el-button>
          <el-button v-if="row.status === 0 || row.status === 30" link @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-if="row.status === 20" link @click="openConfirm(row)">确认</el-button>
          <el-button v-if="row.status === 0" link type="primary" @click="submit(row)"
            >提交</el-button
          >
          <el-button v-if="row.status === 40" link @click="openProcess(row)">进度</el-button>
        </template>
      </el-table-column>
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
import { getClaim, getClaimPage, submitClaim } from '@/api/reimbursement'
import ReimbursementForm from './components/ReimbursementForm.vue'
import ReimbursementDetailDrawer from './components/ReimbursementDetailDrawer.vue'
import MailboxDialog from './components/MailboxDialog.vue'
import MailImportDialog from './components/MailImportDialog.vue'

defineOptions({ name: 'ReimbursementClaim' })
const router = useRouter()
const list = ref<any[]>([])
const total = ref(0)
const formRef = ref()
const detailDrawerRef = ref()
const mailboxDialogRef = ref()
const mailImportDialogRef = ref()
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
  { label: '已提交', value: 40 }
]
const loadList = async () => {
  const data = await getClaimPage(queryParams)
  list.value = data.list || []
  total.value = data.total || 0
}
const openCreate = () => formRef.value?.open('create')
const openDetail = async (row: any) => detailDrawerRef.value?.open(await getClaim(row.id))
const openEdit = async (row: any) => formRef.value?.open('update', await getClaim(row.id))
const openConfirm = async (row: any) => formRef.value?.open('confirm', await getClaim(row.id))
const submit = async (row: any) => {
  await submitClaim({ id: row.id })
  await loadList()
}
const openProcess = (row: any) =>
  router.push({ name: 'BpmProcessInstanceDetail', query: { id: row.processInstanceId } })
onMounted(loadList)
</script>
