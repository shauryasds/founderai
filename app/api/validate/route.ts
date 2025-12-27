import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { getJson } from "serpapi";


type SearchResult = {
  title: string;
  snippet: string;
  link: string;
};

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    if (!input) {
      return NextResponse.json({ error: "Missing Description" }, { status: 400 });
    }

    // STEP 1: Generate Google search query from idea
    const querySchema = z.object({
      query: z.string().describe("A short, specific Google search query"),
    });

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: process.env.GOOGLE_API_KEY!,
    });

    const queryParser = model.withStructuredOutput(querySchema);

    const { query } = await queryParser.invoke(
      `You are a helpful assistant. Refine the user's description of a business idea into a short, specific Google search query to check if similar services exist:\n\n"${input}"`
    );

    // STEP 2: Use SerpAPI and wait for results
    const organicResults = await new Promise<unknown[]>((resolve, reject) => {
      getJson(
        {
          engine: "google_light",
          q: query,
          location: "India",
          google_domain: "google.com",
          api_key: process.env.SERPAPI_API_KEY!,
        },
        (data) => {
          if (data && data.organic_results) {
            resolve(data.organic_results);
          } else {
            reject("No organic results found");
          }
        }
      );
    });

    // STEP 3: Extract top 3 results
    const topResults = organicResults.slice(0, 3).map((item) => {
      const result = item as SearchResult;
      return {
        title: result.title,
        description: result.snippet,
        link: result.link,
      };
    });

    // STEP 4: Analyze uniqueness using Gemini
    const validationSchema = z.object({
      shortAnswer: z.string().describe("A short answer indicating if the idea is unique or not"),
      detailedDescription: z.string().describe("A detailed description of the analysis"),
      score: z.number().min(0).max(100).describe("A score indicating the uniqueness of the idea"),
    });

    const validator = model.withStructuredOutput(validationSchema);

    const analysisPrompt = `
Based on the following search results, assess whether the business idea is uniqueor not . "${query}" .

${topResults.map((r, i) => `Result ${i + 1}:\nTitle: ${r.title}\nDescription: ${r.description}\nLink: ${r.link}`).join('\n\n')}
    `;

    const result = await validator.invoke(analysisPrompt);

    return NextResponse.json({ validatedData: result }, { status: 200 });
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
