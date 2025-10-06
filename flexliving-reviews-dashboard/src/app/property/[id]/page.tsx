// Server Component – safe to await params here
import PropertyClient from "./PropertyClient";

export default async function Page({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const resolved = "then" in params ? await params : params;
  return <PropertyClient id={resolved.id} />;
}
