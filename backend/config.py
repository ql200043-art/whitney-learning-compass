"""Fixed course gateway; no provider or model fallback."""
import os
from pathlib import Path
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[1]
MODEL = "gpt-6-luna"
GATEWAY = "https://api.portkey.ai/v1"
MAX_REQUESTS = 4
MAX_TOOLS = 6
MAX_TOOL_BYTES = 24000
MAX_CONTEXT_BYTES = 70000
RUN_TIMEOUT = 90
HTTP_TIMEOUT = 30
MAX_OUTPUT_TOKENS = 2400

class ConfigurationError(RuntimeError):
    pass

def load_environment(root=ROOT, environ=None):
    env = os.environ if environ is None else environ
    for path in (root / ".env", root.parent / ".env"):
        if path.is_file():
            for key, value in dotenv_values(path, interpolate=False).items():
                if key in {"PORTKEY_API_KEY", "PORTKEY_VIRTUAL_KEY"} and key not in env and value is not None:
                    env[key] = value
    return env

def credentials(root=ROOT, environ=None):
    env = load_environment(root, environ)
    key = env.get("PORTKEY_API_KEY", "").strip()
    if not key or key in {"replace-with-course-key", "your-course-key"}:
        raise ConfigurationError("Set PORTKEY_API_KEY in the process environment, project .env, or parent .env; never send the key in chat.")
    return key, env.get("PORTKEY_VIRTUAL_KEY", "").strip()

