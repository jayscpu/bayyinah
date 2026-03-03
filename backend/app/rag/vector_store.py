import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings

_client = None


def get_chroma_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


class VectorStore:
    def __init__(self):
        self.client = get_chroma_client()

    def get_collection(self, course_id: str):
        return self.client.get_or_create_collection(
            name=f"course_{course_id}",
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(self, course_id: str, chunks: list[dict]):
        """Add document chunks to the vector store.

        Each chunk dict should have: id, text, embedding, metadata
        """
        collection = self.get_collection(course_id)
        collection.add(
            ids=[c["id"] for c in chunks],
            documents=[c["text"] for c in chunks],
            embeddings=[c["embedding"] for c in chunks],
            metadatas=[c["metadata"] for c in chunks],
        )

    def query(self, course_id: str, query_embedding: list[float], n_results: int = 5) -> list[dict]:
        collection = self.get_collection(course_id)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"],
        )

        chunks = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                chunks.append({
                    "id": results["ids"][0][i],
                    "text": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0,
                })
        return chunks

    def delete_by_material(self, course_id: str, material_id: str):
        try:
            collection = self.get_collection(course_id)
            collection.delete(where={"material_id": material_id})
        except Exception:
            pass


_vector_store = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
