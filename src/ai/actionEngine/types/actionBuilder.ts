/** EPIC 4C — Builder context shared by all ActionBuilders. */

import type { AssistantConversationContext } from "../../conversationFoundation/types/assistantContext";
import type { IntentClassification } from "../../conversationFoundation/types/intents";
import type { HumanModel } from "../../humanModelFoundation";

export type ActionBuilderContext = {
  readonly userId: string;
  readonly firstName: string;
  readonly date: string;
  readonly message: string;
  readonly context: AssistantConversationContext;
  readonly humanModel: HumanModel;
  readonly classification: IntentClassification;
};

export type ActionBuilder = {
  readonly type: import("./secureAction").SecureActionType;
  canBuild(input: ActionBuilderContext): boolean;
  build(input: ActionBuilderContext): import("./secureAction").SecureActionDraft;
};
