export function GET() {
  return Response.json({
    status: "ok",
    service: "car-scrap-business",
    timestamp: new Date().toISOString(),
  });
}
