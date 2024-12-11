import bbconf

bba = bbconf.BedBaseAgent("deployment/config/api-dev.bedbase.org.yaml")

bba.config._b2bsi = bba.config._init_b2bsi_object()
bba.config._r2v = bba.config._init_r2v_object()
bba.config._bivec = bba.config._init_bivec_object()


# Here's some code to test the BiVectorSearchInterface

from geniml.search.interfaces import BiVectorSearchInterface
from geniml.search.backends import BiVectorBackend

from geniml.search.query2vec import Text2Vec

search_backend = BiVectorBackend(
    metadata_backend=self._qdrant_text_engine, bed_backend=self._qdrant_engine
)

t2v = Text2Vec("sentence-transformers/all-MiniLM-L6-v2", v2v=None)

bvsi = BiVectorSearchInterface()

from langchain_huggingface.embeddings import HuggingFaceEmbeddings
import logging
from typing import Union

import numpy as np
from langchain_huggingface.embeddings import HuggingFaceEmbeddings

from geniml.text2bednn import Vec2VecFNN
from geniml.search.query2vec.abstract import Query2Vec

# culprit:
te = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Testing the sentence transformers:


from sentence_transformers import SentenceTransformer

sentences = ["This is an example sentence", "Each sentence is converted"]

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
embeddings = model.encode(sentences)
print(embeddings)


from fastembed import TextEmbedding

model = TextEmbedding(
    model_name="sentence-transformers/all-MiniLM-L6-v2", max_length=512
)
sentences = ["This is an example sentence", "Each sentence is converted"]
embeddings = list(model.embed(sentences))
