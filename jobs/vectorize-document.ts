import { inngest } from "@/lib/inngest";

export const vectorizeDocument = inngest.createFunction({
         id: "vectorize-document" ,
         triggers: [{ event: "document/process" }]
    },
    async ({ event, step }) => {
        const { documentId, orgId, workspaceId } = event.data;

        
    }
);