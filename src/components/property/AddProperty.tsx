import Link from "next/link";
import { Button } from "../ui/button";

const AddProperty = ({ userId }: { userId: string }) => {
  return (
    <div className="relative h-screen">
      <Link href={`/user/${userId}/add-property`}>
        <Button className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/5">
          Add New Property
        </Button>
      </Link>
    </div>
  );
};

export default AddProperty;
