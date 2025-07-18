
import { AllBookingPropertyDetails } from "@/actions/propertyActions";
import { getUserByKindeId } from "@/actions/userActions";
import AllBookingsProp from "@/components/property/AllbookedProperty";


type BookingDetails = {
  propertyId: string;
  PropertyName: string;
  bookingID: string;
  BookedUser: string;
  BookedUserEmail: string;
  totalprice: number;
  updatedAt: string;
  roomId: string | null;
  status: string;
  review: number | null;
};

type Props = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function AllBookings(props: Props) {
  const params = await props.params;
  const { userId } = params;
  //   const router = useRouter();

  const user = await getUserByKindeId(userId);
  if (!user) {
    return <h1>User Not found</h1>;
  }

  const all_booking_property_details: BookingDetails[] = (await AllBookingPropertyDetails(user.id ?? "")) || [];

  // Redirect to '/' if there are no bookings
  if (all_booking_property_details.length === 0) {
    return <div className="text-center text-gray-500">No bookings on your created property</div>;
  }

  return (
    <>
      <AllBookingsProp bookingData={all_booking_property_details} />
    </>
  );
}
