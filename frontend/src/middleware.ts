import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.redirect("https://hailey-lms.vercel.app/", 301);
}
