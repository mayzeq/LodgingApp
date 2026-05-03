BEGIN;

CREATE TABLE IF NOT EXISTS "User" (
    "UserId" SERIAL PRIMARY KEY,
    "Login" VARCHAR(50) NOT NULL UNIQUE,
    "Password" VARCHAR(255) NOT NULL,
    "Email" VARCHAR(100) NOT NULL UNIQUE,
    "Phone" VARCHAR(20),
    "Role" VARCHAR(20) NOT NULL DEFAULT 'guest',
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Guest" (
    "GuestId" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL REFERENCES "User"("UserId") ON DELETE CASCADE,
    "Surname" VARCHAR(50) NOT NULL,
    "FirstName" VARCHAR(50) NOT NULL,
    "Patronymic" VARCHAR(50),
    "Birthdate" DATE NOT NULL,
    "Passport" VARCHAR(11) NOT NULL
);

-- keep existing databases compatible (if table already created previously)
ALTER TABLE IF EXISTS "Guest"
    ALTER COLUMN "Passport" TYPE VARCHAR(11);

CREATE TABLE IF NOT EXISTS "RoomType" (
    "RoomTypeId" SERIAL PRIMARY KEY,
    "TypeName" VARCHAR(50) NOT NULL,
    "Description" TEXT,
    "MaxGuests" INTEGER NOT NULL,
    "PricePerNight" DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Room" (
    "RoomId" SERIAL PRIMARY KEY,
    "RoomTypeId" INTEGER NOT NULL REFERENCES "RoomType"("RoomTypeId") ON DELETE RESTRICT,
    "RoomNumber" VARCHAR(10) NOT NULL,
    "Floor" INTEGER NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'available',
    "PhotoUrl" TEXT
);

CREATE TABLE IF NOT EXISTS "Order" (
    "OrderId" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL REFERENCES "User"("UserId") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "TotalAmount" DECIMAL(10,2) NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'created'
);

CREATE TABLE IF NOT EXISTS "Booking" (
    "BookingId" SERIAL PRIMARY KEY,
    "GuestId" INTEGER NOT NULL REFERENCES "Guest"("GuestId") ON DELETE RESTRICT,
    "RoomId" INTEGER NOT NULL REFERENCES "Room"("RoomId") ON DELETE RESTRICT,
    "OrderId" INTEGER NOT NULL REFERENCES "Order"("OrderId") ON DELETE CASCADE,
    "CheckInDate" DATE NOT NULL,
    "CheckOutDate" DATE NOT NULL,
    "BookingDatetime" TIMESTAMP NOT NULL DEFAULT NOW(),
    "TotalPrice" DECIMAL(10,2) NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS "Payment" (
    "PaymentId" SERIAL PRIMARY KEY,
    "OrderId" INTEGER NOT NULL UNIQUE REFERENCES "Order"("OrderId") ON DELETE CASCADE,
    "TransactionId" VARCHAR(100) NOT NULL,
    "PaymentDatetime" TIMESTAMP NOT NULL DEFAULT NOW(),
    "PaymentMethod" VARCHAR(30) NOT NULL,
    "Amount" DECIMAL(10,2) NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'created'
);

CREATE TABLE IF NOT EXISTS "Service" (
    "ServiceId" SERIAL PRIMARY KEY,
    "ServiceName" VARCHAR(100) NOT NULL,
    "Description" TEXT,
    "Price" DECIMAL(10,2) NOT NULL,
    "IsIncluded" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS "BookingService" (
    "BookingServiceId" SERIAL PRIMARY KEY,
    "BookingId" INTEGER NOT NULL REFERENCES "Booking"("BookingId") ON DELETE CASCADE,
    "ServiceId" INTEGER NOT NULL REFERENCES "Service"("ServiceId") ON DELETE RESTRICT,
    "Quantity" INTEGER NOT NULL CHECK ("Quantity" > 0),
    "TotalCost" DECIMAL(10,2) NOT NULL,
    "AddedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;
