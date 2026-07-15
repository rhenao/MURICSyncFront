export interface AuditContextHeaders {
  'X-Timezone': string;
  'X-Screen-Size': string;
}

export function getAuditContextHeaders(): AuditContextHeaders {
  return {
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    'X-Screen-Size': `${window.screen.width}x${window.screen.height}`,
  };
}
