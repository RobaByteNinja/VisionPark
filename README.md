# VisionParking – Smart AI-Based Parking Management System

VisionParking is an intelligent parking management system that combines:

🌍 Real-time parking monitoring

🤖 AI-based vehicle & license plate detection (YOLOv8)

📍 Smart nearest parking recommendation

💳 Telebirr payment integration

🔄 Automated reservation & exit processing

The system serves Drivers and Parking Lot Owners with separate dashboards and secure role-based access control (RBAC).
#Project Objectives
Reduce time spent searching for parking

Automate parking lot management

Prevent manual fraud in parking operations

Enable real-time revenue tracking

Integrate AI for vehicle verification


#System Architecture

VisionParking consists of three main modules:
frontend
backend
ai_model


User Roles
🚘 Driver

Register with license plate & car type

View real-time parking availability

Get nearest parking recommendation

Reserve a parking spot (100 ETB prepayment)

Navigate to parking lot

AI-based license plate verification

Auto duration & payment calculation

Exit with automatic balance payment

🏢 Owner

Add & manage parking lots

Auto-generate parking spots

Monitor reservations in real-time

View AI-based vehicle entry validation

Track live revenue

Generate reports (Daily / Monthly)

Receive notifications for all parking events

🔄 Core Workflow
Driver Journey

Register / Login

View live parking map

Get nearest recommendation

Reserve spot (15-minute timer starts)

Pay 100 ETB prepayment

Navigate to lot

AI verifies license plate

Parking timer starts

Exit → Auto calculate payment

Pay remaining balance

Spot becomes FREE

Owner Journey

Login to Owner Dashboard

Add parking lot & configure spots

Monitor reservations

Watch live AI entry verification

Track revenue in real-time

View reports & analytics


🧠 Technologies Used
Frontend

React

React Leaflet (Map)

Firebase (Realtime Updates)

Geolocation API

Backend

Node.js / Express (or chosen framework)

Firebase Firestore / Database

Cloud Functions (Timers & Auto Cancellation)

AI Module

YOLOv8 (Vehicle & License Plate Detection)

Camera Integration

Payment

Telebirr API Integration

🔐 Security & System Rules

Role-Based Access Control (RBAC)

Owners cannot access Driver dashboard

Drivers cannot access Owner dashboard

Owners cannot manually override spot status

AI verification controls entry

Payment logic automated

Reservation auto-expiry (15 min)


🚀 Getting Started
Clone the repository
git clone https://github.com/winnerJd/VisionParking.git
cd VisionParking

Install Frontend
cd frontend
npm install
npm start

Install Backend
cd backend
npm install
npm run dev

📈 Future Improvements

Mobile app version

Advanced AI plate recognition

Predictive parking demand analysis

Dynamic pricing

Multi-location support

👨‍💻 Team

Developed as a collaborative Agile-based project.

Each module is managed via GitHub Issues and Pull Requests.

📄 License

This project is developed for educational and research purposes.

🌟 Vision

To create a fully automated, AI-powered parking ecosystem that reduces congestion, improves revenue transparency, and enhances user experience.


