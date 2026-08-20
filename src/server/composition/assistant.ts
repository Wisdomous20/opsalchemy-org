import "server-only";

import { AnswerBusinessQuestion } from "@/application/use-cases/answer-business-question";
import { OpenAIResponsesGateway } from "@/infrastructure/openai/openai-responses-gateway";
import { getServerEnv } from "@/server/config/env";
import { createScheduleConsultation } from "@/server/composition/scheduling";

let useCase: AnswerBusinessQuestion | undefined;

export function getAnswerBusinessQuestion(): AnswerBusinessQuestion {
  if (useCase) return useCase;

  const environment = getServerEnv();
  const scheduler = createScheduleConsultation(environment);
  const gateway = new OpenAIResponsesGateway({
    apiKey: environment.OPENAI_API_KEY,
    model: environment.OPENAI_TEXT_MODEL,
    vectorStoreId: environment.OPENAI_VECTOR_STORE_ID,
    scheduleConsultation: scheduler ? (input) => scheduler.execute(input) : undefined,
  });

  useCase = new AnswerBusinessQuestion(gateway);
  return useCase;
}
