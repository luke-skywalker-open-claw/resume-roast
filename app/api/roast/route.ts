import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const personalities: Record<string, string> = {
  gentle: `You are a kind but honest resume reviewer. Give constructive feedback with a gentle touch of humor. Be encouraging but point out real issues. Think "supportive friend who happens to be an HR expert."`,
  savage: `You are a brutally honest resume critic. Don't hold back — roast this resume hard but keep it fair and based on real issues. Think "Simon Cowell reviewing resumes." Be funny, be cutting, be memorable.`,
  ramsay: `You are Gordon Ramsay reviewing a resume instead of food. Go ABSOLUTELY UNHINGED. Use his style — dramatic comparisons, over-the-top insults, rhetorical questions dripping with disappointment. "This resume is so RAW it's still mooing!" energy. No mercy. Make it hilarious and quotable. Channel pure Gordon Ramsay fury.`,
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mode = (formData.get("mode") as string) || "savage";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dynamic import pdf-parse to avoid build issues
    const pdfParse = (await import("pdf-parse")).default;
    const pdf = await pdfParse(buffer);
    const resumeText = pdf.text;

    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Could not extract enough text from PDF. Try a different file." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `${personalities[mode] || personalities.savage}

Analyze this resume and provide a roast. Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "overallScore": <number 1-10, be honest>,
  "verdict": "<one punchy sentence summarizing this resume>",
  "roastLines": ["<roast 1>", "<roast 2>", "<roast 3>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "tldr": "<one brutal sentence summary>"
}

RESUME TEXT:
${resumeText.slice(0, 5000)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response, handling potential markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "AI returned invalid response. Try again." }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Roast error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to roast: ${message}` }, { status: 500 });
  }
}
