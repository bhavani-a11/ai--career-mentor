
import uvicorn

if __name__ == "__main__":
    print("Starting FastAPI server...")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8002,
        log_level="info",
        reload=True
    )
