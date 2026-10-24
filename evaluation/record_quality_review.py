"""Record the assistant's manual inspection ratings; not an automated or educator score."""
import json
from pathlib import Path
from backend.gateway import timestamp
OUT=Path(__file__).resolve().parents[1]/'artifacts/stage5'
def main():
    reviews=[]
    specifications=[
      ('A01-full-advisor',4,3,3,1,'Catapult explanation substitutes a marble for the supplied ping-pong ball. The other choices connect to motion/design, but this factual/safety-relevant error passed the prose validator.'),
      ('A01-shortlist-advisor',4,5,4,0,'Distinct force, banked-curve and adjustable-vane explanations. Wind Power is a plausible but broader energy/mechanics option; choices differ from Full, which offered Simple Machines.'),
      ('A02-full-advisor',5,5,3,0,'Directly links vane settings, gearing and lifting weight to wind energy. Only one option; no explicit comparison with Solar Sunflower, which remains eligible.'),
      ('A02-shortlist-advisor',5,5,3,0,'Specific wind-energy reasoning, similarly one option. No comparative advantage established.'),
      ('A03-full-advisor',5,4,3,0,'Tangram pattern rearrangement fits Grade 2 geometry. Clear spatial reasoning; single option means limited comparison.'),
      ('A03-shortlist-advisor',5,4,3,0,'Specific geometry/pattern explanation. Similar useful content to Full, but one run cannot establish equivalence.')]
    for name,a,s,c,errors,note in specifications:
        reviews.append({'artifact':'artifacts/stage5/'+name+'.json','alignment_1_5':a,'specificity_1_5':s,'comparison_clarity_1_5':c,
          'prose_factual_accuracy':'fail' if errors else 'no_error_identified_in_manual_review','identified_unsupported_fact_count':errors,
          'required_structured_uncertainty_omissions':0,'rationale':note})
    history=[
      {'artifact':'artifacts/agent_runs/case-a-advisor.json','alignment_1_5':5,'specificity_1_5':4,'comparison_clarity_1_5':4,'identified_unsupported_fact_count':0,'note':'Three distinct mechanisms connect to force/motion. Reasoning useful but explicit tradeoff summary limited.'},
      {'artifact':'artifacts/stage4/browser-live.json#records[0]','alignment_1_5':5,'specificity_1_5':4,'comparison_clarity_1_5':4,'identified_unsupported_fact_count':0,'note':'Catapult, track design and chain-reaction reasoning are source-consistent. No measured educational benefit inferred.'},
      {'artifact':'artifacts/agent_runs/case-c-validated.json','alignment_1_5':5,'specificity_1_5':4,'comparison_clarity_1_5':3,'identified_unsupported_fact_count':0,'note':'Capacity uncertainty is explicit in prose. Missing duration appears in structured eligibility, not the reasoning paragraph; distinguish prose omission from a hidden system warning.'}]
    journeys=[
      {'artifact':'artifacts/agent_runs/case-a-journey.json','status_at_execution':'accepted_historically','age_appropriateness_1_5':4,'workshop_specificity_1_5':5,'phase_coherence_1_5':4,'objective_assessment_alignment_1_5':4,'practicality_1_5':3,'facts_suggestions_separation':'explicit','observation_integrity':'needs_correction','note':'The follow-up asks for a made-up observation labeled as an example. It does not invent an actual completed experiment, but is unnecessary for evidence-based assessment. Later Stage 4 instructions/guard reject this style; historical output is preserved.'},
      {'artifact':'artifacts/stage4/browser-live.json#records[1]','status_at_execution':'accepted','age_appropriateness_1_5':4,'workshop_specificity_1_5':5,'phase_coherence_1_5':5,'objective_assessment_alignment_1_5':5,'practicality_1_5':4,'facts_suggestions_separation':'explicit','observation_integrity':'actual_observations_or_blank_records','note':'Specific band-count/ball-position prompts, staff-directed activity and objective-linked assessment. Long text and several abstract concepts still require teacher adaptation.'},
      {'artifact':'artifacts/stage5/A01-full-designer.json','status_at_execution':'rejected_false_positive','age_appropriateness_1_5':4,'workshop_specificity_1_5':5,'phase_coherence_1_5':5,'objective_assessment_alignment_1_5':5,'practicality_1_5':4,'facts_suggestions_separation':'tool-grounded suggestions; not returned as accepted plan','observation_integrity':'actual_observations_or_blank_records','note':'Good paper-based track/curve inquiry and assessment; some language needs Grade 4 simplification. Validator rejects a prohibition against invented evidence. These ratings assess rejected text, not a delivered workflow.'}]
    data={'reviewed_at':timestamp(),'rater':'AI assistant qualitative audit after inspecting actual saved outputs; not independent educator or participant feedback','rubric':'docs/evaluation_methodology.md','new_advisor_reviews':reviews,'historical_advisor_reviews':history,'journey_reviews':journeys,'human_ratings':None,'limitation':'Small purposive sample, subjective internal rubric, no classroom observation or blinded independent assessment. Zero identified errors does not prove all prose entailed.'}
    (OUT/'quality_review.json').write_text(json.dumps(data,indent=2)+'\n')
if __name__=='__main__':main()
