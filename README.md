# EventOps

**EventOps** is a full-stack event management application built with the
MERN stack. It provides public event discovery, role-protected event
management for organizers, and booking workflows for attendees.

## Features

### Authentication and access control

-   User registration and login using JWT-based authentication.
-   Protected profile endpoint for the currently authenticated user.
-   Role-based authorization for attendee and organizer workflows.

### Event discovery

-   Browse all available events.
-   Search events by keyword.
-   Filter events by category.
-   Retrieve events using pagination.
-   View an individual event's details.

### Organizer features

-   Create, update, and delete events.
-   View events created by the authenticated organizer.
-   Access organizer statistics.
-   Organizer-only operations are protected by authentication and role
    checks.
-   Organizers can only modify or delete events they own.

### Attendee booking features

-   Book an event while seats are available.
-   View personal booking history.
-   Cancel a booking.
-   Prevent duplicate active bookings.
-   Restore event availability when a booking is cancelled.
-   Preserve cancelled booking records as booking history.
-   Use database transactions and conditional seat updates to protect
    booking consistency when requests compete for the final seats.

## Tech stack

  Area                     Technologies
  ------------------------ ---------------------------------
  Frontend                 React, Vite, Tailwind CSS
  Backend                  Node.js, Express
  Database                 MongoDB, Mongoose
  Authentication           JSON Web Tokens (JWT), bcryptjs
  Other backend packages   cors, dotenv, validator

## Project structure

``` text
EventOps/
├── backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication and authorization
│   ├── models/          # Mongoose models
│   ├── routes/          # API route definitions
│   ├── services/
│   ├── uploads/         # Runtime uploads (not committed)
│   ├── utils/
│   ├── validators/
│   ├── app.js           # Express app and shared middleware
│   └── server.js        # Environment checks, DB connection, server startup
└── frontend/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── constants/
    │   ├── context/
    │   ├── hooks/
    │   ├── layouts/
    │   ├── pages/
    │   ├── routes/
    │   ├── services/
    │   └── utils/
    ├── .env             # Local frontend configuration (not committed)
    └── package.json
```

## Getting started

### Prerequisites

-   Node.js and npm
-   A MongoDB database.
-   A MongoDB deployment that supports transactions. A replica set, such
    as MongoDB Atlas, is suitable.

### 1. Clone the repository

``` bash
git clone https://github.com/Rutu-TheOTC/EventOps.git
cd EventOps
```


### 2. Configure the backend

Create `backend/.env`:

``` env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
```

Use your own MongoDB connection string and a strong, private JWT secret.
Do not commit `.env` files or share their values.

### 3. Configure the frontend

Create `frontend/.env`:

``` env
VITE_API_URL=http://localhost:5000
```

`VITE_API_URL` is the base URL used by the frontend to reach the
backend. If the backend runs at a different address, update this value.

Do not place private credentials or secrets in frontend environment
variables. Variables prefixed with `VITE_` are exposed to the browser
bundle.

### 4. Install dependencies

Open a terminal at the repository root and run:

``` bash
cd backend
npm install
```

In a second terminal:

``` bash
cd frontend
npm install
```

### 5. Start the application

Start the backend from the `backend` directory:

``` bash
npm run dev
```

The backend defaults to `http://localhost:5000`.

Start the frontend from the `frontend` directory in a second terminal:

``` bash
npm run dev
```

Vite prints the local frontend URL in the terminal, commonly
`http://localhost:5173`.

## API overview

The backend API is mounted under `/api`.

### Authentication

Base path: `/api/auth`

  Method   Endpoint      Access
  -------- ------------- --------------------
  POST     `/register`   Public
  POST     `/login`      Public
  GET      `/me`         Authenticated user

### Events

Base path: `/api/events`

  Method   Endpoint       Access
  -------- -------------- -----------------------
  GET      `/`            Public
  GET      `/search`      Public
  GET      `/filter`      Public
  GET      `/paginate`    Public
  GET      `/:id`         Public
  GET      `/my-events`   Organizer
  GET      `/stats`       Organizer
  POST     `/`            Organizer
  PUT      `/:id`         Organizer, owner only
  DELETE   `/:id`         Organizer, owner only

### Bookings

Base path: `/api/bookings`

  Method   Endpoint         Access
  -------- ---------------- -------------------------------------
  GET      `/my-bookings`   Attendee
  POST     `/`              Attendee
  POST     `/:id`           Attendee, backward-compatible route
  PATCH    `/:id/cancel`    Attendee
  PUT      `/cancel/:id`    Attendee, backward-compatible route

All protected endpoints require a valid bearer token. Organizer and
attendee endpoints also enforce the corresponding role.

## Useful scripts

### Backend

  Command         Purpose
  --------------- --------------------------------
  `npm run dev`   Start the backend with nodemon
  `npm start`     Start the backend with Node.js

### Frontend

  Command             Purpose
  ------------------- --------------------------------------
  `npm run dev`       Start the Vite development server
  `npm run build`     Create a production build
  `npm run preview`   Preview the production build locally
  `npm run lint`      Run ESLint

## Production build and code quality

From the `frontend` directory:

``` bash
npm run lint
npm run build
```

The frontend lint and production build have been run successfully during
the project's V1 verification.

## Security notes

-   Keep backend `.env` files private.
-   Use a strong `JWT_SECRET`.
-   Never expose MongoDB credentials or JWT secrets through frontend
    `VITE_` variables.
-   Protected routes enforce authentication and role authorization on
    the server.
-   Organizer event updates and deletions are restricted to the event
    owner.

## Current status

**Version:** V1

The project has undergone manual security, edge-case, and regression
checks, along with frontend smoke testing and production build
verification.

------------------------------------------------------------------------

Built as a full-stack event management project.
