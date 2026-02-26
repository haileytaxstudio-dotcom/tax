export function middleware() {
  return new Response("점검 중입니다.", { status: 503 });
}
