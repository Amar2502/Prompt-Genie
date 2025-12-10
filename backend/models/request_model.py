from pydantic import BaseModel


class PromptRequest(BaseModel):
    """
    Payload expected from the client when asking for a prompt.
    Defaults keep optional fields empty when not supplied.
    """
    api_key: str
    goal: str
    context: str | None = ""
    constraints: str | None = ""
    tone: str | None = ""
    output_format: str | None = ""
    subject: str | None = ""
