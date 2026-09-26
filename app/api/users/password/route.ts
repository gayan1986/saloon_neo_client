import { NextRequest } from "next/server";

export function POST(request : NextRequest) {

    const body = request.json();

    const password = body.password;

}