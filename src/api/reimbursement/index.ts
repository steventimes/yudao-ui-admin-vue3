import request from '@/config/axios'

export type ReimbursementId = number | string
export type ReimbursementDateValue = string | number[]

export interface ReimbursementItemVO {
  id?: ReimbursementId
  clientItemId?: string
  expenseDate: ReimbursementDateValue
  expenseType: string
  merchantName?: string
  amount: number
  taxAmount?: number
  invoiceNumber?: string
  remark?: string
}

export interface ReimbursementClaimVO {
  id?: ReimbursementId
  reason: string
  currency?: string
  items: ReimbursementItemVO[]
}

export interface ReimbursementAttachmentVO {
  id: ReimbursementId
  itemId?: ReimbursementId
  externalArtifactId?: string
  fileName: string
  mimeType?: string
  size?: ReimbursementId
  sha256?: string
  documentType?: string
}

export interface ReimbursementClaimResponseVO extends ReimbursementClaimVO {
  id: ReimbursementId
  reimbursementNo: string
  totalAmount: number
  status: number
  source: string
  processInstanceId?: string
  aiFailureMessage?: string
  aiWorkflowRunId?: string
  submitTime?: number | null
  createTime?: number | null
  attachments?: ReimbursementAttachmentVO[]
}

export interface ReimbursementClaimPageReqVO {
  pageNo: number
  pageSize: number
  status?: number
  source?: string
  reason?: string
}

export interface ReimbursementMailImportStartReqVO {
  mailboxConnectionId: ReimbursementId
  folder: string
  lookbackDays: number | null
  fromDate?: string
  toDate?: string
  unreadOnly: boolean
  subjectKeywords: string
  senderContains: string
  maxMessages: number
}

export interface ReimbursementMailImportStartRespVO {
  reimbursementId: ReimbursementId
  status: number
  submitMode: string
}

export const createClaim = async (data: ReimbursementClaimVO) => {
  return await request.post<ReimbursementId>({ url: '/reimbursement/claim/create', data })
}

export const deleteClaim = async (id: ReimbursementId) => {
  return await request.delete<boolean>({ url: '/reimbursement/claim/delete?id=' + id })
}

export const updateClaim = async (data: ReimbursementClaimVO) => {
  return await request.put<boolean>({ url: '/reimbursement/claim/update', data })
}

export const submitClaim = async (data: {
  id: ReimbursementId
  startUserSelectAssignees?: Record<string, ReimbursementId[]>
}) => {
  return await request.post({ url: '/reimbursement/claim/submit', data })
}

export const getClaim = async (id: ReimbursementId) => {
  return await request.get<ReimbursementClaimResponseVO>({
    url: '/reimbursement/claim/get?id=' + id
  })
}

export const getClaimPage = async (params: ReimbursementClaimPageReqVO) => {
  return await request.get<PageResult<ReimbursementClaimResponseVO[]>>({
    url: '/reimbursement/claim/page',
    params
  })
}

export const startMailImport = async (data: ReimbursementMailImportStartReqVO) => {
  return await request.post<ReimbursementMailImportStartRespVO>({
    url: '/reimbursement/mail-import/start',
    data
  })
}

export const getAttachmentAccessUrl = async (
  reimbursementId: ReimbursementId,
  attachmentId: ReimbursementId
) => {
  return await request.get<string>({
    url: '/reimbursement/claim/attachment/access-url',
    params: { reimbursementId, attachmentId }
  })
}
