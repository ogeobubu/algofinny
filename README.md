
# AlgoFinny: An AI-Powered Personal Finance Platform

**Final Year Project Documentation**  
Department of Computer Science and Engineering  
Obafemi Awolowo University, Ile-Ife, Nigeria

---

## Abstract

AlgoFinny is a modern, AI-powered web application designed to help individuals manage their personal finances with ease. The platform enables users to track income and expenses, upload and analyse bank statements, and receive actionable financial advice powered by advanced AI models (OpenAI and Deepseek). This project demonstrates the integration of modern web technologies, secure authentication, and artificial intelligence to deliver a seamless and insightful user experience.

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [System Architecture](#system-architecture)
4. [Technologies Used](#technologies-used)
5. [Installation and Setup](#installation-and-setup)
6. [Usage Guide](#usage-guide)
7. [API Endpoints](#api-endpoints)
8. [AI Integration](#ai-integration)
9. [Security Considerations](#security-considerations)
10. [Conclusion](#conclusion)

---

## Introduction

Personal finance management is a critical skill for individuals seeking financial stability and growth. However, many people struggle to track their spending, analyse their financial habits, and receive tailored advice. AlgoFinny addresses these challenges by providing a user-friendly platform that leverages artificial intelligence to automate analysis and deliver personalised recommendations. This project was developed as a final year undergraduate project at Obafemi Awolowo University.

## Features

- **User Authentication:** Secure registration and login system.
- **Dashboard:** Visualise income, expenses, and financial summaries.
- **Transaction Management:** Add, edit, and categorise transactions.
- **Bank Statement Upload:** Upload PDF/CSV bank statements for automatic extraction and analysis.
- **AI-Powered Insights:** Receive actionable financial advice using OpenAI and Deepseek APIs.
- **Modern UI:** Responsive, accessible, and visually appealing interface.

## System Architecture

The system is built using a modular, service-oriented architecture:

- **Frontend:** Developed with Next.js and React, providing a dynamic and interactive user experience.
- **Backend:** Node.js server with Express and TypeScript, handling API requests, authentication, and business logic.
- **Database:** MongoDB for persistent storage of user data and transactions.
- **AI Services:** Integration with OpenAI and Deepseek for advanced natural language processing and financial advice generation.

## Technologies Used

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB, Mongoose
- **AI/ML:** OpenAI API, Deepseek API, LangChain (for document parsing)
- **Authentication:** JWT, bcryptjs
- **File Uploads:** formidable

## Installation and Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/ogeobubu/algofinny.git
   cd algofinny
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   cd server && npm install
   ```
3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env` in both root and `server/` directories.
   - Set your MongoDB URI, JWT secret, and API keys for OpenAI and Deepseek.
4. **Run the Development Servers:**
   - **Frontend:**
     ```bash
     npm run dev
     ```
   - **Backend:**
     ```bash
     cd server
     npm run dev
     ```
5. **Access the Application:**
   - Open [http://localhost:3000](http://localhost:3000) for the frontend.
   - The backend API runs on [http://localhost:4001](http://localhost:4001).

## Usage Guide

1. **Register an Account:** Use the landing page to sign up securely.
2. **Add Transactions:** Manually add or categorise your income and expenses.
3. **Upload Bank Statement:** Navigate to the bank statement upload page and submit your PDF/CSV file.
4. **View Insights:** Access your dashboard for visual summaries and AI-powered advice.

## API Endpoints

- `POST /api/auth/signup` — Register a new user
- `POST /api/auth/login` — Login and receive JWT
- `GET /api/transactions` — List all transactions for the authenticated user
- `POST /api/transactions` — Add a new transaction
- `PUT /api/transactions/:id` — Update a transaction
- `DELETE /api/transactions/:id` — Delete a transaction
- `POST /api/bank/upload` — Upload a bank statement (PDF/CSV)
- `GET /api/ai/advice` — Get AI-powered financial advice

## AI Integration

AlgoFinny leverages state-of-the-art AI models to provide users with meaningful financial insights:

- **OpenAI:** Used for generating natural language advice and summarising spending patterns.
- **Deepseek:** Provides advanced, context-aware financial recommendations.
- **LangChain:** Parses and extracts transaction data from uploaded bank statements.

## Security Considerations

- All passwords are securely hashed using bcryptjs.
- JWT is used for stateless authentication.
- Sensitive API keys and secrets are stored in environment variables.
- User data is never shared with third parties.

## Conclusion

This project demonstrates the application of modern web development and artificial intelligence to solve real-world problems in personal finance. AlgoFinny is designed to be extensible, secure, and user-centric, providing a valuable tool for individuals seeking to improve their financial literacy and management.

---

**Author:** Oge Obubu  
**Supervisor:** Dr Gambo  
**Department of Computer Science and Engineering**  
Obafemi Awolowo University, Ile-Ife, Nigeria
