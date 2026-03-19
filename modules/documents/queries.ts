// unstable_cache wrapper

import { unstable_cache } from "next/cache"
import { getDocumentsByWorkspaceId } from "@/core/db/queries/documents"
import { CACHE_TAGS } from "@/core/redis/cache-tags"

export function getCachedDocumentsByWorkspaceId(workspaceId: string, orgId: string) {
    return unstable_cache(
        () => getDocumentsByWorkspaceId(workspaceId, orgId),
        [`documents-${workspaceId}`],
        {
            tags: [CACHE_TAGS.documents(orgId)], revalidate: 60
        }
    )();
}