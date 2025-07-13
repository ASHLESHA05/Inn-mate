DELIMITER //

CREATE TRIGGER UpdatePropertyMaxGuestsHotel
AFTER INSERT ON Booking
FOR EACH ROW
BEGIN
    -- Check if the propertyId is not NULL and the property is a hotel
    IF NEW.propertyId IS NOT NULL THEN
        UPDATE Property
        SET Current_Space = Current_Space - 1
        WHERE id = NEW.propertyId AND isHotel = 1;
    END IF;
END //

CREATE TRIGGER UpdatePropertyMaxGuests
AFTER INSERT ON Booking
FOR EACH ROW
BEGIN
    -- Update the Current_Space of the property associated with the booking
    IF NEW.propertyId IS NOT NULL AND NEW.isShared = 1 THEN
        UPDATE Property
        SET Current_Space = Current_Space - (NEW.Adult + NEW.Child)
        WHERE id = NEW.propertyId;
    END IF;
END //

CREATE TABLE IF NOT EXISTS Deletion_Log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    propertyId VARCHAR(255) NOT NULL,
    userId VARCHAR(255) NOT NULL,
    name VARCHAR(225) NOT NULL,
    price VARCHAR(225) NOT NULL,
    deletedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DELIMITER $$

CREATE TRIGGER LogPropertyDeletion
BEFORE DELETE ON Property
FOR EACH ROW
BEGIN
    -- Log the deletion of the property
    INSERT INTO Deletion_Log (propertyId, userId, name, price)
    VALUES (OLD.id, OLD.userId, OLD.name, OLD.pricePerNight);
END $$

DELIMITER //

CREATE TRIGGER ResetPropertyStatusAfterBookingCompletion
AFTER UPDATE ON Booking
FOR EACH ROW
BEGIN
    -- Check if the booking status is updated to 'COMPLETED'
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        -- Reset Current_Space to maxGuests
        UPDATE Property
        SET Current_Space = maxGuests
        WHERE id = NEW.propertyId;
    END IF;
END //

CREATE EVENT UpdateBookingStatus
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    -- Set bookings to 'ACTIVE' if check-in date is today or earlier and check-out is in the future
    UPDATE Booking
    SET status = 'ACTIVE'
    WHERE checkinDate <= CURDATE() AND checkoutDate > CURDATE();

    -- Set bookings to 'COMPLETED' if check-out date is today or earlier
    UPDATE Booking
    SET status = 'COMPLETED'
    WHERE checkoutDate <= CURDATE();
END //

-- CREATE TRIGGER AfterPropertyInsert
-- AFTER INSERT ON Property
-- FOR EACH ROW
-- BEGIN
--     -- Update 'Current_Space' to match 'maxGuests'
--     UPDATE Property
--     SET Current_Space = NEW.maxGuests
--     WHERE id = NEW.id;
-- END //

-- DELIMITER ;
