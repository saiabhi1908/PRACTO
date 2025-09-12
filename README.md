# Practo - Online Doctor Appointment Booking System

## 📌 Overview
Practo is a comprehensive doctor appointment booking system designed to make healthcare more accessible.  
It allows patients to search for doctors, book appointments (in-person or virtual), view and manage medical reports, and access nearby hospital services seamlessly.

---

## ✨ Features

### 🔹 User Accounts
- Patient & Doctor registration, login, and profile management
- Optional 2FA login for extra security
- Language-based preferences for accessibility

### 🔹 Appointments
- Book, reschedule, or cancel appointments
- Switch between in-person and virtual appointments anytime
- In-person payments (pay at clinic) or online payments available
- Doctor dashboard for managing slots and availability
- **Automatic email reminders 24 hours before appointments**

### 🔹 Virtual Consultation
- Video call option between doctor and patient
- Interface similar to WhatsApp or Google Meet layout
- Real-time chat & video for seamless consultations

### 🔹 Accessibility
- Eye-problems friendly UI with adaptive colors and theme switching
- Language selection for localized experience
- *Voice navigation within the website*
- Intelligent **voice assistant** for hands-free commands and queries

### 🔹 Medical Reports & Prescriptions
- Patients can view, download, or upload medical reports
- Doctors/admin can upload reports from the admin panel
- Prescription forms are mandatory
- Test reports (BP, sugar, thyroid, etc.) must be entered by doctors/admin
- Users can view these values in their login, with **graphs and advanced visualizations**
- Automatic email notifications with reports attached

  ### 🔹 AI Features
- **AI Chatbot:** Answers all patient and doctor queries intelligently
- **AI Symptom Checker:** Based on symptoms entered, provides likely health conditions and guidance
- Integrated with intelligent backend to continuously learn and improve responses

### 🔹 Nearby Hospitals
- Patients can view hospitals within **5 km range**
- Clicking a hospital card redirects to its details
- Direct access to hospital services (labs, pharmacy, emergency, etc.)

### 🔹 Insurance Privileges
- Users with insurance receive **90% of fees waived** for appointments
- Get **2 extra appointment dates** as the first privilege
- Insurance is **optional** for booking appointments

### 🔹 Other Functionalities
- OTP-based password reset
- Voice assistant for hands-free queries & booking
- Admin panel for system monitoring

---

## 🛠️ Tech Stack
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT, Nodemailer (for OTP & 2FA)
- **Video Call:** WebRTC (Google Meet/WhatsApp style)
- **Voice Assistant:** Web Speech API + Backend integration
- **Maps & Location:** Google Maps API / OpenStreetMap for nearby hospitals

---

## 🚀 Getting Started

### Prerequisites
- Node.js
- MongoDB
- Git

### Installation
```bash
git clone https://github.com/saiabhi1908/practo.git
cd practo

Backend
cd backend
npm install


Create .env file in backend:

PORT=4000

Start backend:

npm start

Frontend
cd ../frontend
npm install
npm start


Now open the app at:

http://localhost:5174

📂 Project Structure
practo/
│── backend/       # Express backend
│── frontend/      # React frontend
│── README.md      # Project documentation

🤝 Contributing

Contributions are welcome! Please fork the repo and create a pull request.

### Prerequisites
- Node.js  
- MongoDB  
- Git
