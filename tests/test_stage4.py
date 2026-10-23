"""Offline Stage 4 compatibility and scientific-integrity regression checks."""
import pytest
from fastapi.testclient import TestClient
from backend.main import create_app
from backend.models import JourneyDraft
from backend.safety import OutputRejected
from backend.validation import validate_journey
from matching import load_catalog
from test_backend import journey_output, service, factory, teacher

@pytest.mark.parametrize('origin',['http://127.0.0.1:5173','http://localhost:5173','http://127.0.0.1:8008','http://localhost:8008'])
def test_exact_local_browser_origins(origin):
    with TestClient(create_app(service(model_factory=factory()))) as client:
        r=client.post('/api/recommend',headers={'Origin':origin},json=teacher().model_dump())
        assert r.status_code==200
        assert r.json()['recommendations'][0]['eligibility']['program_fee']['subtotal']=='336.00'
        assert 'access-control-allow-origin' not in r.headers

@pytest.mark.parametrize('origin',['null','https://untrusted.example','http://127.0.0.1:5173.evil.test','http://localhost:9999'])
def test_other_origins_rejected(origin):
    with TestClient(create_app(service(model_factory=factory()))) as client:
        r=client.post('/api/recommend',headers={'Origin':origin},json=teacher().model_dump())
        assert r.status_code==403

@pytest.mark.parametrize('text',[
    'Add a made-up observation clearly labeled as an example.',
    'Invent some results to illustrate your idea.',
    'Use fabricated measurements on your diagram.',
    'Record hypothetical observations as your evidence.',
    'Simulate results to complete the assessment.',
    'Do not change the equipment. Add invented results to the worksheet.',
])
def test_invented_empirical_evidence_rejected(text):
    data=journey_output();data['after']['follow_up_activity']=text
    program=next(p for p in load_catalog()['programs'] if p['id']=='ewm-catapult')
    with pytest.raises(OutputRejected,match='Invented empirical evidence'):
        validate_journey(JourneyDraft.model_validate(data),program,['get_selected_program'])

@pytest.mark.parametrize('text',[
    'Label your hypothetical prediction. Leave the observation column blank until the visit.',
    'Compare your prediction with an actual observation collected under staff guidance.',
    'Draw a blank observation template to complete after collecting evidence.',
    'If no observation record is available, leave a blank table; do not supply invented results.',
    'Never invent observations. Keep the evidence record blank until the visit.',
])
def test_predictions_and_actual_observations_allowed(text):
    data=journey_output();data['after']['follow_up_activity']=text
    program=next(p for p in load_catalog()['programs'] if p['id']=='ewm-catapult')
    assert validate_journey(JourneyDraft.model_validate(data),program,['get_selected_program'])
