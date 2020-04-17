if (!requireNamespace("BiocManager", quietly = TRUE))
    install.packages("BiocManager")

BiocManager::install("BSgenome.Hsapiens.UCSC.hg38.masked")
BiocManager::install("BSgenome.Hsapiens.UCSC.hg19.masked")