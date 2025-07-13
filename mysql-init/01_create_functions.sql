DELIMITER $$

CREATE FUNCTION add_to_favourites(
    p_id VARCHAR(255),
    p_userId VARCHAR(255),
    p_propertyId VARCHAR(255)
) RETURNS VARCHAR(255)
    NOT DETERMINISTIC
    MODIFIES SQL DATA
BEGIN
    DECLARE fav_id VARCHAR(225);

    IF p_id IS NOT NULL THEN
        INSERT INTO Favourite (id, userId, propertyId)
        VALUES (p_id, p_userId, p_propertyId);

        SET fav_id = LAST_INSERT_ID();
    ELSE
        UPDATE Favourite
        SET userId = p_userId, propertyId = p_propertyId
        WHERE id = p_id;

        SET fav_id = p_id;
    END IF;

    RETURN fav_id;
END $$


CREATE FUNCTION match_destination(
    prop_name VARCHAR(255), 
    prop_description TEXT, 
    prop_city VARCHAR(255), 
    prop_state VARCHAR(255), 
    prop_country VARCHAR(255), 
    destination VARCHAR(255)
) 
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    RETURN 
        LOWER(prop_name) LIKE CONCAT('%', LOWER(destination), '%') OR
        LOWER(prop_description) LIKE CONCAT('%', LOWER(destination), '%') OR
        LOWER(prop_city) LIKE CONCAT('%', LOWER(destination), '%') OR
        LOWER(prop_state) LIKE CONCAT('%', LOWER(destination), '%') OR
        LOWER(prop_country) LIKE CONCAT('%', LOWER(destination), '%');
END $$

CREATE PROCEDURE get_active_bookings(IN propertyId INT)
BEGIN
    SELECT
        b.*,
        p.name, p.description, p.Pricepernight, p.maxGuests,
        p.propertytype, p.isHotel, p.isDeleted, p.RoomType,
        p.locationId,
        c.checkInDate, c.checkOutDate,
        b.totalPrice, b.userId
    FROM Booking AS b
    JOIN Property AS p ON b.propertyId = p.id
    JOIN CheckIncheckOut AS c ON b.id = c.bookingId
    WHERE
        p.id = propertyId
        AND p.isDeleted = false
        AND b.status IN ('ACTIVE', 'CONFIRMED');
END $$

DELIMITER ;
