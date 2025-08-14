import OpenAI from "openai"

(async () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY not set")
  const openai = new OpenAI({ apiKey })
  const res = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful financial advisor for Nigerian users." },
      { role: "user", content: "Give me a sample financial advice for a Nigerian student." },
    ],
    max_tokens: 120,
    temperature: 0.7,
  })
  console.log(res.choices[0]?.message?.content)
})()
