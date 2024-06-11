import requests

API_ENDPOINT = "https://api.bedbase.org"


def test_get_bedbase():
    response = requests.get(API_ENDPOINT)
    assert response.status_code == 200


def test_get_example():
    response = requests.get(f"{API_ENDPOINT}/v1/bed/example")
    assert response.status_code == 200
    # assert response.json()


def test_get_bed():
    response = requests.get(
        f"{API_ENDPOINT}/v1/bed/bbad85f21962bb8d972444f7f9a3a932/metadata"
    )

    assert response.status_code == 200
    assert response.json() is not None


def test_get_bedset():
    response = requests.get(f"{API_ENDPOINT}/v1/bedset/example")

    assert response.status_code == 200
    assert response.json() is not None
