import Login from "@/components/Login";
import { auth } from "@/auth";
import IneligibleUserModal from "@/components/modals/IneligibleUserModal";

export default async function LoginPage() {
  const session = await auth();

  const isIneligible =
    session &&
    (session.user.isEligible === false ||
      session.user.isEligible === undefined);

  return (
    <>
      <Login />
      <IneligibleUserModal isShow={isIneligible} />
    </>
  );
}
