# VisionParking – Smart AI-Based Parking Management System

VisionParking is an intelligent parking management system that combines:

🌍 Real-time parking monitoring

🤖 AI-based vehicle & license plate detection (YOLOv8)

📍 Smart nearest parking recommendation

💳 Telebirr payment integration

🔄 Automated reservation & exit processing

The system serves Drivers and Parking Lot Owners with separate dashboards and secure role-based access control (RBAC).
# Project Objectives
Reduce time spent searching for parking

Automate parking lot management

Prevent manual fraud in parking operations

Enable real-time revenue tracking

Integrate AI for vehicle verification


# System Architecture

VisionParking consists of three main modules:
frontend
backend
ai_model


# User Roles
🚘 Driver

Register with license plate & car type

View real-time parking availability

Get nearest parking recommendation

Reserve a parking spot (100 ETB prepayment)

Navigate to parking lot

AI-based license plate verification

Auto duration & payment calculation

Exit with automatic balance payment

# 🏢 Owner

Add & manage parking lots

Auto-generate parking spots

Monitor reservations in real-time

View AI-based vehicle entry validation

Track live revenue

Generate reports (Daily / Monthly)

Receive notifications for all parking events

# 🔄 Core Workflow
# Driver Journey

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

 # Owner Journey

Login to Owner Dashboard

Add parking lot & configure spots

Monitor reservations

Watch live AI entry verification

Track revenue in real-time

View reports & analytics


# 🧠 Technologies Used
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

# 🔐 Security & System Rules

Role-Based Access Control (RBAC)

Owners cannot access Driver dashboard

Drivers cannot access Owner dashboard

Owners cannot manually override spot status

AI verification controls entry

Payment logic automated

Reservation auto-expiry (15 min)


# 🚀 Getting Started
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

# 📈 Future Improvements

Mobile app version

Advanced AI plate recognition

Predictive parking demand analysis

Dynamic pricing

Multi-location support

# 👨‍💻 Team

Developed as a collaborative Agile-based project.

Each module is managed via GitHub Issues and Pull Requests.

# 📄 License

This project is developed for educational and research purposes.

# 🌟 Vision

To create a fully automated, AI-powered parking ecosystem that reduces congestion, improves revenue transparency, and enhances user experience.
# Proposed folder structure
src/
├── App.css                                     - Basic global and fallback CSS styles
├── App.jsx                                     - Main application routing (Domain checking & layout rendering)
├── index.css                                   - Tailwind directives and comprehensive design system styling
├── main.jsx                                    - React mounting point and context provider wrapping
├── attendant/
│   └── components/
│       └── AttendantLayout.jsx                 - Shell layout and sidebar for the Attendant module
├── components/
│   ├── layout/
│   │   └── Header.jsx                          - Top navigation overlay used in standard pages and auth
│   └── ui/
│       ├── GlassCard.jsx                       - Premium glassmorphism container component
│       ├── Logo.jsx                            - App logo rendering component
│       ├── StatusBadge.jsx                     - UI pill for displaying activity or condition states 
│       ├── button.jsx                          - Reusable Radix/Tailwind button widget
│       ├── card.jsx                            - Reusable Radix/Tailwind structured card element
│       ├── input.jsx                           - Reusable styled input widget
│       ├── label.jsx                           - Reusable styled form label
│       └── theme-toggle.jsx                    - Light/Dark mode toggling switch
├── context/
│   ├── ScrollContext.jsx                       - Context provider managing unified scroller or positioning
│   └── ThemeContext.jsx                        - System-wide light/dark mode state manager
├── driver/
│   ├── components/
│   │   ├── DriverLayout.jsx                    - Main responsive layout wrapper for driver user domains
│   │   └── session/
│   │       └── ProgressRing.jsx                - SVG circular progress timer indicator for parking sessions
│   └── pages/
│       ├── ActiveSession.jsx                   - Live tracking screen for an ongoing reserved parking spot
│       ├── DriverHistory.jsx                   - Interactive timeline feed of a driver's past parking usage
│       ├── DriverMap.jsx                       - Web map for locating branches, zones, and picking specific spots
│       └── DriverProfile.jsx                   - Preferences screen for managing driver and vehicle data
├── lib/
│   └── utils.js                                - Shared helpers like Tailwind class merging (cn)
├── owner/
│   ├── components/
│   │   └── OwnerLayout.jsx                     - Sophisticated dashboard layout for parking lot administrators
│   └── pages/
│       ├── Analytics.jsx                       - Advanced charts indicating utilization trends and traffic 
│       ├── AttendantManagement.jsx             - Admin module for adding, firing, and reviewing employees
│       ├── Dashboard.jsx                       - General operational summary view for owners
│       ├── FinancialReports.jsx                - Comprehensive revenue metrics, ledgers, and transaction tables
│       ├── Operations.jsx                      - Command center for live camera feeds and real-time AI incident alerts
│       ├── OwnerProfile.jsx                    - Organization and individual settings for the lot owner
│       ├── ParkingManagement.jsx               - Builder for zones, grids, and individual spot definition
│       ├── PayoutSettings.jsx                  - Interface connecting withdrawal endpoints (banks, Telebirr)
│       └── PricingSettings.jsx                 - Management of hourly rates, tiers, and overstay multipliers
└── shared/
    ├── auth/
    │   ├── DriverSignUp.jsx                    - Multi-step registration for new platform drivers
    │   ├── ForgotPassword.jsx                  - Flow for fetching and resetting user credential access
    │   └── Login.jsx                           - Central identity gateway branching all user types
    └── pages/
        └── PrivacyPolicy.jsx                   - Standard generic display of legal data privacy terms


