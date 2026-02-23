export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export const generateAIInsight = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3.2:3b',
                prompt: prompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error('Ollama connection failed. Ensure Ollama is running.');
        }

        const data: OllamaResponse = await response.json();
        return data.response;
    } catch (error) {
        console.error('Ollama Error:', error);
        return 'Unable to reach AI Strategic Core. Please ensure Ollama is running locally with llama3.2:3b model.';
    }
};
