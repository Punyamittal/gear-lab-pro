# 🔮 Future Engineering Roadmap

**Gear Lab Pro** is a foundation for future drivetrain intelligence. This roadmap outlines the next phase of evolution.

---

## 📈 1. High-Fidelity Physics (Short Term)

- **Pacejka Magic Formula**: Moving from a linear $\mu$ model to a non-linear tire slip curve. This will allow for the simulation of "Limit Handling" and energy loss during tire slip phases.
- **Aero-Pitch Coupling**: Integrating ride-height sensitivity. As the car "squats" under high-G acceleration, the drag ($C_d$) and downforce ($C_l$) change. Modelling this feedback loop will increase 0-75m accuracy.

---

## 🌎 2. Environmental & Track Integration (Mid Term)

- **DBC & CAN-Bus Export**: One-click configuration files that can be flashed directly to standard Racing ECUs (MoTeC, PE3, Link).
- **GIS Terrain Ingestion**: Uploading GPS track files. The AI will then optimize ratios specifically for a circuit's unique corner exits and elevation changes.
- **Real-Time Telemetry Overlay**: Uploading `MoteC CSV` logs to compare "Real Driver Performance" vs. the "AI Theoretical Limit" on the same 3D chart.

---

## 🤖 3. Intelligent Automation (Long Term)

- **Neural Surrogate Model**: Training a small, browser-based neural net on 1,000,000 simulations. This would allow for **Zero-Latency Prediction**—as you move a slider, the lap time updates instantly (0ms) without running a new sim.
- **Genetic Part-Life Balancing**: A multi-objective optimizer that balances "Fast Lap Time" vs. "Gearbox Wear Level," helping teams choose setups that survive the 22km Endurance event.
- **Collaborative War Room**: Using `WebRTC` to allow multiple engineers across the globe to synchronize their "Pit Wall" dashboards and collaborate on the same car setup in real-time.
