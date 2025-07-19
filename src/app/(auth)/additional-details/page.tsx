import { mapKindeUserToUser } from "@/actions/userActions";
import { UserForm } from "@/components/user/UserForm";
import { TKindeUser, TUser } from "@/lib/definitions";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const AdditionalDetails = async () => {
  const { getUser } = getKindeServerSession();
  const kindeUser = (await getUser()) as TKindeUser;
  const user = await mapKindeUserToUser(kindeUser);
  if (user) {
    return <UserForm user={user as TUser} />;
  } else {
    <div>Sorry couldn&apos;t fetch the user</div>

  }
};

export default AdditionalDetails;
