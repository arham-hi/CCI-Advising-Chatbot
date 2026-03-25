import { DataAPIClient } from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer"

import OpenAI from "openai"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const { ASTRA_DB_NAMESPACE, 
    ASTRA_DB_COLLECTION, 
    ASTRA_DB_API_ENDPOINT, 
    ASTRA_DB_APPLICATION_TOKEN, 
    OPENAI_API_KEY} = process.env

const openai = new OpenAI({ apiKey: OPENAI_API_KEY}) 

const cciData = [
    //basic
    "https://catalog.charlotte.edu/index.php?catoid=40",
    "https://cci.charlotte.edu/academics/undergraduate-studies/",
    "https://cci.charlotte.edu/student-life/cci-advising/steps-degree-completion/",
    "https://cci.charlotte.edu/student-life/cci-advising-center/internal-transfer-guidelines/",

    //academic programs
    "https://cci.charlotte.edu/academics/academic-programs/",
    "https://cci.charlotte.edu/ai-bachelors/",
    "https://cci.charlotte.edu/student-life/cci-advising-center/undergraduate-cs-concentrations-and-degree-plans-study/",
    "https://cci.charlotte.edu/academics/computer-science/undergraduate-programs/courses/",
    
    //majors + concentrations
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11817",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11659",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11656",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11657",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11658",

    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11477",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11660",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11478",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11479",

    //more majors
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11896",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=12714",

    //minors
    "https://cci.charlotte.edu/unc-charlotte-student-life/advising/current-cci-students/undergraduate-minors/",

    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11475",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11814",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11815",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11816",

    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11866",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11867",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11868",
    
    //certifactions
    "https://cci.charlotte.edu/academics/gaming-certificates",
    
    //honors
    "https://cci.charlotte.edu/academics/academic-programs#honors",
    "https://cci.charlotte.edu/academics/honors-program/",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11647",
    
    //early entry
    "https://cci.charlotte.edu/academics/academic-programs#early",
    
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11651",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11608",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11821",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11621",
    
    //resources
    "https://cci.charlotte.edu/student-life/tutoring/",
    "https://cci.charlotte.edu/about-us/technology-resources/24-7-computer-labs/",
    "https://cci.charlotte.edu/node/6871/",
    
    // classes
    "https://cci.charlotte.edu/academics/computer-science/undergraduate-programs/courses-0/",
    "https://catalog.charlotte.edu/preview_program.php?catoid=40&poid=11681",
    "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=1&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=2&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=3&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=4&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=5&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=6&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=7&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=8&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=9&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=10&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=11&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=12&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=13&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=14&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=15&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=16&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=17&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=18&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=19&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=20&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=21&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=22&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=23&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=24&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=25&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=26&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=27&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=28&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=29&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=30&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=31&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=32&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=33&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=34&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=35&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=36&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=37&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",
    // "https://catalog.charlotte.edu/content.php?filter%5B27%5D=-1&filter%5B29%5D=&filter%5Bcourse_type%5D=-1&filter%5Bkeyword%5D=&filter%5B32%5D=1&filter%5Bcpage%5D=38&cur_cat_oid=40&expand=1&navoid=4989&print=1#acalog_template_course_filter",

    //misc
    "https://catalog.charlotte.edu/content.php?catoid=40&navoid=5008",
    
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE })
 
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 800,
  chunkOverlap: 150,
})
 
const scrapePage = async (url: string): Promise<string> => {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: { headless: true },
    gotoOptions: { waitUntil: "domcontentloaded" },
    evaluate: async (page, browser) => {
      const result = await page.evaluate(() => document.body.innerHTML)
      await browser.close()
      return result
    },
  })
  const raw = await loader.scrape() ?? ""
  return raw
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")  // ← remove script blocks first
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")    // ← remove style blocks
    .replace(/<[^>]*>?/gm, "")                          // ← then strip remaining tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s{3,}/g, "\n\n")
    .trim()
}

const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION)


  let urlIndex = 0
  for (const url of cciData) {
    urlIndex++
    console.log(`[${urlIndex}/${cciData.length}] Checking: ${url}`)
 
    // Skip if already indexed — safe to re-run without duplicates
    const existing = await collection.findOne({ source: url })
    if (existing) {
      console.log(`  ⏭ Already indexed, skipping.`)
      continue
    }
 
    let content: string
    try {
      content = await scrapePage(url)
    } catch (err) {
      console.warn(`  ✗ Failed to scrape, skipping: ${url}`)
      continue
    }
 
    if (!content || content.length < 50) {
      console.warn(`  ⚠ Empty content, skipping: ${url}`)
      continue
    }
 
    const chunks = await splitter.splitText(content)
    console.log(`  → ${chunks.length} chunks`)
 
    for (const chunk of chunks) {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      })
 
      await collection.insertOne({
        $vector: embedding.data[0].embedding,
        text: chunk,
        source: url, // stored so the chatbot can cite sources later
      })
    }
 
    console.log(`  ✓ Done`)
  }
 
  console.log("\n✅ All done!")
}
 
loadSampleData()
