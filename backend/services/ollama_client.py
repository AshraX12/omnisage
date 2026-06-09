"""
Ollama Client Module for Omnisage Medical Record Aggregator.

This module provides a thin wrapper around the Ollama HTTP API for generating
text completions and computing text embeddings. All AI services use this client
as their LLM backend.
"""

import json
import requests
from backend.config import settings


class OllamaClient:
    """
    HTTP client for interacting with a local Ollama server.

    Provides methods for text generation (chat completions) and text
    embeddings via the Ollama REST API.
    """

    def __init__(self):
        """
        Initializes the Ollama client with the configured base URL and model names.
        """
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.embed_model = settings.OLLAMA_EMBED_MODEL

    def is_available(self) -> bool:
        """
        Checks whether the Ollama server is reachable and responsive.

        Returns:
            bool: True if the server responds to a health check.
        """
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return resp.status_code == 200
        except Exception:
            return False

    def list_models(self) -> list[str]:
        """
        Lists all models currently available on the Ollama server.

        Returns:
            list[str]: Names of locally available models.
        """
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=10)
            resp.raise_for_status()
            return [m["name"] for m in resp.json().get("models", [])]
        except Exception:
            return []

    def generate(self, prompt: str, system: str = "", temperature: float = 0.3) -> str:
        """
        Generates a text completion using the configured LLM model.

        Args:
            prompt (str): The user prompt / instruction.
            system (str): Optional system prompt to set behavior context.
            temperature (float): Sampling temperature (0.0 = deterministic, 1.0 = creative).

        Returns:
            str: The generated text response.

        Raises:
            RuntimeError: If the Ollama server returns an error or is unreachable.
        """
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": 2048,
            }
        }

        try:
            resp = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=120
            )
            resp.raise_for_status()
            return resp.json().get("response", "").strip()
        except requests.exceptions.ConnectionError:
            raise RuntimeError(
                "Ollama server is not running. Start it with: ollama serve"
            )
        except requests.exceptions.Timeout:
            raise RuntimeError(
                "Ollama request timed out. The model may be loading or the prompt too long."
            )
        except Exception as e:
            raise RuntimeError(f"Ollama generation failed: {str(e)}")

    def embed(self, text: str) -> list[float]:
        """
        Generates a vector embedding for the given text.

        Args:
            text (str): The text to embed.

        Returns:
            list[float]: A 768-dimensional embedding vector.

        Raises:
            RuntimeError: If embedding generation fails.
        """
        payload = {
            "model": self.embed_model,
            "input": text,
        }

        try:
            resp = requests.post(
                f"{self.base_url}/api/embed",
                json=payload,
                timeout=30
            )
            resp.raise_for_status()
            data = resp.json()
            # Ollama returns embeddings in the "embeddings" key (list of lists)
            embeddings = data.get("embeddings", [])
            if embeddings and len(embeddings) > 0:
                return embeddings[0]
            # Fallback for older API format
            return data.get("embedding", [])
        except requests.exceptions.ConnectionError:
            raise RuntimeError("Ollama server is not running.")
        except Exception as e:
            raise RuntimeError(f"Ollama embedding failed: {str(e)}")

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Generates embeddings for multiple texts sequentially.

        Args:
            texts (list[str]): List of text strings to embed.

        Returns:
            list[list[float]]: List of embedding vectors.
        """
        return [self.embed(t) for t in texts]


# Singleton instance
ollama_client = OllamaClient()
