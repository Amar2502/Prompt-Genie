from pydantic import BaseModel


class PromptResponse(BaseModel):
    """Response format returned to the client."""
    prompt: str
    explanation: str
