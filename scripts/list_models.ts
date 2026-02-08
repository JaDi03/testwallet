import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
    console.error("GOOGLE_GENERATIVE_AI_API_KEY is missing");
    process.exit(1);
}

// const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const modelResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await modelResponse.json();
        console.log("Available Models:");
        data.models.forEach((m: any) => {
            if (m.name.includes("gemini")) {
                console.log(`- ${m.name} (${m.displayName})`);
            }
        });
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

listModels();
