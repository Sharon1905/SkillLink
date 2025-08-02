from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Test app working"}

@app.get("/health")
def health():
    return {"status": "healthy"} 