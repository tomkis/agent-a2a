import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AgentCard, Message, TextPart } from '@a2a-js/sdk';
import {
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
  DefaultRequestHandler,
  InMemoryTaskStore,
  A2AExpressApp,
} from '@a2a-js/sdk/server';

const PORT = process.env.PORT || 4000;

const helloAgentCard: AgentCard = {
  name: 'Hello Agent',
  description: 'An agent that greets you by name.',
  url: `http://localhost:${PORT}`,
  version: '1.0.0',
  capabilities: {
    streaming: false,
    pushNotifications: false,
    // extensions: {

    // }
  },
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  skills: [{ id: 'greet', name: 'Greet', description: 'Says hello with your name', tags: ['greeting'] }],
};

class HelloExecutor implements AgentExecutor {
  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const { contextId, userMessage } = requestContext;

    let name = 'World';
    if (userMessage && userMessage.parts) {
      const textPart = userMessage.parts.find((p): p is TextPart => p.kind === 'text');
      if (textPart) {
        name = textPart.text.trim() || 'World';
      }
    }

    const responseMessage: Message = {
      kind: 'message',
      messageId: uuidv4(),
      role: 'agent',
      parts: [{ kind: 'text', text: `Hello ${name}` }],
      contextId: contextId,
    };

    eventBus.publish(responseMessage);
    eventBus.finished();
  }

  cancelTask = async (): Promise<void> => {};
}

const agentExecutor = new HelloExecutor();
const requestHandler = new DefaultRequestHandler(
  helloAgentCard,
  new InMemoryTaskStore(),
  agentExecutor
);

const app = express();
const a2aApp = new A2AExpressApp(requestHandler);
a2aApp.setupRoutes(app);

app.listen(PORT, () => {
  console.log(`A2A Hello Agent running on http://localhost:${PORT}`);
});
