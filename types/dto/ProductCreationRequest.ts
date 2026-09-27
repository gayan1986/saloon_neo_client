import z from "zod";

const ProductsStatuseEnum = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);

const MediaTypeEnum = z.enum(["IMAGE", "VIDEO"]);

export const ProductCreationRequestSchema = z.object(
    {
        sku: z.string().max(50),
        name: z.string().max(100),
        altNames: z.array(z.string().max(100)).optional().default([]),
        discription: z.string().max(500),
        stock: z.number().int().min(0),
        status: ProductsStatuseEnum.optional().default("ACTIVE"),
        price: z.number().min(0),
        compareAT : z.number().min(0).optional(),
        brand: z.string().max(100).optional(),
        model: z.string().max(100).optional(),
        media: z.array(
            z.object(
                {
                    url: z.url(),
                    type: MediaTypeEnum
                }
            )
        )
    }
);