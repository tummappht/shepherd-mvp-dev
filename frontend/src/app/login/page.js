import Login from "@/components/Login";
import { auth } from "@/auth";
import IneligibleUserModal from "@/components/modals/IneligibleUserModal";

export default async function LoginPage() {
  const session = await auth();
  const isIneligible = session?.user?.isEligible === false;

  return (
    <>
      <Login />
      <IneligibleUserModal isShow={isIneligible} />
    </>
  );
}
