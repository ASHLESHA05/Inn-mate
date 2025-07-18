import Link from "next/link";
import { Button } from "../ui/button";

const AddProperty = ({ userId }: { userId: string }) => {
  return (
    <div className="mx-auto">
      <Link href={`/user/${userId}/add-property`}>
        <Button>Add New Property</Button>
      </Link>
    </div>
  );
};

export default AddProperty;