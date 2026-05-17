BEGIN;

INSERT INTO "User" ("Login", "Password", "Email", "Phone", "Role")
VALUES
    ('admin', 'Admin123!', 'admin@hotel.local', '+7 (900) 000-00-01', 'admin'),
    ('guest', 'Guest123!', 'guest@hotel.local', '+7 (900) 000-00-02', 'guest'),
    ('family', 'Family123!', 'family@hotel.local', '+7 (900) 000-00-03', 'guest')
ON CONFLICT ("Login") DO NOTHING;

INSERT INTO "Guest" ("UserId", "Surname", "FirstName", "Patronymic", "Birthdate", "Passport")
SELECT u."UserId", 'Иванов', 'Иван', 'Иванович', DATE '1998-04-12', '4510 123456'
FROM "User" u
WHERE u."Login" = 'guest'
ON CONFLICT ("Passport") DO NOTHING;

INSERT INTO "Guest" ("UserId", "Surname", "FirstName", "Patronymic", "Birthdate", "Passport")
SELECT u."UserId", 'Иванова', 'Мария', 'Сергеевна', DATE '2000-07-03', '4511 123457'
FROM "User" u
WHERE u."Login" = 'guest'
ON CONFLICT ("Passport") DO NOTHING;

INSERT INTO "Guest" ("UserId", "Surname", "FirstName", "Patronymic", "Birthdate", "Passport")
SELECT u."UserId", 'Петров', 'Алексей', NULL, DATE '1993-11-21', '4512 123458'
FROM "User" u
WHERE u."Login" = 'family'
ON CONFLICT ("Passport") DO NOTHING;

INSERT INTO "Guest" ("UserId", "Surname", "FirstName", "Patronymic", "Birthdate", "Passport")
SELECT u."UserId", 'Петрова', 'Анна', NULL, DATE '1995-08-09', '4513 123459'
FROM "User" u
WHERE u."Login" = 'family'
ON CONFLICT ("Passport") DO NOTHING;

INSERT INTO "RoomType" ("TypeName", "Description", "MaxGuests", "PricePerNight")
VALUES
    ('Standard', 'Уютный номер для 1–2 гостей', 2, 3490.00),
    ('Deluxe', 'Улучшенный номер с рабочей зоной', 3, 5490.00),
    ('Suite', 'Номер повышенной комфортности', 4, 8990.00)
ON CONFLICT DO NOTHING;

INSERT INTO "Room" ("RoomTypeId", "RoomNumber", "Floor", "Status", "PhotoUrl")
SELECT rt."RoomTypeId", v.room_number, v.floor, 'available', v.photo_url
FROM (
    VALUES
        ('Standard', '101', 1, '/images/room-standard.svg'),
        ('Standard', '102', 1, '/images/room-standard.svg'),
        ('Deluxe', '201', 2, '/images/room-deluxe.svg'),
        ('Deluxe', '202', 2, '/images/room-deluxe.svg'),
        ('Suite', '301', 3, '/images/room-suite.svg'),
        ('Suite', '302', 3, '/images/room-suite.svg')
) AS v(type_name, room_number, floor, photo_url)
JOIN "RoomType" rt ON rt."TypeName" = v.type_name
ON CONFLICT ("RoomNumber") DO NOTHING;

INSERT INTO "Service" ("ServiceName", "Description", "Price", "IsIncluded")
VALUES
    ('Завтрак', 'Шведский стол', 650.00, FALSE),
    ('Поздний выезд', 'До 18:00 при наличии мест', 1200.00, FALSE),
    ('Трансфер', 'Аэропорт ↔ отель', 2500.00, FALSE),
    ('Бассейн', 'Посещение бассейна (1 час)', 900.00, FALSE),
    ('Массаж', 'Сеанс 45 минут', 2200.00, FALSE)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
    guest1_id INTEGER;
    guest2_id INTEGER;
    room_id INTEGER;
    booking_id INTEGER;
    breakfast_id INTEGER;
BEGIN
    SELECT "GuestId" INTO guest1_id FROM "Guest" WHERE "Passport" = '4510 123456';
    SELECT "GuestId" INTO guest2_id FROM "Guest" WHERE "Passport" = '4511 123457';
    SELECT "RoomId" INTO room_id FROM "Room" WHERE "RoomNumber" = '201';
    SELECT "ServiceId" INTO breakfast_id FROM "Service" WHERE "ServiceName" = 'Завтрак';

    IF guest1_id IS NOT NULL
        AND room_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM "Booking"
            WHERE "GuestId" = guest1_id
              AND "RoomId" = room_id
              AND "CheckInDate" = CURRENT_DATE + 5
              AND "CheckOutDate" = CURRENT_DATE + 7
        ) THEN
        INSERT INTO "Booking" ("GuestId", "RoomId", "CheckInDate", "CheckOutDate", "TotalPrice", "Status")
        VALUES (guest1_id, room_id, CURRENT_DATE + 5, CURRENT_DATE + 7, 11630.00, 'confirmed')
        RETURNING "BookingId" INTO booking_id;

        INSERT INTO "BookingGuest" ("BookingId", "GuestId", "IsPrimary")
        VALUES (booking_id, guest1_id, TRUE)
        ON CONFLICT DO NOTHING;

        IF guest2_id IS NOT NULL THEN
            INSERT INTO "BookingGuest" ("BookingId", "GuestId", "IsPrimary")
            VALUES (booking_id, guest2_id, FALSE)
            ON CONFLICT DO NOTHING;
        END IF;

        IF breakfast_id IS NOT NULL THEN
            INSERT INTO "BookingService" ("BookingId", "ServiceId", "GuestId", "Quantity", "TotalCost")
            VALUES (booking_id, breakfast_id, guest1_id, 2, 1300.00);
        END IF;

        INSERT INTO "Payment" ("BookingId", "TransactionId", "PaymentMethod", "Amount", "Status")
        VALUES (booking_id, md5(random()::text || clock_timestamp()::text), 'card', 11630.00, 'confirmed');
    END IF;
END $$;

COMMIT;
