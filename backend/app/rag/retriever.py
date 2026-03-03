from app.rag.embeddings import embed_query
from app.rag.vector_store import get_vector_store


def retrieve_chunks(course_id: str, query: str, n_results: int = 5) -> list[dict]:
    """Retrieve relevant document chunks for a query."""
    query_embedding = embed_query(query)
    vs = get_vector_store()
    return vs.query(course_id, query_embedding, n_results=n_results)


def format_chunks_as_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string for LLM prompts."""
    if not chunks:
        return "No course material context available."

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        source = chunk.get("metadata", {}).get("source_file", "Unknown")
        page = chunk.get("metadata", {}).get("page_number", "?")
        context_parts.append(f"[Source {i}: {source}, Page {page}]\n{chunk['text']}")

    return "\n\n---\n\n".join(context_parts)
