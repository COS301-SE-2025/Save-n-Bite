# Save n Bite - Reducing Food Waste Through Technology 🍎♻️

**Team:** Secure Web & Mobile Guild (SWMG)  
**University of Pretoria | COS 301 - Software Engineering Capstone (2025)**  

![Demo Banner](https://via.placeholder.com/1200x400?text=Save+n+Bite+-+Fight+Food+Waste+with+Tech)  

---

## 📌 Project Description
**Save n Bite** is a digital platform connecting food providers (restaurants, grocery stores) with individuals/organizations to reduce food waste. Key features:  
- **AI-driven surplus prediction** for optimal food redistribution.  
- **Real-time inventory** and **secure verification** for users/businesses.  
- **Blockchain rewards** (optional) for donations via Ethereum smart contracts.  
- **Impact dashboard** tracking meals saved and CO₂ reduction.  

**Pilot Phase:** Launched at the University of Pretoria to validate scalability.  

---

## 🛠️ Tech Stack
| Category       | Technologies                                                               |
|----------------|----------------------------------------------------------------------------|
| **Frontend**   | React.js (Web), React Native (Mobile), Google Maps API, Material-UI        |
| **Backend**    | Python Django, Django REST Framework, JWT/OAuth2                           |
| **Database**   | PostgreSQL (ACID-compliant), Redis (caching/real-time updates)             |
| **Cloud**      | Microsoft Azure                                                            |
| **DevOps**     | Docker, GitHub Actions (CI/CD), Prometheus + Grafana (monitoring)          |
| **Blockchain** | Ethereum (smart contracts for rewards)                                     |

---

## 📂 Repository Structure
    TBC


---

## 🔗 Links
- **📄 [Software Requirements Specification (SRS)](docs/SRS.md)**  
- **📊 [GitHub Project Board](https://github.com/your-org/save-n-bite/projects/1)**  
- **🤖 [API Documentation](https://github.com/your-org/save-n-bite/wiki/API-Docs)**  

---

## 👥 Team Members
| Name                  | Role                | LinkedIn                                      | GitHub                                   |
|-----------------------|---------------------|-----------------------------------------------|------------------------------------------|
| Sabrina-Gabriel Freeman | Backend Lead       | [LinkedIn](https://www.linkedin.com/in/sabrina-gabriel-freeman-a57281346) | [GitHub](https://github.com/SaberF24)    |
| Marco Geral           | System Architect    | [LinkedIn](https://www.linkedin.com/in/marco-geral-820b7a355/) | [GitHub](https://github.com/Marco-Geral) |
| Chisom Emekpo         | Data/Backend        | [LinkedIn](https://www.linkedin.com/in/chisom-emekpo-39b89827l/) | [GitHub](https://github.com/somworld6)   |
| Vané Abrams           | Frontend Lead       | [LinkedIn](http://www.linkedin.com/in/vane-abrams–40569b305) | [GitHub](https://github.com/vdenise20)   |
| Capleton Chapfika     | Full-Stack          | [LinkedIn](https://www.linkedin.com/in/capletonchapfika/) | [GitHub](https://github.com/Capleton11)  |

---

## ✅ Demo 1 Deliverables (28 May 2025)
1. **Implemented Use Cases** (3+):  
   - User registration/login (JWT/OAuth2).  
   - Food listing by businesses (Django API + React form).  
   - Basic purchase/donation flow (mock payments).  

2. **SRS Document**:  
   - Domain model (UML class diagram).  
   - Use case diagrams + functional requirements.  

3. **GitHub Hygiene**:  
   - Branching strategy (`main` ↔ `feature/` branches).  
   - Code quality badges (Coveralls, GitHub Actions).  

---

## 🚀 Getting Started
```bash
# Clone the repo
git clone https://github.com/your-org/save-n-bite.git

# Backend setup (Django)
cd backend
pip install -r requirements.txt
python manage.py migrate

# Frontend setup (React)
cd ../frontend
npm install
npm start