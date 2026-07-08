# Fitness-web
**Apex Fit – A Web-Based Enrollment & Payment System**

Apex Fit is a full-stack gym management web application designed to streamline user registration, membership enrollment, and secure mobile payments. It features an intuitive frontend for members and a robust administrative dashboard for backend management.

Features:
User & Enrollment Management.

User Registration & Login: Secure authentication for gym members.

Membership Plans: Browse, select and enroll in various gym membership tiers.

Admin Dashboard: Centralized control panel for administrators to manage user accounts, track enrollments and monitor system activity.

Billing & Payments:

Mobile Money Integration: Automated payment processing via Safaricom's Daraja API.

STK Push Notifications: 

Direct-to-phone STK prompts for seamless, automated user checkouts.

**Tech Stack**
Frontend:

HTML5 / CSS – Responsive user interface as well as styling.

JavaScript  – Client-side dynamic interactivity and frontend logic.

Backend:

Node.js – Runtime environment.

Express.js – Backend web framework managing routing and middleware.

Database:

MySQL / MariaDB – Relational database handling users, enrollment logs and transaction records.

Payment Gateway:

Safaricom Daraja API – Safaricom M-Pesa integration for handling STK push notifications.

Installation & Setup:

Prerequisites

Before setting up the project, ensure you have the following installed on your local environment:

Node.js 

MySQL or MariaDB server

An active Safaricom Daraja API developer account

1. Clone the Repository

Bash:

git clone https://github.com/your-username/Fitness-web.git

cd Fitness-web

2. Install Dependencies
   
Install the necessary backend Node.js packages:

Bash:

npm install

3. Database Setup
Open your MySQL/MariaDB terminal or management tool ie XAMPP.

Import the project's database schema to generate the necessary tables for users, plans, and payments.

4. Environment Variables Configuration
Create a .env file in the root directory of the project and supply your local configuration values:

Code snippet
# Server Configuration
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password
DB_NAME=apex_fit_db

# Safaricom Daraja API Credentials
MPESA_CONSUMER_KEY=your_daraja_consumer_key
MPESA_CONSUMER_SECRET=your_daraja_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_LNM_PASSKEY=your_lipa_na_mpesa_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/v1/payments/callback
5. Run the Application
Start the Node.js server:

Development mode (with automatic restarts):

Bash:
npm run dev
Production mode:

Bash:
npm start
Once running, open your browser and navigate to http://localhost:3000.
