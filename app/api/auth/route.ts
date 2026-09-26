import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

// පරිශීලකයා ලොග් වෙද්දී (Login) ක්‍රියාත්මක වන ප්‍රධාන POST Function එක
export async function POST(request : NextRequest) {
    
    // Request එක හරහා එවන JSON දත්ත (body) ටික කියවා ගැනීම (උදා: email, password)
    const body = await request.json();
   
    // 1. Email එකක් ඇතුළත් කරලා නැත්නම් Error එකක් (Bad Request) යැවීම
    if(body.email == null){
        return NextResponse.json(
            { message : "E-mail is required" },
            { status : 400 }
        )
    }

    // 2. Password එකක් ඇතුළත් කරලා නැත්නම් Error එකක් (Bad Request) යැවීම
    if(body.password == null){
        return NextResponse.json(
            { message  : "password is required" },
            { status : 400 }
        )
    }
    
    // ඇතුළත් කරපු Email එකට අදාළ පරිශීලකයා (User) Database එකේ ඉන්නවාදැයි සෙවීම
    const user = await prisma.user.findFirst(
        {
            where : {
                email : body.email
            }
        }
    )

    // 3. එහෙම Email එකක් සහිත User කෙනෙක් Database එකේ නැත්නම් Not Found Error එකක් යැවීම
    if(user == null){
        return NextResponse.json(
            { messege : "user not found" },
            { status : 404 }
        )
    }
 
    // 4. පරිශීලකයාගේ ගිණුම සක්‍රීය (ACTIVE) මට්ටමක නැත්නම් ඇතුළු වීම තහනම් කිරීම (Forbidden)
    if(user.status != "ACTIVE"){
        return NextResponse.json(
            { massege : "your account is disable please contact the admin" },
            { status : 403 }
        )
    }

    // 5. පරිශීලකයා ගැසූ Password එක සහ Database එකේ ඇති Encrypt කරපු Password එක සැසඳීම (Bcryptjs මඟින්)
    const isPasswordValid = await compare(body.password, user.password)

    // Password එක නිවැරදි නම් මේ ඇතුළේ තියෙන දේවල් ක්‍රියාත්මක වේ
    if(isPasswordValid){

            // පරිශීලකයා අවසන් වරට ලොග් වූ වෙලාව (lastLogin) වත්මන් වෙලාවට Update කිරීම
            await prisma.user.update(
                {
                    where : { id : user.id },
                    data : { lastLogin : new Date() }
                }
            )

            // JWT සයින් (Sign) කිරීමට පරිසර විචල්‍යයන්ගෙන් (.env) Secret Key එක ලබා ගැනීම
            const secretText = process.env.JOSE_SECRET || "TemporySecret123456789" 

            // Text එකක් ලෙස ඇති Secret Key එක, Jose පුස්තකාලයට අවශ්‍ය පරිදි Uint8Array එකක් බවට හැරවීම
            const secret = new TextEncoder().encode(secretText)

            // පරිශීලකයාගේ දත්ත (Payload) ඇතුළත් කර සුරක්ෂිත ආරක්ෂිත JWT Token එකක් සෑදීම
            const token = await new jose.SignJWT(
                {
                    id: user.id,
                    email :user.email,
                    fristName : user.fristName,
                    lastName : user.LastName,
                    role : user.role,
                    privileges : user.privileges // පද්ධතියේ අවසරයන් පරීක්ෂා කිරීමට මෙය අත්‍යවශ්‍ය වේ
                }
            ).setProtectedHeader({alg : "HS256"}).sign(secret)
         
            // සාර්ථකව Login වූ බව පවසන JSON Response එක සකස් කිරීම
            const response = NextResponse.json(
                {
                    message : "login successfull",
                    role : user.role,
                }
            )

            // සකස් කරගත් JWT Token එක ආරක්ෂිත Cookie එකක් ලෙස Browser එකේ තැන්පත් කිරීම
            response.cookies.set(
                {
                    name : "login-token", // Cookie එක හඳුන්වන නම
                    value : token, // ඇතුළත් කරන JWT Token අගය
                    httpOnly : true, // JavaScript මඟින් මේ බ්‍රවුසර් කුකිය කියවීම වැළැක්වීම (ආරක්ෂාව සඳහා)
                    secure : false,  // Localhost (HTTP) වලදී false වේ, Live (HTTPS) වලදී true කළ යුතුය
                    sameSite : "lax", // CSRF ප්‍රහාර වලින් ආරක්ෂා වීමට උදව් වේ
                    maxAge : 60 * 60 * 24 * 7 // දින 7ක් යනතුරු කුකිය වලංගු වේ
                }
            )
            
            // සම්පූර්ණ කරන ලද Response එක කුකි සමඟ පරිශීලකයාට ආපසු යැවීම
            return response
    
    }else{
        // 6. ඇතුළත් කළ Password එක වැරදි නම් Unauthorized Error එකක් ලබා දීම
        return NextResponse.json(
            { messege : "Password incorect" },
            { status : 401 }
        )
    }
}
