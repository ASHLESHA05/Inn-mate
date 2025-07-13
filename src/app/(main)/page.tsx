import { getAllAmenitiesForProperty } from "@/actions/amenitiesAction";
import { getLocationById } from "@/actions/locationActions";
import {
  getAllImagesbyId,
  getAllListedProperties,
  getFilteredListings,
} from "@/actions/propertyActions";
import { getAllReviewsById } from "@/actions/reviewActions";
import { getUserById } from "@/actions/userActions";
import PropertyCard from "@/components/property/Property";
import { TKindeUser } from "@/lib/definitions";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import PropTypesSelect from "@/components/propertyTypes/propTypes";
import Footer from "@/components/footer/footer";
import AboutUs from "@/components/contents/Aboutus";
import NoPropertyAvailable from "@/components/property/noProps";

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  try{
  const { getUser } = getKindeServerSession();
  const kindeUser = (await getUser()) as TKindeUser;
  console.log("User:", kindeUser);
  }catch(error){
    console.log("Finding User Error")
  }

  // Utility: Handle string | string[] | undefined
  const getParam = (key: string): string | undefined => {
    const value = searchParams[key];
    if (Array.isArray(value)) return value[0]?.trim() || undefined;
    return value?.trim() || undefined;
  };

  // Utility: Convert to YYYY-MM-DD string or undefined
  const toDateStringOrUndefined = (value?: string): string | undefined => {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date.toISOString().split('T')[0];
  };

  // Extract & sanitize search params
  const destination = getParam("dest");
  const checkIn = toDateStringOrUndefined(getParam("ci"));
  const checkOut = toDateStringOrUndefined(getParam("co"));
  const typeParam = getParam("type");
  const type = typeParam && typeParam !== "Any" ? typeParam : undefined;

  console.log("Parsed search params:", { destination, checkIn, checkOut, type });

  // Fetch properties
  const properties =
    destination || checkIn || checkOut || type
      ? await getFilteredListings(destination, checkIn, checkOut, type)
      : await getAllListedProperties();

  console.log("Fetched properties:", properties);

  // Handle no results
  if (!properties || properties.length === 0) {
    return <NoPropertyAvailable />;
  }

  // Build property cards
  const propertyCards = await Promise.all(
    properties.map(async (property) => {
      if (!property?.id || !property?.locationId) {
        console.warn("Skipping invalid property:", property);
        return null;
      }

      const [reviews, amenities, images, location, user] = await Promise.all([
        getAllReviewsById(property.id),
        getAllAmenitiesForProperty(property.id),
        getAllImagesbyId(property.id),
        getLocationById(property.locationId),
        getUserById(property.userId),
      ]);

      if (!amenities || !location || !user) {
        console.error("Couldn't fetch all details for property:", property);
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
          type="book"
          hostName={user.name}
          hostKindeId={property.userId}
          favorites=""
          status={null}
        />
      );
    })
  );

  return (
    <>
      <PropTypesSelect />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {propertyCards.filter(Boolean).length > 0 ? (
          propertyCards.filter(Boolean)
        ) : (
          <div className="text-red-600 text-center font-semibold text-lg w-full mt-8">
            No property available
          </div>
        )}
      </div>
      <AboutUs />
      <Footer />
    </>
  );
}
