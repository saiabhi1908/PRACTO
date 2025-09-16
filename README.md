# Practo - Online Doctor Appointment Booking System

## 📌 Overview
Practo is a smart online doctor appointment system that makes healthcare fast, easy, and intelligent. Patients can find the right doctors, book in-person or virtual consultations, manage medical reports, and access nearby hospital services seamlessly.

With AI-powered doctor matchmaking, smart symptom checking, and a voice assistant, Practo guides patients to the best specialists, streamlines appointment booking, and enhances user experience. Doctors and admins benefit from robust dashboards, automated reminders, and easy report management.

Practo combines cutting-edge technology with user-focused design, creating a complete digital healthcare ecosystem that saves time, improves care, and empowers patients to make informed decisions.

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
- Automatic email reminders 24 hours before appointments

### 🔹 Virtual Consultation
- Video call option between doctor and patient
- Interface similar to WhatsApp or Google Meet layout
- Real-time chat & video for seamless consultations

### 🔹 Accessibility
- Eye-problems friendly UI with adaptive colors and theme switching
- Language selection for localized experience
- Voice navigation within the website
- Intelligent voice assistant for hands-free commands and queries

### 🔹 Medical Reports & Prescriptions
- Patients can view, download, or upload medical reports
- Doctors/admin can upload reports from the admin panel
- Prescription forms are mandatory
- Test reports (BP, sugar, thyroid, etc.) must be entered by doctors/admin
- Users can view these values in their login, with graphs and advanced visualizations
- Automatic email notifications with reports attached

### 🔹 AI Features
- AI Chatbot: Answers all patient and doctor queries intelligently
- AI Symptom Checker: Based on symptoms entered, provides likely health conditions and guidance
- Integrated with intelligent backend to continuously learn and improve responses

### 🔹 Nearby Hospitals
- Patients can view hospitals within 5 km range
- Clicking a hospital card redirects to its details
- Direct access to hospital services (labs, pharmacy, emergency, etc.)

### 🔹 Insurance Privileges
- Users with insurance receive 90% of fees waived for appointments
- Get 2 extra appointment dates as the first privilege
- Insurance is optional for booking appointments

### 🔹 Other Functionalities
- OTP-based password reset
- Voice assistant for hands-free queries & booking
- Admin panel for system monitoring

---

## 🆕 Newly Added Features

### 🔹 AI Doctor Matchmaking
- Patients can enter their symptoms
- Then the system suggests the most suitable doctors with correct specialization, based on the symptoms entered by the patients
- Each suggestion includes an AI match score to help choose the best doctor

### 🔹 Voice Assistant Appointment Booking
- Patients can book appointments using voice commands  
**Example flow:**
1. Say “Book appointment with a pediatrician”  
2. System displays pediatricians with ratings and number of reviews  
3. Patient selects a doctor (e.g., “Choose Dr. Jeffrey”)  
4. Available slots with date and time are displayed; patient selects preferred slot  
5. Insurance options are shown from the database; patient selects  
6. Appointment is confirmed automatically

### 🔹 Doctor Ratings & Reviews
- Patients can rate doctors after their appointment (/5 stars)  
- Average rating is calculated and displayed
- Ratings and reviews are visible throughout the platform, including in voice assistant system  

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
# Clone the repo
git clone https://github.com/saiabhi1908/PRACTO.git

# Navigate to project directories
cd backend
npm install

cd ../frontend
npm install

cd ../admin
npm install
