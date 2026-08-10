"""
Compliance test suite for Bedhost API.

Tests are invoked against a client object exposed by the ``api_root``
fixture (see ``tests/conftest.py``). The same test bodies run in two modes:

* Black-box mode (default):

      pytest tests/api/ -v
      pytest tests/api/ -v --api_root=https://staging.bedbase.org
      pytest tests/api/ -v --api_root=https://api.bedbase.org

* Integration mode (ephemeral Postgres + Qdrant + in-process TestClient):

      ./tests/scripts/test-integration.sh
"""

import pytest


@pytest.mark.require_service
class TestServiceInfo:
    """Test service info and metadata endpoints."""

    def test_service_info_returns_200(self, api_root):
        """Service info endpoint should return 200."""
        res = api_root.get("/v1/service-info")
        assert res.status_code == 200

    def test_service_info_has_required_fields(self, api_root):
        """Service info should contain required GA4GH fields."""
        res = api_root.get("/v1/service-info")
        data = res.json()
        assert "id" in data
        assert "name" in data
        assert "version" in data
        assert "type" in data

    def test_root_redirects(self, api_root):
        """Root endpoint should redirect to v1."""
        res = api_root.get("/", allow_redirects=False)
        assert res.status_code in [307, 308]


@pytest.mark.require_service
class TestStatsEndpoints:
    """Test statistics endpoints."""

    def test_stats_returns_200(self, api_root):
        """Stats endpoint should return 200."""
        res = api_root.get("/v1/stats")
        assert res.status_code == 200

    def test_stats_has_counts(self, api_root):
        """Stats should include bed and bedset counts."""
        res = api_root.get("/v1/stats")
        data = res.json()
        assert "bedfiles_number" in data
        assert "bedsets_number" in data
        assert "genomes_number" in data

    def test_detailed_stats_returns_200(self, api_root):
        """Detailed stats endpoint should return 200."""
        res = api_root.get("/v1/detailed-stats")
        assert res.status_code == 200

    def test_genomes_returns_list(self, api_root):
        """Genomes endpoint should return a list."""
        res = api_root.get("/v1/genomes")
        assert res.status_code == 200
        data = res.json()
        assert "results" in data
        assert "count" in data
        assert isinstance(data["results"], list)

    def test_assays_returns_list(self, api_root):
        """Assays endpoint should return a list."""
        res = api_root.get("/v1/assays")
        assert res.status_code == 200
        data = res.json()
        assert "results" in data
        assert isinstance(data["results"], list)


@pytest.mark.require_service
class TestBedListEndpoints:
    """Test BED listing endpoints."""

    def test_bed_list_returns_200(self, api_root):
        """BED list endpoint should return 200."""
        res = api_root.get("/v1/bed/list")
        assert res.status_code == 200

    def test_bed_list_has_pagination(self, api_root):
        """BED list should include pagination fields."""
        res = api_root.get("/v1/bed/list")
        data = res.json()
        assert "results" in data
        assert "count" in data
        assert "limit" in data
        assert "offset" in data

    def test_bed_list_respects_limit(self, api_root):
        """BED list should respect limit parameter."""
        res = api_root.get("/v1/bed/list?limit=5")
        data = res.json()
        assert len(data["results"]) <= 5

    def test_bed_list_filters_by_genome(self, api_root):
        """BED list should filter by genome."""
        res = api_root.get("/v1/bed/list?genome=hg38&limit=10")
        assert res.status_code == 200
        # If results exist, they should all be hg38
        data = res.json()
        for bed in data["results"]:
            if "genome_alias" in bed:
                assert bed["genome_alias"] == "hg38"


@pytest.mark.require_service
class TestBedExampleEndpoint:
    """Test BED example endpoint."""

    def test_bed_example_returns_200(self, api_root, example_bed_id):
        """BED example endpoint should return 200 when records exist.

        On an empty DB the endpoint returns 404; skip rather than fail so
        this test is meaningful against both seeded and empty instances.
        """
        if not example_bed_id:
            pytest.skip("No example BED record available (empty DB)")
        res = api_root.get("/v1/bed/example")
        assert res.status_code == 200

    def test_bed_example_has_id(self, api_root, example_bed_id):
        """BED example should return a record with an ID."""
        if not example_bed_id:
            pytest.skip("No example BED record available (empty DB)")
        res = api_root.get("/v1/bed/example")
        data = res.json()
        assert "id" in data
        assert len(data["id"]) == 32  # MD5 hash length


@pytest.mark.require_service
class TestBedMetadataEndpoints:
    """Test BED metadata endpoints."""

    def test_bed_metadata_returns_200(self, api_root, example_bed_id):
        """BED metadata endpoint should return 200 for valid ID."""
        if not example_bed_id:
            pytest.skip("No example BED ID available")
        res = api_root.get(f"/v1/bed/{example_bed_id}/metadata")
        assert res.status_code == 200

    def test_bed_metadata_has_required_fields(self, api_root, example_bed_id):
        """BED metadata should contain required fields."""
        if not example_bed_id:
            pytest.skip("No example BED ID available")
        res = api_root.get(f"/v1/bed/{example_bed_id}/metadata")
        data = res.json()
        assert "id" in data
        assert data["id"] == example_bed_id

    def test_bed_metadata_not_found(self, api_root):
        """BED metadata should return 404 for invalid ID."""
        fake_id = "00000000000000000000000000000000"
        res = api_root.get(f"/v1/bed/{fake_id}/metadata")
        assert res.status_code == 404

    def test_bed_stats_returns_200(self, api_root, example_bed_id):
        """BED stats endpoint should return 200."""
        if not example_bed_id:
            pytest.skip("No example BED ID available")
        res = api_root.get(f"/v1/bed/{example_bed_id}/metadata/stats")
        assert res.status_code == 200

    def test_bed_plots_returns_200_or_404(self, api_root, example_bed_id):
        """BED plots endpoint should return 200 or 404 (if no plots)."""
        if not example_bed_id:
            pytest.skip("No example BED ID available")
        res = api_root.get(f"/v1/bed/{example_bed_id}/metadata/plots")
        assert res.status_code in [200, 404]

    def test_bed_files_returns_200(self, api_root, example_bed_id):
        """BED files endpoint should return 200."""
        if not example_bed_id:
            pytest.skip("No example BED ID available")
        res = api_root.get(f"/v1/bed/{example_bed_id}/metadata/files")
        assert res.status_code == 200

    def test_bed_classification_returns_200(self, api_root, example_bed_id):
        """BED classification endpoint should return 200."""
        if not example_bed_id:
            pytest.skip("No example BED ID available")
        res = api_root.get(f"/v1/bed/{example_bed_id}/metadata/classification")
        assert res.status_code == 200


@pytest.mark.require_service
class TestBedSearchEndpoints:
    """Test BED search endpoints."""

    def test_text_search_returns_200(self, api_root):
        """Text search endpoint should return 200 (or 503 when ML is disabled)."""
        res = api_root.get("/v1/bed/search/text?query=cancer")
        # 503 when BEDHOST_INIT_ML=false; 200 against a fully-initialized server.
        assert res.status_code in [200, 503]

    def test_text_search_has_results_structure(self, api_root):
        """Text search should return proper result structure when available."""
        res = api_root.get("/v1/bed/search/text?query=cancer")
        if res.status_code == 503:
            pytest.skip("Text search unavailable (ML models disabled)")
        data = res.json()
        assert "results" in data
        assert "count" in data

    def test_exact_search_returns_200(self, api_root):
        """Exact search endpoint should return 200."""
        res = api_root.get("/v1/bed/search/exact?query=test")
        assert res.status_code == 200


@pytest.mark.require_service
class TestBedsetListEndpoints:
    """Test BEDSET listing endpoints."""

    def test_bedset_list_returns_200(self, api_root):
        """BEDSET list endpoint should return 200."""
        res = api_root.get("/v1/bedset/list")
        assert res.status_code == 200

    def test_bedset_list_has_pagination(self, api_root):
        """BEDSET list should include pagination fields."""
        res = api_root.get("/v1/bedset/list")
        data = res.json()
        assert "results" in data
        assert "count" in data


@pytest.mark.require_service
class TestBedsetExampleEndpoint:
    """Test BEDSET example endpoint."""

    def test_bedset_example_returns_200(self, api_root, example_bedset_id):
        """BEDSET example endpoint should return 200 when records exist."""
        if not example_bedset_id:
            pytest.skip("No example BEDSET record available (empty DB)")
        res = api_root.get("/v1/bedset/example")
        assert res.status_code == 200

    def test_bedset_example_has_id(self, api_root, example_bedset_id):
        """BEDSET example should return a record with an ID."""
        if not example_bedset_id:
            pytest.skip("No example BEDSET record available (empty DB)")
        res = api_root.get("/v1/bedset/example")
        data = res.json()
        assert "id" in data


@pytest.mark.require_service
class TestBedsetMetadataEndpoints:
    """Test BEDSET metadata endpoints."""

    def test_bedset_metadata_returns_200(self, api_root, example_bedset_id):
        """BEDSET metadata endpoint should return 200 for valid ID."""
        if not example_bedset_id:
            pytest.skip("No example BEDSET ID available")
        res = api_root.get(f"/v1/bedset/{example_bedset_id}/metadata")
        assert res.status_code == 200

    def test_bedset_metadata_not_found(self, api_root):
        """BEDSET metadata should return 404 for invalid ID."""
        fake_id = "00000000000000000000000000000000"
        res = api_root.get(f"/v1/bedset/{fake_id}/metadata")
        assert res.status_code == 404

    def test_bedset_bedfiles_returns_200(self, api_root, example_bedset_id):
        """BEDSET bedfiles endpoint should return 200."""
        if not example_bedset_id:
            pytest.skip("No example BEDSET ID available")
        res = api_root.get(f"/v1/bedset/{example_bedset_id}/bedfiles")
        assert res.status_code == 200

    def test_bedset_stats_returns_200(self, api_root, example_bedset_id):
        """BEDSET stats endpoint should return 200."""
        if not example_bedset_id:
            pytest.skip("No example BEDSET ID available")
        res = api_root.get(f"/v1/bedset/{example_bedset_id}/metadata/stats")
        assert res.status_code == 200


@pytest.mark.require_service
class TestOpenAPIDocumentation:
    """Test API documentation endpoints."""

    def test_docs_available(self, api_root):
        """OpenAPI docs should be available."""
        res = api_root.get("/v1/docs")
        assert res.status_code == 200

    def test_openapi_json_available(self, api_root):
        """OpenAPI JSON schema should be available at /v1/openapi.json."""
        res = api_root.get("/v1/openapi.json")
        assert res.status_code == 200
        data = res.json()
        assert "openapi" in data
        assert "paths" in data


@pytest.mark.require_service
class TestMarkdownAndSchemaPages:
    """Regression tests for pages that broke under Starlette 1.0."""

    def test_v1_landing_page_returns_200(self, api_root):
        """GET /v1 (markdown landing page via TemplateResponse) must return 200."""
        res = api_root.get("/v1", timeout=3, allow_redirects=True)
        assert res.status_code == 200
        assert "text/html" in res.headers.get("content-type", "").lower()
        # Body should be non-empty rendered HTML, not an error page
        assert len(res.text) > 100

    def test_v1_openapi_json_returns_200(self, api_root):
        """GET /v1/openapi.json must return valid OpenAPI JSON within a strict timeout."""
        res = api_root.get("/v1/openapi.json", timeout=3)
        assert res.status_code == 200
        data = res.json()
        assert "openapi" in data
        assert "paths" in data

    def test_v1_changelog_returns_200_or_404(self, api_root):
        """GET /v1/docs/changelog must render (200) or gracefully 404.

        The docs/changelog.md source was removed from the repo in 2024 but
        the route is still registered. When the file is present (prod), the
        page renders as HTML. When it isn't (local dev / CI), the route
        returns 404 instead of the previous 500.
        """
        res = api_root.get("/v1/docs/changelog", timeout=3, allow_redirects=True)
        assert res.status_code in [200, 404]
        if res.status_code == 200:
            assert "text/html" in res.headers.get("content-type", "").lower()
