import prisma from "@/lib/prisma";
import { UserRegistrationRequestSchema } from "@/types/dto/UserRegistrationRequest";
import { UserUpdatedByAdminRequestSchema } from "@/types/dto/UserUpdatedByAdminRequet";
import { getUser, isPrivilaged } from "@/utils/authentication";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function GET(request : NextRequest) {

    // 1. අවසර තියෙනවාද කියලා පරීක්ෂා කිරීම
    const havePrivilage = await isPrivilaged(request, "users:read")

    if(!havePrivilage){
        return NextResponse.json(
            {
                message : "you don't have permission to access this resource"
            },
            {
                status : 403
            }
        )
    }

    // add pagination and filtering later

    const pageNumberInput = request.nextUrl.searchParams.get("pageNumber") || "1"

    const pageSizeInput = request.nextUrl.searchParams.get("pageSize") || "10"

    const pageNumber = parseInt(pageNumberInput) // convert to pageNumbrInput string value to integer

    const pageSize = parseInt(pageSizeInput)

    const userCount = await prisma.user.count()

    const totalPages = Math.ceil(userCount / pageSize) // ceil is used to round up the number of pages to the nearest integer

    if(pageNumber > totalPages){
        return NextResponse.json(
            {
                message : "page number exceeds total pages",
                totalPages : totalPages
            },
            {
                status : 400
            }
        )
    }

    const users = await prisma.user.findMany(
        {
            skip : (pageNumber - 1) * pageSize,
            take : pageSize,
            select : {
                id : true,
                email : true,
                phone : true,
                fristName : true,
                LastName : true,
                role : true,
                status : true, 
                createdAt : true,
                lastLogin : true,
                privileges : true
            }
        }
    )

    // 3. සාර්ථකව දත්ත ලැබුණු පසු 200 Status එක සමඟ users ලා return කිරීම
    return NextResponse.json(
        {
            message: "Users fetched successfully",
            user: users,
            pagination : {
                pageNumber: pageNumber,
                pageSize: pageSize,
                totalPages: totalPages,
                totalCount: userCount,
            }
        },
        {
            status : 200
        }
    )
    
}


// POST Method එකක් හරහා පරිශීලකයා (User) Database එකට Add කිරීම (Create User)
export async function POST(request : NextRequest) {

    //email, password, phone, firstName, lastName, phone(optional) available or no
    const body = await request.json();

   
    try{
         // validate the request body using zod schema
        const parsedBody = UserRegistrationRequestSchema.parse(body);

        
        // Database එකේ email එකක් සහිත පරිශීලකයා (User) ඉන්නවාදැයි සෙවීම
        const exitingUser = await prisma.user.findUnique(
            {
                where : {
                    email : parsedBody.email
                }
            }
        )

        // Database එකේ email එකක් සහිත පරිශීලකයා (User) not ඉන්නවා නම් Error එකක් (Bad Request) යැවීම

        if(exitingUser != null){
            return NextResponse.json(
                {
                    message : "user with this email already exists"
                },
                {
                    status : 400
                }
            )
        }

        // Password එක Encrypt කිරීම (Hashing) කිරීම
        const passwordHash = await bcrypt.hash(parsedBody.password, 12);

        await prisma.user.create(
            {
                data : {
                    email : parsedBody.email,
                    fristName : parsedBody.fristName,
                    LastName : parsedBody.LastName,
                    password : passwordHash,
                    phone : parsedBody.phone || null // phone එක optional එකක් නිසා null දාන්න පුළුවන්
                }
            }
        )

        // සාර්ථකව පරිශීලකයා (User) Database එකට ඇතුළු වීමෙන් පසු 201 Status එක සමඟ සාර්ථක බව return කිරීම
        return NextResponse.json(
            {
                message : "user created successfully"
            },
            {
                status : 201
            }
        )

    } catch(error){

        if(error instanceof z.ZodError){
            return NextResponse.json(
                {
                    message : error.issues[0]?.message ?? "invalid Input",
                },
                {
                    status : 400
                }
            )
        }

        return NextResponse.json(
            {
                message : "invalid request body"
            },
            {
                status : 400
            }
        )
    }
}

export async function PUT(request : NextRequest) {

    const id = request.nextUrl.searchParams.get("id") // id එකක් ඇතුළත් කරලා නැත්නම් Error එකක් (Bad Request) යැවීම

    const requestedUser = await getUser(request) // request එකෙන් එන user එක (requestUser) ලබා ගැනීම

    // id එකක් ඇතුළත් කරලා නැත්නම් Error එකක් (Bad Request) යැවීම
    if(requestedUser == null){
        return NextResponse.json(
            {
                message : "you are not authorized to access this resource"
            },
            {
                status : 401
            }
        )
    }

    try{

        const body = await request.json() 

        // request එකෙන් එන body එක (requestBody) ලබා ගැනීම
        if(requestedUser.id == id){
            // never allow user to update their own roal, status, privilages

            const user = await prisma.user.findUnique(
                {
                    where : {
                        id : id 
                    }
                    
                }
            )
            
            if(user == null){
                return NextResponse.json(
                    {
                        message : "user not found"
                    },
                    {
                        status : 404
                    }
                )
            }

            await prisma.user.update(
                {
                    where : {
                        id : id
                    },
                    data : {
                        email : body.email || user.email,
                        fristName : body.fristName || user.fristName,
                        LastName : body.LastName || user.LastName,
                        phone : body.phone || user.phone,
                        profileImage : body.profileImage || user.profileImage
                    }
                }
            )

                return NextResponse.json(
                    {
                        message : "user updated successfully"
                    },
                    {
                        status : 200
                    }
                )
            
        }else{
            // never allow user to update their own roal, status, privilages
            const havePrivilage = await isPrivilaged(request, "users:edit")

            if(!havePrivilage){
                return NextResponse.json(
                    {
                        message : "you don't have permission to access this resource"
                    },
                    {
                        status : 403
                    }
                )
            }


            UserUpdatedByAdminRequestSchema.parse(body)

            const user = await prisma.user.findUnique(
                {
                    where : {
                        id : id || "00000"
                    }
                }
            )

            if(user == null){
                return NextResponse.json(
                    {
                        message : "user not found"
                    },
                    {
                        status : 404
                    }
                )
            }

            await prisma.user.update(
                {
                    where : {
                        id : id || "00000"
                    },
                    data : {
                        email : body.email || user.email,
                        fristName : body.fristName || user.fristName,
                        LastName : body.LastName || user.LastName,
                        phone : body.phone || user.phone,
                        profileImage : body.profileImage || user.profileImage,
                        role : body.role || user.role,
                        status : body.status || user.status,
                        privileges : body.privileges || user.privileges
                    }
                }
            )

                return NextResponse.json(
                    {
                        message : "user updated successfully"
                    },
                    {
                        status : 200
                    }
                )
            
        }

    }catch(error){

        if(error instanceof z.ZodError){
            return NextResponse.json(
                {
                    message : error.issues[0]?.message ?? "invalid Input",
                },
                {
                    status : 400
                }
            )
        }

        return NextResponse.json(

            {
                message : "Server Error"
            },
            {
                status : 500
            }
        )
    }

}
