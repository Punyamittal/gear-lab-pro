
# 🏎️ Gear Lab Pro  
## Formula Student Drivetrain Optimization Platform

<p align="center">
  <img src="https://i.pinimg.com/originals/ff/47/b9/ff47b943483aa857a812629c7f3eda5a.gif" alt="Gear Dynamics Animation" width="600"/>
</p>

🌐 **Live Demo:**  
https://spectacular-tartufo-dee682.netlify.app/

---

# 📌 Overview

Gear Lab Pro is a physics-grounded drivetrain optimization platform built specifically for **Formula Student teams**.

It combines:
- Multi-algorithm gear optimization
- Deterministic racing physics
- Traction constraint enforcement
- Drivability density logic
- AI + offline fallback intelligence
- Mobile + voice-enabled interaction

This is a **Digital Race Engineer + Physics Engine + Optimization Lab**.

---

## 📚 Technical Documentation (Evaluation Deep Dive)

For a detailed review of the engineering rigor and architecture, please explore:
- **[Mathematical Model](./docs/MATHEMATICAL_MODEL.md)**: Newton-Euler dynamics and traction physics.
- **[AI System Architecture](./docs/AI_SYSTEM_ARCHITECTURE.md)**: Multi-solver hubs and Generative Reasoning.
- **[UX & Accessibility Case Study](./docs/UX_CASE_STUDY.md)**: Auditory twins, haptics, and hands-free control.
- **[Future Engineering Roadmap](./docs/FUTURE_ENGINEERING_ROADMAP.md)**: Vision for Pacejka modeling and GIS integration.

---

# 🏗️ System Architecture

## 🔷 High-Level Block Architecture

```mermaid
flowchart LR
    A[Engine Torque Map] --> D[Optimization Engine]
    B[Vehicle Parameters] --> D
    C[Tyre Friction Model] --> D

    D --> E[Acceleration Simulator]
    D --> F[Skidpad Simulator]
    D --> G[Autocross Simulator]

    E --> H[Performance Aggregator]
    F --> H
    G --> H

    H --> I[Gemini Pit Wall Advisor]
    I --> J[Final Ratio Specification]
```

---

## 🔷 Optimization Engine Architecture

```mermaid
flowchart TD
    A[User Inputs] --> B[Solver Race Engine]

    B --> C1[Genetic Algorithm]
    B --> C2[Particle Swarm Optimization]
    B --> C3[Simulated Annealing]

    C1 --> D[Candidate Ratios]
    C2 --> D
    C3 --> D

    D --> E[Physics Validator]
    E --> F[Traction Constraint]
    F --> G[Drivability Density Check]
    G --> H[Score Evaluation]
    H --> I[Best Configuration Output]
```

---

## 🔷 Simulation Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Optimizer
    participant Physics
    participant Events
    participant AI

    User->>UI: Enter Parameters
    UI->>Optimizer: Run Solver
    Optimizer->>Physics: Evaluate Ratios
    Physics->>Events: Run Event Sims
    Events->>Optimizer: Return Times
    Optimizer->>AI: Generate Strategy
    AI->>UI: Display Insights
```

---

# 📊 Performance Modeling Charts

## 🔷 Tractive Effort Distribution

```mermaid
pie title Tractive Effort Contribution Across Gears
    "Gear 1 Peak Zone" : 35
    "Gear 2 Mid Acceleration" : 30
    "Gear 3 High Speed Pull" : 20
    "Traction Limited Region" : 15
```

---

## 🔷 Event Time Weight Distribution

```mermaid
pie title Weighted Event Contribution to Optimization
    "0-75m Acceleration" : 40
    "Skidpad" : 25
    "Autocross" : 35
```

---

## 🔷 Acceleration Setup Comparison

```mermaid
pie title Relative Performance Comparison (Lower = Better)
    "Baseline (4.21s)" : 421
    "Optimized (3.87s)" : 387
    "Aggressive Final (3.79s)" : 379
```

---

# 🔬 Engineering Model

### Tractive Force

F_t = (T_e × γ_total × η) / r_w

### Traction Limit

F_max = μ × (W_static + ΔW_dynamic + F_downforce)

### Enforced Constraint

F_t ≤ F_max

Wheel torque is always clamped to the traction envelope.

---

# 🛡️ Resilience Layer — Force Heuristic Fallback

If Gemini API fails due to:
- Rate limits
- 404
- Network instability

The system activates:

### 🔹 Force Heuristic Mode

It:
- Detects traction saturation
- Evaluates shift overlap
- Applies gear spacing logic
- Generates deterministic race insights

This makes the system **trackside safe and competition-resilient**.

---

# 📱 Mobile Pit Wall Interface

Built using Shadcn-UI Sheet components.

Features:
- Tablet-friendly dashboard
- Swipe-based configuration access
- Compact telemetry panel
- Trackside quick adjustments

Engineers can operate from phones and tablets in the garage.

---

# 🎙️ Voice Control Commands

Supported Commands:

- "Start Run"
- "Reset Baseline"
- "Mute Audio"
- "Go Mute"
- "Run Acceleration"

Hands-free garage interaction enabled via Web Speech API.

---

# 🔊 Auditory Digital Twin

The engine sound is:

- Synthesized in real time
- Directly mapped to RPM from physics engine
- Responsive to gear ratio changes

Engineers can **hear** short vs tall gearing.

---

# 🧪 Drivability Density Constraint

The solver penalizes:

- Excessive RPM drop between gears
- Unrealistic micro-ratio stacking
- Physically infeasible shift spacing

Ensures the solution is:

✔ Fast  
✔ Drivable  
✔ Mechanically realistic  

---

# 💾 IndexedDB Session Persistence

All optimization runs are stored locally.

- Session history retained after browser close
- Historical comparison enabled
- Acts as a local performance database

Built using IndexedDB via SessionHistoryPanel.

---

# 📂 Accurate Project Structure

```
gear-lab-pro/
│
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   ├── physics.ts
│   │   ├── optimizer.ts
│   │   ├── gemini.ts
│   │   ├── forceHeuristic.ts
│   │   ├── drivetrain.ts
│   │   └── eventSimulators.ts
│   ├── styles/
│   └── main.tsx
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── package.json
└── README.md
```

Core logic resides inside:

src/lib/

---

# 💻 Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS + ShadCN |
| Optimization | GA + PSO + Annealing |
| AI Layer | Google Gemini |
| Fallback | Deterministic Heuristic Engine |
| Persistence | IndexedDB |
| Voice | Web Speech API |
| Audio | Dynamic RPM Synth |
| Visualization | Canvas + Responsive UI |

---

# 🚀 Installation

```bash
npm install
npm run dev
```

or

```bash
bun install
bun run dev
```

---

# 🏁 Optimization Objective

Minimize:

Weighted(Acceleration Time)  
+ Weighted(Skidpad Time)  
+ Weighted(Autocross Time)

Subject to:

- Traction envelope
- RPM limits
- Drivability density
- Gear spacing feasibility
- Mechanical realism

---

# 🏎️ Competition Ready

✔ Physics-backed  
✔ Offline-resilient  
✔ Voice-enabled  
✔ Mobile pit wall mode  
✔ Auditory digital twin  
✔ Persistent optimization history  

---

# 🏁 Advanced Features

---

## 👻 Baseline Ghosting (A/B Testing)

Use the **"Lock Baseline"** command to freeze any configuration as a visual **Ghost Layer**.

This enables:

- Real-time A/B comparison between two ratio setups
- Overlay visualization inside the 3D Digital Twin
- Immediate identification of:
  - Acceleration gains
  - Traction improvements
  - Shift overlap differences
  - Time delta advantages

The Ghost system allows engineers to visually prove performance improvements before committing to mechanical changes.

---

## 📳 Haptic-Tactile Feedback

The platform includes synchronized **Haptic Pulses** triggered by:

- Gear shifts
- Traction break events
- Torque saturation moments
- Launch threshold transitions

This creates a multi-sensory feedback loop where engineers can:

- Feel shift-shock intensity
- Detect traction instability
- Experience drivetrain aggressiveness

The goal is to transform telemetry into **tactile engineering intuition**.

---

## 🛡️ Fail-Safe Optimization (Quantum Visualizer Stability)

The **Quantum Visualizer** integrates non-linear stabilization algorithms to maintain:

- 100% rendering uptime
- Stable visual feedback during high-entropy annealing
- Error-free solver transitions

Even during aggressive optimization sweeps, the:

### 🔹 “Quantum Eye” Visualization Layer

Remains:
- Frame-stable
- Numerically safe
- GPU-efficient
- Artifact-free

This ensures uninterrupted engineering workflow during solver exploration.

---

# 📜 License

MIT License

---

# 🏁 Built for Formula Student Teams

Mathematically Provable.  
Competition Resilient.  
Track Ready.