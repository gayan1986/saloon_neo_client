import z from "zod";

const UserSelfUpdateRequestSchema = z.object(
    {
        id : z.never().optional(),
        email: z.email().optional(),
        fristName: z.string().max(20).optional(),
        LastName: z.string().max(10).optional(),
        password: z.never().optional(),
        phone : z.string().optional(),
        profileImage : z.string().optional(),
        role : z.never().optional(),
        status : z.never().optional(),
        privileges : z.never().optional()
    }
)


export type UserSelfUpdateRequest = z.infer<typeof UserSelfUpdateRequestSchema>;

export {UserSelfUpdateRequestSchema};