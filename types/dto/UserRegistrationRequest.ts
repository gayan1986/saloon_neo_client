import {z} from "zod";

const UserRegistrationRequestSchema = z.object(
    {
        email: z.email(),
        fristName: z.string().max(20),
        LastName: z.string().max(10),
        password: z.string(),
        privileges: z.never().optional(),
        phone : z.string().optional(),
    }
);


export type UserRegistrationRequest = z.infer<typeof UserRegistrationRequestSchema>;

export {UserRegistrationRequestSchema};