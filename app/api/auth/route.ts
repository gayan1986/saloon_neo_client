
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

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

            //const secretText = "TemporySecret123456789"
            const secretText = process.env.JOSE_SECRET || "TemporySecret123456789"

            const secret = new TextEncoder().encode(secretText)

            const token = await new jose.SignJWT(
                {
                    email :user.email,
                    fristName : user.fristName,
                    lastName : user.LastName,
                    role : user.role,
                    prvilages : user.privileges
                }
            ).setProtectedHeader({alg : "HS256"}).sign(secret)
         
            const response = NextResponse.json(
                {
                    message : "login successfull",
                    role : user.role,
                }
            )

            response.cookies.set(
                {
                    name : "login-token",
                    value : token,
                    httpOnly : true,
                    secure : false,  //http nam false, https nam true
                    sameSite : "lax",
                    maxAge : 60 * 60 * 24 * 7 //7 days
                }
            )
            return response
    
    }else{
        return NextResponse.json(
            {
                massege : "Password incorect"
            }
        )
    }

}   