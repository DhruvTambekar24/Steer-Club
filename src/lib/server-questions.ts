import "server-only";
import questionData from "../../public/content/questions.json";
import type { GameQuestion } from "@/lib/game";

export const questionBank = questionData.questions as GameQuestion[];
export const questionById = new Map(questionBank.map((question) => [question.id, question]));
