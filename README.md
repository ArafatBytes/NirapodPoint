# Nirapod Point

**Nirapod Point** is a modern, full-stack Crime Awareness & Safer Route Suggestion System for Bangladesh.  
It empowers citizens to report crimes, visualize crime-prone areas, and get safer route suggestions—all with a beautiful, responsive, and secure web app.

---

## Features

- **User Registration & Verification:**  
  Secure sign-up with NID image upload, admin verification, and JWT-based authentication.
- **Crime Reporting:**  
  Verified users can submit detailed crime reports with location, type, and time.
- **Interactive Safety Map:**  
  Visualize crime-prone zones and safe routes on a live map.
- **AI-Powered Safe Routes:**  
  Get route suggestions that avoid high-risk areas (future feature).
- **Admin Dashboard:**  
  Approve/disapprove users, view NID images, and manage the platform.
- **Account Management:**  
  Users can update their profile and view their verification status.
- **Modern UI/UX:**  
  Glassy, animated, and fully responsive design with Tailwind CSS and Framer Motion.

---

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Framer Motion, React Router, react-hot-toast
- **Backend:** Spring Boot, MongoDB Atlas, JWT Authentication

---

---

## Getting Started

### Backend

```sh
cd backend
# Configure MongoDB URI in application.properties
./mvnw spring-boot:run
```

### Frontend

```sh
cd frontend
npm install
npm run dev
```

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](LICENSE)
