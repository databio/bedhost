from elasticsearch import Elasticsearch
from elasticsearch import helpers
from elasticsearch.serializer import JSONSerializer

# some elasticsearch helper f-ns
def get_elastic_client(host):
    return Elasticsearch([{'host': host}])

# get number of documents in elastic
def get_elastic_doc_num(es_client, idx):
    try:
        json_ct = es_client.cat.count(idx, params={"format":"json"})
        # decompose the entry
        # it will be returned as a list with one element, which is a dictionary
        # such as [{'epoch': '1571915917', 'timestamp': '11:18:37', 'count': '6'}]
        return json_ct[0]['count'] 
    except Exception as e:
        return -1


def elastic_id_search(es_client, idx, q):
    # searches elastic for id 'q'
    res = es_client.search(index=idx, body={"query": {"match": {"id": q}}})
    return res

# below function will ask for ALL docs stored in elastic but elastic returns only the first 10
def get_elastic_docs(es_client, idx):
    try:
        res = es_client.search(index=idx, body = {
            'query': {
                'match_all' : {}
            }})
        if '_shards' in res and int(res['_shards']['total']) > 0:
            return res['hits']['hits']
        else:
            return None
    except Exception as e:
        return None

