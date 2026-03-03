QUESTION_GENERATION_PROMPT = """You are an exam question generator for an Information Security course.
Based on the following course material excerpts, generate exactly {question_count} exam questions.

Requirements:
- Mix of question types: include both essay questions and multiple-choice questions with justification
- Questions must test UNDERSTANDING, not memorization
- Questions should cover different topics from the provided material
- Each question should be answerable using the provided course material
- For MCQ questions, provide 4 options (A, B, C, D) — some may have multiple valid answers depending on justification

COURSE MATERIAL:
{course_material}

Return your response as a JSON array with exactly {question_count} objects. Each object must have:
- "question_type": either "essay" or "mcq"
- "question_text": the question text
- "mcq_options": (only for mcq) array of objects with "key" and "text" fields
- "display_order": integer 1 through {question_count}

Example format:
[
  {{
    "question_type": "essay",
    "question_text": "Explain the concept of...",
    "mcq_options": null,
    "display_order": 1
  }},
  {{
    "question_type": "mcq",
    "question_text": "Which of the following...",
    "mcq_options": [
      {{"key": "A", "text": "Option A"}},
      {{"key": "B", "text": "Option B"}},
      {{"key": "C", "text": "Option C"}},
      {{"key": "D", "text": "Option D"}}
    ],
    "display_order": 2
  }}
]

Return ONLY the JSON array, no other text."""
