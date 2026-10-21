import copy
import pytest
from matching.catalog import CatalogError
from matching.coverage import build_coverage, load_themes

def test_grade_theme_evidence_and_distinct_counts(catalog):
    matrix=build_coverage(catalog,load_themes())
    assert len(matrix["cells"])==24
    assert matrix["uncertain_assignments"]==[]
    for c in matrix["cells"]:
        assert c["count"]==len(set(c["program_ids"]))
        assert {e["program_id"] for e in c["entries"]}==set(c["program_ids"])
        assert all(e["grade_evidence"]["url"] and e["theme_evidence"] for e in c["entries"])
    grade2engineering=next(c for c in matrix["cells"] if c["grade"]==2 and c["theme"]=="Engineering")
    assert set(grade2engineering["program_ids"])=={"ewm-simple-machines","ewm-resourceful-schools"}
    grade7=next(c for c in matrix["cells"] if c["grade"]==7 and c["theme"]=="Interdisciplinary Learning")
    assert "ewm-tangrams" in grade7["program_ids"]

def test_uncertain_themes_excluded(catalog):
    themes=load_themes();themes["assignments"][0]["themes"][0]["status"]="uncertain"
    matrix=build_coverage(catalog,themes)
    assert len(matrix["uncertain_assignments"])==1
    cell=next(c for c in matrix["cells"] if c["grade"]==2 and c["theme"]=="Engineering")
    assert cell["program_ids"]==["ewm-resourceful-schools"]

def test_invented_theme_source_rejected(catalog):
    themes=load_themes();themes["assignments"][0]["themes"][0]["evidence"][0]["url"]="https://example.com"
    with pytest.raises(CatalogError):
        build_coverage(catalog,themes)
