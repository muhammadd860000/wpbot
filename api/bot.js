const accessToken = "WAAVgV0sTckWIRedvZBR1V72a8Y1rBxZCkwu27mtSG2zorg2CJzOaeKazdhqbW5U8TSQZAxVeAbHBBCIUwZAoK98KchgoEcdhj3VrNwbZAlyoVDVCn84cRJU3WdZCjdQF8gBWJS5NDHJHz6RgdnsoG5NjeZBDUobZBPtMGMdqPT8ULfburT9EZD";
const baseUrl = "https://api.whatsapp.com/agent/v1";
const apinexKey = "sk-apx7f8f802ac74f725821e2962f3aba8a7010e524e4870e192";

export default async function handler(req, res) {
    // 1. Handle Meta Webhook Verification (GET request)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // Yahan apna verify token match karein (jo aap Meta dashboard mein likhenge)
        if (mode === 'subscribe' && token === 'zaidtech123') {
            return res.status(200).send(challenge);
        } else {
            return res.status(403).json({ error: "Verification failed" });
        }
    }

    // 2. Handle Incoming Messages (POST request)
    try {
        const body = req.body;

        if (body && body.entry && body.entry[0]?.changes[0]?.value?.messages) {
            const messages = body.entry[0].changes[0].value.messages;

            for (const msg of messages) {
                const recipientId = msg.from; 
                const userText = msg.text?.body;

                if (recipientId && userText) {
                    const aiReply = await getAIResponse(userText);
                    await sendReply(recipientId, aiReply);
                }
            }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function getAIResponse(message) {
    try {
        const response = await fetch("https://api.apinex.bond/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apinexKey}`
            },
            body: JSON.stringify({
                model: "free/gpt-6-luna",
                messages: [
                    { role: "system", content: "You are ZaidTechbot, a helpful AI assistant on WhatsApp." },
                    { role: "user", content: message }
                ]
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Maaf kijiye, main abhi jawab nahi de pa raha.";
    } catch (e) {
        return "Error generating AI response.";
    }
}

async function sendReply(to, text) {
    await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: { body: text }
        })
    });
}
