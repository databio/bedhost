"""Tests for bedhost.core.search_bed, the BED text search shared by REST and MCP."""

import pytest
from bbconf.models.bed_models import BedMetadataBasic, StandardMeta

from bedhost.core import MLUnavailable, SearchKind, search_bed
from tests.fakes import GSM_WITH_HITS, VALID_BED_ID, FakeAgent


# --- exact BED id ------------------------------------------------------------ #
def test_exact_id_returns_file_then_neighbours():
    out = search_bed(FakeAgent(), VALID_BED_ID, limit=3)
    assert out.kind is SearchKind.EXACT_ID
    ids = [r.id for r in out.result.results]
    assert ids[0] == VALID_BED_ID
    assert out.result.results[0].score == 1.0
    assert len(ids) == 3  # the file takes one slot of the page


def test_exact_id_later_page_is_neighbours_shifted_by_one():
    agent = FakeAgent()
    first = search_bed(agent, VALID_BED_ID, limit=3, offset=0).result.results
    second = search_bed(agent, VALID_BED_ID, limit=3, offset=3).result.results
    assert VALID_BED_ID not in [r.id for r in second]
    # page 1 held neighbours 0-1, so page 2 starts at neighbour 2: no gap, no repeat
    assert second[0].id == agent.bed.rows[2].id
    assert {r.id for r in first}.isdisjoint({r.id for r in second})


def test_exact_id_without_neighbours_returns_just_the_file():
    agent = FakeAgent()
    agent.bed.neighbours_empty = True
    out = search_bed(agent, VALID_BED_ID)
    assert out.kind is SearchKind.EXACT_ID
    assert [r.id for r in out.result.results] == [VALID_BED_ID]


@pytest.mark.parametrize(
    "limit, offset, setup, rows, count",
    [
        (1, 0, None, 1, 5),  # just the file; count still the neighbour count
        (3, 10, None, 0, 5),  # past the last neighbour: empty, same count
        (3, 0, "neighbours_fail", 1, 1),  # lookup failed: just the file
    ],
)
def test_exact_id_count_does_not_depend_on_the_page(limit, offset, setup, rows, count):
    # FakeAgent ranks 5 neighbours and reports a catalog of 5, like bbconf.
    agent = FakeAgent()
    if setup:
        setattr(agent.bed, setup, True)
    res = search_bed(agent, VALID_BED_ID, limit=limit, offset=offset).result
    assert (len(res.results), res.count) == (rows, count)


def test_exact_id_count_is_1_without_vector_index():
    res = search_bed(FakeAgent(ml=False), VALID_BED_ID, limit=1).result
    assert (len(res.results), res.count) == (1, 1)


def test_exact_id_works_with_ml_off():
    out = search_bed(FakeAgent(ml=False), VALID_BED_ID)
    assert out.kind is SearchKind.EXACT_ID
    assert [r.id for r in out.result.results] == [VALID_BED_ID]


def test_unknown_32_char_query_falls_through_to_semantic():
    out = search_bed(FakeAgent(), "b" * 32)
    assert out.kind is SearchKind.SEMANTIC


def test_unknown_32_char_query_with_ml_off_raises():
    with pytest.raises(MLUnavailable):
        search_bed(FakeAgent(ml=False), "b" * 32)


# --- GEO/ENCODE accession ------------------------------------------------------ #
def test_accession_hits_are_returned_and_paged():
    out = search_bed(FakeAgent(), GSM_WITH_HITS.upper(), limit=2)
    assert out.kind is SearchKind.ACCESSION
    assert out.result.count == 3
    assert len(out.result.results) == 2
    rest = search_bed(FakeAgent(), GSM_WITH_HITS, limit=2, offset=2).result
    assert len(rest.results) == 1


def _mixed_accession_agent():
    """An accession whose 3 files span two genomes and two assays."""
    agent = FakeAgent()

    def row(i, genome, assay):
        return BedMetadataBasic(
            id=f"{i:032d}",
            name=f"bed{i}",
            genome_alias=genome,
            annotation=StandardMeta(assay=assay),
        )

    agent.bed.external_rows = [
        row(0, "hg38", "ATAC-seq"),
        row(1, "hg19", "ATAC-seq"),
        row(2, "hg38", "ChIP-seq"),
    ]

    def no_semantic(*a, **k):
        raise AssertionError("an accession hit must not fall through to semantic")

    agent.bed.hybrid_search = no_semantic
    return agent


@pytest.mark.parametrize(
    "genome, assay, ids, filtered_out",
    [
        ("hg38", None, [0, 2], 1),
        ("hg38", "ATAC-seq", [0], 2),
        (None, "ChIP-seq", [2], 2),
        ("mm10", None, [], 3),  # nothing left: still an accession answer
    ],
)
def test_accession_applies_genome_and_assay_filters(genome, assay, ids, filtered_out):
    out = search_bed(
        _mixed_accession_agent(), GSM_WITH_HITS, genome=genome, assay=assay
    )
    assert out.kind is SearchKind.ACCESSION
    assert [r.id for r in out.result.results] == [f"{i:032d}" for i in ids]
    assert out.result.count == len(ids)
    assert out.filtered_out == filtered_out


def test_exact_id_ignores_filters():
    out = search_bed(FakeAgent(), VALID_BED_ID, genome="mm10", assay="ChIP-seq")
    assert out.result.results[0].id == VALID_BED_ID


def test_accession_works_with_ml_off():
    out = search_bed(FakeAgent(ml=False), f"geo:{GSM_WITH_HITS}")
    assert out.kind is SearchKind.ACCESSION


def test_accession_with_no_hits_falls_through_to_semantic():
    out = search_bed(FakeAgent(), "GSM999999")
    assert out.kind is SearchKind.SEMANTIC


def test_accession_with_no_hits_and_ml_off_raises():
    with pytest.raises(MLUnavailable):
        search_bed(FakeAgent(ml=False), "ENCFF000AAA")


# --- semantic ------------------------------------------------------------------ #
def test_free_text_is_semantic():
    out = search_bed(FakeAgent(), "liver ATAC", genome="hg38", limit=2)
    assert out.kind is SearchKind.SEMANTIC
    assert len(out.result.results) == 2


def test_free_text_with_ml_off_raises():
    with pytest.raises(MLUnavailable):
        search_bed(FakeAgent(ml=False), "liver ATAC")
