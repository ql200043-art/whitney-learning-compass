"""Opt-in live API demonstrations. A separate journey command records human selection."""
import argparse
import json
from pathlib import Path
import httpx
from backend.config import ROOT
from backend.safety import redact
from backend.gateway import timestamp

BASE="http://127.0.0.1:8008"
NORMAL={"grades":[4],"student_count":24,"learning_goal":"I want my fourth-grade students to understand force, motion, and engineering design through hands-on experiments.",
        "max_program_fee":400,"budget_currency":"USD","assume_usd":True,"max_duration_minutes":90}

def save(label, data):
    folder=ROOT/"artifacts/agent_runs";folder.mkdir(parents=True,exist_ok=True)
    path=folder/(label+".json")
    if path.exists():
        raise RuntimeError("Artifact already exists; use a new label to preserve prior evidence.")
    path.write_text(json.dumps(redact(data),indent=2,ensure_ascii=False)+"\n")
    print("Saved",path.relative_to(ROOT))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("action",choices=["recommend","journey"])
    parser.add_argument("--case",choices=["a","b","c"],default="a")
    parser.add_argument("--label",required=True)
    parser.add_argument("--program-id")
    parser.add_argument("--teacher-selected",action="store_true")
    parser.add_argument("--acknowledge-unknown",action="store_true")
    parser.add_argument("--in-process",action="store_true",help="Real inference through in-process ASGI endpoints; recommendation diagnostics only")
    args=parser.parse_args()
    private=ROOT/".runtime"/("case-"+args.case+".json")
    if (ROOT/"artifacts/agent_runs"/(args.label+".json")).exists():
        raise SystemExit("Choose a fresh label; evidence must not be overwritten.")
    if args.in_process:
        if args.action!="recommend":
            raise SystemExit("In-process diagnostics cannot resume an existing workflow")
        from fastapi.testclient import TestClient
        from backend.main import create_app
        transport_client=TestClient(create_app())
    else:
        transport_client=httpx.Client(base_url=BASE,timeout=100)
    with transport_client as client:
        if args.action=="recommend":
            request=dict(NORMAL)
            if args.case=="b":
                request["max_program_fee"]=200
                request["learning_goal"]="Explore force and motion with a catapult or similar engineering activity."
            if args.case=="c":
                request["mandatory_operational"]={"capacity":True}
                request["learning_goal"]="Explore structural engineering and bridges; verified capacity for the class is mandatory."
            response=client.post("/api/recommend",json=request)
            data=response.json()
            evidence={"timestamp":timestamp(),"execution_kind":"real_portkey","case":args.case,"request":request,
                      "http_status":response.status_code,"response":data}
            if response.is_success:
                private.parent.mkdir(parents=True,exist_ok=True)
                private.write_text(json.dumps({"workflow_id":data["workflow_id"],"workflow_token":data["workflow_token"]}))
                private.chmod(0o600)
                trace=client.get("/api/runs/"+data["run_id"],headers={"X-Workflow-Token":data["workflow_token"]})
                evidence["run_trace"]=trace.json()
                print(json.dumps({"recommendations":[{"id":c["program_id"],"name":c["museum_facts"]["official_name"],"reasoning":c["ai_educational_reasoning"]} for c in data["recommendations"]],
                    "provisional_options":[c["program_id"] for c in data["provisional_options"]],"message":data["message"]},indent=2))
        else:
            if not args.teacher_selected or not args.program_id:
                raise SystemExit("Supply an explicitly teacher-selected --program-id and --teacher-selected; no automatic selection.")
            workflow=json.loads(private.read_text())
            request={"workflow_id":workflow["workflow_id"],"program_id":args.program_id,
                "teacher_selected":True,"acknowledge_unknown":args.acknowledge_unknown}
            headers={"X-Workflow-Token":workflow["workflow_token"]}
            response=client.post("/api/journey",json=request,headers=headers)
            data=response.json()
            evidence={"timestamp":timestamp(),"execution_kind":"real_portkey","case":args.case,
                "human_selection_source":"Explicit user selection followed by separate CLI request.",
                "request":request,"http_status":response.status_code,"response":data}
            if response.is_success:
                evidence["run_trace"]=client.get("/api/runs/"+data["run_id"],headers=headers).json()
                print(json.dumps({"program_id":data["program_id"],"plan_id":data["plan_id"],"provisional":data["provisional"]}))
        if not response.is_success:
            print(json.dumps(data))
            run_id=data.get("error",{}).get("run_id")
            if run_id:
                path=ROOT/".runtime/runs"/(run_id+".json")
                if path.exists():
                    evidence["run_trace"]=json.loads(path.read_text())
        save(args.label,evidence)
        raise SystemExit(0 if response.is_success else 1)

if __name__=="__main__":
    main()

