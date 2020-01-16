import yaml

# get the yaml config first
# pick up base path for the json out of bedstat pipeline and generated PNG images
try:
    with open("config.yaml", 'r') as ymlfile:
        cfg = yaml.safe_load(ymlfile)
except Exception as e:
    raise e

def get_bedstat_base_path():
    if 'path_config' in cfg and 'bedstat_pipeline_output_path' in cfg['path_config']:
        bedstat_base_path = cfg['path_config']['bedstat_pipeline_output_path']
    else:
        bedstat_base_path = os.getcwd()
    return bedstat_base_path

def get_db_host():
    if 'database' in cfg and 'host' in cfg['database']:
        db_host = cfg['database']['host']
    else:
        db_host = 'localhost'
    return db_host

def get_server_cfg():
    if 'server' in cfg:
        if 'host' in cfg['server']:
            host_ip = cfg['server']['host']
        else:
            host_ip = '0.0.0.0'
        if 'port' in cfg['server']:
            host_port = cfg['server']['port']
        else:
            host_port = 8000
        return(host_ip, host_port)
    else:
        return('0.0.0.0', '8000')
