from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.generate import router as generate_router
from routers.health import router as health_router

# Instantiate the FastAPI app with basic metadata that shows up in docs.
app = FastAPI(title="PromptGenie API", version="1.0")

# Allow requests from the frontend (currently permissive for development).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # TODO: lock this down to the deployed frontend URL in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expose prompt-generation endpoints under the /api prefix.
app.include_router(generate_router, prefix="/api")
app.include_router(health_router, prefix="/api")

@app.get("/")
def home():
    """Health endpoint so deployments can verify the service is running."""
    return {"message": "PromptGenie backend running"}
