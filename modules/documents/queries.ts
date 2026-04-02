import { unstable_cache } from "next/cache"
import { getDocumentsByWorkspaceId } from "@/core/db/queries/documents"
import { CACHE_TAGS } from "@/core/redis/cache-tags"

export function getCachedDocumentsByWorkspaceId(workspaceId: string, orgId: string) {
    return unstable_cache(
        () => getDocumentsByWorkspaceId(workspaceId, orgId),
        // workspaceId + orgId in keyParts so each workspace gets its own cache entry
        [`documents`, workspaceId, orgId],
        {
            tags: [CACHE_TAGS.documents(orgId)],
            revalidate: 60,
        }
    )()
}