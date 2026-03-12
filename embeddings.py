import chromadb
from sentence_transformers import SentenceTransformer
import os

model = SentenceTransformer("all-MiniLM-L6-v2")

client = chromadb.Client()
collection = client.create_collection("python_docs")

docs_folder = "docs"

for file in os.listdir(docs_folder):
    text = open(f"{docs_folder}/{file}").read()

    embedding = model.encode(text)

    collection.add(
        documents=[text],
        embeddings=[embedding.tolist()],
        ids=[file]
    )

print("Documents embedded")