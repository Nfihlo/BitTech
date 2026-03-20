import json
import sys
import os

def get_prompts():
    """
    Reads the two-stage prompt templates from prompt.txt.
    Stage 1: Concept to JSON Blueprint.
    Stage 2: Blueprint to Full Code.
    """
    try:
        with open('prompt.txt', 'r') as f:
            content = f.read()

        # Split based on the keyword which identifies the start of each prompt
        parts = content.split('You are a senior game developer')
        if len(parts) < 3:
            return content, ""

        blueprint_prompt = "You are a senior game developer" + parts[1]
        code_prompt = "You are a senior game developer" + parts[2]

        return blueprint_prompt.strip(), code_prompt.strip()
    except FileNotFoundError:
        print("Error: prompt.txt not found.")
        return None, None
    except Exception as e:
        print(f"Error reading prompts: {e}")
        return None, None

def generate_prompts(subject, topic, notes, difficulty="Intermediate"):
    """
    Generates the formatted prompts for the user to use in an LLM.
    """
    blueprint_template, code_template = get_prompts()

    if not blueprint_template or not code_template:
        return None, None

    # Stage 1: Blueprint
    # Use replace to avoid issues with JSON curly braces in f-strings/format
    blueprint_prompt = blueprint_template.replace('{subject_clean}', subject)\
                                          .replace('{concept_clean}', topic)\
                                          .replace('{notes_clean}', notes)\
                                          .replace('{diff_clean}', difficulty)

    return blueprint_prompt, code_template

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 game_generator.py <topic> [subject] [notes] [difficulty]")
        sys.exit(1)

    topic = sys.argv[1]
    subject = sys.argv[2] if len(sys.argv) > 2 else "Computer Science"
    notes = sys.argv[3] if len(sys.argv) > 3 else "No specific notes provided."
    difficulty = sys.argv[4] if len(sys.argv) > 4 else "Intermediate"

    blueprint, code_tmpl = generate_prompts(subject, topic, notes, difficulty)

    if blueprint:
        print("=== STAGE 1: BLUEPRINT PROMPT ===")
        print(blueprint)
        print("\n=== STAGE 2: CODE PROMPT TEMPLATE ===")
        print(code_tmpl)
    else:
        print("Failed to generate prompts. Check your prompt.txt file.")
