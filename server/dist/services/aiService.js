import OpenAI from "openai";
import winston from "winston";
export function generateAdvice(transactions) {
    const foodSpent = transactions
        .filter((t) => t.category.toLowerCase() === "food")
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    if (foodSpent > 0) {
        return `You spent ₦${Math.round(foodSpent).toLocaleString()} on food. Try cooking at home to save 20%!`;
    }
    const expenses = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + (t.amount || 0), 0);
    if (expenses === 0)
        return "Add your expenses to get personalized savings tips.";
    return "Great job tracking expenses! Consider setting a 20% savings goal this month.";
}
// Winston logger setup
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.Console(),
    ],
});
// OpenAI-powered advice
export async function generateOpenAIAdvice(transactions) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
        throw new Error("OPENAI_API_KEY not set");
    const openai = new OpenAI({ apiKey });
    const summary = transactions.slice(0, 10).map((t) => `- ${t.type} ₦${t.amount} on ${t.category} (${t.date.toISOString().slice(0, 10)})`).join("\n");
    const prompt = `You are a financial advisor. Given these transactions, provide actionable, positive, and personalized financial advice for a Nigerian user.\n\nTransactions:\n${summary}\n\nAdvice:`;
    logger.info("Sending prompt to OpenAI", { prompt });
    const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "You are a helpful financial advisor for Nigerian users." },
            { role: "user", content: prompt },
        ],
        max_tokens: 120,
        temperature: 0.7,
    });
    const advice = res.choices[0]?.message?.content?.trim() || "Could not generate advice.";
    logger.info("OpenAI advice generated", { advice });
    return advice;
}
//# sourceMappingURL=aiService.js.map