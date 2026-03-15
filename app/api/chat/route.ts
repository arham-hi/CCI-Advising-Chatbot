import { OpenAIStream, StreamingTextResponse} from "ai"
import OpenAI from "openai";
import { DataAPIClient} from "@datastax/astra-db-ts"

const { ASTRA_DB_NAMESPACE, 
    ASTRA_DB_COLLECTION, 
    ASTRA_DB_API_ENDPOINT, 
    ASTRA_DB_APPLICATION_TOKEN, 
    OPENAI_API_KEY} = process.env

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
})

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE})

export async function POST(req: Request){
    try{
        const {messages} = await req.json()
        const latestMessage = messages[messages?.length-1]?.content

        let docContext = ""

        const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: latestMessage,
            encoding_format: "float"
        })

        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION)
            const cursor = collection.find(null, {
                sort: {
                    $vector: embedding.data[0].embedding,
                },
                limit: 10
            }) 

            const documents = await cursor.toArray()
            const docsMap = documents?.map(doc => doc.text)

            docContext = JSON.stringify(docsMap)
            
        } catch(error){
            console.log("Error querying db...")
            docContext = ""
        }
        const template = {
            role: "system",
            content: `
                You are an assistant who knows everything about advising for the College of Computing and Informatics (CCI) at UNC Charlotte. Use the below context to augment what you know about CCI undergraduate programs, courses, and advising policies. The context will provide you with the most recent page data from the UNC Charlotte undergraduate catalog and other official CCI advising pages, so that is what I fed in.

                If the context doesn't include the information you need, answer based on your existing knowledge and general reasoning about university advising, but do not mention the source of your information or what the context does or doesn't include.

                Only answer questions related to:
                - CCI majors and concentrations
                - course information and prerequisites
                - degree requirements
                - academic plans of study
                - general advising questions related to CCI undergraduate programs

                Do not answer questions about:
                - financial aid
                - billing or tuition
                - NinerCentral services
                - non-CCI departments

                If a user asks about something outside the CCI advising scope, politely explain that the question should be directed to the appropriate university office.

                Format responses using markdown where applicable and keep answers clear, concise, and helpful for students.

                -----------------
                START CONTEXT
                ${docContext}
                END CONTEXT
                -----------------
                QUESTION: ${latestMessage}
                -----------------
            `
            }

            const response = await openai.chat.completions.create({
                model: "gpt-5-nano",
                stream: true,
                messages: [template, ...messages]
            })

            const stream = OpenAIStream(response)
            return new StreamingTextResponse(stream)

    } catch (e){
        throw e
    }
}