from langchain_google_genai import ChatGoogleGenerativeAI
from logic.prompt_builder import build_instruction
from logic.parser import parse_output
from models.request_model import PromptRequest


def generate_prompt(req: PromptRequest):
    """Orchestrate instruction building, LLM call, and output parsing."""
    # Build the LLM-ready instruction from user-provided fields.
    instruction = build_instruction(
        goal=req.goal,
        context=req.context,
        constraints=req.constraints,
        tone=req.tone,
        output_format=req.output_format,
        subject=req.subject
    )

    # Configure Gemini via LangChain with user API key and mild creativity.
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=req.api_key,
        temperature=0.4,
        max_retries=1
    )

    # Single LLM invocation; LangChain returns a message object.
    response = llm.invoke(instruction)
    raw_text = response.content

    # Extract prompt and explanation chunks from the model output.
    return parse_output(raw_text)