import request from '@/config/axios'

export interface ReimbursementMailboxVO {
  id?: number
  providerCode: string
  email: string
  username?: string
  authorizationCode?: string
  imapHost?: string
  imapPort?: number
  tlsVerification?: string
}

export const createMailbox = async (data: ReimbursementMailboxVO) => {
  return await request.post({ url: '/reimbursement/mailbox/create', data })
}

export const updateMailbox = async (data: ReimbursementMailboxVO) => {
  return await request.put({ url: '/reimbursement/mailbox/update', data })
}

export const verifyMailbox = async (id: number) => {
  return await request.post({ url: '/reimbursement/mailbox/verify?id=' + id })
}

export const getMailbox = async (id: number) => {
  return await request.get({ url: '/reimbursement/mailbox/get?id=' + id })
}

export const getMailboxPage = async (params: any) => {
  return await request.get({ url: '/reimbursement/mailbox/page', params })
}

export const deleteMailbox = async (id: number) => {
  return await request.delete({ url: '/reimbursement/mailbox/delete?id=' + id })
}
