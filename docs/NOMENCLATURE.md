# 📖 Nomenclature & Symbol Reference

This glossary defines every physics symbol, engineering term, and domain-specific abbreviation used throughout the **Gear Lab Pro** codebase and documentation.

---

## 🔧 Drivetrain Symbols

| Symbol | Unit | Definition |
|--------|------|------------|
| $T_e$ | Nm | Engine torque at crankshaft |
| $\gamma_g$ | — | Individual gear ratio (dimensionless) |
| $\gamma_f$ | — | Final drive ratio |
| $\gamma_p$ | — | Primary reduction ratio |
| $\gamma_{total}$ | — | Combined ratio: $\gamma_g \cdot \gamma_f \cdot \gamma_p$ |
| $\eta$ | — | Mechanical efficiency per gear stage ($\approx 0.92$) |
| $r_w$ | m | Loaded tire/wheel radius |
| $\omega$ | rad/s | Angular velocity of crankshaft |
| RPM | rev/min | Engine rotational speed |

---

## 🏎️ Vehicle Dynamics Symbols

| Symbol | Unit | Definition |
|--------|------|------------|
| $m$ | kg | Total vehicle mass (with driver) |
| $a_{long}$ | m/s² | Longitudinal acceleration |
| $a_{lat}$ | m/s² | Lateral acceleration |
| $v$ | m/s | Vehicle velocity |
| $F_t$ | N | Tractive force at tire contact patch |
| $F_d$ | N | Aerodynamic drag force |
| $F_{max}$ | N | Maximum traction force (grip limit) |
| $W_{static}$ | N | Static weight on driven axle |
| $\Delta W$ | N | Dynamic weight transfer due to acceleration |
| $h_{cg}$ | m | Height of center of gravity |
| $L$ | m | Vehicle wheelbase |
| $k_{rot}$ | — | Rotational inertia correction factor ($1.05–1.12$) |

---

## 🛞 Tire & Traction Symbols

| Symbol | Unit | Definition |
|--------|------|------------|
| $\mu_{long}$ | — | Longitudinal coefficient of friction |
| $\mu_{lat}$ | — | Lateral coefficient of friction |
| $F_{df}$ | N | Aerodynamic downforce (front + rear) |
| COF | — | Coefficient of Friction (general) |

---

## 🌊 Aerodynamic Symbols

| Symbol | Unit | Definition |
|--------|------|------------|
| $C_d$ | — | Drag coefficient |
| $C_l$ | — | Lift/Downforce coefficient |
| $A_f$ | m² | Frontal area of vehicle |
| $\rho$ | kg/m³ | Air density ($\approx 1.225$ at sea level) |

---

## 🧬 Optimization Terms

| Term | Definition |
|------|------------|
| **Fitness Score** | Inverse of total event time; higher = better configuration |
| **Genome** | A vector encoding a complete gearbox specification |
| **Crossover** | Combining two parent genomes to produce offspring |
| **Mutation** | Random perturbation to a gene (single ratio) |
| **pbest** | Particle's personal best position (PSO) |
| **gbest** | Global best position across all particles (PSO) |
| **Temperature ($T$)** | Control parameter in Simulated Annealing; higher $T$ = more exploration |
| **Acceptance Probability** | $P = \exp(-\Delta E / T)$; chance of accepting a worse solution |
| **Convergence** | State where further iterations no longer improve the fitness score |
| **Traction Saturation** | Condition where $F_t \geq F_{max}$; tire is at its grip limit |

---

## 🏁 Competition Event Terms

| Term | Definition |
|------|------------|
| **0-75m Acceleration** | Standing-start straight-line sprint event |
| **Skidpad** | Constant-radius figure-8 event testing lateral grip |
| **Autocross** | Technical course with mixed corner radii and straights |
| **Endurance** | 22km reliability and efficiency event |
| **Design Event** | Judged presentation of engineering decisions to industry experts |

---

## 💻 Software Architecture Terms

| Term | Definition |
|------|------------|
| **Solver Race** | Parallel execution of GA, PSO, and Annealing to find global optimum |
| **Force Heuristic** | Offline fallback AI that provides deterministic insights without API |
| **Digital Twin** | 3D synchronized vehicle model for visual telemetry validation |
| **Pit Wall** | Real-time dashboard interface inspired by F1 race engineering stations |
| **RAT** | Retrieval-Augmented Telemetry; context injection for Gemini AI prompts |
