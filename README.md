SmartSpend AI – AI-Powered Expense Tracker

SmartSpend AI is an intelligent, modern expense-tracking application built with React + TypeScript + Vite, designed to help users manage finances effortlessly. The system integrates AI models (OpenAI / Gemini) to generate insights, analyze spending patterns, and provide recommendations through an in-app chatbot.

Key Features
1. Smart Expense Tracking

Add, categorize, and manage transactions.

Clean UI components (Card, TransactionForm, Charts, Icon, AppIcon).

Real-time financial summaries and interactive charts.

2. AI-Driven Assistance

AI chatbot powered via:

openaiService.ts

geminiService.ts

Understands user queries related to spending habits.

Generates insights, budgeting tips, and simplified reports.

3. Secure Local Storage Handling

Modular storage utility through storageService.ts.

Stores and retrieves user data efficiently.

4. Smooth User Experience

Onboarding flow (OnboardingView.tsx)

Authentication view (LoginView.tsx)

Responsive UI, optimized for mobile and desktop.

5. Modern Frontend Stack

React + TypeScript

Vite for blazing-fast builds

Component-based architecture

Clean state management and service abstraction

Project Structure
smartspend-ai/
│
├── components/
│   ├── AppIcon.tsx
│   ├── Card.tsx
│   ├── ChatBot.tsx
│   ├── Charts.tsx
│   ├── Icon.tsx
│   ├── LoginView.tsx
│   ├── OnboardingView.tsx
│   └── TransactionForm.tsx
│
├── services/
│   ├── storageService.ts
│   ├── geminiService.ts
│   ├── openaiService.ts
│
├── App.tsx
├── index.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── types.ts
└── README.md

Tech Stack
Category	Technology
Frontend Framework	React + TypeScript
Build Tool	Vite
AI Integration	OpenAI API, Gemini API
Data Handling	Local Storage
UI	Custom reusable components
Charting	Custom chart components
Setup Instructions
1. Clone the Repository
git clone <your-repo-url>
cd smartspend-ai

2. Install Dependencies
npm install

3. Configure Environment Variables

Create an .env.local file:

VITE_OPENAI_API_KEY=your_key
VITE_GEMINI_API_KEY=your_key

4. Run the Project
npm run dev

5. Build for Production
npm run build

6. Deploy to Any Static Host (Netlify, Vercel, Cloudflare Pages)
AI Integration Overview
Gemini

Used for fast and lightweight financial insights.

Located in: services/geminiService.ts

OpenAI

Used for advanced conversational and reasoning responses.

Located in: services/openaiService.ts

The application routes queries intelligently depending on context.

Screens & Components
Core Screens

Onboarding Screen – guides users through setup.

Login View – lightweight authentication mock.

Dashboard – charts + transaction overview.

ChatBot – AI assistant for financial queries.

UI Components

Reusable cards, icons, charts

Clean design system across components

Future Enhancements

Cloud sync with Firebase / Supabase

Multi-currency support

Export reports (PDF/Excel)

Recurring expense predictions

Full authentication (OAuth)

License

This project is licensed under the MIT License.
