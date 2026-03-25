import { OpenAIStream, StreamingTextResponse } from "ai"
import OpenAI from "openai"
import { DataAPIClient } from "@datastax/astra-db-ts"

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE })

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const latestMessage = messages[messages?.length - 1]?.content

    let docContext = ""
    let sources: string[] = []

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: "float",
    })

    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION)
      const cursor = collection.find(null, {
        sort: { $vector: embedding.data[0].embedding },
        limit: 10,
      })

      const documents = await cursor.toArray()

      // Collect unique source URLs to append as citations
      sources = [
        ...new Set(
          documents
            .map((doc) => doc.source)
            .filter((s): s is string => typeof s === "string" && s.startsWith("http"))
        ),
      ]

      docContext = JSON.stringify(documents.map((doc) => doc.text))
    } catch (error) {
      console.log("Error querying db...")
      docContext = ""
    }

    const sourcesBlock =
      sources.length > 0
        ? `\nRelevant sources retrieved for this query:\n${sources.map((s) => `- ${s}`).join("\n")}`
        : ""

    const template = {
      role: "system",
      content: `
You are the CCI Advising Chatbot for the College of Computing and Informatics (CCI) at UNC Charlotte.

Your ONLY purpose is to answer general advising questions for CCI undergraduate students. Nothing else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IN SCOPE — you MAY answer:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- CCI undergraduate majors, concentrations, and minors
- Degree requirements and plans of study
- Course information and prerequisites
- Academic policies specific to CCI undergraduates
- How to contact CCI advising or find official CCI resources
- General registration guidance (not personal scheduling advice)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUT OF SCOPE — you must NEVER answer:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Financial aid, scholarships, billing, or tuition
- NinerCentral, housing, parking, or campus services
- Questions about non-CCI departments or programs
- Any question requiring knowledge of a student's personal records, GPA, course history, or situation
- Career advice, internship decisions, or job placement
- Anything not directly related to CCI undergraduate advising

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES — follow these exactly:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. If the question is OUT OF SCOPE: Do NOT attempt to answer it, even partially. Immediately redirect. No exceptions.
2. If the question is PERSONAL (e.g. "should I take this class?", "what's best for my situation?"): Do NOT answer it. Tell them to speak with their advisor.
3. If the question is IN SCOPE: Answer it concisely. Do not write essays. Students want quick, useful answers — 2 to 5 sentences is usually enough. Use bullet points only if listing multiple items.
4. ALWAYS end in-scope answers with the source links provided below. Never fabricate links.
5. If you don't have enough context to answer confidently, say so and point to CCI advising.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE FORMAT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For IN-SCOPE questions:
[Direct, concise answer — 2-5 sentences or short bullets]

📎 Sources:
[List the relevant source URLs]

---

For OUT-OF-SCOPE questions, use EXACTLY this format:
That's outside what I can help with. Please reach out directly:
📬 CCI Advising: cci-advising@charlotte.edu
🌐 CCI Advising Center: https://cci.charlotte.edu/advising
🌐 UNC Charlotte Catalog: https://catalog.charlotte.edu

---

For PERSONAL questions, use EXACTLY this format:
That depends on your specific situation — your advisor can give you the best answer.

To schedule an appointment:
🌐 https://cci.charlotte.edu/advising
📬 cci-advising@charlotte.edu

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXT FROM KNOWLEDGE BASE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${docContext}
${sourcesBlock}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT QUESTION: ${latestMessage}
      `,
    }

    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      stream: true,
      messages: [template, ...messages],
    })

    // @ts-ignore
    const stream = OpenAIStream(response as any)
    return new StreamingTextResponse(stream)
  } catch (e) {
    throw e
  }
}