We are building a voice first AI Assistant, which talks to user about their daily routine and emotions and then help them create a daily plan and
then journal their thoughts.

To do that we are using LiveKit library, which has an agent framework, that sets up a STT, LLM, and then a TTS pipeline ro get users voice input, convert into text, send to LLM, then then convert LLM response into Speech.

For frontend, LiveKit provides a client framework asd well, where we can connect to our LiveKit server that we have in main.py and then display transcription, and Audio/Bar visualizer to the user