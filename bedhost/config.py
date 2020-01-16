import os
from .const import *


def get_bedstat_base_path(cfg):
    if 'path_config' in cfg and 'bedstat_pipeline_output_path' in cfg['path_config']:
        return cfg['path_config']['bedstat_pipeline_output_path']
    else:
        return os.getcwd()


def get_db_host(cfg):
    if 'database' in cfg and 'host' in cfg['database']:
        db_host = cfg['database']['host']
    else:
        db_host = 'localhost'
    return db_host


def get_server_cfg(cfg):
    if 'server' in cfg:
        if 'host' in cfg['server']:
            host_ip = cfg['server']['host']
        else:
            host_ip = '0.0.0.0'
        if 'port' in cfg['server']:
            host_port = cfg['server']['port']
        else:
            host_port = 8000
        return host_ip, host_port
    else:
        return '0.0.0.0', DEFAULT_PORT
