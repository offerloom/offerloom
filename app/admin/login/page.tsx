import AdminLoginClient from "./AdminLoginClient";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{ return_to?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const returnTo = params.return_to?.startsWith("/") ? params.return_to : "/admin";
  return <AdminLoginClient returnTo={returnTo} />;
}
