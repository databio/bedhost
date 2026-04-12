"""
Compliance test suite for Bedhost API.

Tests can be run against any deployed bedhost instance:

    # Test local development server
    pytest tests/api/ -v

    # Test staging
    pytest tests/api/ -v --api_root=https://staging.bedbase.org

    # Test production
    pytest tests/api/ -v --api_root=https://api.bedbase.org
"""

import pytest
import requests

from tests.conftest import REQ_SERVICE_MARK


@pytest.mark.require_service
class TestServiceInfo:
    """Test service info and metadata endpoints."""

    def test_service_info_returns_200(self, api_root):
        """Service info endpoint should return 200."""
        res = requests.get(f"{api_root}/v1/service-info")
        assert res.status_code == 200

    def test_service_info_has_required_fields(self, api_root):
        """Service info should contain required GA4GH fields."""
        res = requests.get(f"{api_root}/v1/service-info")
        data = res.json()
        assert "id" in data
        assert "name" in data
        assert "version" in data
        assert "type" in data

    def test_root_redirects(self, api_root):
        """Root endpoint should redirect to v1."""
        res = requests.get(f"{api_root}/", allow_redirects=False)
        assert res.status_code in [307, 308]


@pytest.mark.require_service
class TestStatsEndpoints:
    """Test statistics endpoints."""

    def test_stats_returns_200(self, api_root):
        """Stats endpoint should return 200."""
        res = requests.get(f"{api_root}/v1/stats")
        assert res.status_code == 200

    def test_stats_has_counts(self, api_root):
        """Stats should include bed and bedset counts."""
        res = requests.get(f"{api_root}/v1/stats")
        data = res.json()
        assert "bedfiles_number" in data
        assert "bedsets_number" in data
        assert "genomes_number" in data

    def test_detailed_stats_returns_200(self, api_root):
        """Detailed stats endpoint should return 200."""
        res = requests.get(f"{api_root}/v1/detailed-stats")
        assert res.status_code == 200

    def test_genomes_returns_list(self, api_root):
        """Genomes endpoint should return a list."""
        res = requests.get(f"{api_root}/v1/genomes")
        assert res.status_code == 200
        data = res.json()
        assert "results" in data
        assert "count" in data
        assert isinstance(data["results"], list)

    def test_assays_returns_list(self, api_root):
        """Assays endpoint should return a list."""
        res = requests.get(f"{api_root}/v1/assays")
        assert res.status_code == 200
        data = res.json()
        assert "results" in data
        assert isinstance(data["results"], list)


@pytest.mark.require_service
class TestBedListEndpoints:
    """Test BED listing endpoints."""

    def test_bed_list_returns_200(self, api_root):
        """BED list endpoint should return 200."""
        res = requests.get(f"{api_root}/v1/bed/list")
        assert res.status_code == 200

    def test_bed_list_has_pagination(self, api_root):
        """BED list should include pagination fields."""
        res = requests.get(f"{api_root}/v1/bed/list")
        data = res.json()
        assert "results" in data
        assert "count" in data
        assert "limit" in data
        assert "offset" in data

    def test_bed_list_respects_limit(self, api_root):
        """BED list should respect limit parameter."""
        res = requests.get(f"{api_root}/v1/bed/list?limit=5")
        data = res.json()
        assert len(data["results"]) <= 5

    def test_bed_list_filters_by_genome(self, api_root):
        """BED list should filter by genome."""
        res = requests.get(f"{api_root}/v1/bed/list?genome=hg38&limit=10")
        assert res.status_code == 200
        # If results exist, they should all be hg38
        data = res.json()
        for bed in data["results"]:
            if "genome_alias" in bed:
                assert bed["genome_alias"] == "hg38"


@pytest.mark.require_service
class TestBedExampleEndpoint:
    """Test BED example endpoint."""

    def test_bed_example_returns_200(self, api_root):
        """BED example endpoint should return 200."""
        res = requests.get(f"{api_root}/v1/bed/example")
        assert res.status_code == 200

    def test_bed_example_has_id(self, api_root):
        """BED example should return a record with an ID."""
        res = requests.get(f"{api_root}/v1/bed/example")
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
        res = requests.get(f"{api_root}/v1/bed/{example_bed_id}/metadata")
        assert res.status_code == 200

    def test_bed_metadata_has_required_fields(self, api_root, example_bed_id):
        """BED metadata should contain required fields."""
        if not example_bed_id:
            pytest.skip("No example BED ID available")
        res = requests.get(f"{api_root}/v1/bed/{example_bed_id}/metadata")
        data = res.json()
        assert "id" in data
        assert data["id"] == example_bed_id

    def test_bed_metadata_not_found(self, api_root):
        """BED metadata should return 404 for invalid ID."""
        fake_id = "00000000000000000000000000000000"
        res = requests.get(f"{api_root}/v1/bed/{fake_id}/metadata")
        assert res.status_code == 404

    def test_bed_stats_returns_200(self, api_root, example_bed_id):
        """BED stats endpoint should return 200."""
        if not example_bed_id:
            pytest.skip("No example BED ID available")
        res = requests.get(f"{api_root}/v1/bed/{example_bed_id}/metadata/stats")
        assert res.status_code == 200

    def test_bed_plots_returns_200_or_404(self, api_root, example_bed_id):
        """BED plots endpoint should return 200 or 404 (if no plots)."""
        if not example_bed_id:
            pytest.skip("No example BED ID available")
        res = requests.get(f"{api_root}/v1/bed/{example_bed_id}/metadata/plots")
        assert res.status_code in [200, 404]

    def test_bed_files_returns_200(self, api_root, example_bed_id):
        """BED files endpoint should return 200."""
        if not example_bed_id:
            pytest.skip("No example BED ID available")
        res = requests.get(f"{api_root}/v1/bed/{example_bed_id}/metadata/files")
        assert res.status_code == 200

    def test_bed_classification_returns_200(self, api_root, example_bed_id):
        """BED classification endpoint should return 200."""
        if not example_bed_id:
            pytest.skip("No example BED ID available")
        res = requests.get(f"{api_root}/v1/bed/{example_bed_id}/metadata/classification")
        assert res.status_code == 200


@pytest.mark.require_service
class TestBedSearchEndpoints:
    """Test BED search endpoints."""

    def test_text_search_returns_200(self, api_root):
        """Text search endpoint should return 200."""
        res = requests.get(f"{api_root}/v1/bed/search/text?query=cancer")
        assert res.status_code == 200

    def test_text_search_has_results_structure(self, api_root):
        """Text search should return proper result structure."""
        res = requests.get(f"{api_root}/v1/bed/search/text?query=cancer")
        data = res.json()
        assert "results" in data
        assert "count" in data

    def test_exact_search_returns_200(self, api_root):
        """Exact search endpoint should return 200."""
        res = requests.get(f"{api_root}/v1/bed/search/exact?query=test")
        assert res.status_code == 200


@pytest.mark.require_service
class TestBedsetListEndpoints:
    """Test BEDSET listing endpoints."""

    def test_bedset_list_returns_200(self, api_root):
        """BEDSET list endpoint should return 200."""
        res = requests.get(f"{api_root}/v1/bedset/list")
        assert res.status_code == 200

    def test_bedset_list_has_pagination(self, api_root):
        """BEDSET list should include pagination fields."""
        res = requests.get(f"{api_root}/v1/bedset/list")
        data = res.json()
        assert "results" in data
        assert "count" in data


@pytest.mark.require_service
class TestBedsetExampleEndpoint:
    """Test BEDSET example endpoint."""

    def test_bedset_example_returns_200(self, api_root):
        """BEDSET example endpoint should return 200."""
        res = requests.get(f"{api_root}/v1/bedset/example")
        assert res.status_code == 200

    def test_bedset_example_has_id(self, api_root):
        """BEDSET example should return a record with an ID."""
        res = requests.get(f"{api_root}/v1/bedset/example")
        data = res.json()
        assert "id" in data


@pytest.mark.require_service
class TestBedsetMetadataEndpoints:
    """Test BEDSET metadata endpoints."""

    def test_bedset_metadata_returns_200(self, api_root, example_bedset_id):
        """BEDSET metadata endpoint should return 200 for valid ID."""
        if not example_bedset_id:
            pytest.skip("No example BEDSET ID available")
        res = requests.get(f"{api_root}/v1/bedset/{example_bedset_id}/metadata")
        assert res.status_code == 200

    def test_bedset_metadata_not_found(self, api_root):
        """BEDSET metadata should return 404 for invalid ID."""
        fake_id = "00000000000000000000000000000000"
        res = requests.get(f"{api_root}/v1/bedset/{fake_id}/metadata")
        assert res.status_code == 404

    def test_bedset_bedfiles_returns_200(self, api_root, example_bedset_id):
        """BEDSET bedfiles endpoint should return 200."""
        if not example_bedset_id:
            pytest.skip("No example BEDSET ID available")
        res = requests.get(f"{api_root}/v1/bedset/{example_bedset_id}/bedfiles")
        assert res.status_code == 200

    def test_bedset_stats_returns_200(self, api_root, example_bedset_id):
        """BEDSET stats endpoint should return 200."""
        if not example_bedset_id:
            pytest.skip("No example BEDSET ID available")
        res = requests.get(f"{api_root}/v1/bedset/{example_bedset_id}/metadata/stats")
        assert res.status_code == 200


@pytest.mark.require_service
class TestOpenAPIDocumentation:
    """Test API documentation endpoints."""

    def test_docs_available(self, api_root):
        """OpenAPI docs should be available."""
        res = requests.get(f"{api_root}/v1/docs")
        assert res.status_code == 200

    def test_openapi_json_available(self, api_root):
        """OpenAPI JSON schema should be available."""
        res = requests.get(f"{api_root}/openapi.json")
        assert res.status_code == 200
        data = res.json()
        assert "openapi" in data
        assert "paths" in data
