import z from "zod";

const UserUpdatedByAdminRequestSchema = z.object(
    {
        id : z.never().optional(),
        password : z.never().optional(),
    }
)

export type UserUpdateByAdminRequest = z.infer<typeof UserUpdatedByAdminRequestSchema>;

export {UserUpdatedByAdminRequestSchema};