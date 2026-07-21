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
      <el-table-column prop="providerCode" label="类型" />
      <el-table-column prop="status" label="状态" />
      <el-table-column label="操作"
        ><template #default="{ row }"
          ><el-button link @click="verify(row.id)">验证</el-button
          ><el-button link type="danger" @click="remove(row.id)">删除</el-button></template
        ></el-table-column
      >
    </el-table>
    <template #footer
      ><el-button @click="visible = false">关闭</el-button
      ><el-button type="primary" @click="save">保存</el-button></template
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
const formData = reactive<any>({
  providerCode: 'QQ_MAIL',
  email: '',
  username: '',
  authorizationCode: '',
  tlsVerification: 'strict'
})
const load = async () => {
  mailboxes.value = (await getMailboxPage({ pageNo: 1, pageSize: 20 })).list || []
}
const open = async () => {
  visible.value = true
  await load()
}
const save = async () => {
  await createMailbox(formData)
  formData.authorizationCode = ''
  await load()
}
const verify = async (id: number) => {
  await verifyMailbox(id)
  await load()
}
const remove = async (id: number) => {
  await deleteMailbox(id)
  await load()
}
defineExpose({ open, load })
</script>
