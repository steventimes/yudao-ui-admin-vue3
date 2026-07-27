const failureMessageLabels: Record<string, string> = {
  NO_REIMBURSABLE_DATA: '未找到可报销数据',
  SEARCH_INCOMPLETE:
    '邮箱搜索结果不完整，系统未创建报销明细。请缩短日期范围或提高“最大邮件数”后重试',
  DIFY_WORKFLOW_FAILED: '邮箱读取或 AI 工作流执行失败，请检查配置后重试',
  DIFY_WORKFLOW_TIMEOUT: 'AI 处理超时或服务曾重启，本次导入已结束，请重新发起',
  DUPLICATE_EMAIL_IMPORT: '该邮箱邮件已经生成过报销单，已阻止重复导入',
  IMAP_AUTH_FAILED: '邮箱认证失败，请更新邮箱授权码并重新验证',
  IMAP_NETWORK_ERROR: '无法连接邮箱服务器，请检查网络、主机和端口后重试',
  IMAP_FOLDER_ACCESS_DENIED: '无法访问所选邮箱文件夹，请检查文件夹名称或账号权限',
  IMAP_CONFIGURATION_ERROR: '邮箱搜索条件或连接配置无效，请检查后重试',
  MESSAGE_DEDUP_FAILED: '邮件去重检查失败，请稍后重试',
  MESSAGE_READ_FAILED: '邮件读取失败，请重新发起导入',
  MESSAGE_REF_INVALID: '邮件引用无效，请重新发起导入',
  MESSAGE_REF_EXPIRED: '邮件引用已过期，请重新发起导入',
  MESSAGE_REF_CONNECTION_MISMATCH: '邮件引用与当前邮箱不匹配，请重新发起导入',
  MAILBOX_BROKER_CONFIGURATION_ERROR: '邮箱连接器服务配置不完整，请联系管理员',
  MAILBOX_BROKER_ERROR: '邮箱授权服务拒绝本次请求，请重新发起导入',
  MAILBOX_BROKER_RESPONSE_INVALID: '邮箱授权服务返回异常，请联系管理员检查连接器与后端版本',
  MAILBOX_BROKER_UNAVAILABLE: '邮箱授权服务暂时不可用，请稍后重试',
  MAILBOX_BROKER_UNAUTHORIZED: '邮箱连接器服务认证失败，请联系管理员检查服务配置',
  MAILBOX_EXECUTION_TOKEN_REQUIRED: '本次邮箱访问授权缺失，请重新发起导入',
  MAILBOX_EXECUTION_NOT_FOUND: '本次邮箱访问授权不存在或已失效，请重新发起导入',
  MAILBOX_EXECUTION_EXPIRED: '本次邮箱访问授权已过期，请重新发起导入',
  MAILBOX_EXECUTION_REVOKED: '本次邮箱访问授权已失效，请重新发起导入',
  MAILBOX_EXECUTION_TOKEN_INVALID: '邮箱访问授权无效，请重新发起导入',
  MAILBOX_EXECUTION_OPERATION_REQUIRED: '邮箱访问操作缺失，请重新发起导入',
  MAILBOX_EXECUTION_OPERATION_NOT_ALLOWED: '邮箱访问操作与授权不匹配，请重新发起导入',
  MAILBOX_CONNECTION_NOT_FOUND: '邮箱连接不存在或已删除，请重新选择邮箱',
  MAILBOX_CONNECTION_NOT_OWNER: '无权访问所选邮箱，请重新选择邮箱',
  MAILBOX_CONNECTION_NOT_VERIFIED: '所选邮箱尚未通过验证，请先重新验证',
  MAILBOX_CONNECTION_DISABLED: '邮箱连接已停用，请重新验证或启用邮箱',
  MAILBOX_CONNECTION_CREDENTIAL_INVALID: '邮箱授权码已失效，请更新授权码并重新验证',
  MAILBOX_CONNECTION_CONFIGURATION_INVALID: '邮箱连接配置无效，请检查后重新验证',
  MAILBOX_CONNECTION_CUSTOM_DISABLED: '系统未启用自定义邮箱服务商，请联系管理员',
  REIMBURSEMENT_ID_INVALID: '报销任务标识无效，请重新发起导入',
  REIMBURSEMENT_IMPORT_BASE_URL_REQUIRED: '报销回填服务地址未配置，请联系管理员',
  REIMBURSEMENT_IMPORT_BASE_URL_INVALID: '报销回填服务地址无效，请联系管理员',
  REIMBURSEMENT_IMPORT_BASE_URL_INSECURE: '报销回填服务地址不安全，请联系管理员',
  REIMBURSEMENT_IMPORT_BEARER_TOKEN_REQUIRED: '报销回填服务认证未配置，请联系管理员',
  YUDAO_RESPONSE_INVALID: '报销服务返回异常，请联系管理员检查服务版本',
  ARTIFACT_STAGE_FAILED: '邮件附件暂存失败，请重新发起导入',
  ARTIFACT_UPLOAD_FAILED: '邮件附件上传失败，请重新发起导入',
  ARTIFACT_UPLOAD_HTTP_FAILED: '邮件附件服务请求失败，请稍后重试',
  ARTIFACT_UPLOAD_UNAVAILABLE: '邮件附件服务暂时不可用，请稍后重试',
  ARTIFACT_HASH_NOT_MATCH: '邮件附件完整性校验失败，请重新发起导入',
  'Dify workflow completed without ai-fill':
    '工作流已结束但没有回填报销明细，请检查 Dify 工作流配置',
  'Dify workflow failed': 'Dify 工作流调用失败，请检查配置或稍后重试'
}

export const reimbursementFailureMessageLabel = (value: unknown) => {
  const message = String(value || '').trim()
  if (!message) return ''

  const separatorIndex = message.indexOf(':')
  const code = separatorIndex >= 0 ? message.slice(0, separatorIndex).trim() : message
  const detail = separatorIndex >= 0 ? message.slice(separatorIndex + 1).trim() : ''
  const label = failureMessageLabels[code]
  if (!label) return message
  return detail ? `${label}。详情：${detail}` : label
}
