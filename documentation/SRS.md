# Software Requirements Specification (SRS)  
**Project Name:** Save n Bite  
**Version:** 1.0  
**Date:** [22/05/2025]  
**Team:** [Secure Web & Mobile Guild]  
**GitHub Repository:** [Link to Repo](https://github.com/COS301-SE-2025/Save-n-Bite)

---

## 1. Introduction  

### Business Need  
Food waste is a major global concern, with tons of surplus food being discarded every day despite being safe for consumption. This not only contributes to environmental harm but also overlooks the needs of food-insecure individuals and communities. Businesses such as restaurants, hotels, and grocery stores frequently dispose of edible surplus food due to logistical and regulatory constraints.  

Simultaneously, many individuals—especially students and low-income groups—face food insecurity. There is a need for a structured, secure, and accessible platform that facilitates the redistribution of surplus food in a way that is efficient, compliant with safety regulations, and scalable across communities.  

### Project Scope  
Save n Bite will develop a web and mobile platform that connects food suppliers with individuals and organisations in need. The system will allow verified users to list, browse, request, purchase, or request a donation of surplus food. It includes:  
- Role-based dashboards  
- Scheduling tools for pickups  
- AI-driven listing suggestions  
- Review features  

**Exclusions:**  
- Delivery and logistics are **not** part of this project.  

**Pilot Program:**  
The project will be piloted with **University of Pretoria food outlets** in collaboration with **Gendac**.  

---

## 2. User Stories / Epics 

### EPIC 1: User Profile Management  

| User Stories | Acceptance Criteria |
|-------------|--------------------|
| **1. As a Food Provider**, I want to register a profile so that I can list surplus food items for sale or donation. | Given that a user wants to register as a Food Provider, when they select "Register as Food Provider" and enter business details, contact information, and license documents, then a confirmation of successful registration is received. |
| **2. As an Individual Consumer**, I want to register an account so that I can browse and purchase food. | Given that an Individual Consumer wants to register an account, when they choose "Register as Individual" and provide their name, email, and password, then a confirmation email is sent upon successful registration. |
| **3. As an Organization**, I want to register to request food donations for our cause. | Given that an Organization wants to register for food donation requests, when they select "Register as Organization" and upload proof of registration, then their status is set to "Verification pending" until approved by an admin. |
| **4. As a System Administrator**, I want to verify user accounts so that only legitimate providers and organizations are approved. | Given that a System Administrator wants to verify user accounts, when they access the admin dashboard and review uploaded documents, then they can approve or reject users with comments. |
| **5. As any User**, I want to update my profile information so that I can keep my data current. | Given that a user wants to update their profile information, when they edit fields such as email, phone, profile image, and upload updated documents, then their profile information is updated accordingly. |
| **6. As a System Administrator**, I want to manage user roles and permissions so that appropriate access is granted to each user type. | Given that a System Administrator wants to manage user roles and permissions, when they access role management features, then they can assign roles and restrict access based on the selected role. |

### EPIC 2: Food Listing and Management  

| User Stories | Acceptance Criteria |
|-------------|--------------------|
| **1. As a Food Provider**, I want to create a food listing so that surplus food can be made available. | Given that a Food Provider wants to list surplus food, when they enter the food name, description, expiration date, and optionally upload images and choose a pickup/delivery method, then the food listing is created as either a donation or discount item. |
| **2. As a Food Provider**, I want to receive AI-based listing suggestions so that I can optimize sales and reduce waste. | Given that a Food Provider is creating or updating a listing, when they input relevant details, then the system suggests optimal listing time and quantity based on historical data. |
| **3. As a Food Provider**, I want to view and manage my own listings so that I can update or remove them as needed. | Given that a Food Provider wants to manage existing listings, when they access their dashboard, then they can view, edit, or delete current and past food items. |

### EPIC 3: Food Discovery  

| User Stories | Acceptance Criteria |
|-------------|--------------------|
| **1. As an Individual Consumer**, I want to search for food items so that I can find meals that meet my needs. | Given that an Individual Consumer is searching for food, when they use the search bar and apply filters by name, type, expiration date, or location, then relevant food items are displayed. |
| **2. As an Organization**, I want to browse food listings so that I can find donations suitable for our needs. | Given that an Organization is browsing for food donations, when they filter listings by type, quantity, or expiration date, then donation-only items relevant to their needs are shown. |
| **3. As any User**, I want to view food details so that I can make informed decisions. | Given that any User is viewing a food listing, when they select an item, then the full details including description, images, listing date, and provider details are visible. |
| **4. As any User**, I want to receive notifications about new listings so that I can act quickly. | Given that any User has enabled notifications, when new listings that match their preferences (e.g., category or area) are posted, then they receive email or in-app alerts. |

### EPIC 4: Transactions & Donations 

| User Stories | Acceptance Criteria |
|-------------|--------------------|
| **1. As an Individual Consumer**, I want to purchase discounted food items so that I can reduce my food cost. | Given that an Individual Consumer is ready to make a purchase, when they proceed to checkout and complete the payment, then they can review their final order before payment confirmation. |
| **2. As an Organization**, I want to request food donations so that we can support those in need. | Given that an Organization wants to request a donation, when they submit a request for a specific donation listing, then they receive confirmation and available delivery options. |
| **3. As any User**, I want to view my transaction history so that I can track my past activities. | Given that any User wants to review their past transactions, when they access their transaction history, then they can filter by date and type (purchase/donation) and view order details and statuses. |

### EPIC 5: Pickup Coordination

| User Stories | Acceptance Criteria |
|-------------|--------------------|
| **1. As an Individual Consumer**, I want to schedule a pickup so that I can collect food at a convenient time. | Given that an Individual Consumer is finalizing a request or purchase, when they select a pickup time slot, then they receive pickup location, contact information, and a confirmation/reminder notification. |
| **2. As a Food Provider**, I want to manage pickup schedules so that I can prepare the food ahead of collection times. | Given that a Food Provider wants to prepare for pickups, when they define pickup windows and view the upcoming schedule, then they can manage pickups and mark them as completed when done. |
| **3. As a System Administrator**, I want to view and monitor all scheduled pickups so that I can ensure operations run smoothly. | Given that a System Administrator wants to monitor pickup activities, when they view the admin dashboard, then they can see all pickups, filter by user or time, and edit pickup times if needed. |

### EPIC 6: Feedback & Reviews

| User Stories | Acceptance Criteria |
|-------------|--------------------|
| **1. As an Individual Consumer**, I want to rate my purchase experience so that I can give feedback. | Given that an Individual Consumer has completed a transaction, when they leave a review with a rating and optional comment, then the review is linked to the specific transaction. |
| **2. As a System Administrator**, I want to moderate reviews so that we ensure quality content. | Given that a System Administrator wants to moderate user feedback, when they access the reviews section in the dashboard, then they can remove or flag inappropriate content. |

### EPIC 7: Analytics & Impact Tracking

| User Stories | Acceptance Criteria |
|-------------|--------------------|
| **1. As a Food Provider**, I want to view waste reduction metrics so that I can measure our sustainability efforts. | Given that a Food Provider wants to assess their environmental contribution, when they view analytics, then they see metrics such as food saved and CO₂ reduction over time (monthly/yearly). |
| **2. As an Organisation**, I want to track meals received and distributed so that we can report impact to donors. | Given that an Organization needs to track its operational impact, when they access reports, then they see visual charts of meals received and can export the data for reporting purposes. |

### EPIC 8: Blockchain & Rewards System

| User Stories | Acceptance Criteria |
|-------------|--------------------|
| **1. As an Individual Consumer**, I want to earn SaveCoins for sustainable actions so that I feel rewarded | Given that an Individual Consumer performs sustainable actions (e.g., donations or purchases), when the action is completed, then SaveCoins are automatically awarded and the balance updates in real-time. |
| **2. As an Organisation**, I want to redeem rewards so that we can access useful resources or discounts. | Given that an Organization has accumulated SaveCoins, when they view the reward catalog, then they can redeem coins for eligible resources or discounts. |

### EPIC 9: Education & Community

| User Stories | Acceptance Criteria |
|-------------|--------------------|
| **1. As any User**, I want to view sustainability content so that I can learn how to reduce food waste. | Given that any User wants to learn about sustainability, when they browse the education section, then they can view articles, videos, infographics, and track completed content. |
| **2. As an Individual Consumer**, I want to participate in challenges so that I can stay motivated. | Given that an Individual Consumer wants to stay motivated, when they join a sustainability challenge, then they receive progress updates and badges as they complete activities. |

### EPIC 10: Gamification

| User Stories | Acceptance Criteria |
|-------------|--------------------|
| **1. As a Food Provider**,  I want to earn points for listing items regularly so that I feel recognized. | Given that a Food Provider lists items regularly, when new listings or transactions are completed, then points are awarded and progress toward achievements is visible. |
| **2. As any User**, I want to view a leaderboard so that I can compare my sustainability impact with others. | Given that any User wants to track their standing, when they view the leaderboard, then they see rankings categorized by user type (individuals, providers, organizations) with weekly and monthly summaries. |

---

## 3. Use Case Diagrams  

![Use Case Diagram for User Management](../assets/UseCase_User_Management_Subsystem.png)
![Use Case Diagram for Food Listings](../assets/UseCase_Food_Listing_Subsystem.png)
![Use Case Diagram for Food Discovery and Transactions](../assets/UseCase_Food_Discovery_and_Transactions.png)
![Use Case Diagram for Feeback, Analytics and AI](../assets/UseCase_Feedback_Analytics_AI.png)
![Use Case Diagram for Logistics](../assets/UseCase_Logistics_Subsystem.png)
![Use Case Diagram for Blockchain, Education and Gamification](../assets/UseCase_Blockchain_Education_Gamification.png)

---

## 4. Functional Requirements  

R1: **User Management**  
&nbsp;&nbsp;&nbsp;&nbsp;R1.1 The system must support registration for individuals, organisations, and businesses.  
&nbsp;&nbsp;&nbsp;&nbsp;R1.2 Users must be verified during registration.  
&nbsp;&nbsp;&nbsp;&nbsp;R1.3 The system must support role-based access (e.g. individuals, organisations, businesses, admin).  
&nbsp;&nbsp;&nbsp;&nbsp;R1.4 Secure login/logout functionality must be provided.  
&nbsp;&nbsp;&nbsp;&nbsp;R1.5 The system must limit functionality based on user role and verification status.  
&nbsp;&nbsp;&nbsp;&nbsp;R1.6 The system should allow the user to update their profile.  
&nbsp;&nbsp;&nbsp;&nbsp;R1.7 The system should allow the user to reset their password.  
&nbsp;&nbsp;&nbsp;&nbsp;R1.8 The admin should be able to manage roles and permissions.  

R2: **Make Listings**  
&nbsp;&nbsp;&nbsp;&nbsp;R2.1 Only verified business users should be able to create new surplus food listings.  
&nbsp;&nbsp;&nbsp;&nbsp;R2.2 Each listing must include the following details:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Name of the item  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Description  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Expiry date  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Photos (optional)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Quantity available  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Price (or mark as donation)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Pickup Options  
&nbsp;&nbsp;&nbsp;&nbsp;R2.3 Business users should be able to indicate whether the listing is for sale at a discounted price or available as a donation.  
&nbsp;&nbsp;&nbsp;&nbsp;R2.4 Listings should update real-time availability as items are reserved or claimed.  
&nbsp;&nbsp;&nbsp;&nbsp;R2.5 Businesses should be able to update food listings.  
&nbsp;&nbsp;&nbsp;&nbsp;R2.6 Businesses should be able to view their own listings.  

R3: **Browse Listings**  
&nbsp;&nbsp;&nbsp;&nbsp;R3.1 Verified users (individuals and organizations) should be able to view active food listings.  
&nbsp;&nbsp;&nbsp;&nbsp;R3.2 Users should be able to search for listings by keyword (e.g., name, category).  
&nbsp;&nbsp;&nbsp;&nbsp;R3.3 Users should be able to filter listings by:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Availability (in stock)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Type (donation or discounted sale)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Expiry date  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- Business location  
&nbsp;&nbsp;&nbsp;&nbsp;R3.4 Listings should display clearly formatted information (e.g., name, expiry, image, availability).  
&nbsp;&nbsp;&nbsp;&nbsp;R3.5 Users should be able to sort the listings.  
&nbsp;&nbsp;&nbsp;&nbsp;R3.6 Users should be able to receive notifications whenever new listings are added for food products they’re interested in.  

R4: **Purchase / Request Food Items**  
&nbsp;&nbsp;&nbsp;&nbsp;R4.1 Verified individual users should be able to purchase discounted food items.  
&nbsp;&nbsp;&nbsp;&nbsp;R4.2 Verified organization users should be able to request food items listed as donations.  
&nbsp;&nbsp;&nbsp;&nbsp;R4.3 The system should enforce limits to prevent bulk purchasing or hoarding (based on user role and verification status).  
&nbsp;&nbsp;&nbsp;&nbsp;R4.4 Upon purchase or request, the listing should be updated to reflect new availability.  
&nbsp;&nbsp;&nbsp;&nbsp;R4.5 A confirmation screen should summarize the transaction (e.g., pickup time, location, item details).  
&nbsp;&nbsp;&nbsp;&nbsp;R4.6 Users should be able to cancel purchases if they haven’t paid for them yet.  
&nbsp;&nbsp;&nbsp;&nbsp;R4.7 Users should be able to view their transaction history.  

R5: **Logistics**  
&nbsp;&nbsp;&nbsp;&nbsp;R5.1 Businesses must be able to set available pickup times for each listing.  
&nbsp;&nbsp;&nbsp;&nbsp;R5.2 Organizations must be able to coordinate logistics for food pickups.  
&nbsp;&nbsp;&nbsp;&nbsp;R5.3 Real-time tracking and status updates must be available for scheduled pickups.  
&nbsp;&nbsp;&nbsp;&nbsp;R5.4 The system should allow users to receive notifications about pickup schedules and updates.  

R6: **Feedback & Review**  
&nbsp;&nbsp;&nbsp;&nbsp;R6.1 Verified users must be able to rate their food purchase or donation experiences.  
&nbsp;&nbsp;&nbsp;&nbsp;R6.2 Businesses must be able to view feedback received.  
&nbsp;&nbsp;&nbsp;&nbsp;R6.3 A moderation system must exist to prevent false or abusive reviews.  
&nbsp;&nbsp;&nbsp;&nbsp;R6.4 Reviews should be linked to specific listings or transactions.  

R7: **Analytics**  
&nbsp;&nbsp;&nbsp;&nbsp;R7.1 Businesses must be able to view analytics on food waste reduction (e.g., items saved).  
&nbsp;&nbsp;&nbsp;&nbsp;R7.2 The system should present user-friendly dashboards for performance metrics (e.g., total meals donated).  
&nbsp;&nbsp;&nbsp;&nbsp;R7.3 Metrics may include total donations, frequent users, and overall impact.  

R8: **AI Prediction**  
&nbsp;&nbsp;&nbsp;&nbsp;R8.1 The system must use historical data to predict surplus food trends (e.g., "Fridays have 20% more leftovers").  
&nbsp;&nbsp;&nbsp;&nbsp;R8.2 AI must suggest optimal listing times or donation windows to maximize redistribution.  
&nbsp;&nbsp;&nbsp;&nbsp;R8.3 Predictions must be visible to business users during listing creation.  
&nbsp;&nbsp;&nbsp;&nbsp;R8.4 The system must generate smart recommendations to organisations and individuals.  

R9. **Blockchain & Rewards**  
&nbsp;&nbsp;&nbsp;&nbsp;R9.1 The platform must include a blockchain-based wallet system for secure transactions.  
&nbsp;&nbsp;&nbsp;&nbsp;R9.2 Users should be able to earn rewards for actions like donations, purchases, or community engagement.  
&nbsp;&nbsp;&nbsp;&nbsp;R9.3 Rewards and transactions must be logged securely and transparently on the blockchain.  
&nbsp;&nbsp;&nbsp;&nbsp;R9.4 Users may redeem rewards for discounts or other incentives.  
&nbsp;&nbsp;&nbsp;&nbsp;R9.5 Individuals and organisations should be able to share their impact achievements.  

R10: **Educational & Community**  
&nbsp;&nbsp;&nbsp;&nbsp;R10.1 The platform must include educational content on reducing food waste.  
&nbsp;&nbsp;&nbsp;&nbsp;R10.2 The platform should allow users to participate in sustainability challenges.  
&nbsp;&nbsp;&nbsp;&nbsp;R10.3 Users must be able to access community updates, initiatives, or campaigns.  

R11: **Gamification**  
&nbsp;&nbsp;&nbsp;&nbsp;R11.1 Users must be able to earn badges based on activity (e.g., “5 meals saved this week”).  
&nbsp;&nbsp;&nbsp;&nbsp;R11.2 The platform must support social sharing of achievements (e.g., on X/Twitter or Instagram).  
&nbsp;&nbsp;&nbsp;&nbsp;R11.3 Badges should be linked to real impact data (e.g., CO₂ reduction, meals saved).  
&nbsp;&nbsp;&nbsp;&nbsp;R11.4 A leaderboard or achievement dashboard should be available for user motivation.  


---

## 5. Service Contracts  

[Authentication Service Contract](Authentication_service_contract.md)  
[Food Listing Service Contract](Food_Listing_service_contract.md)  
[Transactions Service Contract](Transactions_service_contracts.md)

---

## 6. Domain Model  

![Domain Model](Save-n-Bite_DomainModel.png)

---

## 7. Architectural Requirements  

### 7.1 Quality Requirements and Constraints  

| **Category**               | **Requirement**                                                                 | **Associated Quality Attribute/Constraint**                                                                 |
|----------------------------|---------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
|                            | Secure verification to prevent misuse                                           |  Security constraint                                                             |
| **User Access**             | Role-based access (Provider/Organization/Consumer)                             |  Security model                                                                  |
|                            | Secure login for all users                                                      |  Security standard                                                               |
| **Security & Compliance**   | Fraud prevention (bulk purchase limits, etc.)                                  |  Security policy                                                                 |
|                            | Compliance with food safety regulations                                         |  Legal/regulatory constraint                                                     |
| **Platform UX**             | Responsive web app                                                             |  Usability standard/interoperability                                             |
|                            | Notifications for popular/upcoming listings                                     |  Performance/usability                                                           |
|                            | Only verified users access core features                                        |  Security constraint                                                             |
| **Logistics (Optional)**    | Route optimization for bulk donations                                          |  Performance optimization                                                        |
| **Analytics (Optional)**    | Impact reporting (meals saved, CO₂ reduced)                                    |  Analytics/scalability                                                           |
| **Architecture**            | Cloud-hosted deployment (Azure)                                                |  Infrastructure constraint                                                       |
|                            | Modular system design                                                           |  Maintainability                                                                 |
|                            | Secure authentication                                                           |  Security                                                                        |
| **Design**                  | UI/UX best practices                                                           |  Usability                                                                       |
|                            | First-launch tutorial                                                           |  User onboarding                                                                 | 
 
### 7.2 Architectural Patterns: Event-Driven Architecture
 
#### **Overview**
We adopt an **event-driven architecture (EDA)** to handle real-time data flows between food providers, consumers, and AI-driven analytics. This pattern decouples system components by treating actions (e.g., new food listings, orders) as **events** that trigger independent processes.

#### **Key Components**
| Component          | Role                                                                 | Example Events                          |
|--------------------|----------------------------------------------------------------------|-----------------------------------------|
| **Producers**      | Emit events when state changes (e.g., new listing, order placement). | `FoodListingCreated`, `OrderPlaced`     |
| **Broker**         | Routes events to subscribed consumers (Redis Pub/Sub).               | Manages `food_listings` channel         |
| **Consumers**      | React to events (AI, UI, notifications).                             | `AI_PredictionService`, `UserInterface` |

#### **Reasons for EDA:**
1. **Real-Time Updates**  
   - Users instantly see new listings/donations via WebSocket pushes (no page refresh).  
   - Example: When a restaurant lists surplus food, the UI updates in <500ms.

2. **Decoupled AI/ML**  
   - The AI model consumes inventory update events to predict surplus trends **asynchronously**, avoiding UI latency.  
   - Scales independently during demand spikes (e.g., meal rush hours).

3. **Modularity**  
   - New features (e.g., fraud detection) can subscribe to events without modifying producers.  
   - Example: A `DonationRequested` event triggers both logistics and impact analytics.

4. **Fault Tolerance**  
   - If the AI service crashes, orders/listings continue uninterrupted (events persist in Redis).

#### **Tech Stack Alignment**
Broker: Redis Pub/Sub (lightweight, supports WebSocket via Django Channels).

Frontend: React listens to WebSocket events for real-time UI updates.

Backend: Django emits events on CRUD operations (e.g., post_save signals).


### 7.3 Design Patterns  

#### 1. Singleton
- The **verification system** will be created as a singleton class to ensure a single point of control for security-critical operations (e.g., document validation, fraud checks).
- The **AI model** will be a singleton class to avoid memory watse and guarantees consistent predictions.

#### 2. Observer
- The observer pattern is essential for an event-driven architecture and will be used for decoupling event emitters from subscribers.
- Producers include events that add food listings to the database while consumers include the AI service, the UI and user notifications subscribing to events.

#### 3. Command 
- The use of the command pattern will allow us to encapsulate actions as objects that can be queued or undone.
- Such actions include the ordering of food or sending a donation request.

---

## 8. Technology Requirements  

| Category       | Technologies                                                                 |
|----------------|-----------------------------------------------------------------------------|
| **Frontend**   | React, Material UI |
| **Backend**    | Django, Django REST, JWT|
| **Database**   | PostgreSQL, Redis|
| **Cloud**      | Microsoft Azure |
| **DevOps**     | Docker, GitHub Actions |
| **AI/ML**      | Python, Scikit-learn, Pandas |

---
