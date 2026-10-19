export const doubtIds = ["safe", "muscle-loss", "regain", "diabetes-only", "for-me"] as const;
export type DoubtId = (typeof doubtIds)[number];
export type TopicId = "food" | "movement" | "sleep" | "body";
export type GameMode = "quick-quiz" | "myth-fact" | "daily";
export type Verdict = "myth" | "fact" | "qualified";

export interface QuestionSource {
  title: string;
  url: string;
  supports: string;
}

export interface GameQuestion {
  id: string;
  topic: TopicId;
  label: string;
  claim: string;
  format: "multiple-choice" | "myth-fact";
  prompt: string;
  options: string[];
  correctIndex: number;
  verdict: Verdict;
  mythFactAnswer: "myth" | "fact";
  explanation: string;
  caveat: string;
  doubtTags: DoubtId[];
  sources: QuestionSource[];
  dailyEligible?: boolean;
}

export interface AnswerRecord {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
  elapsedMs: number;
}

export interface TopicScore {
  correct: number;
  total: number;
}

export interface GameResult {
  id: string;
  sessionId: string;
  mode: GameMode;
  dateKey: string;
  score: number;
  total: number;
  answers: AnswerRecord[];
  topicScores: Partial<Record<TopicId, TopicScore>>;
  weakestTopic: TopicId;
  hardestBelievedMyth: { questionId: string; claim: string; correction: string } | null;
  heroGuess: number;
  selectedDoubt: DoubtId;
  finishedAt: string;
}

export const doubtAnswers: Record<DoubtId, { title: string; answer: string }> = {
  safe: {
    title: "About safety",
    answer:
      "A game can’t tell you whether a treatment or health plan is safe for you. That depends on the specific approach and your health history. Ask a qualified clinician who knows your situation.",
  },
  "muscle-loss": {
    title: "About muscle",
    answer:
      "Weight loss can include lean tissue as well as fat. Strength work and enough protein may help preserve muscle for some people, but needs and results vary.",
  },
  regain: {
    title: "About weight returning",
    answer:
      "Weight can return after a change, but it isn’t inevitable or a personal failure. Ongoing habits and support can matter; what helps is different for each person.",
  },
  "diabetes-only": {
    title: "About diabetes",
    answer:
      "Metabolic health isn’t only about diabetes. Some risk factors can exist before a diagnosis, and this game can’t determine anyone’s health status.",
  },
  "for-me": {
    title: "About what fits you",
    answer:
      "Whether an approach fits depends on your health history, needs and circumstances. This game can help you prepare questions, but it can’t decide eligibility or diagnose.",
  },
};

export const topicTakeaways: Record<TopicId, string> = {
  food: "Food is more than one ingredient. Portions, the rest of the meal and the person all matter.",
  movement: "Movement can be small and ordinary. It isn’t a test of willpower or a substitute for care.",
  sleep: "Sleep and appetite can be connected, but people respond differently. One rough night is not a verdict.",
  body: "Body and metabolic health involve more than one number. A quiz cannot tell you what is happening in your body.",
};

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T>(items: T[], seedText: string): T[] {
  const result = [...items];
  let seed = hashSeed(seedText) || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swap = seed % (index + 1);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export const challengePackQuestionIds = [
  "shared-decision",
  "safe-beyond-diabetes",
  "muscle-loss",
  "strength-training",
  "habit-regain",
  "regain-not-inevitable",
  "diabetes-only",
] as const;

export function selectQuestions(
  bank: GameQuestion[],
  mode: GameMode,
  doubt: DoubtId,
  dateKey: string,
  fixedIds?: string[],
): GameQuestion[] {
  if (fixedIds?.length) {
    const byId = new Map(bank.map((question) => [question.id, question]));
    return fixedIds.map((id) => byId.get(id)).filter((question): question is GameQuestion => Boolean(question));
  }

  const available = bank.filter((question) => question.dailyEligible !== false);
  if (mode === "daily") {
    return seededShuffle(available, `steer-daily:${dateKey}`).slice(0, 5);
  }

  const personalized = available.filter((question) => question.doubtTags.includes(doubt));
  if (personalized.length < 2) {
    throw new Error(`Question bank needs two items tagged for ${doubt}.`);
  }
  const chosenForDoubt = seededShuffle(personalized, `steer:${dateKey}:${mode}:${doubt}:doubt`).slice(0, 2);
  const used = new Set(chosenForDoubt.map((question) => question.id));
  const general = seededShuffle(
    available.filter((question) => !used.has(question.id) && !question.doubtTags.includes(doubt)),
    `steer:${dateKey}:${mode}:${doubt}:general`,
  ).slice(0, 5);
  return seededShuffle([...chosenForDoubt, ...general], `steer:${dateKey}:${mode}:${doubt}:order`);
}

export function selectChallengeQuestions(
  bank: GameQuestion[],
  doubt: DoubtId,
  dateKey: string,
  fixedIds?: string[],
): GameQuestion[] {
  const bankById = new Map(bank.map((question) => [question.id, question]));
  const expectedIds = new Set<string>(challengePackQuestionIds);
  const ids = fixedIds ?? [...challengePackQuestionIds];
  if (ids.length !== 7 || new Set(ids).size !== 7 || ids.some((id) => !expectedIds.has(id))) {
    throw new Error("A shared challenge must use the complete seven-note pack.");
  }
  const ordered = ids.map((id) => bankById.get(id));
  if (ordered.some((question) => !question)) throw new Error("The shared challenge pack is incomplete.");
  const questions = ordered as GameQuestion[];
  for (const concern of doubtIds) {
    if (questions.filter((question) => question.doubtTags.includes(concern)).length !== 2) {
      throw new Error(`The shared challenge needs exactly two cards for ${concern}.`);
    }
  }
  if (questions.filter((question) => question.doubtTags.includes(doubt)).length !== 2) {
    throw new Error(`The shared challenge does not address ${doubt} exactly twice.`);
  }
  return fixedIds ? questions : seededShuffle(questions, `steer:shared-challenge:${dateKey}`);
}

export function scoreTopics(
  questions: GameQuestion[],
  answers: AnswerRecord[],
): { scores: Partial<Record<TopicId, TopicScore>>; weakestTopic: TopicId } {
  const answerById = new Map(answers.map((answer) => [answer.questionId, answer]));
  const scores: Partial<Record<TopicId, TopicScore>> = {};
  for (const question of questions) {
    const current = scores[question.topic] ?? { correct: 0, total: 0 };
    current.total += 1;
    if (answerById.get(question.id)?.correct) current.correct += 1;
    scores[question.topic] = current;
  }
  const topicOrder: TopicId[] = ["food", "movement", "sleep", "body"];
  const present = topicOrder.filter((topic) => scores[topic]);
  const weakestTopic = present.reduce((weakest, topic) => {
    const left = scores[weakest]!;
    const right = scores[topic]!;
    return right.correct / right.total < left.correct / left.total ? topic : weakest;
  }, present[0] ?? "food");
  return { scores, weakestTopic };
}

export function getHardestBelievedMyth(
  questions: GameQuestion[],
  answers: AnswerRecord[],
): GameResult["hardestBelievedMyth"] {
  const answerById = new Map(answers.map((answer) => [answer.questionId, answer]));
  const candidate = questions.find((question) => {
    const answer = answerById.get(question.id);
    return question.verdict === "myth" && answer && !answer.correct;
  });
  return candidate
    ? { questionId: candidate.id, claim: candidate.claim, correction: candidate.explanation }
    : null;
}

export function archetypeFor(score: number): string {
  if (score === 7) return "Myth Slayer";
  if (score >= 5) return "Myth Buster";
  if (score >= 3) return "Fact Finder";
  return "Curious Beginner";
}

export function getSessionId(): string {
  const existing = window.localStorage.getItem("steerclub:anonymous-session");
  if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing;
  if (existing) window.localStorage.removeItem("steerclub:anonymous-session");
  const sessionId = window.crypto?.randomUUID?.() ?? createFallbackUuid();
  window.localStorage.setItem("steerclub:anonymous-session", sessionId);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const sameSite = window.location.protocol === "https:" ? "None" : "Lax";
  document.cookie = `sc_session=${encodeURIComponent(sessionId)}; Max-Age=31536000; Path=/; SameSite=${sameSite}${secure}`;
  return sessionId;
}

function createFallbackUuid(): string {
  const bytes = new Uint8Array(16);
  if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function selectedDoubtFromStorage(): DoubtId | null {
  const value = window.localStorage.getItem("steerclub:doubt");
  return doubtIds.find((doubt) => doubt === value) ?? null;
}
