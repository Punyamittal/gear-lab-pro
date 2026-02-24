Project Pitch: Gear Lab Pro — The Formula Student Optimization Suite
The Vision
In Formula Student, victory is a game of precision. Every Newton-meter of torque must be translated into forward motion with surgical accuracy. Gear Lab Pro is an end-to-end drivetrain optimization platform engineered to solve this "Power-to-Ground" puzzle. We have developed a system that moves beyond estimation, providing a mathematically validated pathway to the podium.

1. Holistic Ratio Optimization (Primary, Gear, & Final)
Most teams tune one ratio at a time. Gear Lab Pro optimizes the entire drivetrain simultaneously. Our Solver Race Hub sweeps millions of combinations of primary, individual gear, and final drive ratios. By mapping the vehicle's unique engine torque curve against these variations, the system discovers the "Global Maximum"—the one specific blueprint that extracts every bit of energy from the engine across the entire speed range.

2. High-Fidelity Tractive Modeling
The system provides a dynamic Tractive Effort vs. Vehicle Speed model for every gear.

Optimal Shift Detection: We don't just shift at the redline. Our engine identifies the exact crossover points where the tractive force in the current gear drops below the potential of the next.
Efficiency Mapping: We visualize the "Areal Efficiency" of the drivetrain, ensuring the car stays in its peak power band from the launch line to the finish tape.
3. Traction Preservation Engine
Power is only useful if it’s controllable. Gear Lab Pro implements a Constraint-Aware Physics Engine.

The Limit of Adhesion: Using dynamic weight transfer modeling, we calculate the tire's traction limit in real-time.
Torque Capping: Our solvers are hard-coded to ignore "fast but impossible" ratios. If a gear generates wheel torque exceeding the grip limit ($F_t > F_{max}$), the system automatically clamps the output, simulating a perfect launch and ensured drivability.
4. Event-Specific Simulation (Accel, Skidpad, Autocross)
A "fast" car on paper must be a "fast" car on the track. Gear Lab Pro simulates the three core dynamic events of the competition:

0–75m Acceleration: Focused on longitudinal launch and shift speed.
Skidpad: Modeling lateral grip and steady-state gear selection for constant radius events.
Autocross: Simulating a multi-radius course to ensure the gearing is versatile enough for both hairpins and high-speed sweepers. Users can visually compare the "Time Delta" between different setups to see exactly where a decisecond is gained or lost.
5. Data-Driven "Pit Wall" Recommendations
The project culminates in a Strategic Synthesis Layer. Powered by Google Gemini Pro, the system provides a "Race Engineer Briefing." Instead of a wall of numbers, the AI gives actionable recommendations: "I recommend increasing the Final Drive to 4.10; while you lose 3km/h in top speed, you gain 0.12s in the Autocross hairpins—improving your aggregate competition score by 14%."

Technical Summary
Architecture: Bi-level AI (Heuristic Solver + Generative Reasoning).
Physics: Forward-integration Newtonian model ($200$Hz resolution).
Safety: Drivability density checks to ensure gear spacing is physically feasible for a human driver.
Gear Lab Pro is the ultimate decision-support tool. We take the guesswork out of the garage and put the science on the track.
