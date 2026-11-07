# AI Pet Companion — Product & Development Specification V1.0

## 0. Your Role and Overall Task

You are a senior full-stack engineer, UI/UX designer, and AI application architect.

Build a functional, polished, production-oriented web application called **AI Pet Companion**.

The product is a realistic virtual pet that users can adopt, care for, talk to, and build a long-term relationship with.

**Core vision: A realistic living pet that can speak, understand its owner, remember past interactions, and respond through natural animal movements.**

This is NOT a traditional chatbot, cartoon pet game, or gamified simulation.

Please implement the project directly in the current GitHub repository.

Do not stop after generating documentation or mockups. Create working code, configure the application, and test it.

When external credentials or high-quality 3D assets are unavailable, implement a functioning fallback and clearly document what remains incomplete. Never pretend that a placeholder is a working AI or a realistic animal.

---

# 1. Product Philosophy

## 1.1 Core principles

The application must feel like interacting with a real pet.

The pet should:

- Have a realistic appearance.
- Have a distinctive personality.
- Speak naturally using AI-generated responses.
- Understand text and voice.
- Respond with appropriate animal movements.
- Remember important interactions with its owner.
- Maintain an independent daily routine.
- Be interactive even when the user is not chatting.
- Develop a recognizable relationship with the owner over time.

The user must feel they are spending time with their own pet, rather than interacting with a generic AI assistant.

## 1.2 What to avoid

Do NOT implement:

- Pixel art or cartoon aesthetics.
- Game-like menus or virtual worlds.
- Coins, XP, levels, or achievement systems.
- Artificial relationship scores.
- Task completion rewards.
- Large chatbot-style conversation panels dominating the interface.
- Excessive animations or childish visual effects.
- Fake AI responses disguised as live model output.
- Artificially dramatic separation anxiety or punishments for inactivity.

Design for a calm, natural, immersive experience.

---

# 2. Target User Experience

A user visits the website, adopts a pet, gives it a name, and begins interacting.

Example:

The user adopts a golden retriever named Milo.

When the user opens the website:

Milo is resting on a sofa.

After noticing the user's interaction, Milo looks toward the user, lifts its head, and wags its tail.

The user types:

"宝宝，我回来啦。"

Milo responds:

"你回来啦！我刚才还在睡觉呢。"

Meanwhile, Milo visibly reacts.

Later, the user activates the microphone:

"今天好累呀。"

Milo responds using natural speech:

"怎么啦？今天事情很多吗？"

Milo looks attentive.

The user says:

"嗯，明天还有好多工作。"

Milo:

"那你先休息一下，我陪着你。"

When the user returns the following day, Milo may remember the conversation and naturally ask about it.

The pet must not mention previous conversations too frequently or repeat identical greetings.

---

# 3. Visual Design

## 3.1 Overall design direction

Style:

- Photorealistic or highly realistic 3D animal.
- Minimalist, modern interface.
- Warm and natural colors.
- Spacious layout.
- Soft natural lighting.
- Smooth, restrained transitions.
- Realistic environmental details.

Avoid cartoon styling.

Visual inspiration: a real pet resting inside a modern home, observed through a camera.

## 3.2 Main interface

Desktop layout:

- The pet occupies approximately 65–80% of the primary viewport area.
- A realistic, softly lit background.
- Pet name and subtle current status at the top.
- Minimal settings controls in the upper-right corner.
- A compact interaction area near the bottom.
- A text input field.
- A microphone button.
- A send button.
- Small, unobtrusive actions for feeding, petting, and playing.

The pet should remain the center of visual attention.

Mobile:

- Responsive, portrait-oriented layout.
- Pet remains prominently visible.
- Input controls adapt to the available space.
- Mobile keyboard must not permanently obscure the pet.
- Touch interactions must work reliably.

## 3.3 Chat interface

Text messages should appear in a subtle, semi-transparent overlay.

Use:

- Compact message bubbles.
- Readable typography.
- Minimal visual noise.
- A scrollable chat-history drawer when needed.

Avoid displaying the entire conversation as a permanent large panel.

Provide a clearly labeled way to open full conversation history.

## 3.4 Voice interface

The voice interface must be integrated into the same main page.

Include:

- Microphone toggle.
- Permission handling.
- Listening indicator.
- Speaking indicator.
- Mute control.
- Optional subtitles.
- Clear microphone and connection status.

Do not automatically start recording audio when the website loads.

---

# 4. Pet Adoption

Route: `/adopt`

The user should be able to:

1. Select an animal.
2. Select a breed or appearance.
3. Enter a pet name.
4. Choose a personality preset.
5. Choose a voice.
6. Complete adoption.

## 4.1 Pet species

Planned species:

- Dog
- Cat
- Rabbit

Dog breeds may include:

- Golden Retriever
- Shiba Inu
- Corgi

Cat breeds may include:

- Ragdoll
- British Shorthair
- Orange Tabby

Rabbit breeds may include:

- Holland Lop
- Netherland Dwarf

**MVP requirement: implement one fully functional golden retriever.**

The adoption UI can show future options, but do not make unavailable species appear selectable as fully implemented pets.

## 4.2 Personalities

Personality presets:

**Friendly**
- Affectionate.
- Social.
- Encouraging.
- Enjoys interacting.

**Calm**
- Gentle.
- Relaxed.
- Speaks softly.
- Comfortable with silence.

**Playful**
- Curious.
- Energetic.
- Sometimes humorous.
- Likes proposing activities.

**Independent**
- Less talkative.
- Maintains a recognizable independent routine.
- Shows affection selectively.

Personality should influence:

- Language.
- Response length.
- Tone.
- Initiative.
- Activity preferences.
- Frequency of speaking.

It must not simply alter the welcome message.

---

# 5. Core Pet Experience

Route: `/pet`

This is the main experience and must receive the most development attention.

## 5.1 Pet animation states

Define a consistent animation system with these states:

- `idle`
- `look_at_user`
- `blink`
- `sit`
- `lie_down`
- `sleep`
- `wake_up`
- `walk`
- `tail_wag`
- `eat`
- `play`
- `happy`
- `curious`
- `listen`
- `speak`

Not every state requires a separate animation clip if procedural animation can achieve an acceptable result.

However, do not claim that an animation exists if the model cannot perform it.

## 5.2 Animation requirements

Animations should:

- Transition smoothly.
- Avoid abrupt pose changes.
- Respect anatomical constraints.
- Avoid human-like gestures.
- Be interruptible when appropriate.
- Respond consistently to the pet's current state.

Examples:

If the pet is sleeping and the user speaks, it should wake up before responding.

If the user feeds the pet, it should move toward the food bowl before playing the eating animation, if supported by available assets.

If the pet is already resting, do not randomly switch into an excited running animation without a reason.

## 5.3 Autonomous behavior

The pet should behave independently.

Examples:

- Resting.
- Sleeping.
- Looking around.
- Changing posture.
- Playing with a toy.
- Briefly walking around.
- Reacting to the user's return.

Use a lightweight behavioral state machine.

Do not call an LLM every second to decide idle behaviors.

Behavior should be influenced by:

- Energy.
- Satiety.
- Mood.
- Personality.
- Time since the last interaction.
- Recent activities.

The pet should never die or become seriously ill because the owner did not open the website.

---

# 6. Text Chat

Text input is an essential feature, not a secondary fallback.

Users must be able to type messages at any time.

## 6.1 Text interaction

The user:

1. Types a message.
2. Presses Enter or clicks Send.
3. Sees the message immediately.
4. Receives a streamed AI response.
5. Sees the pet perform a relevant reaction.

Features:

- Streaming responses.
- Conversation persistence.
- Clear loading state.
- Error handling.
- Retry functionality.
- Prevention of duplicate submissions.
- Automatic scrolling within the chat overlay.
- Optional text-to-speech playback.

The input must remain usable even if the microphone is unavailable.

## 6.2 Language support

Support Chinese and English.

The pet should naturally respond in the user's language.

Do not force English responses for Chinese inputs.

Handle mixed Chinese-English conversations.

Avoid automatically translating the user's messages.

## 6.3 AI personality rules

The pet should talk like an affectionate, intelligent pet capable of human language.

It should not sound like ChatGPT.

Avoid:

- "As an AI..."
- "Here are five suggestions..."
- Excessive advice.
- Repeated generic encouragement.
- Unsolicited lectures.
- Formulaic follow-up questions.
- Long, academic explanations.

Prefer conversational and concise responses.

Example:

User: "我今天好累。"

Bad response:

"我理解你的感受。以下是五个缓解疲劳的建议……"

Good response:

"怎么啦，今天又忙了一整天吗？过来陪我坐一会儿。"

Most casual responses should be short, typically one to three sentences, while allowing longer responses when the user explicitly asks for an explanation or sustained conversation.

---

# 7. Voice Chat

Voice is a first-class feature.

Users must be able to speak to the pet and hear a natural spoken response.

## 7.1 Functional requirements

Implement:

- Microphone permission handling.
- Start/stop voice session.
- Low-latency voice interaction.
- Natural turn-taking.
- Voice activity detection where supported.
- User interruption while the pet speaks.
- Audio playback.
- Speaker mute/unmute.
- Optional captions.
- Connection status.
- Graceful recovery after disconnection.

## 7.2 Architecture

Use the current supported OpenAI Realtime API with WebRTC for browser-based live voice.

Obtain session credentials securely through the backend using the officially supported mechanism.

Never expose long-lived API keys in client-side code.

Verify the latest API documentation before implementation. Do not assume old endpoint names, models, request formats, or event structures remain valid.

If live voice is unavailable because of missing credentials, show a clear setup state.

Do not simulate a working microphone using a UI toggle alone.

## 7.3 Text/voice consistency

Text and voice must share:

- Pet identity.
- Current personality.
- Recent conversation context.
- Saved long-term memories.
- Pet activity state.

Example:

The user types:

"我明天有个面试。"

Later, the user activates voice mode and asks:

"宝宝，你还记得我明天有什么事吗？"

The pet should answer correctly based on the same conversation context.

Avoid separate, disconnected conversation histories for text and voice.

## 7.4 Voice responses and animations

During voice output, the pet should:

- Transition into a speaking state.
- Perform subtle facial or body motion.
- Use jaw movement when supported.
- Return to the appropriate resting or idle state after speaking.

Audio-driven jaw movement can be implemented as an initial approximation.

Precise phoneme-based lip synchronization may be implemented later.

Do not claim precise lip sync when only audio amplitude is used.

---

# 8. Pet Interaction and Care

Provide three core interactions in the MVP.

## 8.1 Feed

User clicks Feed or says:

"宝宝，吃饭啦。"

Expected behavior:

- The pet acknowledges the interaction.
- The feeding state is updated.
- An appropriate animation plays.
- The pet can make a short verbal response.
- The updated state persists.

Avoid an unrealistic instant reset of hunger without any visible feedback.

## 8.2 Petting

Users can pet the animal by clicking or touching supported areas of the pet.

Expected behavior:

- Gentle head movement.
- Tail wagging or another species-appropriate reaction.
- A short sound or spoken acknowledgment when appropriate.

For the MVP, basic click/tap regions are acceptable.

Do not promise physically accurate hand tracking.

## 8.3 Play

Provide one basic play interaction.

For example:

- A ball appears.
- The user initiates play.
- The dog responds with a relevant animation.
- The interaction changes the dog's energy state.

Keep the visual interaction natural.

No points, badges, or scores.

---

# 9. Pet State System

Persist meaningful state variables:

```ts
type PetState = {
  energy: number;
  satiety: number;
  mood: "calm" | "happy" | "curious" | "sleepy";
  activity: string;
  lastFedAt: string | null;
  lastPlayedAt: string | null;
  lastInteractionAt: string | null;
};
```

Internal numerical values may be used for behavioral calculations.

Do not display raw numerical relationship or happiness scores on the main interface.

Derive state changes from elapsed time and user interactions.

Use safe ranges and deterministic update rules.

Do not make the pet emotionally dependent on the user or punish absences.

---

# 10. Long-Term Memory

Long-term memory is one of the product's most important differentiators.

## 10.1 Types of memory

**Pet Identity**

- Name.
- Species.
- Breed.
- Personality.
- Preferred voice.
- Adoption date.

**Owner Preferences**

- Preferred language.
- Preferred name or nickname.
- Conversation style preferences.

**Shared Experiences**

- Important conversations.
- User-approved memories.
- Meaningful interaction history.

**Recent Context**

- Recent chat messages.
- Current interaction.
- Current pet state.

## 10.2 Memory behavior

Example:

Day 1:

User: "你以后叫我哥哥吧。"

Pet: "好呀，哥哥！"

Day 2:

Pet: "哥哥，你回来啦。"

The memory must persist after browser refreshes and across login sessions.

## 10.3 Memory implementation

Use a structured memory system.

Suggested process:

1. Save chat messages.
2. Identify potential memories from conversations.
3. Store durable information only with appropriate user permission.
4. Retrieve relevant memories for future responses.
5. Avoid inserting the entire chat history into every model request.

For the MVP, a relational memory table plus relevance filtering is sufficient.

A vector database is optional and should not be added before it is needed.

## 10.4 Privacy controls

Allow users to:

- View stored memories.
- Delete individual memories.
- Clear conversation history.
- Disable long-term memory.
- Delete their pet data.

Do not silently store sensitive personal details as durable memories.

---

# 11. AI Response Architecture

Separate the following responsibilities:

**Conversation Engine**

Generates natural pet dialogue.

**Pet Behavior Engine**

Determines appropriate pet actions and state transitions.

**Memory Engine**

Retrieves and stores contextual information.

**Speech Engine**

Handles speech input and output.

Keep these responsibilities modular.

## 11.1 Structured actions

The AI should be able to propose constrained actions.

Example:

```json
{
  "reply": "你回来啦！我刚才还在睡觉呢。",
  "emotion": "happy",
  "action": "tail_wag",
  "memory_candidates": []
}
```

Treat this as a conceptual schema, not a mandated provider response format.

Validate all AI-generated action data before execution.

Use strict allowlists for available actions.

Do not let the model directly modify arbitrary database fields.

The backend or behavior engine must validate whether an action is possible in the pet's current state.

For live voice, use the appropriate official tool-calling mechanism to request pet actions.

Actions must not block natural conversation.

---

# 12. Website Pages

## 12.1 Landing Page `/`

A clean, emotional introduction to the product.

Components:

- Beautiful realistic pet visual.
- Short headline.
- Brief product explanation.
- Adopt a Pet button.
- Sign In button.

Suggested headline:

"Your pet. Your companion. Always a little world of its own."

Avoid excessive marketing copy.

## 12.2 Adoption Page `/adopt`

Steps:

1. Select pet.
2. Choose name.
3. Choose personality.
4. Choose voice.
5. Complete adoption.

Use an elegant, minimal interface.

## 12.3 Pet Page `/pet`

The primary application.

Features:

- Realistic pet viewport.
- Text messaging.
- Voice messaging.
- Feeding.
- Petting.
- Playing.
- Current activity indicator.
- Conversation drawer.
- Settings access.

## 12.4 Memories Page `/memories`

Display:

- Adoption date.
- Shared moments.
- Saved memories.
- Memory management.

Avoid presenting memories as game achievements.

## 12.5 Settings Page `/settings`

Allow changes to:

- Pet name.
- Voice.
- Conversation language.
- Subtitles.
- Automatic speech playback.
- Memory preferences.
- Privacy and data deletion.
- Account settings.

---

# 13. Technology Stack

Use:

**Frontend**
- Next.js with App Router.
- React.
- TypeScript.
- Tailwind CSS.
- Accessible, minimal UI components.

**Pet Rendering**
- Three.js.
- React Three Fiber.
- React Three Drei.
- GLB/glTF animal models.
- Animation mixer and state machine.

**Backend**
- Next.js server routes where appropriate.
- Supabase PostgreSQL.
- Supabase Authentication.

**AI**
- Official OpenAI SDK.
- Configurable text model.
- Official OpenAI Realtime API for voice.

**Deployment**
- Vercel.
- Supabase.

Choose currently stable, mutually compatible dependency versions.

Avoid adding unnecessary dependencies.

---

# 14. 3D Asset Strategy

Realistic animal rendering is a high-priority requirement.

Do not replace the realistic pet with an emoji, primitive sphere, cartoon animal, or obviously stylized model and call it complete.

Support loading a configurable GLB/glTF model.

Suggested asset structure:

```text
public/
  models/
    golden-retriever/
  textures/
  environments/
  audio/
```

Build an asset-independent PetRenderer component.

The renderer should support:

- Model loading.
- Animation detection.
- Animation playback.
- Camera configuration.
- Lighting.
- Shadows.
- Asset loading status.
- Missing asset fallback.

If an appropriate licensed realistic model is available, integrate it.

Check commercial-use permissions and attribution requirements before integrating external assets.

Do not download or redistribute copyrighted models without appropriate rights.

If no suitable model is available, use a clearly labeled visual prototype with an attractive realistic pet image or licensed video, while retaining the proper 3D architecture for later replacement.

The fallback must still provide meaningful interactive feedback where possible.

Document required asset formats, scale, orientation, animation names, and any missing animations.

---

# 15. Database Design

Create Supabase migrations for the following tables.

## profiles

- id
- display_name
- preferred_language
- created_at

## pets

- id
- owner_id
- name
- species
- breed
- personality
- voice_id
- adopted_at
- created_at
- updated_at

## pet_states

- pet_id
- energy
- satiety
- mood
- activity
- last_fed_at
- last_played_at
- last_interaction_at
- updated_at

## conversations

- id
- pet_id
- owner_id
- created_at
- updated_at

## messages

- id
- conversation_id
- role
- content
- modality
- created_at

## memories

- id
- pet_id
- owner_id
- content
- category
- approved
- created_at
- updated_at

## pet_interactions

- id
- pet_id
- owner_id
- interaction_type
- metadata
- created_at

## user_preferences

- user_id
- subtitles_enabled
- auto_speech_enabled
- long_term_memory_enabled
- updated_at

Create useful indexes.

Use foreign keys and appropriate delete cascading.

Implement Supabase Row Level Security.

Users must not be able to access or modify another user's pets, conversations, or memories.

Validate ownership for all relevant server-side actions.

---

# 16. Backend API Design

Create typed server endpoints or equivalent server actions.

Suggested routes:

```text
POST   /api/pets
GET    /api/pets
GET    /api/pets/:id
PATCH  /api/pets/:id

GET    /api/pets/:id/state
POST   /api/pets/:id/interactions

POST   /api/chat
GET    /api/conversations/:id/messages

POST   /api/voice/session

GET    /api/memories
POST   /api/memories
DELETE /api/memories/:id
```

Use consistent response types.

Implement:

- Input validation.
- Authentication.
- Authorization.
- Rate limiting for costly AI endpoints.
- Appropriate error messages.
- Structured server logging.
- Safe handling of timeouts.
- Cancellation and connection cleanup.

Never expose provider API secrets in browser bundles.

---

# 17. Environment Variables

Create `.env.example` documenting required configuration.

Include variables such as:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=

OPENAI_TEXT_MODEL=
OPENAI_REALTIME_MODEL=
```

These are illustrative names. Confirm SDK and provider configuration before implementation.

Store private keys only on the server.

Do not commit real credentials.

Provide clear instructions for local configuration and Vercel deployment.

---

# 18. Suggested Project Structure

```text
src/
  app/
    page.tsx
    adopt/
    pet/
    memories/
    settings/
    api/

  components/
    pet/
      PetScene.tsx
      PetRenderer.tsx
      PetAnimationController.ts
      PetInteractionLayer.tsx

    chat/
      ChatInput.tsx
      ChatMessages.tsx
      ConversationDrawer.tsx

    voice/
      VoiceControls.tsx
      VoiceSessionManager.ts

    ui/

  lib/
    ai/
      chat.ts
      personality.ts
      action-schema.ts

    pet/
      behavior-engine.ts
      state-machine.ts
      state-updates.ts

    memory/
      memory-service.ts
      memory-retrieval.ts

    supabase/
      client.ts
      server.ts

  hooks/
  types/
  styles/

public/
  models/
  textures/
  environments/

supabase/
  migrations/

tests/
```

Adjust the structure where necessary, but maintain clear boundaries between UI, AI, animation, persistent data, and voice.

---

# 19. Development Phases

Implement the project incrementally.

## Phase 1 — Working Application

Build:

- Next.js application.
- Responsive UI.
- Landing page.
- Adoption flow.
- Main pet page.
- Text chat interface.
- Settings structure.
- Basic persistence.
- Pet rendering abstraction.

Deliver a working local application.

No broken navigation or fake functional buttons.

## Phase 2 — Real AI Integration

Implement:

- Server-side AI integration.
- Streaming text responses.
- Pet personality instructions.
- Structured animation requests.
- Conversation storage.
- Functional error handling.

Text chat must work end-to-end.

## Phase 3 — Voice Integration

Implement:

- Real microphone access.
- WebRTC voice communication.
- Natural audio replies.
- Turn interruption.
- Captions where supported.
- Shared conversation context.
- Voice-driven pet actions.

Do not treat a nonfunctional microphone toggle as complete.

## Phase 4 — Pet Interaction and Care

Implement:

- Pet state machine.
- Autonomous behavior.
- Feed action.
- Pet action.
- Play action.
- Persistent care state.
- Basic pet routine.

## Phase 5 — Memory and Persistence

Implement:

- Authentication.
- User-scoped data.
- Long-term memory.
- Memory management.
- Cross-session continuity.
- User data deletion.

## Phase 6 — Polish and Deployment

Implement:

- Responsive refinements.
- Loading states.
- Error boundaries.
- Asset optimization.
- Accessibility improvements.
- Performance testing.
- Deployment documentation.

Prioritize functional completeness over speculative extra features.

---

# 20. Error Handling

The product must handle:

- Microphone permission denied.
- Browser without WebRTC support.
- AI API connection failure.
- Missing OpenAI credentials.
- Supabase connection failure.
- Missing pet model assets.
- Failed animation loading.
- Slow network.
- Interrupted speech.
- Duplicate chat requests.
- Refreshing during an active session.

Error states should be understandable and graceful.

Never show false success messages.

Text chat should continue working when voice fails, provided the text service itself is available.

---

# 21. Testing and Acceptance Criteria

Create tests where appropriate.

## 21.1 Adoption

- A user can create a pet.
- The pet has a saved name and personality.
- The pet remains available after refresh.
- Invalid inputs are rejected.

## 21.2 Text Chat

- User messages are sent successfully.
- Actual AI responses appear.
- Streaming works.
- The pet retains conversational context.
- The message history persists.
- Failed requests show useful errors.

## 21.3 Voice

- Microphone permission is requested intentionally.
- Spoken messages reach the AI service.
- The pet replies audibly.
- Users can stop or interrupt.
- Voice and text share conversational context.
- Connection errors are handled.

## 21.4 Pet Behavior

- Available animations can be triggered.
- State transitions are consistent.
- Feeding updates persistent state.
- Petting triggers appropriate feedback.
- The pet continues idle behavior without user input.

## 21.5 Memory

- Pet information persists.
- Approved memories can influence future conversations.
- Users can inspect and delete memories.
- Users cannot access other accounts' data.

## 21.6 Quality

- No TypeScript errors.
- No critical runtime exceptions.
- No hydration errors.
- No exposed secrets.
- No broken navigation.
- No deceptive demo functionality.

Run build, lint, and relevant tests.

Report actual results, not assumed success.

---

# 22. UI and Product Quality Requirements

The website should look like a real consumer product, not a coding exercise.

Prioritize:

1. High-quality pet visuals.
2. Natural conversational experience.
3. Smooth interactions.
4. Clear and attractive UI.
5. Responsiveness.
6. Reliable persistence.
7. Performance.

Use polished typography and subtle visual styling.

Avoid unnecessary gradients, excessive cards, large colored buttons, or dashboard-like layouts.

The user's attention should remain on the pet.

---

# 23. Working Instructions for Codex

Follow these rules during implementation:

1. Inspect the current repository before changing files.
2. Identify the existing framework and project structure.
3. Do not overwrite unrelated existing code.
4. Implement functional features rather than static mockups.
5. Make reasonable engineering decisions without unnecessary clarification.
6. Use current official documentation for evolving APIs.
7. Do not invent API keys, model files, or credentials.
8. Do not hardcode fake conversation responses as if they came from an AI service.
9. Use explicit placeholders only when unavoidable.
10. Keep the project runnable after each phase.
11. Document all configuration steps.
12. Run the available tests and production build.
13. Explain blockers and missing external dependencies accurately.

If the scope cannot be fully completed in one execution, prioritize Phases 1 and 2 and create a precise checklist for the remaining work. Do not sacrifice code quality or claim incomplete features are finished.

---

# 24. Final Deliverables

The final repository should contain:

- Working Next.js application.
- Functional navigation.
- Pet adoption interface.
- Main pet experience.
- Text chat integration.
- Voice integration if credentials permit.
- Pet interaction framework.
- Database migrations.
- Memory implementation.
- Responsive styling.
- `.env.example`.
- Clear README.
- Local development instructions.
- Vercel deployment instructions.
- Testing results.
- Known limitations and asset requirements.

The README should be professional and concise.

Avoid including private personal information in public documentation.

---

# 25. Definition of Success

The minimum successful product experience is:

A user opens the website, adopts a golden retriever, gives it a name, sees the pet in a realistic visual interface, sends it a text message, receives a genuine AI response consistent with the pet's personality, and can interact with it through feeding and petting.

The pet and conversation persist when the user returns.

The next milestone is seamless two-way voice interaction with coherent pet reactions.

The ultimate goal is for users to experience the pet as a consistent, living companion rather than an AI chat interface.

**Begin implementing the application now. Start by inspecting the repository, establishing the project structure, and completing Phase 1. Then proceed through the remaining phases as far as available credentials, assets, and environment permit.**