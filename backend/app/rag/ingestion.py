import uuid

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.rag.embeddings import embed_texts
from app.rag.vector_store import get_vector_store
from app.utils.file_parser import parse_pdf, parse_pptx


async def ingest_document(file_path: str, file_type: str, course_id: str, material_id: str) -> int:
    """Parse, chunk, embed, and store a document. Returns chunk count."""

    # Parse document
    if file_type == "pdf":
        pages = parse_pdf(file_path)
    elif file_type == "pptx":
        pages = parse_pptx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

    if not pages:
        return 0

    # Chunk
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = []
    for page in pages:
        page_chunks = splitter.split_text(page["text"])
        for i, chunk_text in enumerate(page_chunks):
            if chunk_text.strip():
                chunks.append({
                    "id": str(uuid.uuid4()),
                    "text": chunk_text,
                    "metadata": {
                        "material_id": material_id,
                        "course_id": course_id,
                        "page_number": page.get("page_number", 0),
                        "chunk_index": i,
                        "source_file": page.get("source_file", ""),
                    },
                })

    if not chunks:
        return 0

    # Embed
    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)
    for chunk, embedding in zip(chunks, embeddings):
        chunk["embedding"] = embedding

    # Store
    vs = get_vector_store()
    vs.add_chunks(course_id, chunks)

    return len(chunks)
