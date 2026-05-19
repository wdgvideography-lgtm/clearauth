export default async function handler(req: Request): Promise<Response> {
  const res = await fetch("https://base44.app/api/apps/6a0c1534017166f536b1ac32/files/mp/public/6a0c1534017166f536b1ac32/49d217010_index.html");
  const text = await res.text();
  return new Response(text, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
