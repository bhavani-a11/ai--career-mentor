
print("Testing imports...")

try:
    from contextlib import asynccontextmanager
    print("OK: contextlib imported")
except Exception as e:
    print(f"ERROR: contextlib failed: {e}")

try:
    from fastapi import FastAPI
    print("OK: FastAPI imported")
except Exception as e:
    print(f"ERROR: FastAPI failed: {e}")

try:
    from fastapi.middleware.cors import CORSMiddleware
    print("OK: CORSMiddleware imported")
except Exception as e:
    print(f"ERROR: CORSMiddleware failed: {e}")

try:
    from app.config import settings
    print("OK: app.config imported")
except Exception as e:
    print(f"ERROR: app.config failed: {e}")
    import traceback
    traceback.print_exc()

try:
    from app.routes import api_router
    print("OK: app.routes imported")
except Exception as e:
    print(f"ERROR: app.routes failed: {e}")
    import traceback
    traceback.print_exc()

print("\nAll imports done!")
