'use client'
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
import {
  Bed,
  Users,
  Star,
  Wifi,
  CarFront,
  AirVent,
  Coffee,
  Shrub,
  Waves,
  Dumbbell,
  Microwave,
  Tv2,
  WashingMachine,
  Dog,
} from "lucide-react";
import {
  TProperty,
  TReview,
  TImage,
  TLocation,
  TAmenity,
  TCheckInCheckOut,
} from "@/lib/definitions";
import BookPropertyButton from "./BookPropertyButton";
import ListPropertyButton, { EditProperty } from "./ListNowButton";
import FavoriteButton from './FavoritesButton';
import ViewPropertyButton from "./ViewPropertyButton";

interface PropertyCardProps {
  property: TProperty;
  reviews: TReview[] | null;
  images: TImage[] | null;
  location: TLocation;
  amenities: TAmenity[];
  type: "book" | "list" | "view" | "status" | "edit";
  hostName: string;
  hostKindeId?: string;
  favorites:string;
  status: "CONFIRMED" | 'ACTIVE' | 'COMPLETED' | null;
  checkInCheckOutDetail?: TCheckInCheckOut;
}

export default function PropertyCard({
  property,
  reviews,
  images,
  location,
  amenities,
  type,
  hostKindeId,
  hostName,
  checkInCheckOutDetail,
  status,
}: PropertyCardProps) {

  // If favorites is an empty string, show all properties
  
  let averageRating;
  let imageLink;
  
  if (reviews) {
    averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : null;
  }
  if (images && images?.length !== 0) {
    imageLink = images[0].link;
  } else {
    imageLink =
      "https://images.unsplash.com/photo-1579297206620-c410c4af42e4?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  }
  const amenityIcons: { [key: string]: React.ElementType } = {
    WIFI: Wifi,
    PARKING: CarFront,
    AIR_CONDITIONING: AirVent,
    COFFEE: Coffee,
    PARK: Shrub,
    POOL: Waves,
    GYM: Dumbbell,
    KITCHEN: Microwave,
    TV: Tv2,
    LAUNDRY: WashingMachine,
    PET_FRIENDLY: Dog,
  };
  // console.log("Image link: ", imageLink);
  // console.log("CheckIn CheckOut in the Property Card: ", checkInCheckOutDetail);

  return (
    <Card className="w-full max-w-sm mx-auto">
      <div className="relative aspect-square">
        <Image
          src={imageLink}
          alt={property.name}
          fill
          className="object-cover rounded-t-lg"
        />
        <FavoriteButton propertyId={property.id ||   ''} /> {/* Pass propertyId here */}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-lg font-semibold line-clamp-1">
              {property.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {location.city}, {location.country}
            </p>
          </div>
          {averageRating !== null && (
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-primary text-primary mr-1" />
              <span className="text-sm font-medium">
                {averageRating?.toFixed(1)}
              </span>

            </div>
          )}

          {
          status && (
          <div>
            <h1>Status: </h1>
            <span 
              style={{
                color: status === 'CONFIRMED' ? 'green' : 
                      status === 'ACTIVE' ? 'red' : 
                      status === 'COMPLETED' ? 'brown' : 'black' 
              }}
            >
              {status}
            </span>
          </div>
          )
            }

        </div>
        <p className="text-sm line-clamp-2 mb-2">{property.description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            <span>{property.propertyType}</span>
          </div>

          

          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>
                {property.isHotel 
                  ? (property.maxGuests !== 0 ? 'Rooms Available' : 'No Rooms Available') 
                  : `Up to ${property.maxGuests} guests`}
            </span>
          </div>
        { (property.isHotel && property.RoomType) ?
        <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1 text-blue-500" /> {/* Bed icon with custom color */}
                  <span className="text-blue-500 font-semibold bg-blue-100 px-1 rounded">
                         Room Type: {property.RoomType}
                  </span>
          </div> : ""
        
                }
  
        </div>
        <div className="flex flex-wrap gap-1">
          {amenities.slice(0, 3).map((amenity) => {
            const Icon = amenityIcons[amenity.name];
            return (
              <div key={amenity.id} className="flex items-center">
                {Icon && (
                  <Icon className="h-5 w-5 mr-2 bg-secondary rounded-md " />
                )}{" "}
                {/* <span>{amenity.name}</span> */}
              </div>
            );
          })}
          {amenities.length > 3 && (
            <Badge variant="secondary">+{amenities.length - 3} more</Badge>
          )}
        </div>
        <h3>
          Hosted by: <span className="font-semibold"> {hostName}</span>
        </h3>
        {type === "status" && (
          <>
          <h3>
            Booked from{" "}
            <span className="font-semibold">
              {checkInCheckOutDetail?.checkInDate.toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>{"   "}
            to{" "}
            <span className="font-semibold">
              {checkInCheckOutDetail?.checkOutDate.toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            
            </span>
          </h3>
          </>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
  <div>
    <span className="text-lg font-bold">₹{property.pricePerNight}</span>
    <span className="text-sm text-muted-foreground"> / night</span>
  </div>
        {type === "book" && (
          <BookPropertyButton propertyId={property.id} />
        )}
        {type === "list" && (
          <ListPropertyButton
            propertyId={property.id}
            kindeUserId={hostKindeId}
          />
        )}

        </CardFooter>
        {(type !== 'book' && type !== 'list' && type !== 'status') ? (
  <>
    <div className="flex justify-center space-x-2">
      <EditProperty propertyId={property.id} kindeUserId={hostKindeId} />
      {/* <ListPropertyButton propertyId={property.id} kindeUserId={hostKindeId} /> */}
      <ViewPropertyButton propertyId={property.id} />
    </div>
  </>
) : (
  <>
    { 
    (status && ['CONFIRMED', 'ACTIVE'].includes(status)) && (
    
      <ViewPropertyButton propertyId={property.id} />
    )}
    <div></div>
  </>
)}

    </Card>
    
  );
}
