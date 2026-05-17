BEGIN;

DROP TABLE IF EXISTS "BookingGuest" CASCADE;
DROP TABLE IF EXISTS "BookingService" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Booking" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Room" CASCADE;
DROP TABLE IF EXISTS "Service" CASCADE;
DROP TABLE IF EXISTS "RoomType" CASCADE;
DROP TABLE IF EXISTS "Guest" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

CREATE TABLE "User" (
    "UserId" SERIAL PRIMARY KEY,
    "Login" VARCHAR(50) NOT NULL UNIQUE,
    "Password" VARCHAR(255) NOT NULL,
    "Email" VARCHAR(100) NOT NULL UNIQUE,
    "Phone" VARCHAR(20),
    "Role" VARCHAR(20) NOT NULL DEFAULT 'guest',
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Guest" (
    "GuestId" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL REFERENCES "User"("UserId") ON DELETE CASCADE,
    "Surname" VARCHAR(50) NOT NULL,
    "FirstName" VARCHAR(50) NOT NULL,
    "Patronymic" VARCHAR(50),
    "Birthdate" DATE NOT NULL,
    "Passport" VARCHAR(11) NOT NULL UNIQUE
);

CREATE TABLE "RoomType" (
    "RoomTypeId" SERIAL PRIMARY KEY,
    "TypeName" VARCHAR(50) NOT NULL,
    "Description" TEXT,
    "MaxGuests" INTEGER NOT NULL CHECK ("MaxGuests" > 0),
    "PricePerNight" DECIMAL(10,2) NOT NULL CHECK ("PricePerNight" >= 0)
);

CREATE TABLE "Room" (
    "RoomId" SERIAL PRIMARY KEY,
    "RoomTypeId" INTEGER NOT NULL REFERENCES "RoomType"("RoomTypeId") ON DELETE RESTRICT,
    "RoomNumber" VARCHAR(10) NOT NULL UNIQUE,
    "Floor" INTEGER NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'available',
    "PhotoUrl" TEXT
);

CREATE TABLE "Booking" (
    "BookingId" SERIAL PRIMARY KEY,
    "GuestId" INTEGER NOT NULL REFERENCES "Guest"("GuestId") ON DELETE RESTRICT,
    "RoomId" INTEGER NOT NULL REFERENCES "Room"("RoomId") ON DELETE RESTRICT,
    "CheckInDate" DATE NOT NULL,
    "CheckOutDate" DATE NOT NULL,
    "BookingDatetime" TIMESTAMP NOT NULL DEFAULT NOW(),
    "TotalPrice" DECIMAL(10,2) NOT NULL CHECK ("TotalPrice" >= 0),
    "Status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    CONSTRAINT "CK_Booking_DateRange" CHECK ("CheckOutDate" > "CheckInDate")
);

CREATE TABLE "Payment" (
    "PaymentId" SERIAL PRIMARY KEY,
    "BookingId" INTEGER NOT NULL UNIQUE REFERENCES "Booking"("BookingId") ON DELETE CASCADE,
    "TransactionId" VARCHAR(100) NOT NULL,
    "PaymentDatetime" TIMESTAMP NOT NULL DEFAULT NOW(),
    "PaymentMethod" VARCHAR(30) NOT NULL,
    "Amount" DECIMAL(10,2) NOT NULL CHECK ("Amount" >= 0),
    "Status" VARCHAR(20) NOT NULL DEFAULT 'created'
);

CREATE TABLE "Service" (
    "ServiceId" SERIAL PRIMARY KEY,
    "ServiceName" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "Price" DECIMAL(10,2) NOT NULL CHECK ("Price" >= 0),
    "IsIncluded" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE "BookingGuest" (
    "BookingGuestId" SERIAL PRIMARY KEY,
    "BookingId" INTEGER NOT NULL REFERENCES "Booking"("BookingId") ON DELETE CASCADE,
    "GuestId" INTEGER NOT NULL REFERENCES "Guest"("GuestId") ON DELETE RESTRICT,
    "IsPrimary" BOOLEAN NOT NULL DEFAULT FALSE,
    "AddedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "UX_BookingGuest_BookingId_GuestId" UNIQUE ("BookingId", "GuestId")
);

CREATE TABLE "BookingService" (
    "BookingServiceId" SERIAL PRIMARY KEY,
    "BookingId" INTEGER NOT NULL REFERENCES "Booking"("BookingId") ON DELETE CASCADE,
    "ServiceId" INTEGER NOT NULL REFERENCES "Service"("ServiceId") ON DELETE RESTRICT,
    "GuestId" INTEGER NULL REFERENCES "Guest"("GuestId") ON DELETE RESTRICT,
    "Quantity" INTEGER NOT NULL CHECK ("Quantity" > 0),
    "TotalCost" DECIMAL(10,2) NOT NULL CHECK ("TotalCost" >= 0),
    "AddedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;
