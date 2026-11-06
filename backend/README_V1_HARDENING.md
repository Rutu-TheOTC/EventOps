# EventOps V1 Backend Hardening

## Files included

Replace the matching files under `D:\Projects\EventOps`:

- `backend/app.js`
- `backend/server.js`
- `backend/middleware/authMiddleware.js`
- `backend/controllers/authController.js`
- `backend/controllers/eventController.js`
- `backend/controllers/bookingController.js`
- `backend/models/Event.js`
- `backend/models/Booking.js`
- `backend/routes/eventRoutes.js`
- `backend/routes/bookingRoutes.js`

These files intentionally leave `User.js`, `authRoutes.js`, `generateToken.js`, `config/db.js`, and `package.json` unchanged.

## Important database preflight: check active duplicate bookings

`Booking.js` adds a partial unique index that permits historical cancelled bookings but prevents two Confirmed bookings for the same attendee/event pair.

Before starting the updated backend, run this read-only aggregation in MongoDB Compass (open the EventOps database, then the `bookings` collection, Aggregations tab):

```javascript
[
  {
    $match: { bookingStatus: "Confirmed" }
  },
  {
    $group: {
      _id: { attendee: "$attendee", event: "$event" },
      count: { $sum: 1 },
      bookingIds: { $push: "$_id" }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
]
```

Expected result: an empty array.

If duplicates appear, STOP. Do not delete or modify any booking automatically. Review the records first and decide which confirmed booking should remain active. The unique index cannot be created while duplicate active pairs exist.

Once the result is empty, the application can create the partial index through Mongoose's normal index initialization. Do not run `syncIndexes()`.

## Before replacing files

1. Stop the backend and frontend terminals.
2. Make a Git checkpoint:
   `git add .`
   `git commit -m "Checkpoint before EventOps V1 backend hardening"`
3. Extract this archive.
4. Copy the included `backend` folder contents into the existing project, preserving the folder structure.

## Environment variables

Keep your existing `.env` file. Confirm it contains:
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (for example `7d`)
- `PORT` (optional; defaults to 5000)

Never paste the `.env` file, database URI, passwords, or JWT secret into chat.

## Why MongoDB transactions?

Booking creation, seat decrement, cancellation, and seat restoration must succeed or fail together. These operations use MongoDB transactions and therefore require a replica-set or sharded MongoDB deployment that supports transactions. MongoDB Atlas replica-set deployments support this.

## Important behavior changes

- Public registration always creates an `attendee`, even if a client submits `"role": "organizer"` or `"role": "admin"`.
- Only organizer accounts can use organizer event routes.
- Only attendee accounts can book/cancel and view their bookings.
- An organizer cannot edit `organizer`, `availableSeats`, or other protected fields through the event update body.
- Event capacity cannot be reduced below already-booked seats.
- Events with confirmed bookings cannot be deleted.
- The booking API supports both the existing frontend request (`POST /api/bookings` with `{ eventId }`) and the older parameter route.
- The frontend cancellation URL (`PATCH /api/bookings/:bookingId/cancel`) is supported. The previous PUT route remains as a compatibility alias.
- The event discovery endpoint continues to include `description`.

## First startup

From the backend directory:

```powershell
npm run dev
```

Do not promote either existing user account yet. First verify the API and decide which account should be an organizer.

## Verification checklist

Use the existing frontend and/or Postman:

1. `GET http://localhost:5000/` returns the EventOps welcome JSON.
2. `GET /api/events` works without a token and includes event descriptions.
3. Register a new account while sending `"role": "organizer"` in the request body. The response must show `"role": "attendee"`.
4. An attendee token calling `GET /api/events/my-events` must receive HTTP 403.
5. An attendee token calling `POST /api/events` must receive HTTP 403.
6. An attendee can call `GET /api/bookings/my-bookings`.
7. An attendee can book using `POST /api/bookings` with `{ "eventId": "<future-event-id>" }`.
8. A second booking for the same attendee/event must be rejected.
9. Cancellation with `PATCH /api/bookings/<booking-id>/cancel` restores exactly one seat.
10. Repeating cancellation must be rejected and must not restore another seat.
11. An event with confirmed bookings cannot be deleted.
12. An organizer can create, edit and delete their own event, but cannot modify another organizer's event.
13. An organizer cannot reduce total seats below the number already booked.
14. A booking attempt against a sold-out or past event is rejected.

Do not test by deleting or modifying the existing React Masterclass booking. Create a fresh temporary event for booking tests and clean it up only after all its test bookings are cancelled.

## Important frontend note

The backend now enforces role permissions regardless of what the UI displays. The existing UI may still show the Organizer Hub to an attendee because the current `App.jsx` navigation was not replaced in this package. The API will return HTTP 403 for attendee access. A role-aware navigation polish can be made after reviewing the exact current `frontend/src/App.jsx`.
