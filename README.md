<!-- PROJECT BADGES -->
<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-blue" />
  <img src="https://img.shields.io/badge/Language-TypeScript-blueviolet" />
  <img src="https://img.shields.io/badge/Build-Vite-brightgreen" />
  <img src="https://img.shields.io/badge/AI-Powered-orange" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
  <img src="https://img.shields.io/badge/Contributions-Welcome-success" />
</p>

<h1 align="center">SmartSpend AI</h1>
<p align="center">An AI-powered expense tracker built with React + TypeScript + Vite</p>

---

## 🚀 Overview

**SmartSpend AI** is an intelligent personal finance tracker that blends clean UI with powerful AI capabilities.  
Using **OpenAI** and **Gemini** models, the app helps users analyze spending behavior, generate insights, and receive conversational budgeting guidance.

This application is designed for fast performance, modularity, and a smooth user experience.

---

## ✨ Features

### **Expense Tracking**
- Add, edit, and categorize transactions  
- Interactive financial charts  
- Summary view of total income, expense, and balance  

### **AI Assistant**
- Finance-focused chatbot  
- Spending pattern analysis  
- Budget optimization suggestions  
- Uses **OpenAI** + **Gemini** APIs  

### **Modern Web App**
- Built with React + TypeScript  
- Vite for lightning-fast development  
- Reusable, scalable UI components  
- Clean onboarding and login screens  

---

## 🧠 Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React, TypeScript |
| Build Tool | Vite |
| AI Models | OpenAI, Google Gemini |
| Storage | Local Storage |
| Components | Custom reusable React components |

---

## 📁 Project Structure

smartspend-ai/
│
├── components/
│ ├── AppIcon.tsx
│ ├── Card.tsx
│ ├── ChatBot.tsx
│ ├── Charts.tsx
│ ├── Icon.tsx
│ ├── LoginView.tsx
│ ├── OnboardingView.tsx
│ └── TransactionForm.tsx
│
├── services/
│ ├── storageService.ts
│ ├── geminiService.ts
│ ├── openaiService.ts
│
├── App.tsx
├── index.tsx
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── types.ts

yaml
Copy code

---

## 🔧 Installation & Setup

### **1. Clone the repository**
```bash
git clone <your-repo-url>
cd smartspend-ai
2. Install packages
bash
Copy code
npm install
3. Add environment variables
Create an .env.local file:

ini
Copy code
VITE_OPENAI_API_KEY=your_openai_key
VITE_GEMINI_API_KEY=your_gemini_key
4. Run the development server
bash
Copy code
npm run dev
5. Build for production
bash
Copy code
npm run build
🤖 AI Integration
Gemini Service
Used for fast suggestions and lightweight insights.
File: services/geminiService.ts

OpenAI Service
Used for deep analysis and conversational financial assistance.
File: services/openaiService.ts

The system routes queries to the most appropriate AI model.

🛣️ Roadmap
Cloud sync (Firebase / Supabase)

Export reports (PDF, Excel)

ML-based expense prediction

Multi-currency support

Theme customization

Multi-wallet support

🤝 Contributing
Contributions are welcome.
Please open an issue or submit a pull request with clear descriptions.

📜 License
This project is licensed under the MIT License.

<p align="center">Made with passion, TypeScript, and AI 🚀</p> ```
