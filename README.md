# Mini Lead CRM

A modern Lead Management CRM built for the Frontend Engineering Intern Assessment.  
The application allows users to manage leads through different stages of a sales pipeline with features like CRUD operations, filtering, search, bulk actions, and Kanban workflow management.

---

# Demo Video

[Watch Demo Video](https://www.loom.com/share/92d29bb6103c4d02bfc65436b37aaec2)

---

# Tech Stack Chosen and Why

## Framework — React + TypeScript

I chose React with TypeScript because it provides a scalable and maintainable frontend architecture while improving developer experience through type safety. TypeScript also helped reduce runtime errors and made component contracts more predictable while handling lead data and workflow transitions.

## State Management

I used React state and centralized state handling to separate UI state from async/server state. This helped avoid unnecessary prop drilling while keeping the application predictable and easier to maintain.

## Styling — Tailwind CSS

Tailwind CSS was chosen because it enabled rapid UI development while maintaining consistency in spacing, responsiveness, and reusable design patterns. It also made it easier to iterate quickly on layouts and UI polish during development.

## Mock API — json-server

The project uses `json-server` as a mock backend to simulate real CRUD APIs. This allowed the frontend to behave like a production-style application while keeping development lightweight and focused on frontend architecture.

---

# Setup Steps to Run Locally

## Clone Repository

```bash
git clone https://github.com/AjayKumar-KK/mini-lead-crm.git
cd mini-lead-crm
```

## Install Dependencies

### Frontend

```bash
cd frontend
npm install
```

### Mock Server

```bash
cd ../mock-server
npm install
```

## Run Mock Server

```bash
npm run server
```

## Run Frontend

```bash
cd ../frontend
npm run dev
```

The frontend and mock server should run simultaneously in separate terminal windows.

---

# Design Decisions

## Component, State, and Async Logic Organization

The application is organized using reusable and single-responsibility components. Shared UI elements such as tables, modals, badges, forms, and action menus are separated into reusable components to improve maintainability and scalability.

UI state and async/server state are intentionally separated to keep the application predictable and easier to manage. Every async operation includes dedicated loading and error handling states to improve overall user experience.

## Status Rule Enforcement

The workflow rules are enforced visually in the UI instead of relying only on backend validation. Invalid transitions are never shown to the user, which prevents incorrect actions before they happen and keeps the workflow intuitive.

Allowed transitions:

```text
NEW → CONTACTED → QUALIFIED → CONVERTED
```

Additionally:
- NEW → LOST
- CONTACTED → LOST
- QUALIFIED → LOST

CONVERTED and LOST are treated as terminal states.

## Offline Support / Concurrent Edits

If extended further, I would add offline-first support using cached API responses and queued mutations for reconnection sync. For concurrent edits, I would introduce version tracking or timestamps along with optimistic concurrency handling to prevent users from overwriting each other’s changes.

## What I’d Improve Given Another Week

Given additional time, I would improve:
- better mobile responsiveness
- smoother animations and UI polish
- unit and integration testing
- activity history for each lead
- undo functionality for important actions
- real-time synchronization for multiple users editing leads simultaneously

---

# AI Usage Note

I used AI tools during development mainly for brainstorming UI ideas, improving code structure, and exploring different approaches for certain features and edge cases.

However, the core application logic, status transition rules, component structure, and overall implementation were written and reviewed by me. I also made sure to understand every part of the code and avoided using suggestions that felt overly complex or unnecessary for the scope of this project.
