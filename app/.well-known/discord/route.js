// Discord domain verification — served as plain text at
// /.well-known/discord. Body must be exactly the dh= key.
export const dynamic = "force-static";

export function GET() {
  return new Response("dh=56566db6396efd4baca3f822424c0042151d87a4", {
    headers: { "Content-Type": "text/plain" },
  });
}
