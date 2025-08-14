import Transaction from "../models/Transaction";
import { generateAdvice, generateOpenAIAdvice } from "../services/aiService";
// Returns basic or OpenAI-powered advice based on query param
export async function getAdvice(req, res) {
    const userId = req.query.userId;
    const useOpenAI = req.query.openai === "true";
    if (!userId)
        return res.status(400).json({ error: "userId required" });
    const transactions = await Transaction.find({ userId });
    if (useOpenAI) {
        try {
            const aiAdvice = await generateOpenAIAdvice(transactions);
            return res.json({ advice: aiAdvice });
        }
        catch (err) {
            return res.status(500).json({ error: "AI service error" });
        }
    }
    const advice = generateAdvice(transactions);
    return res.json({ advice });
}
//# sourceMappingURL=ai.js.map