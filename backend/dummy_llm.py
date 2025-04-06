# dummy_llm.py
import asyncio
import random
import json


class DummyLLM:
    def __init__(self):
        self.responses = [
            "That's an interesting point. Can you tell me more?",
            "I understand what you're saying. Here's what I think...",
            "Based on what you've shared, I'd suggest considering these ideas...",
            "Let me analyze this further... The key aspects to consider are...",
            "That's a great question! From my perspective...",
            "I've processed your request and here's what I found...",
            "Thanks for sharing that. My thoughts on this topic are...",
            "I've considered multiple angles on this issue, and here's my analysis...",
            "Your question touches on several important concepts. Let me break it down...",
            "I find this topic fascinating. Here's what I know about it..."
        ]

    async def generate_large_response(self):
        """
        Generate a large response consisting of 1000 words
        """
        words = []
        for _ in range(100):  # Generate a message of 1000 words
            words.append(random.choice(self.responses))
        return " ".join(words)

    async def stream_response(self, input_text):

        # await asyncio.sleep(10)

        """
        Simulate streaming a large response in chunks (1000 words) with a small delay between each chunk.
        """
        if len(input_text) < 5:
            yield "data: Could you provide more details?\n\n"
            return

        # Generate a large response
        large_response = await self.generate_large_response()

        # Stream the response in chunks
        chunk_size = 50  # Send 50 words per chunk
        words = large_response.split()

        # Send chunks of the large response
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            yield f"data: {chunk}\n\n"
            await asyncio.sleep(0.2)  # Simulate real-time delay between chunks

