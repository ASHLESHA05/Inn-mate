import getBookingDetailsByPropertyId from '@/actions/bookingActions';
import { mapKindeUserToUser } from '@/actions/userActions';
import DeleteProperty from '@/components/property/DeleteProperty'
import { TKindeUser } from '@/lib/definitions';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import React from 'react'

type Props = {
    params: Promise<{
      kindeUserId: string;
      propertyId: string;
    }>;
  };
export default async function Deleteprops(props: Props) {
    const params = await props.params;
    const {kindeUserId,propertyId}=params
    const { getUser } = getKindeServerSession();
    const kindeUser = (await getUser()) as TKindeUser;
    if(!kindeUser){
        return(<h1>Sorry..Something went wrong</h1>)
    }
    const user = await mapKindeUserToUser(kindeUser);
    if(!user){
        return(<h1>Sorry..Something went wrong</h1>)
    }

    const bookings=await getBookingDetailsByPropertyId(propertyId)
    return(
        <>
        <DeleteProperty bookings={bookings} userId={user.id}  kindeId={kindeUserId} propertyId={propertyId}/>
        </>
    )
}