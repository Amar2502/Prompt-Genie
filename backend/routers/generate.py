from fastapi import APIRouter, HTTPException
from models.request_model import PromptRequest
from models.response_model import PromptResponse
from logic.generator import generate_prompt

# Router dedicated to prompt generation endpoints.
router = APIRouter()

@router.post("/generate", response_model=PromptResponse)
async def generate(req: PromptRequest):
    """
    Receive prompt parameters from the client, trigger prompt generation,
    and normalize the response. Any unexpected failure becomes a 500.
    """
    try:
        result = generate_prompt(req)
        # result is a dictionary with keys matching PromptResponse fields (e.g., "prompt" and "explanation")
        return PromptResponse(**result)
    except Exception as e:
        # Bubble up as HTTP error so the client gets a clear failure response.
        raise HTTPException(status_code=500, detail=str(e))
