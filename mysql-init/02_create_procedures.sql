DELIMITER //

CREATE PROCEDURE AddProperty(
  IN propertyId VARCHAR(191),
  IN userId VARCHAR(191),
  IN name VARCHAR(191),
  IN description VARCHAR(191),
  IN isDeleted BOOLEAN,
  IN pricePerNight DECIMAL(10, 2),
  IN maxGuests INT,
  IN updatedAt DATETIME,
  IN propertyCountry VARCHAR(191),
  IN propertyState VARCHAR(191),
  IN propertyCity VARCHAR(191),
  IN propertyType VARCHAR(191),
  IN roomType VARCHAR(191),
  IN isHotel BOOLEAN,
  IN images JSON,
  IN amenities JSON,
  IN inputLocationId VARCHAR(191)
)
BEGIN
  DECLARE locationId VARCHAR(191);

  -- Check if location exists, else insert and set locationId
  SELECT id INTO locationId
  FROM location
  WHERE country COLLATE utf8mb4_unicode_ci = propertyCountry COLLATE utf8mb4_unicode_ci
    AND state COLLATE utf8mb4_unicode_ci = propertyState COLLATE utf8mb4_unicode_ci
    AND city COLLATE utf8mb4_unicode_ci = propertyCity COLLATE utf8mb4_unicode_ci;

  -- If location doesn't exist, use inputLocationId as new location id
  IF locationId IS NULL THEN
    INSERT INTO location (id, country, state, city)
    VALUES (inputLocationId, propertyCountry, propertyState, propertyCity);
    SET locationId = inputLocationId;
  END IF;

  -- Insert property
  INSERT INTO property (id, userId, name, description, isDeleted, pricePerNight, maxGuests, updatedAt, locationId, propertyType, roomType, isHotel,Current_Space)
  VALUES (propertyId, userId, name, description, isDeleted, pricePerNight, maxGuests, updatedAt, locationId, propertyType, roomType, isHotel,maxGuests);

  -- Insert images if provided
  IF JSON_LENGTH(images) > 0 THEN
    INSERT INTO image (id, propertyId, link)
    SELECT JSON_UNQUOTE(JSON_EXTRACT(img.value, "$.imageId")) AS imageId,
           propertyId,
           JSON_UNQUOTE(JSON_EXTRACT(img.value, "$.link")) AS link
    FROM JSON_TABLE(images, "$[*]" 
        COLUMNS (
            value JSON PATH "$"
        )
    ) AS img
    WHERE JSON_UNQUOTE(JSON_EXTRACT(img.value, "$.link")) IS NOT NULL 
      AND JSON_UNQUOTE(JSON_EXTRACT(img.value, "$.link")) <> '';
  END IF;

  -- Insert amenities if provided
  IF JSON_LENGTH(amenities) > 0 THEN
    INSERT INTO amenity (id, propertyId, name)
    SELECT 
      UUID(), -- Generate a unique ID for each amenity
      propertyId,
      amn.name
    FROM JSON_TABLE(amenities, "$[*]" 
      COLUMNS (
        name VARCHAR(191) PATH "$.name"
      )
    ) AS amn
    WHERE amn.name IN ('WIFI', 'PARKING', 'AIR_CONDITIONING', 'COFFEE', 'PARK', 'POOL', 'GYM', 'KITCHEN', 'TV', 'LAUNDRY', 'PET_FRIENDLY');
  END IF;
END //

CREATE PROCEDURE InsertBookingAndPayment(
    IN bookingId VARCHAR(255),
    IN totalPrice DECIMAL(10, 2),
    IN userId VARCHAR(255),
    IN propertyId VARCHAR(255),
    IN status VARCHAR(50),
    IN Adult INT,
    IN Child INT,
    IN isShared TINYINT(1),
    IN Numberofrooms INT
)
BEGIN
    DECLARE currentTime DATETIME;
    DECLARE isHotels TINYINT(1) DEFAULT 0; -- Default to 0 (not a hotel)
    DECLARE totalRooms INT DEFAULT 0;

    -- Get the current time
    SET currentTime = NOW();

    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    -- Start transaction
    START TRANSACTION;

    -- Insert into booking table
    INSERT INTO booking (id, totalPrice, createdAt, updatedAt, userId, propertyId, status, Adult, Child, isShared)
    VALUES (bookingId, totalPrice, currentTime, currentTime, userId, propertyId, status, Adult, Child, isShared);

    -- Insert into payment table
    INSERT INTO payment (id, amount, paymentDate, bookingId)
    VALUES (UUID(), totalPrice, currentTime, bookingId);

    -- Get the property type (hotel or not)
    SELECT isHotel INTO isHotels 
    FROM property 
    WHERE propertyId = propertyId
    LIMIT 1;

    -- Check if the property is a hotel and if the number of rooms is greater than 0
    IF isHotels = 1 AND Numberofrooms > 0 THEN
        -- Update the current space in the property for hotel properties
        UPDATE property 
        SET Current_Space = Current_Space - Numberofrooms 
        WHERE propertyId = propertyId;
    ELSE
        -- If Numberofrooms is not greater than 0, set totalRooms to 1 (if needed)
        SET totalRooms = 1;
    END IF;

    -- Commit the transaction
    COMMIT;
END //


CREATE PROCEDURE SearchProperties(
    IN p_destination VARCHAR(255),
    IN p_checkIn DATE,
    IN p_checkOut DATE,
    IN p_propertyType VARCHAR(50)
)
BEGIN
    SELECT 
        p.*, 
        l.availabilityStart, 
        l.availabilityEnd
    FROM 
        listing AS l
    JOIN 
        property AS p ON p.id = l.propertyId
    JOIN 
        location AS loc ON loc.id = p.locationId
    WHERE 
        1 = 1
        -- Destination filter using LIKE
        AND (p_destination IS NULL OR 
             CONCAT(p.name, ' ', p.description, ' ', loc.city, ' ', loc.state, ' ', loc.country) LIKE CONCAT('%', p_destination, '%'))
        -- Availability filter
        AND (p_checkIn IS NULL OR p_checkOut IS NULL OR 
             (l.availabilityStart <= p_checkIn AND l.availabilityEnd >= p_checkOut))
        -- Property type filter
        AND (p_propertyType IS NULL OR p.propertyType = p_propertyType);
END //

CREATE PROCEDURE InsertCheckInCheckOutAndFetchBooking(
    IN p_bookingId VARCHAR(255),
    IN p_totalPrice DECIMAL(10, 2),
    IN p_userId VARCHAR(255),
    IN p_propertyId VARCHAR(255),
    IN p_status VARCHAR(50),
    IN p_checkInDate DATE,
    IN p_checkOutDate DATE,
    IN checkinoutID VARCHAR(225) , 
    IN Adult INT,
    IN Child INT
)
BEGIN
    DECLARE bookingExists BOOLEAN DEFAULT FALSE;

    -- Check if check-in/check-out data is provided (i.e., if dates are non-null)
    IF p_checkInDate IS NOT NULL AND p_checkOutDate IS NOT NULL THEN
        -- Insert check-in/check-out record
        INSERT INTO checkIncheckOut (id, checkInDate, checkOutDate, bookingId)
        VALUES (checkinoutID, p_checkInDate, p_checkOutDate, p_bookingId);
    END IF;
    
    -- Fetch and return the full booking data with checkInOut included
    SELECT b.*, c.checkInDate, c.checkOutDate
    FROM booking AS b
    LEFT JOIN checkIncheckOut AS c ON b.id = c.bookingId
    WHERE b.id = p_bookingId;
END //

CREATE PROCEDURE insert_new_listing(
  IN p_newListingId VARCHAR(225),
  IN p_availabilityStart DATETIME,
  IN p_availabilityEnd DATETIME,
  IN p_userId VARCHAR(255),
  IN p_propertyId VARCHAR(255)
)
BEGIN


  INSERT INTO listing (id, availabilityStart, availabilityEnd, updatedAt, userId, propertyId)
  VALUES (p_newListingId, p_availabilityStart, p_availabilityEnd, NOW(), p_userId, p_propertyId);

  SELECT * FROM listing AS l WHERE l.id = p_newListingId COLLATE utf8mb4_unicode_ci;

END //

DELIMITER ;
