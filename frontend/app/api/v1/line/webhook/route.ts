import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_WEBHOOK_URL || (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') + '/api/v1/line/webhook') || ''

export async function POST(request: NextRequest) {
    try {
        const body = await request.text()
        const signature = request.headers.get("x-line-signature") || ""

        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-line-signature": signature,
            },
            body,
        })

        const data = await res.text()
        return new NextResponse(data, { status: res.status })
    } catch (error) {
        console.error("Webhook proxy error:", error)
        return NextResponse.json({ error: "Proxy failed" }, { status: 502 })
    }
}
