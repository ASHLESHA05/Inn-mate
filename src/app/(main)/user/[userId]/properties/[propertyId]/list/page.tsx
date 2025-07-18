import { getAllAmenitiesForProperty } from "@/actions/amenitiesAction";
import { getLocationById } from "@/actions/locationActions";
import { getAllImagesbyId, getPropertyById } from "@/actions/propertyActions";
import { getAllReviewsById } from "@/actions/reviewActions";
import { getUserById} from "@/actions/userActions";
import ListProperty from "@/components/property/ListProperty";
import React from "react";

const page = async (
  props: {
    params: Promise<{ propertyId: string; userId: string }>;
  }
) => {
  const params = await props.params;
  const property = await getPropertyById(params.propertyId);
  if (!property || !property.id || !property.locationId) {
    return (<div>Invalid property Id</div>);
  }

  const [images, location ,user] = await Promise.all([
    // await getAllAmenitiesForProperty(property.id),
    await getAllImagesbyId(property.id),
    await getLocationById(property.locationId),
    // await getAllReviewsById(property.id),
    await getUserById(property.userId),
  ]);
  if (!user || !location) {
    return (<div>Sorry couldn't get all details about the propery</div>);
  }
  if (!property || !user || !location) {
    return (<div>Sorry, you're probably looking for something else?</div>);
  }
  return (
    <ListProperty
      property={property}
      user={user}
      location={location}
      images={images}
    />
  );
};

export default page;
