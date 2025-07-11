DELIMITER //

CREATE TRIGGER UpdatePropertyMaxGuestsHotel
AFTER INSERT ON booking
FOR EACH ROW
BEGIN
    -- Check if the propertyId is not NULL and the property is a hotel
    IF NEW.propertyId IS NOT NULL  THEN
        UPDATE property 
        SET Current_Space = Current_Space - 1
        WHERE id = NEW.propertyId AND isHotel=1;
    END IF;
END //

CREATE TRIGGER UpdatePropertyMaxGuests
AFTER INSERT ON booking
FOR EACH ROW
BEGIN
    -- Update the maxGuests of the property associated with the booking
    IF NEW.propertyId IS NOT NULL AND NEW.isShared = 1 THEN
        UPDATE property 
        SET Current_space = Current_space - (NEW.Adult + NEW.Child)
        WHERE id = NEW.propertyId;
    END IF;
END //

CREATE TABLE IF NOT EXISTS deletion_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    propertyId VARCHAR(255) NOT NULL,
    userId VARCHAR(255) NOT NULL,
    name VARCHAR(225) NOT NULL,
    price VARCHAR(225) NOT NULL,
    deletedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Create the trigger to log deletions
  DELIMITER $$

  CREATE TRIGGER log_property_deletion
  BEFORE DELETE ON property
  FOR EACH ROW
  BEGIN
    -- Log the deletion of the property
    INSERT INTO deletion_log (propertyId,userId,name,price) VALUES (OLD.id,OLD.userId,OLD.name,OLD.pricePerNight);
  END //

CREATE TRIGGER ResetPropertyStatusAfterBookingCompletion
AFTER UPDATE ON booking
FOR EACH ROW
BEGIN
    -- Check if the booking status is updated to 'COMPLETED'
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        -- Update the associated property to reset Current_Space and isShared
        UPDATE property
        SET 
            Current_space = maxGuests,  -- Reset Current_Space to maxGuests
        WHERE id = NEW.propertyId;      -- Assuming `propertyId` links to the `property` table
    END IF;
END //

CREATE EVENT update_booking_status
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
  -- Set bookings to 'ACTIVE' if the check-in date is today or earlier and check-out is in the future
  UPDATE booking
  SET status = 'ACTIVE'
  WHERE checkinDate <= CURDATE() AND checkoutDate > CURDATE();

  -- Set bookings to 'COMPLETED' if the check-out date is today or earlier
  UPDATE booking
  SET status = 'COMPLETED'
  WHERE checkoutDate <= CURDATE();
END //

CREATE TRIGGER after_property_insert
AFTER INSERT ON property
FOR EACH ROW
BEGIN
    -- Update the 'Current_space' to match 'maxGuests' and set 'isShared' to 0 (false)
    UPDATE property
    SET Current_space = NEW.maxGuests
    WHERE id = NEW.id;
END //

DELIMITER ;
