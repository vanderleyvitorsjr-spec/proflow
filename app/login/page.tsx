import { ProFlowEntryScreen } from "@/components/auth/proflow-entry-screen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    reason?: string;
    error?: string;
    success?: string;
  }>;
}) {
  const query = await searchParams;
  return <ProFlowEntryScreen query={query} />;
}
