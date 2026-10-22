"""Mock HTTP transport checks; these are not live gateway runs."""
import asyncio
import json
import httpx
import pytest
from pydantic_ai import Agent
from backend import gateway
from backend.config import MODEL,GATEWAY
from backend.gateway import course_model,ExecutionLimit,safe_error

def install(monkeypatch,handler):
    original=httpx.AsyncClient
    monkeypatch.setattr(gateway,"credentials",lambda:("test-only-placeholder",""))
    class MockClient(original):
        def __init__(self,**kwargs):
            super().__init__(transport=httpx.MockTransport(handler),**kwargs)
    monkeypatch.setattr(gateway.httpx,"AsyncClient",MockClient)

def response(request,cached=None,model=MODEL):
    usage={"prompt_tokens":7,"completion_tokens":2,"total_tokens":9}
    if cached is not None:usage["prompt_tokens_details"]={"cached_tokens":cached}
    return httpx.Response(200,request=request,json={"id":"test","object":"chat.completion","created":0,"model":model,
        "choices":[{"index":0,"message":{"role":"assistant","content":"ok"},"finish_reason":"stop"}],"usage":usage})

@pytest.mark.parametrize("cached",[None,0,4])
def test_provider_usage_not_invented(monkeypatch,cached):
    seen=[]
    def handler(req):
        seen.append(req)
        return response(req,cached)
    install(monkeypatch,handler);trace={"model_requests":[]}
    async def call():
        async with course_model(trace) as model:
            result=await Agent(model,model_settings={"openai_reasoning_effort":"none"}).run("Connectivity test")
            assert result.output=="ok"
    asyncio.run(call())
    assert len(seen)==1
    assert str(seen[0].url)==GATEWAY+"/chat/completions"
    assert json.loads(seen[0].content)["model"]==MODEL
    assert trace["model_requests"][0]["cached_input_tokens"]==cached
    assert trace["model_requests"][0]["input_tokens"]==7

@pytest.mark.parametrize("status",[400,401,403,429,500])
def test_provider_http_error_redacted_and_no_retry(monkeypatch,status):
    seen=[]
    def handler(req):
        seen.append(req)
        return httpx.Response(status,request=req,json={"error":{"message":"sensitive-provider-detail"}})
    install(monkeypatch,handler);trace={"model_requests":[]}
    async def call():
        async with course_model(trace) as model:
            await Agent(model,model_settings={"openai_reasoning_effort":"none"}).run("test")
    with pytest.raises(Exception) as e:asyncio.run(call())
    code,http_status,message=safe_error(e.value)
    assert code=="provider_unavailable" and http_status==502
    assert "sensitive-provider-detail" not in message
    assert len(seen)==1 and len(trace["model_requests"])==1

def test_reported_other_model_rejected(monkeypatch):
    install(monkeypatch,lambda req:response(req,model="unapproved-model"));trace={"model_requests":[]}
    async def call():
        async with course_model(trace) as model:
            await Agent(model,model_settings={"openai_reasoning_effort":"none"}).run("test")
    with pytest.raises(Exception) as e:asyncio.run(call())
    # SDK may wrap event-hook failures; the response is still never accepted.
    assert trace["model_requests"][0]["reported_model"]=="unapproved-model"

@pytest.mark.parametrize("mode",["count","size","reasoning"])
def test_transport_limits_prevent_network(monkeypatch,mode):
    seen=[]
    install(monkeypatch,lambda req:seen.append(req) or response(req))
    trace={"model_requests":[{}]*4 if mode=="count" else []}
    async def call():
        async with course_model(trace) as model:
            await Agent(model,model_settings={"openai_reasoning_effort":"low" if mode=="reasoning" else "none"}).run("x"*71000 if mode=="size" else "test")
    with pytest.raises(Exception):asyncio.run(call())
    assert not seen

