
import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { isPrivilaged } from "@/utils/authentication";


export async function POST(request : NextRequest){

    const hasPrivilege = await isPrivilaged(request, "products:add");

    if(hasPrivilege){
        
        const body = await request.json();


    }else{
        return NextResponse.json(
            {
                message: "You do not have the required privilege to perform this action."
            },
            {
                status: 403
            }
        )

}