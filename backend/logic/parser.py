import re


def parse_output(text: str):
    """
    Parse the LLM response into prompt and explanation sections expected by
    the client. Falls back to empty strings when sections are missing.
    """
    prompt = ""
    explanation = ""

    # Grab everything between [PROMPT] and [EXPLANATION] markers.
    match_prompt = re.search(r"\[PROMPT\](.*?)\[EXPLANATION\]", text, re.DOTALL)
    if match_prompt:
        prompt = match_prompt.group(1).strip()

    # Grab everything after the [EXPLANATION] marker.
    match_expl = re.search(r"\[EXPLANATION\](.*)", text, re.DOTALL)
    if match_expl:
        explanation = match_expl.group(1).strip()

    return {
        "prompt": prompt,
        "explanation": explanation
    }
