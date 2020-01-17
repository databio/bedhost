from .const import *


def get_bedstat_base_path(cfg):
    if 'path_config' in cfg and 'bedstat_pipeline_output_path' in cfg['path_config']:
        return cfg['path_config']['bedstat_pipeline_output_path']
    return os.getcwd()


def get_db_host(cfg):
    if 'database' in cfg and 'host' in cfg['database']:
        return cfg['database']['host']
    return 'localhost'


def get_elastic_index_name(cfg):
    """
    Get the Elasticsearch index from config or return the default one

    :param str cfg: path to the bedhost configuration file
    :return str: Elasticsearch index name
    """
    if 'database' in cfg and 'bed_index' in cfg['database']:
        return cfg['database']['bed_index']
    return DEFAULT_BED_INDEX


def get_server_cfg(cfg):
    if 'server' in cfg:
        if 'host' in cfg['server']:
            host_ip = cfg['server']['host']
        else:
            host_ip = DEFAULT_IP
        if 'port' in cfg['server']:
            host_port = cfg['server']['port']
        else:
            host_port = DEFAULT_PORT
        return host_ip, host_port
    else:
        return DEFAULT_IP, DEFAULT_PORT
