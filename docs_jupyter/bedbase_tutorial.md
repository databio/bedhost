# **BEDBASE Demo**

The following demo has the purpose of demonstrating how to process, generate statistics and plots of BED files genrated by the R package Genomic Distributions using the REST API for the bedstat and bedbuncher pipelines. 




## Prior to start the tutorial (files download)
We need create a directory where we'll store the bedbase pipelines and files to be processed. 


```bash
cd $HOME
```


```bash
mkdir bedbase_tutorial
cd bedbase_tutorial
```

To download the files we'll need for this tutorial, we can easily do it with the following commands:


```bash
wget http://big.databio.org/example_data/bedbase_demo/bedbase_demo_files_justBED/bedbase_BEDfiles.tar.gz     
wget http://big.databio.org/example_data/bedbase_demo/bedbase_demo_files_justBED/bedbase_demo_PEPs.tar.gz 
```

    --2020-03-19 16:57:03--  http://big.databio.org/example_data/bedbase_demo/bedbase_demo_files_justBED/bedbase_BEDfiles.tar.gz
    Resolving big.databio.org (big.databio.org)... 128.143.245.181
    Connecting to big.databio.org (big.databio.org)|128.143.245.181|:80... connected.
    HTTP request sent, awaiting response... 200 OK
    Length: 60245813 (57M) [application/octet-stream]
    Saving to: ‘bedbase_BEDfiles.tar.gz’
    
    bedbase_BEDfiles.ta 100%[===================>]  57.45M   914KB/s    in 59s     
    
    2020-03-19 16:58:02 (993 KB/s) - ‘bedbase_BEDfiles.tar.gz’ saved [60245813/60245813]
    
    --2020-03-19 16:58:02--  http://big.databio.org/example_data/bedbase_demo/bedbase_demo_files_justBED/bedbase_demo_PEPs.tar.gz
    Resolving big.databio.org (big.databio.org)... 128.143.245.181
    Connecting to big.databio.org (big.databio.org)|128.143.245.181|:80... connected.
    HTTP request sent, awaiting response... 200 OK
    Length: 1374 (1.3K) [application/octet-stream]
    Saving to: ‘bedbase_demo_PEPs.tar.gz’
    
    bedbase_demo_PEPs.t 100%[===================>]   1.34K  --.-KB/s    in 0s      
    
    2020-03-19 16:58:03 (88.6 MB/s) - ‘bedbase_demo_PEPs.tar.gz’ saved [1374/1374]
    


The downloaded files are compressed so we'll need to untar them:


```bash
tar -zxvf bedbase_BEDfiles.tar.gz
tar -zxvf bedbase_demo_PEPs.tar.gz
```

    bedbase_BEDfiles/
    bedbase_BEDfiles/GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19.bed.gz
    bedbase_BEDfiles/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE105587_ENCFF413ANK_peaks_hg19.bed.gz
    bedbase_BEDfiles/GSM2423312_ENCFF155HVK_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE91663_ENCFF316ASR_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSM2423313_ENCFF722AOG_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19.bed.gz
    bedbase_BEDfiles/GSM2827349_ENCFF196DNQ_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE105977_ENCFF634NTU_peaks_hg19.bed.gz
    bedbase_BEDfiles/GSE105977_ENCFF937CGY_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSM2827350_ENCFF928JXU_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38.bed.gz
    bedbase_demo_PEPs/
    bedbase_demo_PEPs/bedstat_annotation_sheet.csv
    bedbase_demo_PEPs/bedbuncher_config.yaml
    bedbase_demo_PEPs/bedbase_configuration.yaml
    bedbase_demo_PEPs/bedbuncher_query.csv
    bedbase_demo_PEPs/bedstat_config.yaml


## First part of the tutorial (insert BED files stats into elastic)


### 1) Create a PEP describing the BED files to process

In order to get started, we'll need a PEP [Portable Encapsulated project](https://pepkit.github.io/). A PEP consists of 1) an annotation sheet (.csv) that contains information about the samples on a project and 2) a project config.yaml file that points to the sample annotation sheet. The config file also has other components, such as derived attributes, that in this case point to the BED files to be processed. The following is an example of a config file using the derived attributes `output_file_path` and `yaml_file` to point to the `.bed.gz` files and their respective metadata.


```bash
cat bedbase_demo_PEPs/bedstat_config.yaml
```

    metadata:
      sample_table: bedstat_annotation_sheet.csv
      output_dir: ../bedstat/bedstat_pipeline_logs 
      pipeline_interfaces: ../bedstat/pipeline_interface.yaml
    
    constant_attributes: 
      output_file_path: "source"
      yaml_file: "source2"
      protocol: "bedstat"
    
    derived_attributes: [output_file_path, yaml_file]
    data_sources:
      source: ../bedbase_BEDfiles/{file_name} 
      source2: ../bedstat/bedstat_pipeline_logs/submission/{sample_name}.yaml


### 2) Download bedstat and the Bedbase configuration manager (bbconf)

[bedstat](https://github.com/databio/bedstat) is a [pypiper](http://code.databio.org/pypiper/) pipeline that generates statistics and plots of BED files. Additionally, [bedstat](https://github.com/databio/bedstat) relies in
[bbconf](https://github.com/databio/bbconf), the `bedbase` configuration manager which implements convenience methods for interacting with an elasticsearch database, where our files metadata will be placed. For carrying out this demo, we'll be using the dev version of `bbconf` that can be downloaded as follows:


```bash
git clone git@github.com:databio/bedstat
git clone -b dev git@github.com:databio/bbconf

# Install Python dependencies
pip install piper --user
pip install --user loopercli
#pip install git+https://github.com/databio/bbconf.git@dev --user

# Install R dependencies
#Rscript scripts/installRdeps.R
```

    Cloning into 'bedstat'...
    remote: Enumerating objects: 165, done.[K
    remote: Counting objects: 100% (165/165), done.[K
    remote: Compressing objects: 100% (92/92), done.[K
    remote: Total 362 (delta 81), reused 106 (delta 43), pack-reused 197[K
    Receiving objects: 100% (362/362), 57.94 KiB | 1.81 MiB/s, done.
    Resolving deltas: 100% (155/155), done.
    Cloning into 'bbconf'...
    remote: Enumerating objects: 251, done.[K
    remote: Counting objects: 100% (251/251), done.[K
    remote: Compressing objects: 100% (178/178), done.[K
    remote: Total 251 (delta 148), reused 154 (delta 61), pack-reused 0[K
    Receiving objects: 100% (251/251), 42.52 KiB | 4.72 MiB/s, done.
    Resolving deltas: 100% (148/148), done.
    Requirement already satisfied: piper in /home/jev4xy/.local/lib/python3.6/site-packages (0.12.1)
    Requirement already satisfied: psutil in /home/jev4xy/.local/lib/python3.6/site-packages (from piper) (5.6.5)
    Requirement already satisfied: logmuse>=0.2.4 in /home/jev4xy/.local/lib/python3.6/site-packages (from piper) (0.2.5)
    Requirement already satisfied: pandas in /home/jev4xy/.local/lib/python3.6/site-packages (from piper) (0.25.1)
    Requirement already satisfied: yacman in /home/jev4xy/.local/lib/python3.6/site-packages (from piper) (0.6.6)
    Requirement already satisfied: ubiquerg>=0.4.5 in /home/jev4xy/.local/lib/python3.6/site-packages (from piper) (0.5.0)
    Requirement already satisfied: attmap>=0.12.5 in /home/jev4xy/.local/lib/python3.6/site-packages (from piper) (0.12.9)
    Requirement already satisfied: pytz>=2017.2 in /home/jev4xy/.local/lib/python3.6/site-packages (from pandas->piper) (2019.2)
    Requirement already satisfied: numpy>=1.13.3 in /home/jev4xy/.local/lib/python3.6/site-packages (from pandas->piper) (1.17.2)
    Requirement already satisfied: python-dateutil>=2.6.1 in /home/jev4xy/.local/lib/python3.6/site-packages (from pandas->piper) (2.8.0)
    Requirement already satisfied: pyyaml>=3.13 in /home/jev4xy/.local/lib/python3.6/site-packages (from yacman->piper) (5.1.2)
    Requirement already satisfied: oyaml in /home/jev4xy/.local/lib/python3.6/site-packages (from yacman->piper) (0.9)
    Requirement already satisfied: six>=1.5 in /home/jev4xy/.local/lib/python3.6/site-packages (from python-dateutil>=2.6.1->pandas->piper) (1.12.0)
    [33mWARNING: You are using pip version 19.3.1; however, version 20.0.2 is available.
    You should consider upgrading via the 'pip install --upgrade pip' command.[0m
    Requirement already satisfied: loopercli in /home/jev4xy/.local/lib/python3.6/site-packages (0.12.4)
    Requirement already satisfied: attmap>=0.12.7 in /home/jev4xy/.local/lib/python3.6/site-packages (from loopercli) (0.12.9)
    Requirement already satisfied: colorama>=0.3.9 in /home/jev4xy/.local/lib/python3.6/site-packages (from loopercli) (0.4.1)
    Requirement already satisfied: divvy>=0.3.1 in /home/jev4xy/.local/lib/python3.6/site-packages (from loopercli) (0.4.0)
    Requirement already satisfied: jinja2 in /home/jev4xy/.local/lib/python3.6/site-packages (from loopercli) (2.10.1)
    Requirement already satisfied: logmuse>=0.2.0 in /home/jev4xy/.local/lib/python3.6/site-packages (from loopercli) (0.2.5)
    Requirement already satisfied: ngstk>=0.0.1rc1 in /home/jev4xy/.local/lib/python3.6/site-packages (from loopercli) (0.0.1rc2)
    Requirement already satisfied: pandas>=0.20.2 in /home/jev4xy/.local/lib/python3.6/site-packages (from loopercli) (0.25.1)
    Requirement already satisfied: peppy>=0.22.2 in /home/jev4xy/.local/lib/python3.6/site-packages (from loopercli) (0.22.4.dev0)
    Requirement already satisfied: pyyaml>=3.12 in /home/jev4xy/.local/lib/python3.6/site-packages (from loopercli) (5.1.2)
    Requirement already satisfied: ubiquerg>=0.4.5 in /home/jev4xy/.local/lib/python3.6/site-packages (from loopercli) (0.5.0)
    Requirement already satisfied: yacman>=0.5.0 in /home/jev4xy/.local/lib/python3.6/site-packages (from divvy>=0.3.1->loopercli) (0.6.6)
    Requirement already satisfied: MarkupSafe>=0.23 in /home/jev4xy/.local/lib/python3.6/site-packages (from jinja2->loopercli) (1.1.1)
    Requirement already satisfied: python-dateutil>=2.6.1 in /home/jev4xy/.local/lib/python3.6/site-packages (from pandas>=0.20.2->loopercli) (2.8.0)
    Requirement already satisfied: pytz>=2017.2 in /home/jev4xy/.local/lib/python3.6/site-packages (from pandas>=0.20.2->loopercli) (2019.2)
    Requirement already satisfied: numpy>=1.13.3 in /home/jev4xy/.local/lib/python3.6/site-packages (from pandas>=0.20.2->loopercli) (1.17.2)
    Requirement already satisfied: oyaml in /home/jev4xy/.local/lib/python3.6/site-packages (from yacman>=0.5.0->divvy>=0.3.1->loopercli) (0.9)
    Requirement already satisfied: six>=1.5 in /home/jev4xy/.local/lib/python3.6/site-packages (from python-dateutil>=2.6.1->pandas>=0.20.2->loopercli) (1.12.0)
    [33mWARNING: You are using pip version 19.3.1; however, version 20.0.2 is available.
    You should consider upgrading via the 'pip install --upgrade pip' command.[0m


We'll need to create a directory where we can store the stats and plots generated by `bedstat`. Additionally, we'll create a directory where we can store log and metadata files that we'll need later on.


```bash
mkdir bedstat/bedstat_output
mkdir bedstat/bedstat_pipeline_logs
```

In order to use bbconf, we'll need to create a minimal configuration.yaml file. The path to this configuration file can be stored in the environment variable `$BEDBASE`.


```bash
cat bedbase_demo_PEPs/bedbase_configuration.yaml
```

    path:
      pipelines_output: ../bedstat/bedstat_output
    
    database:
      host: localhost
      bed_index: bed_index
      bedset_index: bedset_index
    
    server:
      host: 0.0.0.0
      port: 8000


### 3) Inititiate a local elasticsearch cluster

In addition to generate statistics and plots, [bedstat](https://github.com/databio/bedstat) inserts JSON formatted metadata into an [elasticsearch](https://www.elastic.co/elasticsearch/?ultron=[EL]-[B]-[AMER]-US+CA-Exact&blade=adwords-s&Device=c&thor=elasticsearch&gclid=Cj0KCQjwjcfzBRCHARIsAO-1_Oq5mSdze16kripxT5_I__EeH9F-xUCz_khEvzGL7q_mqP62CahJ9SIaAg2BEALw_wcB) database that it'll later be used to search and extract files and information about them. (This step may have to be performed outside the notebook since these commands ask for a sudo password. 


```bash
# If docker is not already installed, you can do so with the following commands
#(make sure you have sudo permissions)

sudo apt-get update
sudo apt-get install docker-engine -y

# Create a persistent volume to house elastic search data
sudo docker volume create es-data

# Run the docker container for elasticsearch
sudo docker run -p 9200:9200 -p 9300:9300 -v es-data:/usr/share/elasticsearch/data -e "xpack.ml.enabled=false" \
  -e "discovery.type=single-node" elasticsearch:7.5.1
```

    [sudo] password for jev4xy: 


### 4) Run the bedstat pipeline on the demo PEP
To run [bedstat](https://github.com/databio/bedstat) and the other required pipelines in this demo, we will rely on the pipeline submission engine [looper](http://looper.databio.org/en/latest/). For detailed instructions in how to link a project to a pipeline, click [here](http://looper.databio.org/en/latest/linking-a-pipeline/). If the pipeline is being run from an HPC environment where docker is not available, we recommend running the pipeline using the `--no-db-commit` flag (this will only calculate statistics and generate plots but will not insert this information into the local elasticsearch cluster.


```bash
#looper run bedbase_demo_PEPs/bedstat_config.yaml --no-db-commit --compute local --limit 1 -R

looper run bedbase_demo_PEPs/bedstat_config.yaml --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml \
--no-db-commit --compute local -R
```

    Command: run (Looper version: 0.12.4)
    Reading sample table: '/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/bedstat_annotation_sheet.csv'
    Activating compute package 'local'
    Finding pipelines for protocol(s): bedstat
    Known protocols: bedstat
    '/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py' appears to attempt to run on import; does it lack a conditional on '__main__'? Using base type: Sample
    [36m## [1 of 15] bedbase_demo_db1 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db1.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db1.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:38:38
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38.bed.gz --genome hg38 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db1.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/78c0e4753d04b238fc07e4ebe5a02984/
    *  Pipeline started at:   (03-19 17:38:38) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg38`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db1.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/78c0e4753d04b238fc07e4ebe5a02984/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38.bed.gz --fileId=GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/78c0e4753d04b238fc07e4ebe5a02984 --genome=hg38 --digest=78c0e4753d04b238fc07e4ebe5a02984` (13472)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/78c0e4753d04b238fc07e4ebe5a02984/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38_tssdist"
    BSAggregate: Calculating sizes. You can speed this up by supplying a regionsGRL.length vector...Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/78c0e4753d04b238fc07e4ebe5a02984/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg38.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/78c0e4753d04b238fc07e4ebe5a02984/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38_gccontent"
    promoterCore :	found 11017
    promoterProx :	found 2911
    exon :	found 11031
    intron :	found 22553
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/78c0e4753d04b238fc07e4ebe5a02984/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38_partitions"
    Warning messages:
    1: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000224v1, chr17_GL000205v2_random, chrUn_GL000219v1, chrUn_GL000195v1, chrUn_GL000218v1, chr22_KI270733v1_random, chr1_KI270706v1_random, chrUn_GL000220v1, chrUn_GL000216v2, chr17_KI270729v1_random, chr1_KI270713v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, ch [... truncated]
    2: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000224v1, chr17_GL000205v2_random, chrUn_GL000219v1, chrUn_GL000195v1, chrUn_GL000218v1, chr22_KI270733v1_random, chr1_KI270706v1_random, chrUn_GL000220v1, chrUn_GL000216v2, chr17_KI270729v1_random, chr1_KI270713v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, ch [... truncated]
    3: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000224v1, chr17_GL000205v2_random, chrUn_GL000219v1, chrUn_GL000195v1, chrUn_GL000218v1, chr22_KI270733v1_random, chr1_KI270706v1_random, chrUn_GL000220v1, chrUn_GL000216v2, chr17_KI270729v1_random, chr1_KI270713v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, ch [... truncated]
    4: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000224v1, chr17_GL000205v2_random, chrUn_GL000219v1, chrUn_GL000195v1, chrUn_GL000218v1, chr22_KI270733v1_random, chr1_KI270706v1_random, chrUn_GL000220v1, chrUn_GL000216v2, chr17_KI270729v1_random, chr1_KI270713v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, ch [... truncated]
    </pre>
    Command completed. Elapsed time: 0:00:17. Running peak memory: 0.611GB.  
      PID: 13472;	Command: Rscript;	Return code: 0;	Memory used: 0.611GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:17
    *  Total elapsed time (all runs):  0:00:17
    *         Peak memory (this run):  0.611 GB
    *        Pipeline completed time: 2020-03-19 17:38:56
    [36m## [2 of 15] bedbase_demo_db2 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db2.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db2.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:38:56
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38.bed.gz --genome hg38 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db2.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/fdd94ac0787599d564b07193e4ec41fd/
    *  Pipeline started at:   (03-19 17:38:56) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg38`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db2.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/fdd94ac0787599d564b07193e4ec41fd/GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38.bed.gz --fileId=GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/fdd94ac0787599d564b07193e4ec41fd --genome=hg38 --digest=fdd94ac0787599d564b07193e4ec41fd` (13528)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/fdd94ac0787599d564b07193e4ec41fd/GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38_tssdist"
    BSAggregate: Calculating sizes. You can speed this up by supplying a regionsGRL.length vector...Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/fdd94ac0787599d564b07193e4ec41fd/GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg38.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/fdd94ac0787599d564b07193e4ec41fd/GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38_gccontent"
    promoterCore :	found 102
    promoterProx :	found 178
    exon :	found 334
    intron :	found 2938
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/fdd94ac0787599d564b07193e4ec41fd/GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38_partitions"
    Warning messages:
    1: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000224v1, chrUn_KI270466v1, chrUn_KI270467v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrCHR_HSCHR11_1_CTG5, chrCHR_HSCHR11_1_CTG6, chrCHR_HSCHR11_1_CT [... truncated]
    2: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000224v1, chrUn_KI270466v1, chrUn_KI270467v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrCHR_HSCHR11_1_CTG5, chrCHR_HSCHR11_1_CTG6, chrCHR_HSCHR11_1_CT [... truncated]
    3: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000224v1, chrUn_KI270466v1, chrUn_KI270467v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrCHR_HSCHR11_1_CTG5, chrCHR_HSCHR11_1_CTG6, chrCHR_HSCHR11_1_CT [... truncated]
    4: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000224v1, chrUn_KI270466v1, chrUn_KI270467v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrCHR_HSCHR11_1_CTG5, chrCHR_HSCHR11_1_CTG6, chrCHR_HSCHR11_1_CT [... truncated]
    </pre>
    Command completed. Elapsed time: 0:00:12. Running peak memory: 0.385GB.  
      PID: 13528;	Command: Rscript;	Return code: 0;	Memory used: 0.385GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:12
    *  Total elapsed time (all runs):  0:00:12
    *         Peak memory (this run):  0.385 GB
    *        Pipeline completed time: 2020-03-19 17:39:09
    [36m## [3 of 15] bedbase_demo_db3 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db3.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db3.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:39:09
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38.bed.gz --genome hg38 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db3.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a6a08126cb6f4b1953ba0ec8675df85a/
    *  Pipeline started at:   (03-19 17:39:09) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg38`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db3.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a6a08126cb6f4b1953ba0ec8675df85a/GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38.bed.gz --fileId=GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a6a08126cb6f4b1953ba0ec8675df85a --genome=hg38 --digest=a6a08126cb6f4b1953ba0ec8675df85a` (13577)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a6a08126cb6f4b1953ba0ec8675df85a/GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38_tssdist"
    BSAggregate: Calculating sizes. You can speed this up by supplying a regionsGRL.length vector...Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a6a08126cb6f4b1953ba0ec8675df85a/GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg38.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a6a08126cb6f4b1953ba0ec8675df85a/GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38_gccontent"
    promoterCore :	found 31
    promoterProx :	found 59
    exon :	found 156
    intron :	found 1595
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a6a08126cb6f4b1953ba0ec8675df85a/GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38_partitions"
    Warning messages:
    1: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_KI270587v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrCHR_HSCHR11_1_CTG5, chrCHR_HSCHR11_1_CTG6, chrCHR_HSCHR11_1_CTG7, chrCHR_HSCHR11_1_CTG8, chrCHR_HS [... truncated]
    2: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_KI270587v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrCHR_HSCHR11_1_CTG5, chrCHR_HSCHR11_1_CTG6, chrCHR_HSCHR11_1_CTG7, chrCHR_HSCHR11_1_CTG8, chrCHR_HS [... truncated]
    3: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_KI270587v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrCHR_HSCHR11_1_CTG5, chrCHR_HSCHR11_1_CTG6, chrCHR_HSCHR11_1_CTG7, chrCHR_HSCHR11_1_CTG8, chrCHR_HS [... truncated]
    4: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_KI270587v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrCHR_HSCHR11_1_CTG5, chrCHR_HSCHR11_1_CTG6, chrCHR_HSCHR11_1_CTG7, chrCHR_HSCHR11_1_CTG8, chrCHR_HS [... truncated]
    </pre>
    Command completed. Elapsed time: 0:00:11. Running peak memory: 0.385GB.  
      PID: 13577;	Command: Rscript;	Return code: 0;	Memory used: 0.385GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:11
    *  Total elapsed time (all runs):  0:00:11
    *         Peak memory (this run):  0.3851 GB
    *        Pipeline completed time: 2020-03-19 17:39:20
    [36m## [4 of 15] bedbase_demo_db4 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db4.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db4.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:39:21
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSE105977_ENCFF937CGY_peaks_GRCh38.bed.gz --genome hg38 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db4.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a78493a2b314afe9f6635c4883f0d44b/
    *  Pipeline started at:   (03-19 17:39:21) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSE105977_ENCFF937CGY_peaks_GRCh38.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg38`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db4.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a78493a2b314afe9f6635c4883f0d44b/GSE105977_ENCFF937CGY_peaks_GRCh38.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSE105977_ENCFF937CGY_peaks_GRCh38.bed.gz --fileId=GSE105977_ENCFF937CGY_peaks_GRCh38 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a78493a2b314afe9f6635c4883f0d44b --genome=hg38 --digest=a78493a2b314afe9f6635c4883f0d44b` (13632)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a78493a2b314afe9f6635c4883f0d44b/GSE105977_ENCFF937CGY_peaks_GRCh38_tssdist"
    BSAggregate: Calculating sizes. You can speed this up by supplying a regionsGRL.length vector...Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a78493a2b314afe9f6635c4883f0d44b/GSE105977_ENCFF937CGY_peaks_GRCh38_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg38.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a78493a2b314afe9f6635c4883f0d44b/GSE105977_ENCFF937CGY_peaks_GRCh38_gccontent"
    promoterCore :	found 1748
    promoterProx :	found 6890
    exon :	found 20173
    intron :	found 137782
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a78493a2b314afe9f6635c4883f0d44b/GSE105977_ENCFF937CGY_peaks_GRCh38_partitions"
    Warning messages:
    1: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_KI270466v1, chrUn_KI270467v1, chr1_KI270711v1_random, chrUn_GL000224v1, chrUn_KI270448v1, chrUn_KI270587v1, chr1_KI270713v1_random, chrUn_KI270511v1, chrUn_KI270538v1, chr14_GL000225v1_random, chr5_GL000208v1_random, chrUn_GL000195v1, chrUn_GL000214v1, chr1_KI270712v1_random, chr22_KI270735v1_random, chr17_GL000205v2_random, chrUn_KI270742v1, chrUn_KI270757v1, chrUn_KI270438v1, chr2_KI270716v1_random, chrUn_KI270337v1, chr14_KI270722v1_random, chrUn_KI270519v1, chr1_KI270709v1_random, chrUn_KI270751v1, chrUn_KI270442v1, chrUn_GL000216v2, chrUn_KI270310v1, chrUn_KI270746v1, chrUn_KI270749v1, chr14_GL000009v2_random, chrUn_GL000219v1, chr1_KI270708v1_random, chrUn_KI270507v1, chrUn_KI270508v1, chr22_KI270739v1_random, chrUn_KI270515v1, chr17_KI270729v1_random, chrUn_KI270744v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCH [... truncated]
    2: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_KI270466v1, chrUn_KI270467v1, chr1_KI270711v1_random, chrUn_GL000224v1, chrUn_KI270448v1, chrUn_KI270587v1, chr1_KI270713v1_random, chrUn_KI270511v1, chrUn_KI270538v1, chr14_GL000225v1_random, chr5_GL000208v1_random, chrUn_GL000195v1, chrUn_GL000214v1, chr1_KI270712v1_random, chr22_KI270735v1_random, chr17_GL000205v2_random, chrUn_KI270742v1, chrUn_KI270757v1, chrUn_KI270438v1, chr2_KI270716v1_random, chrUn_KI270337v1, chr14_KI270722v1_random, chrUn_KI270519v1, chr1_KI270709v1_random, chrUn_KI270751v1, chrUn_KI270442v1, chrUn_GL000216v2, chrUn_KI270310v1, chrUn_KI270746v1, chrUn_KI270749v1, chr14_GL000009v2_random, chrUn_GL000219v1, chr1_KI270708v1_random, chrUn_KI270507v1, chrUn_KI270508v1, chr22_KI270739v1_random, chrUn_KI270515v1, chr17_KI270729v1_random, chrUn_KI270744v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCH [... truncated]
    3: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_KI270466v1, chrUn_KI270467v1, chr1_KI270711v1_random, chrUn_GL000224v1, chrUn_KI270448v1, chrUn_KI270587v1, chr1_KI270713v1_random, chrUn_KI270511v1, chrUn_KI270538v1, chr14_GL000225v1_random, chr5_GL000208v1_random, chrUn_GL000195v1, chrUn_GL000214v1, chr1_KI270712v1_random, chr22_KI270735v1_random, chr17_GL000205v2_random, chrUn_KI270742v1, chrUn_KI270757v1, chrUn_KI270438v1, chr2_KI270716v1_random, chrUn_KI270337v1, chr14_KI270722v1_random, chrUn_KI270519v1, chr1_KI270709v1_random, chrUn_KI270751v1, chrUn_KI270442v1, chrUn_GL000216v2, chrUn_KI270310v1, chrUn_KI270746v1, chrUn_KI270749v1, chr14_GL000009v2_random, chrUn_GL000219v1, chr1_KI270708v1_random, chrUn_KI270507v1, chrUn_KI270508v1, chr22_KI270739v1_random, chrUn_KI270515v1, chr17_KI270729v1_random, chrUn_KI270744v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCH [... truncated]
    4: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_KI270466v1, chrUn_KI270467v1, chr1_KI270711v1_random, chrUn_GL000224v1, chrUn_KI270448v1, chrUn_KI270587v1, chr1_KI270713v1_random, chrUn_KI270511v1, chrUn_KI270538v1, chr14_GL000225v1_random, chr5_GL000208v1_random, chrUn_GL000195v1, chrUn_GL000214v1, chr1_KI270712v1_random, chr22_KI270735v1_random, chr17_GL000205v2_random, chrUn_KI270742v1, chrUn_KI270757v1, chrUn_KI270438v1, chr2_KI270716v1_random, chrUn_KI270337v1, chr14_KI270722v1_random, chrUn_KI270519v1, chr1_KI270709v1_random, chrUn_KI270751v1, chrUn_KI270442v1, chrUn_GL000216v2, chrUn_KI270310v1, chrUn_KI270746v1, chrUn_KI270749v1, chr14_GL000009v2_random, chrUn_GL000219v1, chr1_KI270708v1_random, chrUn_KI270507v1, chrUn_KI270508v1, chr22_KI270739v1_random, chrUn_KI270515v1, chr17_KI270729v1_random, chrUn_KI270744v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCH [... truncated]
    </pre>
    Command completed. Elapsed time: 0:00:34. Running peak memory: 0.461GB.  
      PID: 13632;	Command: Rscript;	Return code: 0;	Memory used: 0.461GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:34
    *  Total elapsed time (all runs):  0:00:34
    *         Peak memory (this run):  0.4613 GB
    *        Pipeline completed time: 2020-03-19 17:39:55
    [36m## [5 of 15] bedbase_demo_db5 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db5.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db5.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:39:55
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSE91663_ENCFF316ASR_peaks_GRCh38.bed.gz --genome hg38 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db5.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/50e19bd44174bb286aa28ae2a15e7b8f/
    *  Pipeline started at:   (03-19 17:39:55) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSE91663_ENCFF316ASR_peaks_GRCh38.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg38`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db5.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/50e19bd44174bb286aa28ae2a15e7b8f/GSE91663_ENCFF316ASR_peaks_GRCh38.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSE91663_ENCFF316ASR_peaks_GRCh38.bed.gz --fileId=GSE91663_ENCFF316ASR_peaks_GRCh38 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/50e19bd44174bb286aa28ae2a15e7b8f --genome=hg38 --digest=50e19bd44174bb286aa28ae2a15e7b8f` (13694)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/50e19bd44174bb286aa28ae2a15e7b8f/GSE91663_ENCFF316ASR_peaks_GRCh38_tssdist"
    BSAggregate: Calculating sizes. You can speed this up by supplying a regionsGRL.length vector...Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/50e19bd44174bb286aa28ae2a15e7b8f/GSE91663_ENCFF316ASR_peaks_GRCh38_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg38.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/50e19bd44174bb286aa28ae2a15e7b8f/GSE91663_ENCFF316ASR_peaks_GRCh38_gccontent"
    promoterCore :	found 7468
    promoterProx :	found 13588
    exon :	found 30763
    intron :	found 127116
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/50e19bd44174bb286aa28ae2a15e7b8f/GSE91663_ENCFF316ASR_peaks_GRCh38_partitions"
    Warning messages:
    1: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr17_GL000205v2_random, chrUn_KI270744v1, chrUn_GL000219v1, chrUn_KI270742v1, chr1_KI270706v1_random, chr14_GL000225v1_random, chrUn_GL000195v1, chr1_KI270707v1_random, chr1_KI270711v1_random, chr14_GL000009v2_random, chr14_GL000194v1_random, chrUn_GL000216v2, chr16_KI270728v1_random, chr9_KI270718v1_random, chr22_KI270736v1_random, chr4_GL000008v2_random, chrUn_GL000214v1, chrUn_KI270442v1, chrUn_KI270745v1, chr22_KI270738v1_random, chr22_KI270733v1_random, chrUn_KI270749v1, chrUn_KI270589v1, chr17_KI270729v1_random, chr22_KI270734v1_random, chr14_KI270725v1_random, chr5_GL000208v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG20 [... truncated]
    2: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr17_GL000205v2_random, chrUn_KI270744v1, chrUn_GL000219v1, chrUn_KI270742v1, chr1_KI270706v1_random, chr14_GL000225v1_random, chrUn_GL000195v1, chr1_KI270707v1_random, chr1_KI270711v1_random, chr14_GL000009v2_random, chr14_GL000194v1_random, chrUn_GL000216v2, chr16_KI270728v1_random, chr9_KI270718v1_random, chr22_KI270736v1_random, chr4_GL000008v2_random, chrUn_GL000214v1, chrUn_KI270442v1, chrUn_KI270745v1, chr22_KI270738v1_random, chr22_KI270733v1_random, chrUn_KI270749v1, chrUn_KI270589v1, chr17_KI270729v1_random, chr22_KI270734v1_random, chr14_KI270725v1_random, chr5_GL000208v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG20 [... truncated]
    3: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr17_GL000205v2_random, chrUn_KI270744v1, chrUn_GL000219v1, chrUn_KI270742v1, chr1_KI270706v1_random, chr14_GL000225v1_random, chrUn_GL000195v1, chr1_KI270707v1_random, chr1_KI270711v1_random, chr14_GL000009v2_random, chr14_GL000194v1_random, chrUn_GL000216v2, chr16_KI270728v1_random, chr9_KI270718v1_random, chr22_KI270736v1_random, chr4_GL000008v2_random, chrUn_GL000214v1, chrUn_KI270442v1, chrUn_KI270745v1, chr22_KI270738v1_random, chr22_KI270733v1_random, chrUn_KI270749v1, chrUn_KI270589v1, chr17_KI270729v1_random, chr22_KI270734v1_random, chr14_KI270725v1_random, chr5_GL000208v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG20 [... truncated]
    4: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr17_GL000205v2_random, chrUn_KI270744v1, chrUn_GL000219v1, chrUn_KI270742v1, chr1_KI270706v1_random, chr14_GL000225v1_random, chrUn_GL000195v1, chr1_KI270707v1_random, chr1_KI270711v1_random, chr14_GL000009v2_random, chr14_GL000194v1_random, chrUn_GL000216v2, chr16_KI270728v1_random, chr9_KI270718v1_random, chr22_KI270736v1_random, chr4_GL000008v2_random, chrUn_GL000214v1, chrUn_KI270442v1, chrUn_KI270745v1, chr22_KI270738v1_random, chr22_KI270733v1_random, chrUn_KI270749v1, chrUn_KI270589v1, chr17_KI270729v1_random, chr22_KI270734v1_random, chr14_KI270725v1_random, chr5_GL000208v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG20 [... truncated]
    </pre>
    Command completed. Elapsed time: 0:00:27. Running peak memory: 0.462GB.  
      PID: 13694;	Command: Rscript;	Return code: 0;	Memory used: 0.462GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:27
    *  Total elapsed time (all runs):  0:00:27
    *         Peak memory (this run):  0.4618 GB
    *        Pipeline completed time: 2020-03-19 17:40:22
    [36m## [6 of 15] bedbase_demo_db6 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db6.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db6.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:40:22
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38.bed.gz --genome hg38 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db6.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9cd65cf4f07b83af35770c4a098fd4c6/
    *  Pipeline started at:   (03-19 17:40:23) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg38`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db6.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9cd65cf4f07b83af35770c4a098fd4c6/GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38.bed.gz --fileId=GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9cd65cf4f07b83af35770c4a098fd4c6 --genome=hg38 --digest=9cd65cf4f07b83af35770c4a098fd4c6` (13745)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9cd65cf4f07b83af35770c4a098fd4c6/GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38_tssdist"
    BSAggregate: Calculating sizes. You can speed this up by supplying a regionsGRL.length vector...Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9cd65cf4f07b83af35770c4a098fd4c6/GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg38.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9cd65cf4f07b83af35770c4a098fd4c6/GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38_gccontent"
    promoterCore :	found 1559
    promoterProx :	found 1208
    exon :	found 2416
    intron :	found 5794
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9cd65cf4f07b83af35770c4a098fd4c6/GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38_partitions"
    Warning messages:
    1: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr1_KI270706v1_random, chr17_GL000205v2_random, chrUn_KI270744v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrC [... truncated]
    2: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr1_KI270706v1_random, chr17_GL000205v2_random, chrUn_KI270744v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrC [... truncated]
    3: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr1_KI270706v1_random, chr17_GL000205v2_random, chrUn_KI270744v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrC [... truncated]
    4: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr1_KI270706v1_random, chr17_GL000205v2_random, chrUn_KI270744v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_1_CTG2, chrCHR_HSCHR10_1_CTG4, chrCHR_HSCHR11_1_CTG1_2, chrC [... truncated]
    </pre>
    Command completed. Elapsed time: 0:00:13. Running peak memory: 0.384GB.  
      PID: 13745;	Command: Rscript;	Return code: 0;	Memory used: 0.384GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:13
    *  Total elapsed time (all runs):  0:00:13
    *         Peak memory (this run):  0.3837 GB
    *        Pipeline completed time: 2020-03-19 17:40:35
    [36m## [7 of 15] bedbase_demo_db7 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db7.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db7.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:40:35
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38.bed.gz --genome hg38 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db7.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a5af5857bfbc3bfc8fea09cb90e67a16/
    *  Pipeline started at:   (03-19 17:40:36) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg38`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db7.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a5af5857bfbc3bfc8fea09cb90e67a16/GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38.bed.gz --fileId=GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a5af5857bfbc3bfc8fea09cb90e67a16 --genome=hg38 --digest=a5af5857bfbc3bfc8fea09cb90e67a16` (13804)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a5af5857bfbc3bfc8fea09cb90e67a16/GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38_tssdist"
    BSAggregate: Calculating sizes. You can speed this up by supplying a regionsGRL.length vector...Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a5af5857bfbc3bfc8fea09cb90e67a16/GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg38.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a5af5857bfbc3bfc8fea09cb90e67a16/GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38_gccontent"
    promoterCore :	found 1967
    promoterProx :	found 1607
    exon :	found 3285
    intron :	found 8071
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/a5af5857bfbc3bfc8fea09cb90e67a16/GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38_partitions"
    Warning messages:
    1: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000219v1, chr1_KI270711v1_random, chrUn_KI270744v1, chr1_KI270714v1_random, chr1_KI270713v1_random, chrUn_KI270742v1, chr1_KI270706v1_random, chr17_GL000205v2_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_ [... truncated]
    2: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000219v1, chr1_KI270711v1_random, chrUn_KI270744v1, chr1_KI270714v1_random, chr1_KI270713v1_random, chrUn_KI270742v1, chr1_KI270706v1_random, chr17_GL000205v2_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_ [... truncated]
    3: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000219v1, chr1_KI270711v1_random, chrUn_KI270744v1, chr1_KI270714v1_random, chr1_KI270713v1_random, chrUn_KI270742v1, chr1_KI270706v1_random, chr17_GL000205v2_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_ [... truncated]
    4: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrUn_GL000219v1, chr1_KI270711v1_random, chrUn_KI270744v1, chr1_KI270714v1_random, chr1_KI270713v1_random, chrUn_KI270742v1, chr1_KI270706v1_random, chr17_GL000205v2_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PATCH, chrCHR_HG2023_PATCH, chrCHR_HG2030_PATCH, chrCHR_HG2058_PATCH, chrCHR_HG2063_PATCH, chrCHR_HG2066_PATCH, chrCHR_HG2072_PATCH, chrCHR_HG2095_PATCH, chrCHR_HG2104_PATCH, chrCHR_HG2116_PATCH, chrCHR_HG2191_PATCH, chrCHR_HG2213_PATCH, chrCHR_HG2217_PATCH, chrCHR_HG2232_PATCH, chrCHR_HG2233_PATCH, chrCHR_HG2235_PATCH, chrCHR_HG2239_PATCH, chrCHR_HG2247_PATCH, chrCHR_HG2288_HG2289_PATCH, chrCHR_HG2290_PATCH, chrCHR_HG2291_PATCH, chrCHR_HG2334_PATCH, chrCHR_HG26_PATCH, chrCHR_HG986_PATCH, chrCHR_HSCHR10_1_CTG1, chrCHR_HSCHR10_ [... truncated]
    </pre>
    Command completed. Elapsed time: 0:00:14. Running peak memory: 0.879GB.  
      PID: 13804;	Command: Rscript;	Return code: 0;	Memory used: 0.879GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:14
    *  Total elapsed time (all runs):  0:00:14
    *         Peak memory (this run):  0.8793 GB
    *        Pipeline completed time: 2020-03-19 17:40:50
    [36m## [8 of 15] bedbase_demo_db8 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db8.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db8.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:40:50
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSM2423312_ENCFF155HVK_peaks_GRCh38.bed.gz --genome hg38 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db8.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/02fd518818560c28ed20ed98f4c291bd/
    *  Pipeline started at:   (03-19 17:40:50) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSM2423312_ENCFF155HVK_peaks_GRCh38.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg38`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db8.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/02fd518818560c28ed20ed98f4c291bd/GSM2423312_ENCFF155HVK_peaks_GRCh38.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSM2423312_ENCFF155HVK_peaks_GRCh38.bed.gz --fileId=GSM2423312_ENCFF155HVK_peaks_GRCh38 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/02fd518818560c28ed20ed98f4c291bd --genome=hg38 --digest=02fd518818560c28ed20ed98f4c291bd` (13883)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/02fd518818560c28ed20ed98f4c291bd/GSM2423312_ENCFF155HVK_peaks_GRCh38_tssdist"
    BSAggregate: Calculating sizes. You can speed this up by supplying a regionsGRL.length vector...Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/02fd518818560c28ed20ed98f4c291bd/GSM2423312_ENCFF155HVK_peaks_GRCh38_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg38.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/02fd518818560c28ed20ed98f4c291bd/GSM2423312_ENCFF155HVK_peaks_GRCh38_gccontent"
    promoterCore :	found 6459
    promoterProx :	found 13322
    exon :	found 29119
    intron :	found 129565
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/02fd518818560c28ed20ed98f4c291bd/GSM2423312_ENCFF155HVK_peaks_GRCh38_partitions"
    Warning messages:
    1: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr17_GL000205v2_random, chrUn_GL000219v1, chrUn_KI270742v1, chrUn_KI270744v1, chr1_KI270711v1_random, chr1_KI270706v1_random, chr22_KI270731v1_random, chrUn_GL000195v1, chr14_GL000194v1_random, chrUn_KI270442v1, chr17_KI270729v1_random, chr1_KI270707v1_random, chr22_KI270736v1_random, chr1_KI270709v1_random, chr22_KI270733v1_random, chr4_GL000008v2_random, chr16_KI270728v1_random, chr9_KI270719v1_random, chr22_KI270732v1_random, chr14_GL000009v2_random, chrUn_KI270745v1, chr14_GL000225v1_random, chrUn_KI270330v1, chrUn_GL000220v1, chr22_KI270737v1_random, chrUn_KI270751v1, chrUn_KI270757v1, chr9_KI270720v1_random, chrUn_GL000216v2, chr14_KI270724v1_random, chrUn_KI270746v1, chr9_KI270718v1_random, chrUn_KI270587v1, chrUn_GL000214v1, chr1_KI270712v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chr [... truncated]
    2: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr17_GL000205v2_random, chrUn_GL000219v1, chrUn_KI270742v1, chrUn_KI270744v1, chr1_KI270711v1_random, chr1_KI270706v1_random, chr22_KI270731v1_random, chrUn_GL000195v1, chr14_GL000194v1_random, chrUn_KI270442v1, chr17_KI270729v1_random, chr1_KI270707v1_random, chr22_KI270736v1_random, chr1_KI270709v1_random, chr22_KI270733v1_random, chr4_GL000008v2_random, chr16_KI270728v1_random, chr9_KI270719v1_random, chr22_KI270732v1_random, chr14_GL000009v2_random, chrUn_KI270745v1, chr14_GL000225v1_random, chrUn_KI270330v1, chrUn_GL000220v1, chr22_KI270737v1_random, chrUn_KI270751v1, chrUn_KI270757v1, chr9_KI270720v1_random, chrUn_GL000216v2, chr14_KI270724v1_random, chrUn_KI270746v1, chr9_KI270718v1_random, chrUn_KI270587v1, chrUn_GL000214v1, chr1_KI270712v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chr [... truncated]
    3: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr17_GL000205v2_random, chrUn_GL000219v1, chrUn_KI270742v1, chrUn_KI270744v1, chr1_KI270711v1_random, chr1_KI270706v1_random, chr22_KI270731v1_random, chrUn_GL000195v1, chr14_GL000194v1_random, chrUn_KI270442v1, chr17_KI270729v1_random, chr1_KI270707v1_random, chr22_KI270736v1_random, chr1_KI270709v1_random, chr22_KI270733v1_random, chr4_GL000008v2_random, chr16_KI270728v1_random, chr9_KI270719v1_random, chr22_KI270732v1_random, chr14_GL000009v2_random, chrUn_KI270745v1, chr14_GL000225v1_random, chrUn_KI270330v1, chrUn_GL000220v1, chr22_KI270737v1_random, chrUn_KI270751v1, chrUn_KI270757v1, chr9_KI270720v1_random, chrUn_GL000216v2, chr14_KI270724v1_random, chrUn_KI270746v1, chr9_KI270718v1_random, chrUn_KI270587v1, chrUn_GL000214v1, chr1_KI270712v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chr [... truncated]
    4: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chr1_KI270714v1_random, chr17_GL000205v2_random, chrUn_GL000219v1, chrUn_KI270742v1, chrUn_KI270744v1, chr1_KI270711v1_random, chr1_KI270706v1_random, chr22_KI270731v1_random, chrUn_GL000195v1, chr14_GL000194v1_random, chrUn_KI270442v1, chr17_KI270729v1_random, chr1_KI270707v1_random, chr22_KI270736v1_random, chr1_KI270709v1_random, chr22_KI270733v1_random, chr4_GL000008v2_random, chr16_KI270728v1_random, chr9_KI270719v1_random, chr22_KI270732v1_random, chr14_GL000009v2_random, chrUn_KI270745v1, chr14_GL000225v1_random, chrUn_KI270330v1, chrUn_GL000220v1, chr22_KI270737v1_random, chrUn_KI270751v1, chrUn_KI270757v1, chr9_KI270720v1_random, chrUn_GL000216v2, chr14_KI270724v1_random, chrUn_KI270746v1, chr9_KI270718v1_random, chrUn_KI270587v1, chrUn_GL000214v1, chr1_KI270712v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chr [... truncated]
    </pre>
    Command completed. Elapsed time: 0:00:27. Running peak memory: 0.461GB.  
      PID: 13883;	Command: Rscript;	Return code: 0;	Memory used: 0.461GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:27
    *  Total elapsed time (all runs):  0:00:27
    *         Peak memory (this run):  0.4611 GB
    *        Pipeline completed time: 2020-03-19 17:41:17
    [36m## [9 of 15] bedhost_demo_db9 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedhost_demo_db9.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedhost_demo_db9.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:41:17
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSM2423313_ENCFF722AOG_peaks_GRCh38.bed.gz --genome hg38 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedhost_demo_db9.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/33d4328fe4ff3a472edff81bf8f5d566/
    *  Pipeline started at:   (03-19 17:41:17) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSM2423313_ENCFF722AOG_peaks_GRCh38.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg38`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedhost_demo_db9.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/33d4328fe4ff3a472edff81bf8f5d566/GSM2423313_ENCFF722AOG_peaks_GRCh38.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSM2423313_ENCFF722AOG_peaks_GRCh38.bed.gz --fileId=GSM2423313_ENCFF722AOG_peaks_GRCh38 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/33d4328fe4ff3a472edff81bf8f5d566 --genome=hg38 --digest=33d4328fe4ff3a472edff81bf8f5d566` (13960)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/33d4328fe4ff3a472edff81bf8f5d566/GSM2423313_ENCFF722AOG_peaks_GRCh38_tssdist"
    BSAggregate: Calculating sizes. You can speed this up by supplying a regionsGRL.length vector...Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/33d4328fe4ff3a472edff81bf8f5d566/GSM2423313_ENCFF722AOG_peaks_GRCh38_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg38.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/33d4328fe4ff3a472edff81bf8f5d566/GSM2423313_ENCFF722AOG_peaks_GRCh38_gccontent"
    promoterCore :	found 5514
    promoterProx :	found 12714
    exon :	found 28439
    intron :	found 128655
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/33d4328fe4ff3a472edff81bf8f5d566/GSM2423313_ENCFF722AOG_peaks_GRCh38_partitions"
    Warning messages:
    1: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chrUn_KI270744v1, chr17_GL000205v2_random, chr1_KI270714v1_random, chr1_KI270706v1_random, chr14_GL000225v1_random, chrUn_KI270742v1, chrUn_GL000216v2, chrUn_GL000219v1, chr1_KI270711v1_random, chr16_KI270728v1_random, chr14_GL000009v2_random, chr1_KI270707v1_random, chr22_KI270738v1_random, chr22_KI270736v1_random, chrUn_KI270442v1, chr9_KI270718v1_random, chrUn_KI270751v1, chr1_KI270709v1_random, chrUn_KI270589v1, chr14_KI270725v1_random, chr14_GL000194v1_random, chrUn_GL000195v1, chr9_KI270719v1_random, chrUn_KI270538v1, chrUn_KI270749v1, chr4_GL000008v2_random, chr17_KI270729v1_random, chrUn_KI270330v1, chrUn_KI270745v1, chrUn_KI270746v1, chrUn_GL000214v1, chr22_KI270733v1_random, chr22_KI270737v1_random, chrUn_KI270756v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR [... truncated]
    2: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chrUn_KI270744v1, chr17_GL000205v2_random, chr1_KI270714v1_random, chr1_KI270706v1_random, chr14_GL000225v1_random, chrUn_KI270742v1, chrUn_GL000216v2, chrUn_GL000219v1, chr1_KI270711v1_random, chr16_KI270728v1_random, chr14_GL000009v2_random, chr1_KI270707v1_random, chr22_KI270738v1_random, chr22_KI270736v1_random, chrUn_KI270442v1, chr9_KI270718v1_random, chrUn_KI270751v1, chr1_KI270709v1_random, chrUn_KI270589v1, chr14_KI270725v1_random, chr14_GL000194v1_random, chrUn_GL000195v1, chr9_KI270719v1_random, chrUn_KI270538v1, chrUn_KI270749v1, chr4_GL000008v2_random, chr17_KI270729v1_random, chrUn_KI270330v1, chrUn_KI270745v1, chrUn_KI270746v1, chrUn_GL000214v1, chr22_KI270733v1_random, chr22_KI270737v1_random, chrUn_KI270756v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR [... truncated]
    3: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chrUn_KI270744v1, chr17_GL000205v2_random, chr1_KI270714v1_random, chr1_KI270706v1_random, chr14_GL000225v1_random, chrUn_KI270742v1, chrUn_GL000216v2, chrUn_GL000219v1, chr1_KI270711v1_random, chr16_KI270728v1_random, chr14_GL000009v2_random, chr1_KI270707v1_random, chr22_KI270738v1_random, chr22_KI270736v1_random, chrUn_KI270442v1, chr9_KI270718v1_random, chrUn_KI270751v1, chr1_KI270709v1_random, chrUn_KI270589v1, chr14_KI270725v1_random, chr14_GL000194v1_random, chrUn_GL000195v1, chr9_KI270719v1_random, chrUn_KI270538v1, chrUn_KI270749v1, chr4_GL000008v2_random, chr17_KI270729v1_random, chrUn_KI270330v1, chrUn_KI270745v1, chrUn_KI270746v1, chrUn_GL000214v1, chr22_KI270733v1_random, chr22_KI270737v1_random, chrUn_KI270756v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR [... truncated]
    4: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr1_KI270713v1_random, chrUn_KI270744v1, chr17_GL000205v2_random, chr1_KI270714v1_random, chr1_KI270706v1_random, chr14_GL000225v1_random, chrUn_KI270742v1, chrUn_GL000216v2, chrUn_GL000219v1, chr1_KI270711v1_random, chr16_KI270728v1_random, chr14_GL000009v2_random, chr1_KI270707v1_random, chr22_KI270738v1_random, chr22_KI270736v1_random, chrUn_KI270442v1, chr9_KI270718v1_random, chrUn_KI270751v1, chr1_KI270709v1_random, chrUn_KI270589v1, chr14_KI270725v1_random, chr14_GL000194v1_random, chrUn_GL000195v1, chr9_KI270719v1_random, chrUn_KI270538v1, chrUn_KI270749v1, chr4_GL000008v2_random, chr17_KI270729v1_random, chrUn_KI270330v1, chrUn_KI270745v1, chrUn_KI270746v1, chrUn_GL000214v1, chr22_KI270733v1_random, chr22_KI270737v1_random, chrUn_KI270756v1
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR [... truncated]
    </pre>
    Command completed. Elapsed time: 0:00:26. Running peak memory: 0.462GB.  
      PID: 13960;	Command: Rscript;	Return code: 0;	Memory used: 0.462GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:26
    *  Total elapsed time (all runs):  0:00:26
    *         Peak memory (this run):  0.4615 GB
    *        Pipeline completed time: 2020-03-19 17:41:43
    [36m## [10 of 15] bedbase_demo_db10 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db10.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db10.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:41:44
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSM2827349_ENCFF196DNQ_peaks_GRCh38.bed.gz --genome hg38 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db10.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/2ffb2cedd14f5f1fae7cb765a66d82a3/
    *  Pipeline started at:   (03-19 17:41:44) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSM2827349_ENCFF196DNQ_peaks_GRCh38.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg38`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db10.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/2ffb2cedd14f5f1fae7cb765a66d82a3/GSM2827349_ENCFF196DNQ_peaks_GRCh38.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSM2827349_ENCFF196DNQ_peaks_GRCh38.bed.gz --fileId=GSM2827349_ENCFF196DNQ_peaks_GRCh38 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/2ffb2cedd14f5f1fae7cb765a66d82a3 --genome=hg38 --digest=2ffb2cedd14f5f1fae7cb765a66d82a3` (14015)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/2ffb2cedd14f5f1fae7cb765a66d82a3/GSM2827349_ENCFF196DNQ_peaks_GRCh38_tssdist"
    BSAggregate: Calculating sizes. You can speed this up by supplying a regionsGRL.length vector...Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/2ffb2cedd14f5f1fae7cb765a66d82a3/GSM2827349_ENCFF196DNQ_peaks_GRCh38_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg38.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/2ffb2cedd14f5f1fae7cb765a66d82a3/GSM2827349_ENCFF196DNQ_peaks_GRCh38_gccontent"
    promoterCore :	found 13451
    promoterProx :	found 9142
    exon :	found 38026
    intron :	found 121299
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/2ffb2cedd14f5f1fae7cb765a66d82a3/GSM2827349_ENCFF196DNQ_peaks_GRCh38_partitions"
    Warning messages:
    1: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr17_GL000205v2_random, chrUn_GL000195v1, chr1_KI270713v1_random, chrUn_GL000220v1, chrUn_GL000224v1, chrUn_GL000219v1, chrUn_GL000218v1, chr17_KI270729v1_random, chr22_KI270733v1_random, chrUn_GL000216v2, chr1_KI270706v1_random, chr1_KI270714v1_random, chrUn_KI270751v1, chrUn_KI270442v1, chrUn_KI270438v1, chr14_GL000225v1_random, chr16_KI270728v1_random, chr22_KI270736v1_random, chrUn_KI270515v1, chrUn_KI270517v1, chr22_KI270732v1_random, chrUn_KI270519v1, chr9_KI270719v1_random, chr14_KI270722v1_random, chrUn_KI270742v1, chr1_KI270709v1_random, chr2_KI270716v1_random, chr1_KI270712v1_random, chr1_KI270708v1_random, chrUn_KI270508v1, chrUn_KI270507v1, chrUn_KI270538v1, chr17_KI270730v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PA [... truncated]
    2: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr17_GL000205v2_random, chrUn_GL000195v1, chr1_KI270713v1_random, chrUn_GL000220v1, chrUn_GL000224v1, chrUn_GL000219v1, chrUn_GL000218v1, chr17_KI270729v1_random, chr22_KI270733v1_random, chrUn_GL000216v2, chr1_KI270706v1_random, chr1_KI270714v1_random, chrUn_KI270751v1, chrUn_KI270442v1, chrUn_KI270438v1, chr14_GL000225v1_random, chr16_KI270728v1_random, chr22_KI270736v1_random, chrUn_KI270515v1, chrUn_KI270517v1, chr22_KI270732v1_random, chrUn_KI270519v1, chr9_KI270719v1_random, chr14_KI270722v1_random, chrUn_KI270742v1, chr1_KI270709v1_random, chr2_KI270716v1_random, chr1_KI270712v1_random, chr1_KI270708v1_random, chrUn_KI270508v1, chrUn_KI270507v1, chrUn_KI270538v1, chr17_KI270730v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PA [... truncated]
    3: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr17_GL000205v2_random, chrUn_GL000195v1, chr1_KI270713v1_random, chrUn_GL000220v1, chrUn_GL000224v1, chrUn_GL000219v1, chrUn_GL000218v1, chr17_KI270729v1_random, chr22_KI270733v1_random, chrUn_GL000216v2, chr1_KI270706v1_random, chr1_KI270714v1_random, chrUn_KI270751v1, chrUn_KI270442v1, chrUn_KI270438v1, chr14_GL000225v1_random, chr16_KI270728v1_random, chr22_KI270736v1_random, chrUn_KI270515v1, chrUn_KI270517v1, chr22_KI270732v1_random, chrUn_KI270519v1, chr9_KI270719v1_random, chr14_KI270722v1_random, chrUn_KI270742v1, chr1_KI270709v1_random, chr2_KI270716v1_random, chr1_KI270712v1_random, chr1_KI270708v1_random, chrUn_KI270508v1, chrUn_KI270507v1, chrUn_KI270538v1, chr17_KI270730v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PA [... truncated]
    4: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chr17_GL000205v2_random, chrUn_GL000195v1, chr1_KI270713v1_random, chrUn_GL000220v1, chrUn_GL000224v1, chrUn_GL000219v1, chrUn_GL000218v1, chr17_KI270729v1_random, chr22_KI270733v1_random, chrUn_GL000216v2, chr1_KI270706v1_random, chr1_KI270714v1_random, chrUn_KI270751v1, chrUn_KI270442v1, chrUn_KI270438v1, chr14_GL000225v1_random, chr16_KI270728v1_random, chr22_KI270736v1_random, chrUn_KI270515v1, chrUn_KI270517v1, chr22_KI270732v1_random, chrUn_KI270519v1, chr9_KI270719v1_random, chr14_KI270722v1_random, chrUn_KI270742v1, chr1_KI270709v1_random, chr2_KI270716v1_random, chr1_KI270712v1_random, chr1_KI270708v1_random, chrUn_KI270508v1, chrUn_KI270507v1, chrUn_KI270538v1, chr17_KI270730v1_random
      - in 'y': chrCHR_HG107_PATCH, chrCHR_HG126_PATCH, chrCHR_HG1311_PATCH, chrCHR_HG1342_HG2282_PATCH, chrCHR_HG1362_PATCH, chrCHR_HG142_HG150_NOVEL_TEST, chrCHR_HG151_NOVEL_TEST, chrCHR_HG1832_PATCH, chrCHR_HG2021_PA [... truncated]
    </pre>
    Command completed. Elapsed time: 0:00:27. Running peak memory: 0.462GB.  
      PID: 14015;	Command: Rscript;	Return code: 0;	Memory used: 0.462GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:27
    *  Total elapsed time (all runs):  0:00:27
    *         Peak memory (this run):  0.4622 GB
    *        Pipeline completed time: 2020-03-19 17:42:11
    [36m## [11 of 15] bedbase_demo_db11 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db11.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db11.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:42:11
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSM2827350_ENCFF928JXU_peaks_GRCh38.bed.gz --genome hg38 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db11.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/3e67ac88348d8b816a8ca50ab94eeade/
    *  Pipeline started at:   (03-19 17:42:11) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSM2827350_ENCFF928JXU_peaks_GRCh38.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg38`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db11.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/3e67ac88348d8b816a8ca50ab94eeade/GSM2827350_ENCFF928JXU_peaks_GRCh38.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSM2827350_ENCFF928JXU_peaks_GRCh38.bed.gz --fileId=GSM2827350_ENCFF928JXU_peaks_GRCh38 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/3e67ac88348d8b816a8ca50ab94eeade --genome=hg38 --digest=3e67ac88348d8b816a8ca50ab94eeade` (14070)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/3e67ac88348d8b816a8ca50ab94eeade/GSM2827350_ENCFF928JXU_peaks_GRCh38_tssdist"
    BSAggregate: Calculating sizes. You can speed this up by supplying a regionsGRL.length vector...Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/3e67ac88348d8b816a8ca50ab94eeade/GSM2827350_ENCFF928JXU_peaks_GRCh38_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg38.masked
    Error in GenomeInfoDb:::getDanglingSeqlevels(x, new2old = new2old, pruning.mode = pruning.mode,  : 
      The following seqlevels are to be dropped but are currently in use
      (i.e. have ranges on them): chrEBV. Please use the 'pruning.mode'
      argument to control how to prune 'x', that is, how to remove the ranges
      in 'x' that are on these sequences. For example, do something like:
      
      seqlevels(x, pruning.mode="coarse") <- new_seqlevels
      
      or
      
      keepSeqlevels(x, new_seqlevels, pruning.mode="coarse")
      
      See ?seqinfo for a description of the pruning modes.
    Calls: doitall ... seqlevels<- -> seqinfo<- -> seqinfo<- -> <Anonymous>
    In addition: Warning messages:
    1: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrEBV
      - in 'y': chrM, chr1_GL383518v1_alt, chr1_GL383519v1_alt, chr1_GL383520v2_alt, chr1_KI270759v1_alt, chr1_KI270760v1_alt, chr1_KI270761v1_alt, chr1_KI270762v1_alt, chr1_KI270763v1_alt, chr1_KI270764v1_alt, chr1_KI270765v1_alt, chr1_KI270766v1_alt, chr1_KI270892v1_alt, chr2_GL383521v1_alt, chr2_GL383522v1_alt, chr2_GL582966v2_alt, chr2_KI270767v1_alt, chr2_KI270768v1_alt, chr2_KI270769v1_alt, chr2_KI270770v1_alt, chr2_KI270771v1_alt, chr2_KI270772v1_alt, chr2_KI270773v1_alt, chr2_KI270774v1_alt, chr2_KI270775v1_alt, chr2_KI270776v1_alt, chr2_KI270893v1_alt, chr2_KI270894v1_alt, chr3_GL383526v1_alt, chr3_JH636055v2_alt, chr3_KI270777v1_alt, chr3_KI270778v1_alt, chr3_KI270779v1_alt, chr3_KI270780v1_alt, chr3_KI270781v1_alt, chr3_KI270782v1_alt, chr3_KI270783v1_alt, chr3_KI270784v1_alt, chr3_KI270895v1_alt, chr3_KI270924v1_alt, chr3_KI270934v1_alt, chr3_KI270935v1_alt, chr3_KI270936v1_alt, chr3_KI27093 [... truncated]
    2: In .Seqinfo.mergexy(x, y) :
      Each of the 2 combined objects has sequence levels not in the other:
      - in 'x': chrM, chr1_GL383518v1_alt, chr1_GL383519v1_alt, chr1_GL383520v2_alt, chr1_KI270759v1_alt, chr1_KI270760v1_alt, chr1_KI270761v1_alt, chr1_KI270762v1_alt, chr1_KI270763v1_alt, chr1_KI270764v1_alt, chr1_KI270765v1_alt, chr1_KI270766v1_alt, chr1_KI270892v1_alt, chr2_GL383521v1_alt, chr2_GL383522v1_alt, chr2_GL582966v2_alt, chr2_KI270767v1_alt, chr2_KI270768v1_alt, chr2_KI270769v1_alt, chr2_KI270770v1_alt, chr2_KI270771v1_alt, chr2_KI270772v1_alt, chr2_KI270773v1_alt, chr2_KI270774v1_alt, chr2_KI270775v1_alt, chr2_KI270776v1_alt, chr2_KI270893v1_alt, chr2_KI270894v1_alt, chr3_GL383526v1_alt, chr3_JH636055v2_alt, chr3_KI270777v1_alt, chr3_KI270778v1_alt, chr3_KI270779v1_alt, chr3_KI270780v1_alt, chr3_KI270781v1_alt, chr3_KI270782v1_alt, chr3_KI270783v1_alt, chr3_KI270784v1_alt, chr3_KI270895v1_alt, chr3_KI270924v1_alt, chr3_KI270934v1_alt, chr3_KI270935v1_alt, chr3_KI270936v1_alt, chr3_KI270937v1_alt, chr4_GL000 [... truncated]
    Execution halted
    </pre>
    Command completed. Elapsed time: 0:00:17. Running peak memory: 0.461GB.  
      PID: 14070;	Command: Rscript;	Return code: 1;	Memory used: 0.461GB
    
    
    ### Pipeline failed at:  (03-19 17:42:28) elapsed: 17.0 _TIME_
    
    Total time: 0:00:17
    Failure reason: Subprocess returned nonzero result. Check above output for details
    Traceback (most recent call last):
      File "/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py", line 50, in <module>
        pm.run(cmd=command, target=json_file_path)
      File "/home/jev4xy/.local/lib/python3.6/site-packages/pypiper/manager.py", line 785, in run
        self.callprint(cmd, shell, lock_file, nofail, container)  # Run command
      File "/home/jev4xy/.local/lib/python3.6/site-packages/pypiper/manager.py", line 1028, in callprint
        self._triage_error(SubprocessError(msg), nofail)
      File "/home/jev4xy/.local/lib/python3.6/site-packages/pypiper/manager.py", line 2131, in _triage_error
        self.fail_pipeline(e)
      File "/home/jev4xy/.local/lib/python3.6/site-packages/pypiper/manager.py", line 1660, in fail_pipeline
        raise exc
    pypiper.exceptions.SubprocessError: Subprocess returned nonzero result. Check above output for details
    [36m## [12 of 15] bedbase_demo_db12 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db12.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db12.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:42:28
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSE105587_ENCFF413ANK_peaks_hg19.bed.gz --genome hg19 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db12.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/f41e12ddd3b6c4ee6da2140d0feee1ea/
    *  Pipeline started at:   (03-19 17:42:28) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSE105587_ENCFF413ANK_peaks_hg19.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg19`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db12.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/f41e12ddd3b6c4ee6da2140d0feee1ea/GSE105587_ENCFF413ANK_peaks_hg19.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSE105587_ENCFF413ANK_peaks_hg19.bed.gz --fileId=GSE105587_ENCFF413ANK_peaks_hg19 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/f41e12ddd3b6c4ee6da2140d0feee1ea --genome=hg19 --digest=f41e12ddd3b6c4ee6da2140d0feee1ea` (14123)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/f41e12ddd3b6c4ee6da2140d0feee1ea/GSE105587_ENCFF413ANK_peaks_hg19_tssdist"
    Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/f41e12ddd3b6c4ee6da2140d0feee1ea/GSE105587_ENCFF413ANK_peaks_hg19_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg19.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/f41e12ddd3b6c4ee6da2140d0feee1ea/GSE105587_ENCFF413ANK_peaks_hg19_gccontent"
    promoterCore :	found 15183
    promoterProx :	found 9310
    exon :	found 38478
    intron :	found 120148
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/f41e12ddd3b6c4ee6da2140d0feee1ea/GSE105587_ENCFF413ANK_peaks_hg19_partitions"
    </pre>
    Command completed. Elapsed time: 0:00:33. Running peak memory: 0.721GB.  
      PID: 14123;	Command: Rscript;	Return code: 0;	Memory used: 0.721GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:33
    *  Total elapsed time (all runs):  0:00:33
    *         Peak memory (this run):  0.7212 GB
    *        Pipeline completed time: 2020-03-19 17:43:01
    [36m## [13 of 15] bedbase_demo_db13 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db13.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db13.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:43:01
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19.bed.gz --genome hg19 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db13.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9dc6f420639e0a265f3f179b6b42713a/
    *  Pipeline started at:   (03-19 17:43:02) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg19`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db13.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9dc6f420639e0a265f3f179b6b42713a/GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19.bed.gz --fileId=GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9dc6f420639e0a265f3f179b6b42713a --genome=hg19 --digest=9dc6f420639e0a265f3f179b6b42713a` (14182)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9dc6f420639e0a265f3f179b6b42713a/GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19_tssdist"
    Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9dc6f420639e0a265f3f179b6b42713a/GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg19.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9dc6f420639e0a265f3f179b6b42713a/GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19_gccontent"
    promoterCore :	found 11005
    promoterProx :	found 2977
    exon :	found 10918
    intron :	found 22468
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/9dc6f420639e0a265f3f179b6b42713a/GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19_partitions"
    </pre>
    Command completed. Elapsed time: 0:00:14. Running peak memory: 0.94GB.  
      PID: 14182;	Command: Rscript;	Return code: 0;	Memory used: 0.94GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:14
    *  Total elapsed time (all runs):  0:00:14
    *         Peak memory (this run):  0.9405 GB
    *        Pipeline completed time: 2020-03-19 17:43:15
    [36m## [14 of 15] bedbase_demo_db14 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db14.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db14.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:43:15
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19.bed.gz --genome hg19 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db14.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/e577eb947b5c791b30df969f0564324b/
    *  Pipeline started at:   (03-19 17:43:16) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg19`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db14.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/e577eb947b5c791b30df969f0564324b/GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19.bed.gz --fileId=GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/e577eb947b5c791b30df969f0564324b --genome=hg19 --digest=e577eb947b5c791b30df969f0564324b` (14238)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/e577eb947b5c791b30df969f0564324b/GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19_tssdist"
    Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/e577eb947b5c791b30df969f0564324b/GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg19.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/e577eb947b5c791b30df969f0564324b/GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19_gccontent"
    promoterCore :	found 98
    promoterProx :	found 184
    exon :	found 314
    intron :	found 3012
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/e577eb947b5c791b30df969f0564324b/GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19_partitions"
    </pre>
    Command completed. Elapsed time: 0:00:10. Running peak memory: 0.378GB.  
      PID: 14238;	Command: Rscript;	Return code: 0;	Memory used: 0.378GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:10
    *  Total elapsed time (all runs):  0:00:10
    *         Peak memory (this run):  0.378 GB
    *        Pipeline completed time: 2020-03-19 17:43:25
    [36m## [15 of 15] bedbase_demo_db15 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db15.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db15.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:43:26
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py --bedfile bedbase_BEDfiles/GSE105977_ENCFF634NTU_peaks_hg19.bed.gz --genome hg19 --sample-yaml bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db15.yaml -O bedstat/bedstat_pipeline_logs/results_pipeline --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml --no-db-commit -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/021461e2edc7b85315042c5ef80c7c03/
    *  Pipeline started at:   (03-19 17:43:26) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/pipeline`
    *     Pipeline version:  None
    *        Pipeline hash:  bd90e7cbb5a8146fe95bce6c38548da519cb7602
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-18 10:30:43 -0400
    
    ### Arguments passed to pipeline:
    
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *            `bedfile`:  `bedbase_BEDfiles/GSE105977_ENCFF634NTU_peaks_hg19.bed.gz`
    *        `config_file`:  `bedstat.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *    `genome_assembly`:  `hg19`
    *              `input`:  `None`
    *             `input2`:  `None`
    *     `just_db_commit`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `4000`
    *          `new_start`:  `False`
    *       `no_db_commit`:  `True`
    *      `output_parent`:  `bedstat/bedstat_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *        `sample_name`:  `None`
    *        `sample_yaml`:  `bedstat/bedstat_pipeline_logs/submission/bedbase_demo_db15.yaml`
    *             `silent`:  `False`
    *   `single_or_paired`:  `single`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/021461e2edc7b85315042c5ef80c7c03/GSE105977_ENCFF634NTU_peaks_hg19.json`  
    
    > `Rscript /home/jev4xy/Desktop/bedbase_tutorial/bedstat/tools/regionstat.R --bedfile=bedbase_BEDfiles/GSE105977_ENCFF634NTU_peaks_hg19.bed.gz --fileId=GSE105977_ENCFF634NTU_peaks_hg19 --outputfolder=/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/021461e2edc7b85315042c5ef80c7c03 --genome=hg19 --digest=021461e2edc7b85315042c5ef80c7c03` (14288)
    <pre>
    Loading required package: GenomicRanges
    Loading required package: stats4
    Loading required package: BiocGenerics
    Loading required package: parallel
    
    Attaching package: ‘BiocGenerics’
    
    The following objects are masked from ‘package:parallel’:
    
        clusterApply, clusterApplyLB, clusterCall, clusterEvalQ,
        clusterExport, clusterMap, parApply, parCapply, parLapply,
        parLapplyLB, parRapply, parSapply, parSapplyLB
    
    The following objects are masked from ‘package:stats’:
    
        IQR, mad, sd, var, xtabs
    
    The following objects are masked from ‘package:base’:
    
        anyDuplicated, append, as.data.frame, basename, cbind, colnames,
        dirname, do.call, duplicated, eval, evalq, Filter, Find, get, grep,
        grepl, intersect, is.unsorted, lapply, Map, mapply, match, mget,
        order, paste, pmax, pmax.int, pmin, pmin.int, Position, rank,
        rbind, Reduce, rownames, sapply, setdiff, sort, table, tapply,
        union, unique, unsplit, which, which.max, which.min
    
    Loading required package: S4Vectors
    
    Attaching package: ‘S4Vectors’
    
    The following object is masked from ‘package:base’:
    
        expand.grid
    
    Loading required package: IRanges
    Loading required package: GenomeInfoDb
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/021461e2edc7b85315042c5ef80c7c03/GSE105977_ENCFF634NTU_peaks_hg19_tssdist"
    Done counting regionsGRL lengths.
    Finding overlaps...
    Setting regionIDs...
    jExpr: .N
    Combining...
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/021461e2edc7b85315042c5ef80c7c03/GSE105977_ENCFF634NTU_peaks_hg19_chrombins"
    Loading required namespace: BSgenome.Hsapiens.UCSC.hg19.masked
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/021461e2edc7b85315042c5ef80c7c03/GSE105977_ENCFF634NTU_peaks_hg19_gccontent"
    promoterCore :	found 1756
    promoterProx :	found 7025
    exon :	found 19611
    intron :	found 137727
    [1] "Plotting: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/021461e2edc7b85315042c5ef80c7c03/GSE105977_ENCFF634NTU_peaks_hg19_partitions"
    </pre>
    Command completed. Elapsed time: 0:00:25. Running peak memory: 0.671GB.  
      PID: 14288;	Command: Rscript;	Return code: 0;	Memory used: 0.671GB
    
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:25
    *  Total elapsed time (all runs):  0:00:25
    *         Peak memory (this run):  0.671 GB
    *        Pipeline completed time: 2020-03-19 17:43:50
    
    Looper finished
    Samples valid for job generation: 15 of 15
    Successful samples: 15 of 15
    Commands submitted: 15 of 15
    Jobs submitted: 15
    [0m

Once we have generated plots and statistics, we can insert them into our local elasticsearch cluster running the `bedstat` pipeline with the `--just-db-commit` flag


```bash
#looper run bedbase_demo_PEPs/bedstat_config.yaml  --just-db-commit --compute local -R

looper run bedbase_demo_EPsP/bedstat_config.yaml --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml \
--just-db-commit --compute local -R
```

    Command: run (Looper version: 0.12.4)
    Reading sample table: '/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/bedstat_annotation_sheet.csv'
    Activating compute package 'local'
    Finding pipelines for protocol(s): bedstat
    Known protocols: bedstat
    '/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py' appears to attempt to run on import; does it lack a conditional on '__main__'? Using base type: Sample
    [36m## [1 of 15] bedbase_demo_db1 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db1.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db1.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:53
    Established connection with Elasticsearch: localhost
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38'], 'gc_content': [0.5364], 'regions_no': [68728], 'mean_absolute_TSS_dist': [51994518.6441], 'md5sum': ['78c0e4753d04b238fc07e4ebe5a02984'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38.bed.gz'], 'exon_frequency': [11031], 'exon_percentage': [0.1605], 'intergenic_frequency': [21216], 'intergenic_percentage': [0.3087], 'intron_frequency': [22553], 'intron_percentage': [0.3281], 'promoterCore_frequency': [11017], 'promoterCore_percentage': [0.1603], 'promoterProx_frequency': [2911], 'promoterProx_percentage': [0.0424], 'genome': ['hg38'], 'exp_protocol': ['ChiPseq'], 'cell_type': ['GM12878'], 'tissue': ['NA'], 'antibody': ['IKZF1'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['IKZF1 ChIP-seq on human GM12878']}
    [36m## [2 of 15] bedbase_demo_db2 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db2.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db2.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:53
    Established connection with Elasticsearch: localhost
    'tissue' metadata not available
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38'], 'gc_content': [0.4153], 'regions_no': [5725], 'mean_absolute_TSS_dist': [55778498.7442], 'md5sum': ['fdd94ac0787599d564b07193e4ec41fd'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38.bed.gz'], 'exon_frequency': [334], 'exon_percentage': [0.0583], 'intergenic_frequency': [2173], 'intergenic_percentage': [0.3796], 'intron_frequency': [2938], 'intron_percentage': [0.5132], 'promoterCore_frequency': [102], 'promoterCore_percentage': [0.0178], 'promoterProx_frequency': [178], 'promoterProx_percentage': [0.0311], 'genome': ['hg38'], 'exp_protocol': ['ChiPseq'], 'cell_type': ['HEK293'], 'antibody': ['GLI2'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['HEK293 cell line stably expressing N-terminal tagged eGFP-GLI2 under the control of a CMV promoter']}
    [36m## [3 of 15] bedbase_demo_db3 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db3.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db3.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:54
    Established connection with Elasticsearch: localhost
    'tissue' metadata not available
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38'], 'gc_content': [0.4063], 'regions_no': [2982], 'mean_absolute_TSS_dist': [51400911.9678], 'md5sum': ['a6a08126cb6f4b1953ba0ec8675df85a'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38.bed.gz'], 'exon_frequency': [156], 'exon_percentage': [0.0523], 'intergenic_frequency': [1141], 'intergenic_percentage': [0.3826], 'intron_frequency': [1595], 'intron_percentage': [0.5349], 'promoterCore_frequency': [31], 'promoterCore_percentage': [0.0104], 'promoterProx_frequency': [59], 'promoterProx_percentage': [0.0198], 'genome': ['hg38'], 'exp_protocol': ['ChiPseq'], 'cell_type': ['HEK293'], 'antibody': ['GLI2'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['HEK293 cell line stably expressing N-terminal tagged eGFP-GLI2 under the control of a CMV promoter']}
    [36m## [4 of 15] bedbase_demo_db4 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db4.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db4.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:54
    Established connection with Elasticsearch: localhost
    'tissue' metadata not available
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSE105977_ENCFF937CGY_peaks_GRCh38'], 'gc_content': [0.391], 'regions_no': [300000], 'mean_absolute_TSS_dist': [52114640.1946], 'md5sum': ['a78493a2b314afe9f6635c4883f0d44b'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSE105977_ENCFF937CGY_peaks_GRCh38.bed.gz'], 'exon_frequency': [20173], 'exon_percentage': [0.0672], 'intergenic_frequency': [133407], 'intergenic_percentage': [0.4447], 'intron_frequency': [137782], 'intron_percentage': [0.4593], 'promoterCore_frequency': [1748], 'promoterCore_percentage': [0.0058], 'promoterProx_frequency': [6890], 'promoterProx_percentage': [0.023], 'genome': ['hg38'], 'exp_protocol': ['ChiPseq'], 'cell_type': ['HEK293'], 'antibody': ['GLI2'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['HEK293 cell line stably expressing N-terminal tagged eGFP-GLI2 under the control of a CMV promoter']}
    [36m## [5 of 15] bedbase_demo_db5 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db5.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db5.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:55
    Established connection with Elasticsearch: localhost
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSE91663_ENCFF316ASR_peaks_GRCh38'], 'gc_content': [0.4546], 'regions_no': [300000], 'mean_absolute_TSS_dist': [54150666.8582], 'md5sum': ['50e19bd44174bb286aa28ae2a15e7b8f'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSE91663_ENCFF316ASR_peaks_GRCh38.bed.gz'], 'exon_frequency': [30763], 'exon_percentage': [0.1025], 'intergenic_frequency': [121065], 'intergenic_percentage': [0.4036], 'intron_frequency': [127116], 'intron_percentage': [0.4237], 'promoterCore_frequency': [7468], 'promoterCore_percentage': [0.0249], 'promoterProx_frequency': [13588], 'promoterProx_percentage': [0.0453], 'genome': ['hg38'], 'exp_protocol': ['ChiPseq'], 'cell_type': [' K562'], 'tissue': ['Lung '], 'antibody': [' ZEB2'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['ZEB2 ChIP-seq on human K562 (ENCODE)']}
    [36m## [6 of 15] bedbase_demo_db6 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db6.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db6.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:55
    Established connection with Elasticsearch: localhost
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38'], 'gc_content': [0.507], 'regions_no': [17110], 'mean_absolute_TSS_dist': [51414986.6069], 'md5sum': ['9cd65cf4f07b83af35770c4a098fd4c6'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38.bed.gz'], 'exon_frequency': [2416], 'exon_percentage': [0.1412], 'intergenic_frequency': [6133], 'intergenic_percentage': [0.3584], 'intron_frequency': [5794], 'intron_percentage': [0.3386], 'promoterCore_frequency': [1559], 'promoterCore_percentage': [0.0911], 'promoterProx_frequency': [1208], 'promoterProx_percentage': [0.0706], 'genome': ['hg38'], 'exp_protocol': ['ChiPseq'], 'cell_type': [' K562'], 'tissue': [' Lung'], 'antibody': [' ZEB2'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['ZEB2 ChIP-seq on human K562 (ENCODE)']}
    [36m## [7 of 15] bedbase_demo_db7 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db7.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db7.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:56
    Established connection with Elasticsearch: localhost
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38'], 'gc_content': [0.503], 'regions_no': [23256], 'mean_absolute_TSS_dist': [51610783.8628], 'md5sum': ['a5af5857bfbc3bfc8fea09cb90e67a16'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38.bed.gz'], 'exon_frequency': [3285], 'exon_percentage': [0.1413], 'intergenic_frequency': [8326], 'intergenic_percentage': [0.358], 'intron_frequency': [8071], 'intron_percentage': [0.3471], 'promoterCore_frequency': [1967], 'promoterCore_percentage': [0.0846], 'promoterProx_frequency': [1607], 'promoterProx_percentage': [0.0691], 'genome': ['hg38'], 'exp_protocol': ['ChiPseq'], 'cell_type': [' K562'], 'tissue': [' Lung'], 'antibody': [' ZEB2'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['ZEB2 ChIP-seq on human K562 (ENCODE)']}
    [36m## [8 of 15] bedbase_demo_db8 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db8.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db8.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:56
    Established connection with Elasticsearch: localhost
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSM2423312_ENCFF155HVK_peaks_GRCh38'], 'gc_content': [0.4502], 'regions_no': [300000], 'mean_absolute_TSS_dist': [53195047.1617], 'md5sum': ['02fd518818560c28ed20ed98f4c291bd'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSM2423312_ENCFF155HVK_peaks_GRCh38.bed.gz'], 'exon_frequency': [29119], 'exon_percentage': [0.0971], 'intergenic_frequency': [121535], 'intergenic_percentage': [0.4051], 'intron_frequency': [129565], 'intron_percentage': [0.4319], 'promoterCore_frequency': [6459], 'promoterCore_percentage': [0.0215], 'promoterProx_frequency': [13322], 'promoterProx_percentage': [0.0444], 'genome': ['hg38'], 'exp_protocol': ['ChiPseq'], 'cell_type': [' K562'], 'tissue': ['Lung'], 'antibody': [' ZEB2'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['K562 established from pleural effusion of 53 year old female with chronic myelogenous leukemia']}
    [36m## [9 of 15] bedhost_demo_db9 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedhost_demo_db9.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedhost_demo_db9.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:56
    Established connection with Elasticsearch: localhost
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSM2423313_ENCFF722AOG_peaks_GRCh38'], 'gc_content': [0.4459], 'regions_no': [300000], 'mean_absolute_TSS_dist': [52479401.3593], 'md5sum': ['33d4328fe4ff3a472edff81bf8f5d566'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSM2423313_ENCFF722AOG_peaks_GRCh38.bed.gz'], 'exon_frequency': [28439], 'exon_percentage': [0.0948], 'intergenic_frequency': [124678], 'intergenic_percentage': [0.4156], 'intron_frequency': [128655], 'intron_percentage': [0.4288], 'promoterCore_frequency': [5514], 'promoterCore_percentage': [0.0184], 'promoterProx_frequency': [12714], 'promoterProx_percentage': [0.0424], 'genome': ['hg38'], 'exp_protocol': ['ChiPseq'], 'cell_type': [' K562'], 'tissue': ['Lung'], 'antibody': [' ZEB2'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['K562 established from pleural effusion of 53 year old female with chronic myelogenous leukemia']}
    [36m## [10 of 15] bedbase_demo_db10 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db10.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db10.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:57
    Established connection with Elasticsearch: localhost
    'tissue' metadata not available
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSM2827349_ENCFF196DNQ_peaks_GRCh38'], 'gc_content': [0.4812], 'regions_no': [300000], 'mean_absolute_TSS_dist': [52671790.3859], 'md5sum': ['2ffb2cedd14f5f1fae7cb765a66d82a3'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSM2827349_ENCFF196DNQ_peaks_GRCh38.bed.gz'], 'exon_frequency': [38026], 'exon_percentage': [0.1268], 'intergenic_frequency': [118082], 'intergenic_percentage': [0.3936], 'intron_frequency': [121299], 'intron_percentage': [0.4043], 'promoterCore_frequency': [13451], 'promoterCore_percentage': [0.0448], 'promoterProx_frequency': [9142], 'promoterProx_percentage': [0.0305], 'genome': ['hg38'], 'exp_protocol': ['ChiPseq'], 'cell_type': ['GM12878'], 'antibody': ['IKZF1'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['IKZF1 ChIP-seq on human GM12878']}
    [36m## [11 of 15] bedbase_demo_db11 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db11.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db11.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:57
    Established connection with Elasticsearch: localhost
    Traceback (most recent call last):
      File "/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedstat/pipeline/bedstat.py", line 59, in <module>
        with open(json_file_path, 'r', encoding='utf-8') as f:
    FileNotFoundError: [Errno 2] No such file or directory: '/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/3e67ac88348d8b816a8ca50ab94eeade/GSM2827350_ENCFF928JXU_peaks_GRCh38.json'
    [36m## [12 of 15] bedbase_demo_db12 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db12.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db12.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:58
    Established connection with Elasticsearch: localhost
    'tissue' metadata not available
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSE105587_ENCFF413ANK_peaks_hg19'], 'gc_content': [0.4894], 'regions_no': [300000], 'mean_absolute_TSS_dist': [53096969.8565], 'md5sum': ['f41e12ddd3b6c4ee6da2140d0feee1ea'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSE105587_ENCFF413ANK_peaks_hg19.bed.gz'], 'exon_frequency': [38478], 'exon_percentage': [0.1283], 'intergenic_frequency': [116881], 'intergenic_percentage': [0.3896], 'intron_frequency': [120148], 'intron_percentage': [0.4005], 'promoterCore_frequency': [15183], 'promoterCore_percentage': [0.0506], 'promoterProx_frequency': [9310], 'promoterProx_percentage': [0.031], 'genome': ['hg19'], 'exp_protocol': ['ChiPseq'], 'cell_type': ['GM12878'], 'antibody': ['IKZF1'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['IKZF1 ChIP-seq on human GM12878']}
    [36m## [13 of 15] bedbase_demo_db13 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db13.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db13.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:58
    Established connection with Elasticsearch: localhost
    'tissue' metadata not available
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19'], 'gc_content': [0.5364], 'regions_no': [68681], 'mean_absolute_TSS_dist': [52337816.7597], 'md5sum': ['9dc6f420639e0a265f3f179b6b42713a'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19.bed.gz'], 'exon_frequency': [10918], 'exon_percentage': [0.159], 'intergenic_frequency': [21313], 'intergenic_percentage': [0.3103], 'intron_frequency': [22468], 'intron_percentage': [0.3271], 'promoterCore_frequency': [11005], 'promoterCore_percentage': [0.1602], 'promoterProx_frequency': [2977], 'promoterProx_percentage': [0.0433], 'genome': ['hg19'], 'exp_protocol': ['ChiPseq'], 'cell_type': ['GM12878'], 'antibody': ['IKZF1'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['IKZF1 ChIP-seq on human GM12878']}
    [36m## [14 of 15] bedbase_demo_db14 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db14.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db14.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:59
    Established connection with Elasticsearch: localhost
    'tissue' metadata not available
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19'], 'gc_content': [0.4142], 'regions_no': [5837], 'mean_absolute_TSS_dist': [51149954.7245], 'md5sum': ['e577eb947b5c791b30df969f0564324b'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19.bed.gz'], 'exon_frequency': [314], 'exon_percentage': [0.0538], 'intergenic_frequency': [2229], 'intergenic_percentage': [0.3819], 'intron_frequency': [3012], 'intron_percentage': [0.516], 'promoterCore_frequency': [98], 'promoterCore_percentage': [0.0168], 'promoterProx_frequency': [184], 'promoterProx_percentage': [0.0315], 'genome': ['hg19'], 'exp_protocol': ['ChiPseq'], 'cell_type': ['HEK293'], 'antibody': ['GLI2'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['HEK293 cell line stably expressing N-terminal tagged eGFP-GLI2 under the control of a CMV promoter']}
    [36m## [15 of 15] bedbase_demo_db15 (bedstat)[0m
    Submission settings lack memory specification
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db15.sub
    Job script (n=1; 0.00 Gb): bedstat/bedstat_pipeline_logs/submission/bedstat_bedbase_demo_db15.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 17:51:59
    Established connection with Elasticsearch: localhost
    'tissue' metadata not available
    'id' metadata not available
    'md5sum' metadata not available
    'plots' metadata not available
    'bedfile_path' metadata not available
    Data: {'id': ['GSE105977_ENCFF634NTU_peaks_hg19'], 'gc_content': [0.3911], 'regions_no': [300000], 'mean_absolute_TSS_dist': [57236876.5477], 'md5sum': ['021461e2edc7b85315042c5ef80c7c03'], 'plots': [{'name': 'tssdist', 'caption': 'Region-TSS distance distribution'}, {'name': 'chrombins', 'caption': 'Regions distribution over chromosomes'}, {'name': 'gccontent', 'caption': 'GC content'}, {'name': 'partitions', 'caption': 'Regions distribution over genomic partitions'}], 'bedfile_path': ['bedbase_BEDfiles/GSE105977_ENCFF634NTU_peaks_hg19.bed.gz'], 'exon_frequency': [19611], 'exon_percentage': [0.0654], 'intergenic_frequency': [133881], 'intergenic_percentage': [0.4463], 'intron_frequency': [137727], 'intron_percentage': [0.4591], 'promoterCore_frequency': [1756], 'promoterCore_percentage': [0.0059], 'promoterProx_frequency': [7025], 'promoterProx_percentage': [0.0234], 'genome': ['hg19'], 'exp_protocol': ['ChiPseq'], 'cell_type': ['HEK293'], 'antibody': ['GLI2'], 'treatment': ['None'], 'data_source': ['GEO'], 'description': ['HEK293 cell line stably expressing N-terminal tagged eGFP-GLI2 under the control of a CMV promoter']}
    
    Looper finished
    Samples valid for job generation: 15 of 15
    Successful samples: 15 of 15
    Commands submitted: 15 of 15
    Jobs submitted: 15
    [0m

After the previous steps have been executed, our BED files should be available for query on our local elastic search cluster. Files can be queried using the `bedbuncher` pipeline described in the below section. 


## Second part of the tutorial (use bedbuncher to create bedsets)

### 1) Create a new PEP describing the bedset name and specific JSON query  
[bedbuncher](https://github.com/databio/bedbuncher) is a pipeline designed to create bedsets (sets of BED files retrieved from bedbase), with their respective statistics and additional outputs such as a `PEP` and an `iGD` database. In order to run `bedbuncher`, we will need to design an additional PEP describing the query as well as attributes such as the name assigned to the newly created bedset. This configuration file should point to the `JSON` file describing the query to find files of interest. The configuration file should have the following structure:


```bash
cat bedbase_demo_PEPs/bedbuncher_query.csv
```

    sample_name,bedset_name,JSONquery_name,bbconfig_name,JSONquery_path,output_folder_path
    bedset1,bedbase_demo_bedset,test_query,bedbase_configuration,source1,source2



```bash
cat bedbase_demo_PEPs/bedbuncher_config.yaml
```

    metadata:
      sample_table: bedbuncher_query.csv
      output_dir: bedbuncher/bedbuncher_pipeline_logs
      pipeline_interfaces: ../bedbuncher/pipeline_interface.yaml 
    
    derived_attributes: [JSONquery_path, bbconfig_path]
    data_sources:
      source1: "bedbuncher/tests/{JSONquery_name}.json"
      source2: "bedbase_demo_PEPs/{bbconfig_name}.yaml"
    constant_attributes:
      protocol: "bedbuncher"


### 2) Download the bedbuncher pipeline 

To download the `bedbuncher` pipeline, simply clone the repository from github. 


```bash
git clone git@github.com:databio/bedbuncher
mkdir bedbuncher/bedbuncher_pipeline_logs
```

    Cloning into 'bedbuncher'...
    remote: Enumerating objects: 39, done.[K
    remote: Counting objects: 100% (39/39), done.[K
    remote: Compressing objects: 100% (27/27), done.[K
    remote: Total 235 (delta 22), reused 26 (delta 12), pack-reused 196[K
    Receiving objects: 100% (235/235), 54.59 KiB | 1.71 MiB/s, done.
    Resolving deltas: 100% (130/130), done.


One of the feats of `bedbuncher` includes [iGD](https://github.com/databio/iGD) database creation from the files in the bedset. [iGD](https://github.com/databio/iGD) can be installed as follows:  


```bash
git clone git@github.com:databio/iGD
cd iGD
make

#Add iGD bin to PATH (might have to do this before starting the tutorial) Something like 
export PATH=$BEDBASE/iGD/bin/:$PATH
```

    Cloning into 'iGD'...
    remote: Enumerating objects: 367, done.[K
    remote: Counting objects: 100% (367/367), done.[K
    remote: Compressing objects: 100% (253/253), done.[K
    remote: Total 1149 (delta 230), reused 242 (delta 111), pack-reused 782[K
    Receiving objects: 100% (1149/1149), 18.57 MiB | 1.14 MiB/s, done.
    Resolving deltas: 100% (651/651), done.
    mkdir -p obj
    mkdir -p bin
    cc -c -g -O2 -lz -lm src/igd_base.c -o obj/igd_base.o 
    [01m[Ksrc/igd_base.c:[m[K In function ‘[01m[Kget_fileinfo[m[K’:
    [01m[Ksrc/igd_base.c:228:5:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfgets[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
         [01;35m[Kfgets(buf, 1024, fp)[m[K;//head line
         [01;35m[K^~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_base.c:235:5:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfgets[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
         [01;35m[Kfgets(buf, 1024, fp)[m[K;   //header
         [01;35m[K^~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_base.c:[m[K In function ‘[01m[Kget_igdinfo[m[K’:
    [01m[Ksrc/igd_base.c:257:5:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
         [01;35m[Kfread(&iGD->nbp, sizeof(int32_t), 1, fp)[m[K;
         [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_base.c:258:5:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
         [01;35m[Kfread(&iGD->gType, sizeof(int32_t), 1, fp)[m[K;
         [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_base.c:259:5:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
         [01;35m[Kfread(&iGD->nCtg, sizeof(int32_t), 1, fp)[m[K;
         [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_base.c:269:5:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
         [01;35m[Kfread(iGD->nTile, sizeof(int32_t)*m, 1, fp)[m[K;
         [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_base.c:278:6:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
          [01;35m[Kfread(iGD->nCnt[i], sizeof(int32_t)*k, 1, fp)[m[K;
          [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_base.c:290:3:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
       [01;35m[Kfread(iGD->cName[i], 40, 1, fp)[m[K;
       [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_base.c:[m[K In function ‘[01m[Kigd_save[m[K’:
    [01m[Ksrc/igd_base.c:429:6:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
          [01;35m[Kfread(gdata, gdsize, 1, fp0)[m[K;
          [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_base.c:[m[K In function ‘[01m[Kigd0_save[m[K’:
    [01m[Ksrc/igd_base.c:487:6:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
          [01;35m[Kfread(gdata, gdsize, 1, fp0)[m[K;
          [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    cc -c -g -O2 -lz -lm src/igd_create.c -o obj/igd_create.o 
    cc -c -g -O2 -lz -lm src/igd_search.c -o obj/igd_search.o 
    [01m[Ksrc/igd_search.c:[m[K In function ‘[01m[Kget_overlaps0[m[K’:
    [01m[Ksrc/igd_search.c:47:4:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
        [01;35m[Kfread(gData0, sizeof(gdata0_t)*tmpi, 1, fP)[m[K;
        [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_search.c:79:7:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
           [01;35m[Kfread(gData0, sizeof(gdata0_t)*tmpi, 1, fP)[m[K;
           [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_search.c:[m[K In function ‘[01m[Kget_overlaps[m[K’:
    [01m[Ksrc/igd_search.c:157:4:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
        [01;35m[Kfread(gData, sizeof(gdata_t)*tmpi, 1, fP)[m[K;
        [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_search.c:189:7:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
           [01;35m[Kfread(gData, sizeof(gdata_t)*tmpi, 1, fP)[m[K;
           [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_search.c:[m[K In function ‘[01m[Kget_overlaps_v[m[K’:
    [01m[Ksrc/igd_search.c:239:4:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
        [01;35m[Kfread(gData, sizeof(gdata_t)*tmpi, 1, fP)[m[K;
        [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_search.c:267:6:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
          [01;35m[Kfread(gData, sizeof(gdata_t)*tmpi, 1, fP)[m[K;
          [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_search.c:[m[K In function ‘[01m[KgetMap[m[K’:
    [01m[Ksrc/igd_search.c:363:5:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
         [01;35m[Kfread(gData, sizeof(gdata_t)*tmpi, 1, fP)[m[K;
         [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    [01m[Ksrc/igd_search.c:[m[K In function ‘[01m[KgetMap_v[m[K’:
    [01m[Ksrc/igd_search.c:420:5:[m[K [01;35m[Kwarning: [m[Kignoring return value of ‘[01m[Kfread[m[K’, declared with attribute warn_unused_result [[01;35m[K-Wunused-result[m[K]
         [01;35m[Kfread(gData, sizeof(gdata_t)*tmpi, 1, fP)[m[K;
         [01;35m[K^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~[m[K
    cc -c -g -O2 -lz -lm src/igd.c -o obj/igd.o 
    cc -o bin/igd obj/igd_base.o obj/igd_create.o obj/igd_search.o obj/igd.o -g -O2 -lz -lm


### 3) Run the bedbuncher pipeline using Looper 

Once we have cloned the `bedbuncher` repository, we just need to point to the config file previously shown and pass the location of the `bedbase` configuration file to the argument `--bedbase-config`


```bash
looper run  bedbase_demo_PEPs/bedbuncher_config.yaml  --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml \
--compute local -R
```

    Command: run (Looper version: 0.12.4)
    Reading sample table: '/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/bedbuncher_query.csv'
    Activating compute package 'local'
    Finding pipelines for protocol(s): bedbuncher
    Known protocols: bedbuncher
    '/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedbuncher/bedbuncher.py' appears to attempt to run on import; does it lack a conditional on '__main__'? Using base type: Sample
    [36m## [1 of 1] bedset1 (bedbuncher)[0m
    > Note (missing optional attribute): 'bedbuncher' requests sample attribute 'bbconfig_path' for option '--bedbase-config'
    Writing script to /home/jev4xy/Desktop/bedbase_tutorial/bedbuncher/bedbuncher_pipeline_logs/submission/bedbuncher_bedset1.sub
    Job script (n=1; 0.00 Gb): bedbuncher/bedbuncher_pipeline_logs/submission/bedbuncher_bedset1.sub
    Compute node: cphg-51ksmr2
    Start time: 2020-03-19 18:39:50
    ### Pipeline run code and environment:
    
    *              Command:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbase_demo_PEPs/../bedbuncher/bedbuncher.py --JSON-query-path bedbuncher/tests/test_query.json --bedset-name bedbase_demo_bedset -O bedbuncher/bedbuncher_pipeline_logs/results_pipeline -M 12000 --bedbase-config bedbase_demo_PEPs/bedbase_configuration.yaml -R`
    *         Compute host:  cphg-51ksmr2
    *          Working dir:  /home/jev4xy/Desktop/bedbase_tutorial
    *            Outfolder:  bedbuncher/bedbuncher_pipeline_logs/results_pipeline/
    *  Pipeline started at:   (03-19 18:39:51) elapsed: 0.0 _TIME_
    
    ### Version log:
    
    *       Python version:  3.6.8
    *          Pypiper dir:  `/home/jev4xy/.local/lib/python3.6/site-packages/pypiper`
    *      Pypiper version:  0.12.1
    *         Pipeline dir:  `/home/jev4xy/Desktop/bedbase_tutorial/bedbuncher`
    *     Pipeline version:  None
    *        Pipeline hash:  3606a73841cb842f7408b67db8467f92e741fed5
    *      Pipeline branch:  * master
    *        Pipeline date:  2020-03-13 13:40:45 -0400
    *        Pipeline diff:  1 file changed, 1 insertion(+), 1 deletion(-)
    
    ### Arguments passed to pipeline:
    
    *    `JSON_query_path`:  `bedbuncher/tests/test_query.json`
    *     `bedbase_config`:  `bedbase_demo_PEPs/bedbase_configuration.yaml`
    *        `bedset_name`:  `bedbase_demo_bedset`
    *        `config_file`:  `bedbuncher.yaml`
    *              `cores`:  `1`
    *              `dirty`:  `False`
    *       `force_follow`:  `False`
    *             `logdev`:  `False`
    *                `mem`:  `12000`
    *          `new_start`:  `False`
    *      `output_parent`:  `bedbuncher/bedbuncher_pipeline_logs/results_pipeline`
    *            `recover`:  `True`
    *             `silent`:  `False`
    *           `testmode`:  `False`
    *          `verbosity`:  `None`
    
    ----------------------------------------
    
    Established connection with Elasticsearch: localhost
    Removed existing flag: 'bedbuncher/bedbuncher_pipeline_logs/results_pipeline/bedbuncher_completed.flag'
    14 BED files match the query
    bedset digest: 4b67b56dcbc2e13d161be7f8cf52d68b
    Output directory does not exist. Creating: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b
    Creating PEP annotation sheet and config.yaml for bedbase_demo_bedset
    Creating TAR archive: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset.tar
    bedbase_BEDfiles/GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE105977_ENCFF937CGY_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE91663_ENCFF316ASR_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSM2423312_ENCFF155HVK_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSM2423313_ENCFF722AOG_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSM2827349_ENCFF196DNQ_peaks_GRCh38.bed.gz
    bedbase_BEDfiles/GSE105587_ENCFF413ANK_peaks_hg19.bed.gz
    bedbase_BEDfiles/GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19.bed.gz
    bedbase_BEDfiles/GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19.bed.gz
    bedbase_BEDfiles/GSE105977_ENCFF634NTU_peaks_hg19.bed.gz
    /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_PEP
    /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_PEP/bedbase_demo_bedset_annotation_sheet.csv
    Reading individual BED file statistics from Elasticsearch
    Processing: GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38
    Processing: GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38
    Processing: GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38
    Processing: GSE105977_ENCFF937CGY_peaks_GRCh38
    Processing: GSE91663_ENCFF316ASR_peaks_GRCh38
    Processing: GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38
    Processing: GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38
    Processing: GSM2423312_ENCFF155HVK_peaks_GRCh38
    Processing: GSM2423313_ENCFF722AOG_peaks_GRCh38
    Processing: GSM2827349_ENCFF196DNQ_peaks_GRCh38
    Processing: GSE105587_ENCFF413ANK_peaks_hg19
    Processing: GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19
    Processing: GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19
    Processing: GSE105977_ENCFF634NTU_peaks_hg19
    Calculating bedset statistics
    Saving bedfiles statistics to: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_bedstat.csv
    Saving bedset statistics to: /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_summaryStats.csv
    Creating iGD database
    Target to produce: `/home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_igd.tar.gz`  
    
    > `igd create /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset.txt /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_igd bedbase_demo_bedset -f` (17993)
    <pre>
    igd_create 0
    igd_create 1: 0
    igd_create 2
    igd_create 3
    igd_create 4
    </pre>
    Command completed. Elapsed time: 0:00:00. Running peak memory: 0GB.  
      PID: 17993;	Command: igd;	Return code: 0;	Memory used: 0.0GB
    
    Creating iGD database TAR archive: bedbase_demo_bedset_igd.tar.gz
    /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_igd
    /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_igd/bedbase_demo_bedset_index.tsv
    /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_igd/data0
    /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_igd/bedbase_demo_bedset.igd
    Creating PEP TAR archive: bedbase_demo_bedset_PEP.tar.gz
    /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_PEP
    /home/jev4xy/Desktop/bedbase_tutorial/bedstat/bedstat_output/4b67b56dcbc2e13d161be7f8cf52d68b/bedbase_demo_bedset_PEP/bedbase_demo_bedset_annotation_sheet.csv
    {'GSE105587_ENCFF018NNF_conservative_idr_thresholded_peaks_GRCh38': '78c0e4753d04b238fc07e4ebe5a02984', 'GSE105977_ENCFF617QGK_optimal_idr_thresholded_peaks_GRCh38': 'fdd94ac0787599d564b07193e4ec41fd', 'GSE105977_ENCFF793SZW_conservative_idr_thresholded_peaks_GRCh38': 'a6a08126cb6f4b1953ba0ec8675df85a', 'GSE105977_ENCFF937CGY_peaks_GRCh38': 'a78493a2b314afe9f6635c4883f0d44b', 'GSE91663_ENCFF316ASR_peaks_GRCh38': '50e19bd44174bb286aa28ae2a15e7b8f', 'GSE91663_ENCFF319TPR_conservative_idr_thresholded_peaks_GRCh38': '9cd65cf4f07b83af35770c4a098fd4c6', 'GSE91663_ENCFF553KIK_optimal_idr_thresholded_peaks_GRCh38': 'a5af5857bfbc3bfc8fea09cb90e67a16', 'GSM2423312_ENCFF155HVK_peaks_GRCh38': '02fd518818560c28ed20ed98f4c291bd', 'GSM2423313_ENCFF722AOG_peaks_GRCh38': '33d4328fe4ff3a472edff81bf8f5d566', 'GSM2827349_ENCFF196DNQ_peaks_GRCh38': '2ffb2cedd14f5f1fae7cb765a66d82a3', 'GSE105587_ENCFF413ANK_peaks_hg19': 'f41e12ddd3b6c4ee6da2140d0feee1ea', 'GSE105587_ENCFF809OOE_conservative_idr_thresholded_peaks_hg19': '9dc6f420639e0a265f3f179b6b42713a', 'GSE105977_ENCFF449EZT_optimal_idr_thresholded_peaks_hg19': 'e577eb947b5c791b30df969f0564324b', 'GSE105977_ENCFF634NTU_peaks_hg19': '021461e2edc7b85315042c5ef80c7c03'}
    'bedbase_demo_bedset' summary info was successfully inserted into bedsets
    Starting cleanup: 3 files; 0 conditional files for cleanup
    
    Cleaning up flagged intermediate files. . .
    
    ### Pipeline completed. Epilogue
    *        Elapsed time (this run):  0:00:00
    *  Total elapsed time (all runs):  0:00:00
    *         Peak memory (this run):  0 GB
    *        Pipeline completed time: 2020-03-19 18:39:51
    
    Looper finished
    Samples valid for job generation: 1 of 1
    Successful samples: 1 of 1
    Commands submitted: 1 of 1
    Jobs submitted: 1
    [0m

## Third part of the demo (run local instance of bedhost)

The last part of the tutorial consists on running a local instance of [bedhost](https://github.com/databio/bedhost/tree/master) (a REST API for bedstat and bedbuncher produced outputs) in order to explore and download output files. To access the API, we'll need to download the dev branch of the github repository as follows:


```bash
git clone git@github.com:databio/bedhost
pip install bedhost/. --user
```

    Cloning into 'bedhost'...
    remote: Enumerating objects: 111, done.[K
    remote: Counting objects: 100% (111/111), done.[K
    remote: Compressing objects: 100% (81/81), done.[K
    remote: Total 622 (delta 72), reused 66 (delta 29), pack-reused 511[K
    Receiving objects: 100% (622/622), 178.95 KiB | 1.41 MiB/s, done.
    Resolving deltas: 100% (405/405), done.
    Processing ./bedhost
    Requirement already satisfied: aiofiles in /home/jev4xy/.local/lib/python3.6/site-packages (from bedhost==0.0.1) (0.4.0)
    Requirement already satisfied: bbconf>=0.0.2-dev in /home/jev4xy/.local/lib/python3.6/site-packages (from bedhost==0.0.1) (0.0.2.dev0)
    Requirement already satisfied: elasticsearch-dsl<8.0.0,>=7.0.0 in /home/jev4xy/.local/lib/python3.6/site-packages (from bedhost==0.0.1) (7.1.0)
    Requirement already satisfied: fastapi in /home/jev4xy/.local/lib/python3.6/site-packages (from bedhost==0.0.1) (0.49.0)
    Requirement already satisfied: jinja2 in /home/jev4xy/.local/lib/python3.6/site-packages (from bedhost==0.0.1) (2.10.1)
    Requirement already satisfied: python-multipart in /home/jev4xy/.local/lib/python3.6/site-packages (from bedhost==0.0.1) (0.0.5)
    Requirement already satisfied: pyyaml in /home/jev4xy/.local/lib/python3.6/site-packages (from bedhost==0.0.1) (5.1.2)
    Requirement already satisfied: requests in /usr/lib/python3/dist-packages (from bedhost==0.0.1) (2.18.4)
    Requirement already satisfied: starlette in /home/jev4xy/.local/lib/python3.6/site-packages (from bedhost==0.0.1) (0.12.9)
    Requirement already satisfied: uvicorn>=0.7.1 in /home/jev4xy/.local/lib/python3.6/site-packages (from bedhost==0.0.1) (0.11.3)
    Requirement already satisfied: yacman in /home/jev4xy/.local/lib/python3.6/site-packages (from bedhost==0.0.1) (0.6.6)
    Requirement already satisfied: elasticsearch in /home/jev4xy/.local/lib/python3.6/site-packages (from bbconf>=0.0.2-dev->bedhost==0.0.1) (7.1.0)
    Requirement already satisfied: logmuse in /home/jev4xy/.local/lib/python3.6/site-packages (from bbconf>=0.0.2-dev->bedhost==0.0.1) (0.2.5)
    Requirement already satisfied: six in /home/jev4xy/.local/lib/python3.6/site-packages (from elasticsearch-dsl<8.0.0,>=7.0.0->bedhost==0.0.1) (1.12.0)
    Requirement already satisfied: python-dateutil in /home/jev4xy/.local/lib/python3.6/site-packages (from elasticsearch-dsl<8.0.0,>=7.0.0->bedhost==0.0.1) (2.8.0)
    Requirement already satisfied: pydantic<2.0.0,>=0.32.2 in /home/jev4xy/.local/lib/python3.6/site-packages (from fastapi->bedhost==0.0.1) (1.4)
    Requirement already satisfied: MarkupSafe>=0.23 in /home/jev4xy/.local/lib/python3.6/site-packages (from jinja2->bedhost==0.0.1) (1.1.1)
    Requirement already satisfied: h11<0.10,>=0.8 in /home/jev4xy/.local/lib/python3.6/site-packages (from uvicorn>=0.7.1->bedhost==0.0.1) (0.9.0)
    Requirement already satisfied: websockets==8.* in /home/jev4xy/.local/lib/python3.6/site-packages (from uvicorn>=0.7.1->bedhost==0.0.1) (8.1)
    Requirement already satisfied: uvloop>=0.14.0; sys_platform != "win32" and sys_platform != "cygwin" and platform_python_implementation != "PyPy" in /home/jev4xy/.local/lib/python3.6/site-packages (from uvicorn>=0.7.1->bedhost==0.0.1) (0.14.0)
    Requirement already satisfied: click==7.* in /home/jev4xy/.local/lib/python3.6/site-packages (from uvicorn>=0.7.1->bedhost==0.0.1) (7.0)
    Requirement already satisfied: httptools==0.1.*; sys_platform != "win32" and sys_platform != "cygwin" and platform_python_implementation != "PyPy" in /home/jev4xy/.local/lib/python3.6/site-packages (from uvicorn>=0.7.1->bedhost==0.0.1) (0.1.1)
    Requirement already satisfied: oyaml in /home/jev4xy/.local/lib/python3.6/site-packages (from yacman->bedhost==0.0.1) (0.9)
    Requirement already satisfied: ubiquerg>=0.4.9 in /home/jev4xy/.local/lib/python3.6/site-packages (from yacman->bedhost==0.0.1) (0.5.0)
    Requirement already satisfied: attmap>=0.12.9 in /home/jev4xy/.local/lib/python3.6/site-packages (from yacman->bedhost==0.0.1) (0.12.9)
    Requirement already satisfied: urllib3>=1.21.1 in /usr/lib/python3/dist-packages (from elasticsearch->bbconf>=0.0.2-dev->bedhost==0.0.1) (1.22)
    Requirement already satisfied: dataclasses>=0.6; python_version < "3.7" in /home/jev4xy/.local/lib/python3.6/site-packages (from pydantic<2.0.0,>=0.32.2->fastapi->bedhost==0.0.1) (0.7)
    Building wheels for collected packages: bedhost
      Building wheel for bedhost (setup.py) ... [?25ldone
    [?25h  Created wheel for bedhost: filename=bedhost-0.0.1-cp36-none-any.whl size=59799 sha256=3da5288dcd0f404fc58e0e4a6ebc382e7410619abd6657ff37a5fc0f8961709f
      Stored in directory: /tmp/pip-ephem-wheel-cache-h0h97mve/wheels/0d/13/b6/f9f990b04e991dfbb802fbdb6628b11149fedfb88a6916dfe0
    Successfully built bedhost
    Installing collected packages: bedhost
      Found existing installation: bedhost 0.0.1
        Uninstalling bedhost-0.0.1:
          Successfully uninstalled bedhost-0.0.1
    Successfully installed bedhost-0.0.1
    [33mWARNING: You are using pip version 19.3.1; however, version 20.0.2 is available.
    You should consider upgrading via the 'pip install --upgrade pip' command.[0m


Then we need to run the following command, making sure to point to the previously described bedbase config.yaml file 


```bash
pip install itsdangerous --user
bedhost serve -c  bedbase_demo_PEPs/bedbase_configuration.yaml

```

    Requirement already satisfied: itsdangerous in /home/jev4xy/.local/lib/python3.6/site-packages (1.1.0)
    [33mWARNING: You are using pip version 19.3.1; however, version 20.0.2 is available.
    You should consider upgrading via the 'pip install --upgrade pip' command.[0m
    DEBU 2020-03-19 18:45:30,471 | bedhost:est:263 > Configured logger 'bedhost' using logmuse v0.2.5 
    DEBU 18:45:30 | bbconf:est:263 > Configured logger 'bbconf' using logmuse v0.2.5 
    INFO 18:45:30 | bbconf:bbconf:58 > Established connection with Elasticsearch: localhost 
    DEBU 18:45:30 | bbconf:bbconf:59 > Elasticsearch info:
    {'name': '1ec537ca3e87', 'cluster_name': 'docker-cluster', 'cluster_uuid': 'PamppPmESrKNFL1hqlo6gA', 'version': {'number': '7.5.1', 'build_flavor': 'default', 'build_type': 'docker', 'build_hash': '3ae9ac9a93c95bd0cdc054951cf95d88e1e18d96', 'build_date': '2019-12-16T22:57:37.835892Z', 'build_snapshot': False, 'lucene_version': '8.3.0', 'minimum_wire_compatibility_version': '6.8.0', 'minimum_index_compatibility_version': '6.0.0-beta1'}, 'tagline': 'You Know, for Search'} 
    Traceback (most recent call last):
      File "/home/jev4xy/.local/bin/bedhost", line 8, in <module>
        sys.exit(main())
      File "/home/jev4xy/.local/lib/python3.6/site-packages/bedhost/main.py", line 253, in main
        StaticFiles(directory=bbc[CFG_PATH_KEY][CFG_PIP_OUTPUT_KEY]), name=BED_INDEX)
      File "/home/jev4xy/.local/lib/python3.6/site-packages/starlette/applications.py", line 41, in mount
        self.router.mount(path, app=app, name=name)
      File "/home/jev4xy/.local/lib/python3.6/site-packages/starlette/routing.py", line 499, in mount
        route = Mount(path, app=app, name=name)
      File "/home/jev4xy/.local/lib/python3.6/site-packages/starlette/routing.py", line 282, in __init__
        assert path == "" or path.startswith("/"), "Routed paths must start with '/'"
    AssertionError: Routed paths must start with '/'




If we have stored the path to the bedbase config in the environment variable `$BEDBASE` (suggested), it's not neccesary to specify the path to the config file to start bedhost


```bash
bedhost serve 
```


```bash

```
