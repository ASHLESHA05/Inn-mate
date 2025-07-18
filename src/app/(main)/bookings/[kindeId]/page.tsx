import { getAllAmenitiesForProperty } from "@/actions/amenitiesAction";
import { getAllBookedProperties } from "@/actions/bookingActions";
import { getLocationById } from "@/actions/locationActions";
import { getAllImagesbyId } from "@/actions/propertyActions";
import { getAllReviewsById } from "@/actions/reviewActions";
import { getUserById } from "@/actions/userActions";
import PropertyCard from "@/components/property/Property";
import { TBooking, TCheckInCheckOut, TProperty } from "@/lib/definitions";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Bookings = async (props: { params: Promise<{ kindeId: string }> }) => {
  const params = await props.params;
  const kindeId = params.kindeId;
  const bookings = (await getAllBookedProperties(kindeId)) as (TBooking & {
    property: TProperty;
  } & { checkInOut: TCheckInCheckOut })[];

  const renderPropertyCards = async (
    bookings: (TBooking & { property: TProperty } & { checkInOut: TCheckInCheckOut })[],
    type: string
  ) => {
    const relevantStatuses = type === "current" ? ["CONFIRMED", "ACTIVE"] : ["COMPLETED"];
    if(!bookings){
      return <>No bookings found</>;
    }
    const filteredBookings = bookings.filter((booking) =>
      relevantStatuses.includes(booking.status)
    );

    return await Promise.all(
      filteredBookings.map(async (booking) => {
        if (!booking.property.id || !booking.property.locationId) {
          return <>No bookings found</>;
        }

        const reviews = await getAllReviewsById(booking.property.id);
        const amenities = await getAllAmenitiesForProperty(booking.property.id);
        const images = await getAllImagesbyId(booking.property.id);
        const location = await getLocationById(booking.property.locationId);
        const user = await getUserById(booking.property.userId);

        if (!amenities || !location || !user) {
          console.error("Couldn't get all the props for property: ", booking.property);
          return null;
        }

        return (
          <PropertyCard
            key={booking.property.id}
            property={booking.property}
            location={location}
            reviews={reviews}
            amenities={amenities}
            images={images}
            type="status"
            hostName={user.name}
            hostKindeId={booking.property.userId}
            checkInCheckOutDetail={booking.checkInOut}
            favorites={''}
            status={booking.status}
          />
        );
      })
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Tabs defaultValue="account" className="w-full max-w-5xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">Current/Upcoming Bookings</TabsTrigger>
          <TabsTrigger value="password">Previous Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="flex justify-center w-full">
          <Card className="w-full">
            <CardHeader className="flex flex-col items-center text-center">
              <CardTitle>Current/Upcoming Bookings</CardTitle>
              <CardDescription>All your current bookings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 justify-center">
              {await renderPropertyCards(bookings, "current")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="flex justify-center w-full">
          <Card className="w-full">
            <CardHeader className="flex flex-col items-center text-center">
              <CardTitle>Previous Bookings</CardTitle>
              <CardDescription>
                All your previous bookings will be available here. No entries will display if there are no previous bookings.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 justify-center">
              {await renderPropertyCards(bookings, "previous")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Bookings;
