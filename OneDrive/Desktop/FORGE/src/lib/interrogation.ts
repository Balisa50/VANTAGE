/**
 * THE FORGE — AI Interrogation Engine
 *
 * Builds the system prompt and question context for "The Professor" persona.
 * Uses a tokenized syntax highlighting system (prevents regex corruption of HTML).
 */

export const PROFESSOR_SYSTEM_PROMPT = (
  studentName: string,
  taskTitle: string,
  taskDetail: string,
  description: string,
  evidenceContext: string,
  previousTopics: string[],
) => `You are THE PROFESSOR — a relentless AI examiner for THE FORGE accountability platform.

STUDENT: ${studentName}
TODAY'S TASK: ${taskTitle}
TASK REQUIREMENTS: ${taskDetail}
STUDENT'S CLAIMED WORK: ${description}
EVIDENCE CONTEXT: ${evidenceContext}

YOUR PERSONA:
- Tough, direct, zero-nonsense. Respect excellent work, roast lazy work.
- Address the student by name: ${studentName}
- Reference specific details from their evidence and code
- Never teach — only interrogate
- Push back on vague answers

STRICT SCOPE RULE — CRITICAL:
You MUST ONLY ask questions about what ${studentName} claimed they did in their submission.
NEVER ask about topics, techniques, or tools they did NOT mention.
If they said they built a login form, ask about that. NOT about databases they never mentioned.

PREVIOUSLY ASKED TOPICS (avoid repeating):
${previousTopics.length > 0 ? previousTopics.join(", ") : "None yet"}

QUESTION FORMAT:
You must return exactly ONE question as valid JSON matching this structure:
{
  "questionNumber": <number 1-10>,
  "type": "<APPLICATION|DEBUGGING|CONCEPTUAL_DEPTH|EVIDENCE_CROSS_CHECK|EDGE_CASE|TRADE_OFF|DEEPER_APPLICATION|HISTORY_RECALL|HISTORY_CONNECTION|SYNTHESIS>",
  "question": "<the question text — can include markdown code blocks>",
  "options": {
    "A": "<option A text>",
    "B": "<option B text>",
    "C": "<option C text>",
    "D": "<option D text>"
  },
  "correctAnswer": "<A|B|C|D>",
  "explanation": "<why this answer is correct and others are wrong>",
  "topic": "<short topic tag for anti-repetition tracking>"
}

QUESTION SEQUENCE (follow this order):
Q1: APPLICATION — realistic scenario using their actual work
Q2: DEBUGGING — "if you change X to Y, what breaks and why?"
Q3: CONCEPTUAL_DEPTH — the WHY question
Q4: EVIDENCE_CROSS_CHECK — based on something in evidence they didn't mention
Q5: EDGE_CASE — beyond the happy path
Q6: TRADE_OFF — "why X over Y? consequences?"
Q7: DEEPER_APPLICATION — different aspect than Q1
Q8: HISTORY_RECALL — references past session (if none: ask about a concept they should know)
Q9: HISTORY_CONNECTION — connects past to today
Q10: SYNTHESIS — hardest, connects multiple concepts

CODE QUESTIONS: At least 3 of 10 questions must include a code snippet in markdown fence blocks.
Use the student's actual code if available from evidence. Otherwise write realistic code based on their work.

PASS THRESHOLD: 7/10 correct answers.`;

export const VERDICT_PROMPT = (
  studentName: string,
  answers: Array<{ question: string; correct: boolean; topic: string }>,
  scores: { mastery: number; application: number; analysis: number; recall: number; depth: number },
) => `You are THE PROFESSOR. ${studentName} has completed the interrogation.

RESULTS:
${answers.map((a, i) => `Q${i + 1} (${a.topic}): ${a.correct ? "CORRECT" : "WRONG"}`).join("\n")}

SCORES:
- Mastery: ${scores.mastery}/10
- Application: ${scores.application}/10
- Analysis: ${scores.analysis}/10
- Recall: ${scores.recall}/10
- Depth: ${scores.depth}/10

Write a 2-3 sentence verdict for ${studentName}. Be direct, specific, and reference their actual scores.
If passed (7+ correct): acknowledge what they proved. Be tough but fair.
If failed (< 7 correct): be blunt about what they couldn't demonstrate. No sympathy, but be professional.

Return ONLY the verdict text. No JSON.`;

export type QuestionType =
  | "APPLICATION"
  | "DEBUGGING"
  | "CONCEPTUAL_DEPTH"
  | "EVIDENCE_CROSS_CHECK"
  | "EDGE_CASE"
  | "TRADE_OFF"
  | "DEEPER_APPLICATION"
  | "HISTORY_RECALL"
  | "HISTORY_CONNECTION"
  | "SYNTHESIS";

export interface MCQQuestion {
  questionNumber: number;
  type: QuestionType;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  topic: string;
}

export interface InterrogationState {
  interrogationId: string;
  currentQuestion: number;
  questions: MCQQuestion[];
  answers: Array<{
    questionNumber: number;
    selected: "A" | "B" | "C" | "D";
    correct: boolean;
    topic: string;
  }>;
  correctCount: number;
  passed: boolean;
  completed: boolean;
  scores: {
    mastery: number;
    application: number;
    analysis: number;
    recall: number;
    depth: number;
    overall: number;
  };
  verdict: string;
}

export function calculateScores(
  answers: Array<{ correct: boolean; type: QuestionType }>,
): InterrogationState["scores"] {
  const score = (questionTypes: QuestionType[]) => {
    const relevant = answers.filter((a) => questionTypes.includes(a.type));
    if (relevant.length === 0) return 0;
    return (relevant.filter((a) => a.correct).length / relevant.length) * 10;
  };

  const correct = answers.filter((a) => a.correct).length;
  const mastery = (correct / answers.length) * 10;
  const application = score(["APPLICATION", "DEBUGGING"]);
  const analysis = score(["EDGE_CASE", "TRADE_OFF"]);
  const recall = score(["HISTORY_RECALL", "HISTORY_CONNECTION", "SYNTHESIS"]);
  const depth = score(["CONCEPTUAL_DEPTH", "DEEPER_APPLICATION"]);
  const overall = (mastery + application + analysis + recall + depth) / 5;

  return {
    mastery: Math.round(mastery * 10) / 10,
    application: Math.round(application * 10) / 10,
    analysis: Math.round(analysis * 10) / 10,
    recall: Math.round(recall * 10) / 10,
    depth: Math.round(depth * 10) / 10,
    overall: Math.round(overall * 10) / 10,
  };
}

// Tokenized syntax highlighter — prevents regex corruption of HTML
export function highlightCode(code: string, language = "javascript"): string {
  const escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const tokens: Record<string, string> = {};
  let tokenIndex = 0;
  let result = escaped;

  const addToken = (html: string): string => {
    const key = `__TOKEN_${tokenIndex++}__`;
    tokens[key] = html;
    return key;
  };

  // Order matters — more specific patterns first
  // Strings
  result = result.replace(/(&#34;[^&#34;]*&#34;|'[^']*'|`[^`]*`)/g, (m) =>
    addToken(`<span style="color:#a6e3a1">${m}</span>`)
  );

  // Comments
  result = result.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (m) =>
    addToken(`<span style="color:#6c7086;font-style:italic">${m}</span>`)
  );

  // Keywords
  const keywords =
    /\b(const|let|var|function|return|if|else|for|while|class|import|export|default|from|async|await|try|catch|throw|new|typeof|instanceof|null|undefined|true|false|void|this|super|extends|implements|interface|type|enum|in|of|do|switch|case|break|continue|yield|static|public|private|protected|readonly|abstract)\b/g;
  result = result.replace(keywords, (m) =>
    addToken(`<span style="color:#cba6f7;font-weight:bold">${m}</span>`)
  );

  // Numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, (m) =>
    addToken(`<span style="color:#fab387">${m}</span>`)
  );

  // Functions
  result = result.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, (_, name) =>
    addToken(`<span style="color:#89b4fa">${name}</span>`)
  );

  // Operators
  result = result.replace(/(===|!==|=>|&&|\|\||[+\-*/%=<>!&|^~?:])/g, (m) =>
    addToken(`<span style="color:#89dceb">${m}</span>`)
  );

  // Replace all tokens with their HTML
  Object.entries(tokens).forEach(([key, html]) => {
    result = result.replace(key, html);
  });

  return result;
}
