import { getAllAmenitiesForProperty } from "@/actions/amenitiesAction";
import { getListing } from "@/actions/listingActions";
import { getLocationById } from "@/actions/locationActions";
import {
  getAllImagesbyId,
  getAllPropertiesByUserId,
} from "@/actions/propertyActions";
import { getAllReviewsById } from "@/actions/reviewActions";
import { getUserByKindeId } from "@/actions/userActions";
import AddProperty from "@/components/property/AddProperty";
import PropertyCard from "@/components/property/Property";
import { TKindeUser } from "@/lib/definitions";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import React from "react";

const MyProperties = async () => {
  const { getUser, isAuthenticated } = getKindeServerSession();
  const kindeUser = (await getUser()) as TKindeUser;

  if (!kindeUser || !isAuthenticated) {
    return <h2>Sorry You are not authorized to see this route</h2>;
  }

  const user = await getUserByKindeId(kindeUser.id);
  if (!user || !user.id || !isAuthenticated) {
    console.log("couldn't get the user in /user/userId/properties");
    return (<div>sorry couldn&apos;t fetch the user</div>);
  }

  const properties = await getAllPropertiesByUserId(user.id);
  console.log("Properties",properties)
  if (!properties) {
    return (<div>sorry couldn&apos;t fetch the properties</div>);
  }

  const propertyCards = await Promise.all(
    properties.map(async (property) => {
      if (!property.id || !property.locationId) {
        return null;
      }
      const reviews = await getAllReviewsById(property.id);
      const amenities = await getAllAmenitiesForProperty(property.id);
      const images = await getAllImagesbyId(property.id);
      const location = await getLocationById(property.locationId);
      const isListed = await getListing(user.id, property.id);

      if (!amenities || !location) {
        console.error("couldn't get all the props for property: ", property);
        return null;
      }
      return (
        <PropertyCard
          key={property.id}
          property={property}
          location={location}
          reviews={reviews}
          amenities={amenities}
          images={images}
          type={isListed ? "view" : "list"}
          hostKindeId={kindeUser.id}
          hostName={user.name}
          favorites={''}
          status = {null}
        />
      );
    })
  );

  return (
    <div className="w-full">
      <AddProperty userId={user.id} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {propertyCards.filter(Boolean)}
      </div>
    </div>
  );
};

export default MyProperties;
