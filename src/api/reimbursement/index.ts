import request from '@/config/axios'

export interface ReimbursementItemVO {
  id?: number
  clientItemId?: string
  expenseDate: string
  expenseType: string
  merchantName?: string
  amount: number
  taxAmount?: number
  invoiceNumber?: string
  remark?: string
}

export interface ReimbursementClaimVO {
  id?: number
  reason: string
  currency?: string
  items: ReimbursementItemVO[]
}

export const createClaim = async (data: ReimbursementClaimVO) => {
  return await request.post({ url: '/reimbursement/claim/create', data })
}

export const deleteClaim = async (id: number) => {
  return await request.delete({ url: '/reimbursement/claim/delete?id=' + id })
}

export const updateClaim = async (data: ReimbursementClaimVO) => {
  return await request.put({ url: '/reimbursement/claim/update', data })
}

export const submitClaim = async (data: {
  id: number
  startUserSelectAssignees?: Record<string, number[]>
}) => {
  return await request.post({ url: '/reimbursement/claim/submit', data })
}

export const getClaim = async (id: number) => {
  return await request.get({ url: '/reimbursement/claim/get?id=' + id })
}

export const getClaimPage = async (params: any) => {
  return await request.get({ url: '/reimbursement/claim/page', params })
}

export const startMailImport = async (data: any) => {
  return await request.post({ url: '/reimbursement/mail-import/start', data })
}

export const getAttachmentAccessUrl = async (reimbursementId: number, attachmentId: number) => {
  return await request.get({
    url: '/reimbursement/claim/attachment/access-url',
    params: { reimbursementId, attachmentId }
  })
}
