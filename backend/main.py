"""Local FastAPI entry point. No model/client creation during import or health checks."""
from uuid import UUID
from fastapi import FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from .service import Service, WorkflowError
from .models import TeacherRequest, JourneyRequest, RecommendationResponse, JourneyResponse, ErrorResponse
from .safety import redact

def create_app(service=None):
    app=FastAPI(title="Whitney Learning Compass",version="0.3.0")
    app.add_middleware(TrustedHostMiddleware,allowed_hosts=["127.0.0.1","localhost","testserver"])
    app.state.service=service or Service()

    @app.middleware("http")
    async def local_safety(request:Request,call_next):
        # Local frontend proxy only; no wildcard CORS or public browser access.
        if request.headers.get("origin") not in (None, "http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:8008", "http://localhost:8008"):
            return JSONResponse({"error":{"code":"origin_not_allowed","message":"Only the configured local browser origins are permitted.","run_id":None}},status_code=403)
        if request.method=="POST":
            body=b""
            async for chunk in request.stream():
                body+=chunk
                if len(body)>12000:
                    return JSONResponse({"error":{"code":"input_too_large","message":"Request body exceeds 12000 bytes.","run_id":None}},status_code=413)
            request._body=body
        return await call_next(request)

    @app.exception_handler(RequestValidationError)
    async def invalid_input(request,exc):
        return JSONResponse({"error":{"code":"invalid_input","message":"Invalid request fields or values. Use class-level needs and the documented schema.","run_id":None}},status_code=422)

    @app.exception_handler(WorkflowError)
    async def workflow_error(request,exc):
        return JSONResponse({"error":{"code":exc.code,"message":exc.message,"run_id":exc.run_id}},status_code=exc.status)

    @app.exception_handler(Exception)
    async def internal_error(request,exc):
        return JSONResponse({"error":{"code":"internal_error","message":"The request could not complete safely.","run_id":None}},status_code=500)

    @app.get("/api/health")
    def health():
        return {"status":"ok","stage":3,"model":"gpt-6-luna","booking_supported":False}

    @app.get("/api/programs")
    def programs():
        return app.state.service._catalog()

    errors={422:{"model":ErrorResponse},502:{"model":ErrorResponse},503:{"model":ErrorResponse},504:{"model":ErrorResponse}}
    @app.post("/api/recommend",response_model=RecommendationResponse,responses=errors)
    async def recommend(teacher:TeacherRequest):
        result=await app.state.service.recommend(teacher)
        # Keep the workflow capability token; sanitize generated text before HTTP exposure.
        body=result.model_dump(mode="json");token=body.pop("workflow_token")
        return {**redact(body),"workflow_token":token}

    @app.post("/api/journey",response_model=JourneyResponse,responses=errors)
    async def journey(selection:JourneyRequest,x_workflow_token:str|None=Header(default=None)):
        result=await app.state.service.journey(selection,x_workflow_token)
        return redact(result.model_dump(mode="json"))

    @app.get("/api/runs/{run_id}")
    def run_record(run_id:UUID,x_workflow_token:str|None=Header(default=None)):
        return app.state.service.run_record(str(run_id),x_workflow_token)

    return app

app=create_app()

