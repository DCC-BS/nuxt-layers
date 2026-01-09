import z from "zod";

export const attachmentSchema = z.object({
    base64: z.base64(),
    fileName: z.string(),
});

export const bodySchema = z.object({
    message: z.string(),
    rating: z.string(),
    email: z.email(),
    attachments: z.array(attachmentSchema).default([]),
});

export type FeedbackAttachment = z.output<typeof attachmentSchema>;
export type FeedbackBody = z.output<typeof bodySchema>;
