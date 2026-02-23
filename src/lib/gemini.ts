import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const generateAIInsight = async (prompt: string): Promise<string> => {
    try {
        if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === '') {
            throw new Error("API_KEY_MISSING");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error('Gemini Error:', error);
        // Throw error to trigger fallback in the component
        throw error;
    }
};

/**
 * High-Fidelity Rule-Based Fallback
 * Provides technical race engineering insights based on simulation heuristics
 */
export const getRuleBasedFallback = (data: {
    mass: number,
    mu: number,
    gears: number[],
    results: { accel: number, skidpad: number, autocross: number }
}): string => {
    const { mass, mu, gears, results } = data;
    let insights = [];

    // Analysis Logic
    if (gears[0] > 4.5) {
        insights.push("Low-end torque is excessive. 1st gear ratio is too short, leading to significant traction loss at launch.");
    } else if (gears[0] < 2.5) {
        insights.push("Launch torque is sub-optimal. 1st gear is too tall, bogging the engine during the critical 0-20m phase.");
    }

    if (results.accel > 4.5) {
        insights.push("Acceleration performance is below threshold. Current gear spacing fails to maintain engine in the optimal power band (9,500 - 12,000 RPM).");
    }

    if (mass > 250) {
        insights.push("Vehicle mass is negatively impacting transient response. Recommend narrowing gear spacing to compensate for higher inertial load.");
    }

    if (mu < 1.2) {
        insights.push("Lateral grip is the primary bottleneck. Focus on a shorter final drive to maximize corner exit velocity despite low friction coefficients.");
    }

    // Gear spacing analysis
    const gaps = gears.slice(0, -1).map((g, i) => g - gears[i + 1]);
    const inconsistentGaps = gaps.some((g, i) => i > 0 && Math.abs(g - gaps[i - 1]) > 0.8);
    if (inconsistentGaps) {
        insights.push("Strategic Alert: Logarithmic gear spacing is inconsistent. Transition shifts will likely result in RPM drops outside of peak torque plateau.");
    }

    return `[FALLBACK MODE: RULE-BASED SYNTHESIS ACTIVE]\n\n${insights.join('\n\n')}\n\nENGINEER RECOMMENDATION: Standardize gear steps to ~0.6-0.8 delta and reduce mass to sub-230kg for optimal power-to-weight ratio.`;
};
