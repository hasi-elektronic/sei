const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Content-Type': 'application/json',
}
export const ok = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: CORS })
export const err = (msg: string, status = 400) =>
  new Response(JSON.stringify({ error: msg }), { status, headers: CORS })
export const corsOk = () =>
  new Response(null, { status: 204, headers: CORS })
