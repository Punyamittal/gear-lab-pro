# 🔬 Mathematical Model & Engineering Theory

This document outlines the deterministic physics engine and optimization heuristics underpinning **Gear Lab Pro**. In Formula Student, success is governed by the laws of thermodynamics and classical mechanics.

---

## 🏎️ 1. Longitudinal Dynamics Model

The core simulation uses a **200Hz ($5$ms step) forward-integration model** to calculate vehicle state.

### 🔹 Tractive Effort ($F_t$)
Total force delivered to the tire contact patch:
$$F_t = \frac{T_e(\omega) \cdot \gamma_{primary} \cdot \gamma_{gear}(n) \cdot \gamma_{final} \cdot \eta}{r_w}$$
- **$T_e(\omega)$**: Torque as a function of angular velocity ($\omega$).
- **$\gamma$**: Reduction ratios across the drivetrain stages.
- **$\eta$**: Mechanical efficiency ($\approx 0.92$ per gear pair).
- **$r_w$**: Loaded tire radius.

### 🔹 Dynamic Weight Transfer ($\Delta W$)
Acceleration causes pitch, shifting normal force to the rear wheels:
$$\Delta W = \frac{m \cdot a_{long} \cdot h_{cg}}{L}$$
- **$h_{cg}$**: Height of the Center of Gravity.
- **$L$**: Vehicle Wheelbase.

### 🔹 The Traction Constraint
Force is limited by the **Coulomb Friction** model:
$$F_{clamped} = \min(F_t, \mu \cdot (W_{static,rear} + \Delta W + F_{downforce}))$$
If $F_t$ exceeds the grip envelope, the simulation models **traction saturation**, ensuring results are "track-achievable."

---

## 🧬 2. Optimization Heuristics

### 🔹 Genetic Algorithm (GA)
Used for **Evolutionary Search**. 
- **Genome**: A vector of 6 ratios + Final Drive.
- **Crossover**: Single-point recombination to preserve "successful" gear sequences.
- **Mutation**: Gaussian noise perturbation to prevent premature convergence.
- **Fitness**: $1 / \text{Total Score}$, where score is a weighted sum of dynamic event times.

### 🔹 Particle Swarm Optimization (PSO)
Used for **Rapid Local Convergence**.
- Each "solvers" position represents a gearbox config.
- Velocity update: $v_{i+1} = w v_i + c_1 r_1 (pbest_i - x_i) + c_2 r_2 (gbest - x_i)$
- Captures the "social" nature of the search space.

### 🔹 Simulated Annealing (Quantum Lab)
Used for **Global Global Maxima Detection**.
- Acceptance probability: $P = \exp(-\Delta E / T)$
- Allows the engine to accept "worse" solutions temporarily to bridge gaps between isolated performance peaks.

---

## 📈 3. Event-Specific Loss Functions

To win a competition, the engine optimizes for an **Aggregate Score**:
$$L = w_{accel} \cdot T_{75m} + w_{skid} \cdot T_{8m} + w_{auto} \cdot T_{course}$$
By minimizing $L$, the system finds a gearset that isn't just fast in a straight line, but retains agility on tight technical corners.
