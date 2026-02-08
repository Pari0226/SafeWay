# 🚺 SafeWay – Women Safety Route Companion

SafeWay is a smart navigation app that helps you choose **safer routes instead of just shorter ones**.  
It combines real-time maps, a multi-factor safety score, and an SOS system so you can travel with more confidence — especially at night or in unfamiliar places.

---

## 🎥 Demo

Want to see SafeWay in action?

▶ **Live App:** https://safe-way.vercel.app/login

---

## ✨ Features

### 🗺 Interactive Navigation
- Search source & destination with smart suggestions  
- View multiple routes on an interactive map  
- Routes color-coded by safety level  
- Drop pins directly on the map  

### 🧠 Safety Scoring Engine
- Score from **0–100** for every route  
- Factors include:  
  - City crime statistics  
  - Women & night safety index  
  - Time of day risk  
  - Area type (market / highway / isolated)  
  - Population density  

### 🚨 SOS Emergency System
- Add trusted emergency contacts  
- One-tap SOS with live location  
- SMS alerts via Twilio  
- Alert history saved securely  

### 👤 User Features
- Secure login & registration  
- Save favorite routes  
- Report unsafe incidents  
- View nearby safety reports  

### ⚡ Performance
- Redis caching  
- Debounced search  
- Smart API fallbacks  
- Auto session handling  

---

## 🛠 Tech Stack

**Frontend**
- React + Vite  
- React Router  
- React-Leaflet  
- Axios  
- OpenStreetMap Nominatim  

**Backend**
- Node.js + Express  
- Prisma + PostgreSQL  
- JWT Authentication  
- Twilio SMS  
- Redis Caching  

---

## 📌 How Safety Score Works

Each route is evaluated using:

- Crime data → **40%**  
- Time of day → **25%**  
- Area type → **20%**  
- Density → **15%**

**Levels:**  
🟢 Safe – score ≥ 80  
🟡 Moderate – 50–79  
🔴 Risky – < 50  

---

## 🌱 Future Plans

- ML based crime prediction  
- Real-time crowd density  
- Voice SOS  
- Backend unified safety engine  
- Test suite  

---

## 💙 Built By

**Pari Singh**  
Making everyday travel a little safer ✨
