<template>
  <Dialog v-model="visible" title="邮箱设置" width="900px">
    <el-form :model="formData" label-width="120px">
      <el-form-item label="邮箱类型"
        ><el-select v-model="formData.providerCode"
          ><el-option label="QQ 邮箱" value="QQ_MAIL" /><el-option
            label="自定义 IMAPS"
            value="CUSTOM_IMAPS" /></el-select
      ></el-form-item>
      <el-form-item label="邮箱地址"><el-input v-model="formData.email" /></el-form-item>
      <el-form-item label="用户名"
        ><el-input v-model="formData.username" placeholder="默认使用邮箱地址"
      /></el-form-item>
      <template v-if="formData.providerCode === 'CUSTOM_IMAPS'">
        <el-form-item label="IMAPS host"><el-input v-model="formData.imapHost" /></el-form-item>
        <el-form-item label="IMAPS port"
          ><el-input-number v-model="formData.imapPort" :min="1" :max="65535"
        /></el-form-item>
        <el-form-item label="TLS"
          ><el-select v-model="formData.tlsVerification"
            ><el-option label="strict" value="strict" /><el-option
              label="insecure-dev"
              value="insecure-dev" /></el-select
        ></el-form-item>
      </template>
      <el-form-item label="客户端授权码"
        ><el-input v-model="formData.authorizationCode" type="password" show-password
      /></el-form-item>
    </el-form>
    <el-table :data="mailboxes" border>
      <el-table-column prop="emailNormalized" label="邮箱" />
      <el-table-column label="类型"
        ><template #default="{ row }">{{
          providerLabel(row.providerCode)
        }}</template></el-table-column
      >
      <el-table-column label="状态"
        ><template #default="{ row }"
          ><el-tag :type="row.status === 1 ? 'success' : 'warning'">{{
            statusLabel(row.status)
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column label="操作"
        ><template #default="{ row }"
          ><el-button
            link
            :loading="verifyingId === row.id"
            :disabled="mailboxActionInProgress"
            @click="verify(row.id)"
            >验证</el-button
          ><el-button
            link
            type="danger"
            :loading="deletingId === row.id"
            :disabled="mailboxActionInProgress"
            @click="remove(row)"
            >删除</el-button
          ></template
        ></el-table-column
      >
    </el-table>
    <template #footer
      ><el-button :disabled="mailboxActionInProgress" @click="visible = false">关闭</el-button
      ><el-button type="primary" :loading="saving" :disabled="mailboxActionInProgress" @click="save"
        >保存</el-button
      ></template
    >
  </Dialog>
</template>
<script setup lang="ts">
import {
  createMailbox,
  deleteMailbox,
  getMailboxPage,
  verifyMailbox
} from '@/api/reimbursement/mailbox'
const visible = ref(false)
const mailboxes = ref<any[]>([])
const saving = ref(false)
const verifyingId = ref<number>()
const deletingId = ref<number>()
const mailboxActionInProgress = computed(
  () => saving.value || verifyingId.value !== undefined || deletingId.value !== undefined
)
const formData = reactive<any>({
  providerCode: 'QQ_MAIL',
  email: '',
  username: '',
  authorizationCode: '',
  tlsVerification: 'strict'
})
const providerLabel = (value: string) =>
  (({ QQ_MAIL: 'QQ 邮箱', CUSTOM_IMAPS: '自定义 IMAPS' }) as Record<string, string>)[value] ||
  value ||
  '未知'
const statusLabel = (value: number) => (value === 1 ? '已验证' : '未验证')
const load = async () => {
  mailboxes.value = (await getMailboxPage({ pageNo: 1, pageSize: 20 })).list || []
}
const open = async () => {
  visible.value = true
  try {
    await load()
  } catch {
    // 请求拦截器已经展示失败原因。
  }
}
const save = async () => {
  if (mailboxActionInProgress.value) return
  saving.value = true
  try {
    await createMailbox(formData)
    formData.authorizationCode = ''
    await load()
    ElMessage.success('邮箱保存成功')
  } catch {
    // 请求拦截器已经展示失败原因。
  } finally {
    saving.value = false
  }
}
const verify = async (id: number) => {
  if (mailboxActionInProgress.value) return
  verifyingId.value = id
  try {
    await verifyMailbox(id)
    await load()
    ElMessage.success('邮箱验证成功')
  } catch {
    await load().catch(() => undefined)
  } finally {
    verifyingId.value = undefined
  }
}
const remove = async (mailbox: any) => {
  if (mailboxActionInProgress.value) return
  try {
    await ElMessageBox.confirm(
      `确定删除邮箱 ${mailbox.emailNormalized} 吗？删除后需要重新绑定并验证。`,
      '删除邮箱确认',
      { type: 'warning' }
    )
  } catch {
    return
  }
  deletingId.value = mailbox.id
  try {
    await deleteMailbox(mailbox.id)
    await load()
    ElMessage.success('邮箱删除成功')
  } catch {
    // 请求拦截器已经展示失败原因。
  } finally {
    deletingId.value = undefined
  }
}
defineExpose({ open, load })
</script>
