/**
 * Resume Section Classifier with LLM Intelligence
 * Uses Gemini to accurately classify resume sections and detect tech stacks
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ResumeSectionType } from '@/types/resume';

/**
 * Classify a resume section using AI
 */
export async function classifyResumeSection(
  sectionTitle: string,
  sectionContent: string,
  apiKey?: string
): Promise<ResumeSectionType> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a resume parsing expert. Classify this resume section into ONE of these exact categories:

Categories:
- summary
- experience
- education
- skills
- projects
- certifications
- awards
- publications
- custom

Section Title: "${sectionTitle}"

Section Content Preview (first 300 characters):
"${sectionContent.substring(0, 300)}"

Instructions:
1. Analyze the title and content
2. Respond with ONLY the category name (lowercase, no punctuation)
3. Use "custom" if it doesn't fit standard categories

Response:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim().toLowerCase();

    // Validate response
    const validTypes: ResumeSectionType[] = [
      'summary',
      'experience',
      'education',
      'skills',
      'projects',
      'certifications',
      'awards',
      'publications',
      'custom',
    ];

    if (validTypes.includes(response as ResumeSectionType)) {
      console.log(`[CLASSIFIER] Section "${sectionTitle}" classified as: ${response}`);
      return response as ResumeSectionType;
    }

    // Fallback to basic classification
    console.warn(`[CLASSIFIER] Invalid LLM response: ${response}, using fallback`);
    return classifySectionBasic(sectionTitle);
  } catch (error) {
    console.error('[CLASSIFIER] LLM classification failed:', error);
    return classifySectionBasic(sectionTitle);
  }
}

/**
 * Fallback: Basic keyword-based classification
 */
function classifySectionBasic(title: string): ResumeSectionType {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('experience') || titleLower.includes('work')) {
    return 'experience';
  }
  if (titleLower.includes('education')) {
    return 'education';
  }
  if (titleLower.includes('skill')) {
    return 'skills';
  }
  if (titleLower.includes('project')) {
    return 'projects';
  }
  if (titleLower.includes('certification')) {
    return 'certifications';
  }
  if (titleLower.includes('award') || titleLower.includes('honor')) {
    return 'awards';
  }
  if (titleLower.includes('publication')) {
    return 'publications';
  }
  if (titleLower.includes('summary') || titleLower.includes('objective')) {
    return 'summary';
  }

  return 'custom';
}

/**
 * Detect technical keywords/stack from bullet points using AI
 */
export async function detectTechStack(
  bulletPoints: string[],
  apiKey?: string
): Promise<string[]> {
  if (bulletPoints.length === 0) return [];

  try {
    const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const allText = bulletPoints.join('\n');

    const prompt = `Extract ALL technical keywords, technologies, frameworks, and tools from this resume content.

Content:
${allText.substring(0, 2000)}

Include:
- Programming languages (Python, JavaScript, Java, C++, etc.)
- Frameworks (React, Django, TensorFlow, Spring, etc.)
- Tools (Docker, Kubernetes, Git, AWS, etc.)
- Databases (MongoDB, PostgreSQL, MySQL, etc.)
- Methodologies (Agile, CI/CD, REST API, GraphQL, etc.)

Format: Return a comma-separated list ONLY, no explanations.
Example: React, TypeScript, AWS, Docker, PostgreSQL

Response:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    // Parse comma-separated list
    const keywords = response
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    // Also run regex detection as backup
    const regexKeywords = detectTechStackRegex(allText);

    // Combine and deduplicate
    const combined = [...new Set([...keywords, ...regexKeywords])];

    console.log(`[CLASSIFIER] Detected ${combined.length} tech keywords`);
    return combined;
  } catch (error) {
    console.error('[CLASSIFIER] Tech stack detection failed:', error);
    return detectTechStackRegex(bulletPoints.join(' '));
  }
}

/**
 * Regex-based tech stack detection (fallback and supplement)
 */
function detectTechStackRegex(text: string): string[] {
  // Comprehensive tech keyword patterns
  const techPatterns = [
    // Languages
    /\b(Python|JavaScript|TypeScript|Java|C\+\+|C#|Go|Rust|Ruby|PHP|Swift|Kotlin|Scala|R|MATLAB)\b/gi,

    // Frontend
    /\b(React|Vue\.js|Angular|Svelte|Next\.js|Nuxt\.js|Gatsby|HTML5?|CSS3?|SASS|SCSS|Tailwind|Bootstrap)\b/gi,

    // Backend
    /\b(Node\.js|Express|Django|Flask|FastAPI|Spring|\.NET|Rails|Laravel|ASP\.NET)\b/gi,

    // Mobile
    /\b(React Native|Flutter|iOS|Android|Xamarin|Ionic)\b/gi,

    // Databases
    /\b(MongoDB|PostgreSQL|MySQL|SQLite|Redis|Cassandra|DynamoDB|Firestore|SQL Server)\b/gi,

    // Cloud & DevOps
    /\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|CircleCI|GitHub Actions|Terraform|Ansible)\b/gi,

    // AI/ML
    /\b(TensorFlow|PyTorch|Keras|scikit-learn|Pandas|NumPy|OpenCV|Hugging Face|LangChain)\b/gi,

    // Tools
    /\b(Git|GitHub|GitLab|Jira|Confluence|Slack|VS Code|IntelliJ|Postman|Figma)\b/gi,

    // Methodologies
    /\b(Agile|Scrum|Kanban|CI\/CD|REST API|GraphQL|Microservices|Serverless|TDD|BDD)\b/gi,

    // Other
    /\b(Elasticsearch|Kafka|RabbitMQ|Socket\.io|WebSockets|OAuth|JWT|WebPack|Babel|ESLint)\b/gi,
  ];

  const matches: string[] = [];

  for (const pattern of techPatterns) {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found);
    }
  }

  // Deduplicate (case-insensitive)
  const unique = Array.from(
    new Set(matches.map((m) => m))
  );

  return unique;
}

/**
 * Batch classify multiple sections in parallel
 */
export async function classifyMultipleSections(
  sections: Array<{ title: string; content: string }>,
  apiKey?: string
): Promise<ResumeSectionType[]> {
  const promises = sections.map((section) =>
    classifyResumeSection(section.title, section.content, apiKey)
  );

  return Promise.all(promises);
}

/**
 * Extract job titles, company names, dates from experience section
 * Uses LLM for intelligent parsing
 */
export async function parseExperienceItem(
  itemText: string,
  apiKey?: string
): Promise<{
  title?: string;
  subtitle?: string;
  date?: string;
  location?: string;
}> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Extract structured information from this resume experience entry.

Text:
${itemText.substring(0, 500)}

Extract:
- title: Job title (e.g., "Software Engineer")
- subtitle: Company name (e.g., "Google Inc.")
- date: Date range (e.g., "Jan 2020 - Present")
- location: Location (e.g., "San Francisco, CA" or "Remote")

Respond in JSON format ONLY:
{
  "title": "...",
  "subtitle": "...",
  "date": "...",
  "location": "..."
}

Response:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[CLASSIFIER] Parsed experience item:', parsed);
      return parsed;
    }

    return {};
  } catch (error) {
    console.error('[CLASSIFIER] Experience parsing failed:', error);
    return {};
  }
}

/**
 * Detect if a line is a title/header vs bullet point vs date
 */
export function classifyLineType(
  line: string
): 'title' | 'subtitle' | 'date' | 'location' | 'bullet' | 'unknown' {
  const trimmed = line.trim();

  // Date patterns
  const datePatterns = [
    /\b\d{4}\s*[-–]\s*\d{4}\b/, // 2020 - 2024
    /\b\d{4}\s*[-–]\s*Present\b/i, // 2020 - Present
    /\b[A-Z][a-z]{2,8}\s+\d{4}\s*[-–]\s*[A-Z][a-z]{2,8}\s+\d{4}\b/, // Jan 2020 - Dec 2024
    /\b[A-Z][a-z]{2,8}\s+\d{4}\s*[-–]\s*Present\b/i, // Jan 2020 - Present
  ];

  for (const pattern of datePatterns) {
    if (pattern.test(trimmed)) {
      return 'date';
    }
  }

  // Location patterns
  if (/\b[A-Z][a-z]+,\s*[A-Z]{2}\b/.test(trimmed)) {
    // City, ST
    return 'location';
  }
  if (/\bRemote\b/i.test(trimmed)) {
    return 'location';
  }

  // Bullet points
  if (/^[-•●◦▪▫]\s/.test(trimmed)) {
    return 'bullet';
  }

  // All caps likely a title/header
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3) {
    return 'title';
  }

  // Default
  return 'unknown';
}
