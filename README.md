# VisionPark frontend

VisionPark is a premium, AI-powered parking management system interface that offers distinct, tailor-made experiences to drivers, lot owners, and parking attendants. This React-based frontend dynamically routes users to feature-rich dashboards catering to spot reservation, realtime operational monitoring, and business analytics.

## Tech Stack
- **React** (v19.2.0)
- **React DOM** (v19.2.0)
- **React Router DOM** (v7.13.1)
- **Tailwind CSS** (v3.4.19)
- **Vite** (v7.3.1)
- **Lucide React** (v0.575.0) for icons
- **Leaflet & React-Leaflet** (v1.9.4 & v5.0.0) for interactive maps
- **Radix UI components**, **clsx**, **tailwind-merge**, and **tailwindcss-animate** for styling and UI primitives
- **next-themes** (v0.4.6) for dark/light mode context

## Full Project Structure

```text
src/
├── App.css                                     - Basic global and fallback CSS styles
├── App.jsx                                     - Main application routing (Domain checking & layout rendering)
├── index.css                                   - Tailwind directives and comprehensive design system styling
├── main.jsx                                    - React mounting point and context provider wrapping
├── admin/
│   ├── components/
│   │   └── AdminLayout.jsx                     - Shell layout and sidebar for the Admin module
│   └── pages/
│       ├── AdminProfile.jsx                    - Preferences and settings for the admin
│       ├── AlertThresholds.jsx                 - Configuration for system alert triggers
│       ├── AuditLog.jsx                        - Comprehensive log of system activity and user actions
│       ├── BackupRecovery.jsx                  - Interface for data backups and restoration
│       ├── Dashboard.jsx                       - High-level overview of platform status and metrics
│       ├── NetworkHealth.jsx                   - Monitoring of system node connectivity and latency
│       ├── OwnerAccount.jsx                    - Management interface for platform owners
│       ├── PaymentGateway.jsx                  - Configuration for external payment integrations
│       ├── PlatformAnalytics.jsx               - Cross-system data visualizations and reporting
│       ├── SessionManager.jsx                  - Overview and control of active user sessions
│       └── SystemConfig.jsx                    - Master settings for the VisionPark platform
├── assets/
│   └── react.svg                               - Default React vector graphic
├── attendant/
│   ├── components/
│   │   └── AttendantLayout.jsx                 - Shell layout and sidebar for the Attendant module
│   └── pages/
│       ├── AIExceptions.jsx                    - Interface for resolving AI detection anomalies
│       ├── AttendantProfile.jsx                - Preferences and settings for the attendant
│       ├── Enforcement.jsx                     - Tools for issuing citations or logging violations
│       ├── Incidents.jsx                       - Feed for logging and responding to facility incidents
│       ├── LiveGrid.jsx                        - Real-time status map of the parking floor
│       ├── Overstays.jsx                       - Tracking interface for vehicles exceeding reserved times
│       ├── WalkUpPOS.jsx                       - Point of sale terminal for unreserved drive-in customers
│       └── ZReport.jsx                         - End of shift financial reconciliation and reporting
├── components/
│   ├── layout/
│   │   ├── AdminHeader.jsx                     - Top navigation overlay used in admin domains
│   │   └── Header.jsx                          - Top navigation overlay used in standard pages and auth
│   ├── theme-provider.jsx                      - System-wide Next-themes provider wrapper
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
│   ├── context/
│   │   └── ScrollContext.jsx                   - Driver specific localized scroll context
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
    │   ├── admin/
    │   │   ├── AdminForgotPassword.jsx         - Recovery flow for admin credentials
    │   │   └── AdminLogin.jsx                  - Secure authentication gateway for platform administrators
    │   ├── DriverSignUp.jsx                    - Multi-step registration for new platform drivers
    │   ├── ForgotPassword.jsx                  - Flow for fetching and resetting user credential access
    │   └── Login.jsx                           - Central identity gateway branching all user types
    └── pages/
        └── PrivacyPolicy.jsx                   - Standard generic display of legal data privacy terms
```

## LocalStorage Reference Table

| Key | What it Stores | Read/Write Pages |
| --- | --- | --- |
| `vp_theme` | "light", "dark", or "system" | **Write**: ThemeContext.jsx <br> **Read**: Login, DriverSignUp, ForgotPassword, PrivacyPolicy |
| `vp_driver_name` | Driver's Full Name | **Write**: DriverSignUp.jsx, DriverProfile.jsx <br> **Read**: DriverProfile.jsx |
| `vp_driver_email` | Driver's Email Address | **Write**: DriverSignUp.jsx, DriverProfile.jsx <br> **Read**: DriverProfile.jsx |
| `vp_driver_phone` | Driver's Phone Number | **Write**: DriverSignUp.jsx, DriverProfile.jsx <br> **Read**: DriverProfile.jsx |
| `vp_driver_vehicle` | Selected Vehicle Category | **Write**: DriverSignUp.jsx, DriverProfile.jsx <br> **Read**: DriverProfile.jsx, DriverMap.jsx |
| `vp_driver_license_plate` | Vehicle Plate String | **Write**: DriverSignUp.jsx, DriverProfile.jsx <br> **Read**: DriverProfile.jsx |
| `vp_driver_payment` | Chosen Payment Method | **Write**: DriverProfile.jsx, DriverMap.jsx <br> **Read**: DriverProfile.jsx, DriverMap.jsx, ActiveSession.jsx |
| `vp_driver_account` | Target payment account # | **Write**: DriverProfile.jsx <br> **Read**: DriverProfile.jsx |
| `vp_driver_photo` | Profile picture Base64 string | **Write**: DriverProfile.jsx <br> **Read**: DriverProfile.jsx |
| `vp_session_state` | Session condition (e.g. "Reserved") | **Write**: DriverMap.jsx <br> **Read**: ActiveSession.jsx |
| `vp_selected_area` | JSON configuration of chosen branch | **Write**: DriverMap.jsx <br> **Read**: ActiveSession.jsx |
| `vp_selected_spot` | JSON details of specifically booked spot | **Write**: DriverMap.jsx <br> **Read**: ActiveSession.jsx |
| `vp_session_end_time` | Timestamp string of active session expiry | **Write**: DriverMap.jsx <br> **Read**: ActiveSession.jsx |
| `vp_session_start_time` | Timestamp string of session initialization | **Write**: DriverMap.jsx <br> **Read**: ActiveSession.jsx |
| `vp_payment_timestamp` | Timestamp string of exact payment time | **Write**: DriverMap.jsx <br> **Read**: ActiveSession.jsx |

*(Note: Custom DOM events like `vp_profile_updated`, `vp_photo_updated`, and `vp_session_changed` are dynamically dispatched across Windows to refresh views).*

## Driver Module

### DriverMap — `src/driver/pages/DriverMap.jsx`
**Primary Purpose**  
The core interactive explorer for drivers to visually locate parking facilities, inspect floor zones, and reserve individual spots immediately with integrated mock payment.

**Key Features & Sections**
1. **Interactive Map**: Displays a Leaflet-based map allowing drivers to click on branches to visualize parking availability or distance in realtime.
2. **Zone & Grid Selection**: Drills down from a selected branch into specific floors, rendering an interactive spot grid differentiating available, reserved, and disabled spaces.
3. **Session Builder**: Dynamically builds out an arrival timestamp and exit timeframe, summarizing duration and pricing.
4. **Instant Payment Interface**: Directly invokes a slide-up module for finalizing transaction (via Telebirr or Card) and issues virtual local storage receipts.

### ActiveSession — `src/driver/pages/ActiveSession.jsx`
**Primary Purpose**  
A dedicated live tracking screen actively used by drivers while their reserved session is dynamically ticking down, presenting actionable methods for extension, navigation, or cancellation.

**Key Features & Sections**
1. **Live Countdown Ring**: Utilizes `ProgressRing.jsx` with real-time interval logic indicating remaining grace minutes before automatic spot release or overstays.
2. **Access Pass**: Provides a simulated visual QR code element containing transaction, spot hash, and license identifiers.
3. **Smart Management Controls**: Quick buttons enabling the driver to launch navigation maps, add time, or fully terminate the session ahead of schedule.

### DriverHistory — `src/driver/pages/DriverHistory.jsx`
**Primary Purpose**  
Maintains tabular insights representing the total lineage of a driver's app usages, acting simultaneously as a parking logbook and virtual receipt vault.

**Key Features & Sections**
1. **Activity Timeline**: Distinct separation chronologically detailing previous branch bookings alongside the respective date, amount, and exact spot metadata.
2. **Analytics Widgets**: Top summary cards calculating global metrics like total hours parked and gross expenditures.
3. **Downloadable Receipts**: Allows simulation of regenerating an actionable receipt for an already completed session.

### DriverProfile — `src/driver/pages/DriverProfile.jsx`
**Primary Purpose**  
Global configuration page for managing individual demographic information, connected mobile wallets, and their specific vehicular assets.

**Key Features & Sections**
1. **Photo Upload & Compression**: Secure localized browser rendering and compression utilizing the canvas API to save the driver's display identity.
2. **Data Manipulation Modal**: An overlay enabling fast and verified modification of standard strings (Name, Phone, Plate) that directly syncs with `localStorage`.
3. **Preferences**: Modulators allowing rapid toggles between favored transaction methods and managing external linked bank credentials.

## Owner Module

### Analytics — `src/owner/pages/Analytics.jsx`
**Primary Purpose**  
A high-level statistical visualization layer, presenting dense numerical parking facts across the proprietor's entire business portfolio, optimizing demand predictions.

**Key Features & Sections**
1. **Performance Summaries**: Actionable cards analyzing lifetime metrics and identifying peaks via integrated trend indicators.
2. **Charts & Graph Integrations**: Recharts-based interfaces detailing time-series performance data mapping capacity ceilings.

### AttendantManagement — `src/owner/pages/AttendantManagement.jsx`
**Primary Purpose**  
A master CRM-like grid governing the human operator resources inside parking regions, structuring assignments, wages, and authentication.

**Key Features & Sections**
1. **Employee Registry Table**: Wide data table listing individual credentials including generated user paths and branch-assignment filters.
2. **Access Generator**: Auto-compiles temporary secure passwords using multi-character requirement validators.
3. **Shift Assigner**: Maps human logic by aligning designated work hours directly onto specific branches in localized territories.

### Dashboard — `src/owner/pages/Dashboard.jsx`
**Primary Purpose**  
Acts as the general home base immediately post-login for Owners; rapidly summarizing critical issues impacting active business functions.

**Key Features & Sections**
1. **KPI Stream**: Instant insight on "Vehicles Parked", "Active Incidents", and "Realized Revenue".
2. **Operations Snapshot**: Quick glance view of systems requiring Owner intervention.

### FinancialReports — `src/owner/pages/FinancialReports.jsx`
**Primary Purpose**  
The definitive financial accounting module containing holistic histories of generated profitability, split-fees against the VisionPark system, and deep payment classification.

**Key Features & Sections**
1. **Metrics Cards**: Distinctly separates "Gross Ticket Revenue" from the application's "System Fee", representing true organizational yield.
2. **Income Time-Series**: Deep granular charting delineating profitability shifts.
3. **Transaction Ledger**: Paged record displaying exhaustive specifics marking isolated inbound and outbound fiscal transfers with built-in export filtering constraints.

### Operations — `src/owner/pages/Operations.jsx`
**Primary Purpose**  
A tactical command center interface meant to constantly run in the background; providing active live metrics and direct visual linkage to lot-side sensor environments.

**Key Features & Sections**
1. **Live Camera Matrix**: Renders connected facility-side camera placeholders, simulating active feed reception and parsing YOLO vehicle-event triggers.
2. **System Health Status**: Reports latency or connectivity outages relating directly to terminal devices or networking.
3. **Incident Action Hub**: A live response feed requiring manual management intervention, generally relating to parking violators or unverified plate entries.

### OwnerProfile — `src/owner/pages/OwnerProfile.jsx`
**Primary Purpose**  
Secure hub controlling institutional identity representations, organizational metadata definitions, and heavy overarching operational notification flags.

**Key Features & Sections**
1. **Live Webcam Snapshotting**: Allows owners to capture headshots via an active WebRTC data stream bridging with native hardware.
2. **Security & Notifications**: Manages encryption keys, MFA integrations, and handles granular flags deciding when system texts or emails trigger securely.

### ParkingManagement — `src/owner/pages/ParkingManagement.jsx`
**Primary Purpose**  
Essentially a level-editor giving administrators digital capability to define the real-world scale and limitations of their physical real estate assets inside the application network.

**Key Features & Sections**
1. **Interactive Builder Mode**: Visual interface logic establishing dimensional grids allowing toggling status variants mapped to individual numbered spaces.
2. **Branch Definitions**: Global settings determining operational hours, total volumetric capacity, and geographic map placements.

### PayoutSettings — `src/owner/pages/PayoutSettings.jsx`
**Primary Purpose**  
Handles outbound economic routes ensuring owner balances flow efficiently into institutional or mobile reservoirs via pre-vetted banking platforms.

**Key Features & Sections**
1. **Wallet Breakdown**: Isolates "Available to Yield" balances from "Processing Pipeline" flows.
2. **Connection Gateway**: Configurator bridging VisionPark with third-party verification nodes (like Commercial Bank of Ethiopia or localized cellular wallets) for withdrawing equity.

### PricingSettings — `src/owner/pages/PricingSettings.jsx`
**Primary Purpose**  
Permits dynamic elasticity regarding cost schedules to handle shifting daily demand curves, mitigating stagnant growth by controlling price tier adjustments.

**Key Features & Sections**
1. **Granular Variable Configurator**: Supports independent cost definition depending on complex identifiers like the exact Branch or Vehicle Class hierarchy.
2. **Simulation Matrix**: Incorporates "Scenario Builders" running calculations showcasing precisely how long-duration instances calculate against stacked compounding variables.

## Attendant Module
**Primary Purpose**  
Although the component logic strictly sits at `AttendantLayout.jsx` awaiting specific inner-page instantiations, the domain intends to provide a highly mobile-first verification suite.

**Key Features & Sections**
1. **AttendantLayout**: Governs authentication logic rendering rapid-action interfaces, permitting security guards instant override authority related to spot disputes or offline terminal failure scenarios.

## Shared Module

### Login — `src/shared/auth/Login.jsx`
**Primary Purpose**  
The central authentication gateway that securely identifies users and dynamically routes them to their respective specialized dashboards (Driver, Owner, or Attendant) based on their verified role.

**Key Features & Sections**
1. **Role-Based Routing**: Evaluates verified credentials against the database and executes React Router redirects to the correct layout contexts.
2. **Credential Management**: Provides a secure interface for entering emails and passwords, with robust error handling for invalid states.
3. **Environment Setup**: Initializes necessary `localStorage` tokens and ensures the global theme context aligns with user preferences upon entry.

### DriverSignUp — `src/shared/auth/DriverSignUp.jsx`
**Primary Purpose**  
A comprehensive, multi-stage registration funnel specifically engineered to onboard new drivers by securely collecting their demographic and vehicular data.

**Key Features & Sections**
1. **Multi-Step Funnel**: Sections the onboarding process logically (Basic Info, Vehicle Details, Password Setup) to reduce cognitive load and prevent form abandonment.
2. **Granular Validations**: Enforces strict syntactical rules on critical data like Ethiopian phone formats and specialized license plate categorizations.
3. **Local Profile Initialization**: Immediately writes the validated data structure into local storage keys (`vp_driver_name`, etc.) for seamless first-time usage.

### ForgotPassword — `src/shared/auth/ForgotPassword.jsx`
**Primary Purpose**  
A secure, multi-stage recovery flow enabling users who have lost access to their credentials to safely reset their authentication tokens without administrative support.

**Key Features & Sections**
1. **OTP Verification**: Implements a time-sensitive One-Time Password mechanism sent to the registered email to prove account ownership before allowing mutation.
2. **Typo Prevention**: Incorporates proactive email domain checking (e.g., catching `@gmai.com`) to prevent users from locking themselves out via simple errors.
3. **Strength Enforcement**: Integrates the same robust password strength criteria utilized during registration to ensure the new credential maintains system security standards.

### PrivacyPolicy — `src/shared/pages/PrivacyPolicy.jsx`
**Primary Purpose**  
A static informational document clearly outlining VisionPark's data handling procedures, establishing trust by communicating compliance with regional and constitutional privacy laws.

**Key Features & Sections**
1. **Constitutional Alignment**: Explicitly references Article 26 of the FDRE Constitution, demonstrating localized legal awareness regarding personal data rights.
2. **Data Usage Transparency**: Clearly delineates exactly how telemetry, license plates, and transaction histories are stored and manipulated by the AI backend.

## Shared Components
- **Header**: Primary navigation context aware of user types. Features theme shifting, logo rendering, and profile toggling.
- **GlassCard**: Foundational element standardizing visual consistency by embedding subtle transparency layers mirroring glassmorphism aesthetics.
- **Logo**: Unified central vector display of the main corporate brand.
- **StatusBadge**: Tiny pill indicators ensuring rapid cognition of varied dynamic conditions.
- **Theme-Toggle**: Interactive utility strictly responsible for swapping light mode vs dark mode boolean identifiers in the DOM matrix context.

## Layouts
1. **DriverLayout**: Mobile-forward layout ensuring maximum ease of use. It centralizes around primary tasks like Maps, Current Sessions, and localized History. Utilizes a sidebar navigation context focusing on wide viewports for discovery.
2. **OwnerLayout**: An enterprise-grade, heavy dashboard shell structured heavily with desktop viewing in mind. Integrates an entire complex side-menu routing owners down multiple granular analytical rabbit-holes safely.
3. **AttendantLayout**: Built to be lean, fast, and aggressively responsive. Tailored towards handheld devices ensuring field operators handle task throughput quickly without cumbersome multi-menus.
