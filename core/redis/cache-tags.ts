export const CACHE_TAGS = {
  documents: (orgId: string) => `docs:${orgId}`,
  workspaces: (orgId: string) => `ws:${orgId}`,
  organization: (orgId: string) => `org:${orgId}`,
}