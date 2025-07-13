"use server";

import prisma from "@/lib/db";
import {
  kindeUserSchema,
  TBooking,
  TKindeUser,
  TUser,
  userSchema,
} from "@/lib/definitions";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs/types";
import { revalidatePath } from "next/cache";
import nodemailer from 'nodemailer';
import { getPropertyById } from "./propertyActions";
import cuid from "cuid";

export async function getUserById(id_: string | undefined): Promise<TUser | null> {
  if (!id_) return null;

  const result:TUser[] = await prisma.$queryRaw`
    SELECT u.*,city,state,country 
    FROM User as u
    JOIN Address as p
    on u.addressId = p.id
    WHERE u.id = ${id_}
  `;
  
  if (!result) {
    return null;
  }

  const user = result[0]; // Assuming you expect a single user result.
  return user;
}

export async function getUserByKindeId(kindeId: string): Promise<TUser | null> {
  const result:TUser[] = await prisma.$queryRaw`
    SELECT u.*,city,state,country 
    FROM User as u
    JOIN Address as p
    on u.addressId = p.id
    WHERE kindeId = ${kindeId}
  `;
  
  if (!result) {
    return null;
  }

  const user = result[0];
  return user;
}


export async function isAuthenticatedUserInDb(id: string): Promise<TUser | null> {
  if (!id) return null;

  try{
  const result:TUser[] = await prisma.$queryRaw`
    SELECT u.*, city, state,country 
    FROM User as u 
    JOIN Address as ad
    ON  u.addressId = ad.id
    WHERE u.id = ${id}
  `;
  
  if (!result) {
    return null;
  }

  const user = result[0];
  return user;

}catch (error) {
  console.error("Error finding the user: ", error);
  return null;
}
}


export async function createUser(user: TUser): Promise<TUser | null> {

  try{
  const validatedUser = userSchema.parse(user);
  const { name, email, dob, gender, address, kindeId } = validatedUser;
  

  // Check if the user already exists based on the email
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // If the user already exists, return the existing user
      throw new Error("User already exists, try upadating");
  }

  // Generate a cuid for the address
  const addressId = cuid();

  // Insert into address table first
  await prisma.$queryRaw`
    INSERT INTO Address (id, city, state, country)
    VALUES (${addressId}, ${address.city}, ${address.state}, ${address.country})
  `;
  const addressResult : any=  prisma.$queryRaw`
    SELECT * FROM Address where id=${addressId}
  `

  // If the address insertion failed, return null
  if (!addressResult || addressResult.length === 0) {
    return null;
  }

  // Generate a cuid for the user
  const userId = cuid();

  // Insert into user table
  await prisma.$queryRaw`
    INSERT INTO User (id, name, email, dob, gender, UpdatedAt,kindeId, addressId)
    VALUES (${userId}, ${name}, ${email}, ${dob}, ${gender},${new Date()}, ${kindeId}, ${addressId})
  `;
  const userResult: TUser[]= await prisma.$queryRaw`
    SELECT u.*, city, state, country FROM User as u 
    JOIN Address as ad ON u.addressId = ad.id
  `

  // If the user insertion failed, return null
  if (!userResult || userResult.length === 0) {
    return null;
  }

  const newUser = userResult[0];
  revalidatePath("/");
  return newUser;
}catch (error) {
  console.error("Error creating user:", error);
  return null;
}
}


export async function updateUser(user: TUser): Promise<TUser | null> {
  const validatedUser = userSchema.parse(user);

  const { id, name, email, dob, gender, address } = validatedUser;


  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    // If the user already exists, return the existing user
      throw new Error("User Not exists, try Creating");
  }

  
const addressResult: { addressId: string }[] = await prisma.$queryRaw`
  SELECT addressId FROM User WHERE id = ${id}
`;

// Extract the address ID if it exists
const AddId = addressResult[0]?.addressId || cuid();

if (!addressResult[0]?.addressId) {
  // Create new address if none exists
  await prisma.$queryRaw`
    INSERT INTO Address (id, city, state, country)
    VALUES (${AddId}, ${address.city}, ${address.state}, ${address.country})
  `;
} else {
  // Update existing address if addressId exists
  await prisma.$queryRaw`
    UPDATE Address
    SET city = ${address.city}, state = ${address.state}, country = ${address.country}
    WHERE id = ${AddId}
  `;
}




  // Update the user
  await prisma.$queryRaw`
    UPDATE User as u
    SET name = ${name}, email = ${email}, dob = ${dob}, gender = ${gender}, addressId = ${AddId}
    WHERE id = ${id} `

  const userResult:TUser[] = await prisma.$queryRaw`
    SELECT u.*,city,state, country FROM User as u
    JOIN Address as ad on u.addressId=ad.id
    WHERE u.id=${id}

  `;
  
  if (!userResult) {
    return null;
  }
  const userUpdate: TUser[]= await prisma.$queryRaw`
      SELECT u.*, city, state, country
      FROM User AS u
      JOIN Address AS ad ON u.addressId = ad.id
      WHERE u.id = ${id}
  `
  const updatedUser = userUpdate[0];
  return updatedUser;
}


export async function deleteUser(user: TUser): Promise<TUser | null> {
  const validatedUser = userSchema.parse(user);
  const { id, address } = validatedUser;
  const addressId = address.id;
  // Delete the address
  await prisma.$queryRaw`
    DELETE FROM Address
    WHERE id = ${addressId}
  `;

  // Delete the user
  const userResult : TUser[]= await prisma.$queryRaw`
    DELETE FROM User
    WHERE id = ${id}
    RETURNING *
  `;
  
  if (!userResult) {
    return null;
  }

  const deletedUser = userResult[0];
  return deletedUser;
}


export async function mapKindeUserToUser(user: TKindeUser): Promise<TUser | null> {
  // const { kindeId, email, given_name, dob, gender } = user;

  try {
    // Validate the incoming user data using the schema
    const kindeUser = user as KindeUser<TKindeUser>;
    console.log("kinde user in server action", kindeUser);
    try {
      const validatedKindeUser = kindeUserSchema.parse(kindeUser);
  
//! MAP KINDE USER TO USER
      const alreadyUser: TUser[] = await prisma.$queryRaw`
        SELECT u.*, city , state, country FROM User as u
        JOIN Address as ad ON u.addressId=ad.id
        WHERE u.kindeId=${user.id}
      `

      const mappeduser=alreadyUser[0]
      if (alreadyUser && alreadyUser.length > 0) {
        return mappeduser;
      }
      const userNew: TUser = {
        address: {
          city: "",
          country: "",
          state: "",
        },
        kindeId: validatedKindeUser.id,
        dob: new Date(),
        email: validatedKindeUser.email,
        name: validatedKindeUser.given_name,
        gender: "OTHERS",
      };
      return userNew;
  } catch (error) {
    console.error("Error in mapping the user to kindeUser: ", error);
    return null;
  }
}catch (error) {
  console.error("Error in mapping the user to kindeUser: ", error);
  return null;
}

}

export default async function SendMailToUsers(bookingDataList: TBooking[]) {
  try {
    // Configure your SMTP transport (e.g., Gmail or other email service)
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Or another email service provider
      auth: {
        user: process.env.SMTP_USER, // Your email address
        pass: process.env.SMTP_PASS, // Your email password or app-specific password
      },
    });

    for (const bookingData of bookingDataList) {
      const userId = bookingData.userId;
      const user = await getUserById(userId);
      const prop = await getPropertyById(bookingData.propertyId);
      const propName = prop?.name;

      if (!user || !user.email) {
        console.error(`User not found or email not available for user ID ${userId}`);
        continue;
      }

      const userEmail = user.email;
      const subject = 'Booking Cancellation Notice';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
          <h1 style="color: #333;">Dear ${user.name},</h1>
          <p style="color: #555;">We regret to inform you that your booking has been canceled by the admin. <strong style="color: red;">This property is no longer available.</strong> We sincerely apologize for the inconvenience this may cause.</p>
          
          <h2 style="color: #333;">Booking Details:</h2>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Booking ID:</strong> ${bookingData.id}</li>
            <li><strong>Property:</strong> ${propName}</li>
            <li><strong>Check-in:</strong> ${bookingData.checkInOut?.checkInDate}</li>
            <li><strong>Check-out:</strong> ${bookingData.checkInOut?.checkOutDate}</li>
            <li><strong>Total Price:</strong> $${bookingData.totalPrice}</li>
          </ul>
          
          <p style="color: #555;">As a token of our apology, we will issue a full refund for your booking. Please allow 3-5 business days for the refund to process.</p>
          
          <p style="color: #555;">Thank you for your understanding. If you have any further questions or need assistance, feel free to reach out to our support team.</p>
          
          <p style="color: #555;">Best regards,</p>
          <p style="color: #555;">The Team</p>
          <footer style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; color: #777;">
            <p>Contact us: support@example.com | Phone: +1 234 567 890</p>
            <p>Follow us on <a href="https://twitter.com/example" style="color: #1DA1F2;">Twitter</a> and <a href="https://facebook.com/example" style="color: #1877F2;">Facebook</a></p>
          </footer>
        </div>
      `;

      const mailOptions = {
        from: 'no-reply@example.com', // Your email or service email
        to: userEmail,
        subject,
        html: htmlContent,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Cancellation email sent successfully to:', userEmail);
        return 200
      } catch (error) {
        console.error(`Error sending email to ${userEmail}:`, error);
        return null
      }
    }
  } catch (error) {
    console.error('Error processing bookings:', error);
    return null
  }
}

// Assuming TBooking type is defined elsewhere in your project
export async function BookingCnfMail(bookingData: TBooking, transactionId: string) {
  try {
    // Configure SMTP transport
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.SMTP_USER, // Your email address
        pass: process.env.SMTP_PASS, // Your email password or app-specific password
      },
    });

    const userId = bookingData.userId;
    const user = await getUserById(userId); // Assume this function fetches user details
    const prop = await getPropertyById(bookingData.propertyId); // Assume this function fetches property details
    const propName = prop?.name;
    const currentDateTime = new Date().toLocaleString();

    if (!user || !user.email) {
      console.error(`User not found or email not available for user ID ${userId}`);
      return;
    }

    const userEmail = user.email;
    const subject = 'Booking Confirmation';

    // Parsing and formatting dates
    const checkInDate = bookingData.checkInOut?.checkInDate
      ? new Date(bookingData.checkInOut.checkInDate).toLocaleDateString()
      : "N/A";
    const checkOutDate = bookingData.checkInOut?.checkOutDate
      ? new Date(bookingData.checkInOut.checkOutDate).toLocaleDateString()
      : "N/A";

    // HTML content with CSS styling
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9;">

      <div style="display: flex; align-items: left; margin-bottom: 20px;">
      <h2 style="color: #4CAF50; font-size: 24px; margin: 0;">INNMATE</h2>
    </div>

        <h1 style="color: #4CAF50; text-align: center;">Booking Confirmation</h1>
        
        <p style="color: #333; text-align: center;">Dear ${user?.name},</p>
        <p style="color: #555; text-align: center;">We are excited to let you know that your booking was successful! Here are your booking details:</p>
        
        <div style="background-color: #fff; padding: 15px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Booking Details</h2>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Booking ID:</strong> ${bookingData.id ? bookingData.id : ''}</li>
            <li><strong>Transaction ID:</strong> ${transactionId}</li>
            <li><strong>Property:</strong> ${propName}</li>
            <li><strong>Check-in Date:</strong> ${checkInDate}</li>
            <li><strong>Check-out Date:</strong> ${checkOutDate}</li>
            <li><strong>Total Price:</strong> $${bookingData.totalPrice}</li>
            <li><strong>Booking Date:</strong> ${currentDateTime}</li>
          </ul>
        </div>
        
        <p style="color: #555; margin-top: 20px;">Thank you for choosing our service. We look forward to making your stay comfortable and memorable.</p>
        
        <p style="color: #555; margin-top: 20px; text-align: center;">Best regards,</p>
        <p style="color: #333; text-align: center;"><strong>The Team</strong></p>

        <footer style="margin-top: 20px; text-align: center; color: #888;">
          <p>Contact us: support@example.com | Phone: +1 234 567 890</p>
          <p>Follow us on <a href="https://twitter.com/example" style="color: #1DA1F2; text-decoration: none;">Twitter</a> and <a href="https://facebook.com/example" style="color: #1877F2; text-decoration: none;">Facebook</a></p>
        </footer>
      </div>
    `;

    const mailOptions = {
      from: 'no-reply@example.com', // Your email or service email
      to: userEmail,
      subject,
      html: htmlContent,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Booking confirmation email sent successfully to:', userEmail);
    } catch (error) {
      console.error(`Error sending email to ${userEmail}:`, error);
    }

  } catch (error) {
    console.error('Error processing booking confirmations:', error);
  }
}
