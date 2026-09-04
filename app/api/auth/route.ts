
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request : NextRequest) {
    
    const body = await request.json();

    //// email ekak reqest eke thiyenawada kiyala balanna
    if(body.email == null){

        return NextResponse.json(
            {
                massage : "E-mail is requied"
            }
        )
    }

    /////////front end eken ena requst read karaganna ////////////
    const user = await prisma.user.findFirst(
        {
            where : {
                email : body.email
            }
        }
    )

    /////// ena request eke user kenek innawada balanna
    if(user == null){

        return NextResponse.json(
            {
                massege : "user not found"
            }
        )
    }


    /////////////// password eka harida kiyala balanawa ///////////////

    const isPasswordValid = await compare(body.password, user.password)

    if(isPasswordValid){

        return NextResponse.json(
            {
                massege : "Login sucsusfull"
            }
        )
    }else{
        return NextResponse.json(
            {
                massege : "Password incorect"
            }
        )
    }

}   