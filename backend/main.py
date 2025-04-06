# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import json
import asyncio
from dummy_llm import DummyLLM
import threading

app = FastAPI(title="Chatbot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the dummy LLM
llm = DummyLLM()

condition = threading.Condition()

class State:
    def __init__(self):
        self.messages = []

    def update(self, new_messages):
        self.messages = new_messages
        with condition:
            condition.notify()

state = State()

@app.get("/")
async def root():
    return {"message": "Welcome to the Chatbot API"}

# Stream responses
@app.get("/streamresponse")
async def streamresponse(prompt: str):
    async def event_generator():
        # Use DummyLLM to stream the response
        async for chunk in llm.stream_response(prompt):
            yield chunk  # Yield the chunk of data (streaming part)

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# Simulate message update via POST request (if needed for internal state)
@app.post('/update')
def update(new_messages: list):
    state.update(new_messages)
    return {"message": "Messages updated!"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
