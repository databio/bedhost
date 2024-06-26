/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */


export interface paths {
  "/v1": {
    /**
     * API intro page
     * @description Display the index UI page
     */
    get: operations["index_v1_get"];
  };
  "/v1/docs/changelog": {
    /** Release notes */
    get: operations["changelog_v1_docs_changelog_get"];
  };
  "/": {
    /** Lending Page */
    get: operations["lending_page__get"];
  };
  "/v1/stats": {
    /**
     * Get summary statistics for the DRS object store
     * @description Returns statistics
     */
    get: operations["get_bedbase_db_stats_v1_stats_get"];
  };
  "/v1/service-info": {
    /**
     * GA4GH service info
     * @description Returns information about this service, such as versions, name, etc.
     */
    get: operations["service_info_v1_service_info_get"];
  };
  "/v1/bed/example": {
    /**
     * Get example BED record metadata
     * @description Get metadata for an example BED record.
     */
    get: operations["get_example_bed_record_v1_bed_example_get"];
  };
  "/v1/bed/list": {
    /**
     * Paged list of all BED records
     * @description Returns list of BED files in the database with optional filters.
     */
    get: operations["list_beds_v1_bed_list_get"];
  };
  "/v1/bed/{bed_id}/metadata": {
    /**
     * Get metadata for a single BED record
     * @description Example
     *  bed_id: bbad85f21962bb8d972444f7f9a3a932
     */
    get: operations["get_bed_metadata_v1_bed__bed_id__metadata_get"];
  };
  "/v1/bed/{bed_id}/metadata/plots": {
    /**
     * Get plots for a single BED record
     * @description Example
     *  bed_id: bbad85f21962bb8d972444f7f9a3a932
     */
    get: operations["get_bed_plots_v1_bed__bed_id__metadata_plots_get"];
  };
  "/v1/bed/{bed_id}/metadata/files": {
    /**
     * Get metadata for a single BED record
     * @description Example
     *  bed_id: bbad85f21962bb8d972444f7f9a3a932
     */
    get: operations["get_bed_files_v1_bed__bed_id__metadata_files_get"];
  };
  "/v1/bed/{bed_id}/metadata/stats": {
    /**
     * Get stats for a single BED record
     * @description Example
     *  bed_id: bbad85f21962bb8d972444f7f9a3a932
     */
    get: operations["get_bed_stats_v1_bed__bed_id__metadata_stats_get"];
  };
  "/v1/bed/{bed_id}/metadata/classification": {
    /**
     * Get classification of single BED file
     * @description Example
     *  bed_id: bbad85f21962bb8d972444f7f9a3a932
     */
    get: operations["get_bed_classification_v1_bed__bed_id__metadata_classification_get"];
  };
  "/v1/bed/{bed_id}/metadata/raw": {
    /**
     * Get raw metadata for a single BED record
     * @description Returns raw metadata for a single BED record. This metadata is stored in PEPHub. And is not verified.Example
     *  bed_id: bbad85f21962bb8d972444f7f9a3a932
     */
    get: operations["get_bed_pephub_v1_bed__bed_id__metadata_raw_get"];
  };
  "/v1/bed/{bed_id}/embedding": {
    /**
     * Get embeddings for a single BED record
     * @description Returns embeddings for a single BED record.
     */
    get: operations["get_bed_embedding_v1_bed__bed_id__embedding_get"];
  };
  "/v1/bed/{bed_id}/regions/{chr_num}": {
    /**
     * Get regions from a BED file that overlap a query region.
     * @description Returns the queried regions with provided ID and optional query parameters
     */
    get: operations["get_regions_for_bedfile_v1_bed__bed_id__regions__chr_num__get"];
  };
  "/v1/bed/search/text": {
    /**
     * Search for a BedFile
     * @description Search for a BedFile by a text query.
     * Example: query="cancer"
     */
    post: operations["text_to_bed_search_v1_bed_search_text_post"];
  };
  "/v1/bed/search/bed": {
    /** Search for similar bed files */
    post: operations["bed_to_bed_search_v1_bed_search_bed_post"];
  };
  "/v1/bed/{bed_id}/tokens/{universe_id}": {
    /**
     * Get tokenized of bed file
     * @description Return univers of bed file
     * Example: bed: 0dcdf8986a72a3d85805bbc9493a1302 | universe: 58dee1672b7e581c8e1312bd4ca6b3c7
     */
    get: operations["get_tokens_v1_bed__bed_id__tokens__universe_id__get"];
  };
  "/v1/bed/{bed_id}/tokens/{universe_id}/info": {
    /**
     * Get link to tokenized bed file
     * @description Return link to tokenized bed file
     * Example: bed: 0dcdf8986a72a3d85805bbc9493a1302 | universe: 58dee1672b7e581c8e1312bd4ca6b3c7
     */
    get: operations["get_tokens_v1_bed__bed_id__tokens__universe_id__info_get"];
  };
  "/v1/bedset/example": {
    /** Get metadata for an example BEDset record */
    get: operations["get_example_bedset_record_v1_bedset_example_get"];
  };
  "/v1/bedset/list": {
    /**
     * Paged list of all BEDset records
     * @description Returns a list of BEDset records in the database with optional filters and search.
     */
    get: operations["list_bedsets_v1_bedset_list_get"];
  };
  "/v1/bedset/{bedset_id}/metadata": {
    /**
     * Get all metadata for a single BEDset record
     * @description Example
     *  bed_id: gse218680
     */
    get: operations["get_bedset_metadata_v1_bedset__bedset_id__metadata_get"];
  };
  "/v1/bedset/{bedset_id}/metadata/plots": {
    /**
     * Get plots for single bedset record
     * @description Example
     *  bed_id: gse218680
     */
    get: operations["get_bedset_metadata_v1_bedset__bedset_id__metadata_plots_get"];
  };
  "/v1/bedset/{bedset_id}/metadata/stats": {
    /**
     * Get stats for a single BEDSET record
     * @description Example
     *  bed_id: gse218680
     */
    get: operations["get_bedset_metadata_v1_bedset__bedset_id__metadata_stats_get"];
  };
  "/v1/bedset/{bedset_id}/bedfiles": {
    /**
     * Get Bedfiles In Bedset
     * @description Example
     *  bed_id: gse218680
     */
    get: operations["get_bedfiles_in_bedset_v1_bedset__bedset_id__bedfiles_get"];
  };
  "/v1/objects/{object_id}": {
    /**
     * Get DRS object metadata
     * @description Returns metadata about a DrsObject.
     */
    get: operations["get_drs_object_metadata_v1_objects__object_id__get"];
  };
  "/v1/objects/{object_id}/access/{access_id}": {
    /**
     * Get URL where you can retrieve files
     * @description Returns a URL that can be used to fetch the bytes of a DrsObject.
     */
    get: operations["get_object_bytes_url_v1_objects__object_id__access__access_id__get"];
  };
  "/v1/objects/{object_id}/access/{access_id}/bytes": {
    /**
     * Download actual file
     * @description Returns the bytes of a DrsObject.
     */
    get: operations["get_object_bytes_v1_objects__object_id__access__access_id__bytes_get"];
  };
  "/v1/objects/{object_id}/access/{access_id}/thumbnail": {
    /**
     * Download thumbnail file
     * @description Returns the bytes of a thumbnail of a DrsObject
     */
    get: operations["get_object_thumbnail_v1_objects__object_id__access__access_id__thumbnail_get"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    /** AccessMethod */
    AccessMethod: {
      /** Type */
      type: string;
      access_url?: components["schemas"]["AccessURL"] | null;
      /** Access Id */
      access_id?: string | null;
      /** Region */
      region?: string | null;
    };
    /** AccessURL */
    AccessURL: {
      /** Url */
      url: string;
      /** Headers */
      headers?: Record<string, never> | null;
    };
    /** BedClassification */
    BedClassification: {
      /** Name */
      name?: string | null;
      /** Genome Alias */
      genome_alias?: string;
      /** Genome Digest */
      genome_digest?: string | null;
      /**
       * Bed Type
       * @default bed3
       */
      bed_type?: string;
      /** Bed Format */
      bed_format?: string;
    };
    /** BedEmbeddingResult */
    BedEmbeddingResult: {
      /** Identifier */
      identifier: string;
      /** Payload */
      payload: Record<string, never>;
      /** Embedding */
      embedding: number[];
    };
    /** BedFiles */
    BedFiles: {
      bed_file?: components["schemas"]["FileModel"] | null;
      bigbed_file?: components["schemas"]["FileModel"] | null;
    };
    /** BedListResult */
    BedListResult: {
      /** Count */
      count: number;
      /** Limit */
      limit: number;
      /** Offset */
      offset: number;
      /** Results */
      results: components["schemas"]["BedMetadataBasic"][];
    };
    /** BedListSearchResult */
    BedListSearchResult: {
      /** Count */
      count: number;
      /** Limit */
      limit: number;
      /** Offset */
      offset: number;
      /** Results */
      results?: components["schemas"]["QdrantSearchResult"][];
    };
    /** BedMetadata */
    BedMetadata: {
      /**
       * Name
       * @default
       */
      name?: string | null;
      /** Genome Alias */
      genome_alias?: string;
      /** Genome Digest */
      genome_digest?: string | null;
      /**
       * Bed Type
       * @default bed3
       */
      bed_type?: string;
      /** Bed Format */
      bed_format?: string;
      /** Id */
      id: string;
      /** Description */
      description?: string | null;
      /**
       * Submission Date
       * Format: date-time
       */
      submission_date?: string;
      /** Last Update Date */
      last_update_date?: string | null;
      /**
       * Is Universe
       * @default false
       */
      is_universe?: boolean | null;
      /**
       * License Id
       * @default DUO:0000042
       */
      license_id?: string | null;
      stats?: components["schemas"]["BedStatsModel"] | null;
      plots?: components["schemas"]["BedPlots"] | null;
      files?: components["schemas"]["BedFiles"] | null;
      universe_metadata?: components["schemas"]["UniverseMetadata"] | null;
      /** Raw Metadata */
      raw_metadata?: components["schemas"]["BedPEPHub"] | components["schemas"]["BedPEPHubRestrict"] | null;
      /** Bedsets */
      bedsets?: components["schemas"]["BedSetMinimal"][] | null;
    };
    /** BedMetadataBasic */
    BedMetadataBasic: {
      /**
       * Name
       * @default
       */
      name?: string | null;
      /** Genome Alias */
      genome_alias?: string;
      /** Genome Digest */
      genome_digest?: string | null;
      /**
       * Bed Type
       * @default bed3
       */
      bed_type?: string;
      /** Bed Format */
      bed_format?: string;
      /** Id */
      id: string;
      /** Description */
      description?: string | null;
      /**
       * Submission Date
       * Format: date-time
       */
      submission_date?: string;
      /** Last Update Date */
      last_update_date?: string | null;
      /**
       * Is Universe
       * @default false
       */
      is_universe?: boolean | null;
      /**
       * License Id
       * @default DUO:0000042
       */
      license_id?: string | null;
    };
    /** BedPEPHub */
    BedPEPHub: {
      /** Sample Name */
      sample_name: string;
      /**
       * Genome
       * @default
       */
      genome?: string;
      /**
       * Organism
       * @default
       */
      organism?: string;
      /**
       * Species Id
       * @default
       */
      species_id?: string;
      /**
       * Cell Type
       * @default
       */
      cell_type?: string;
      /**
       * Cell Line
       * @default
       */
      cell_line?: string;
      /**
       * Exp Protocol
       * @description Experimental protocol (e.g. ChIP-seq)
       * @default
       */
      exp_protocol?: string;
      /**
       * Library Source
       * @description Library source (e.g. genomic, transcriptomic)
       * @default
       */
      library_source?: string;
      /**
       * Genotype
       * @description Genotype of the sample
       * @default
       */
      genotype?: string;
      /**
       * Target
       * @description Target of the assay (e.g. H3K4me3)
       * @default
       */
      target?: string;
      /**
       * Antibody
       * @description Antibody used in the assay
       * @default
       */
      antibody?: string;
      /**
       * Treatment
       * @description Treatment of the sample (e.g. drug treatment)
       * @default
       */
      treatment?: string;
      /**
       * Tissue
       * @description Tissue type
       * @default
       */
      tissue?: string;
      /**
       * Global Sample Id
       * @description Global sample identifier
       * @default
       */
      global_sample_id?: string;
      /**
       * Global Experiment Id
       * @description Global experiment identifier
       * @default
       */
      global_experiment_id?: string;
      /**
       * Description
       * @description Description of the sample
       * @default
       */
      description?: string;
      [key: string]: unknown;
    };
    /** BedPEPHubRestrict */
    BedPEPHubRestrict: {
      /** Sample Name */
      sample_name: string;
      /**
       * Genome
       * @default
       */
      genome?: string;
      /**
       * Organism
       * @default
       */
      organism?: string;
      /**
       * Species Id
       * @default
       */
      species_id?: string;
      /**
       * Cell Type
       * @default
       */
      cell_type?: string;
      /**
       * Cell Line
       * @default
       */
      cell_line?: string;
      /**
       * Exp Protocol
       * @description Experimental protocol (e.g. ChIP-seq)
       * @default
       */
      exp_protocol?: string;
      /**
       * Library Source
       * @description Library source (e.g. genomic, transcriptomic)
       * @default
       */
      library_source?: string;
      /**
       * Genotype
       * @description Genotype of the sample
       * @default
       */
      genotype?: string;
      /**
       * Target
       * @description Target of the assay (e.g. H3K4me3)
       * @default
       */
      target?: string;
      /**
       * Antibody
       * @description Antibody used in the assay
       * @default
       */
      antibody?: string;
      /**
       * Treatment
       * @description Treatment of the sample (e.g. drug treatment)
       * @default
       */
      treatment?: string;
      /**
       * Tissue
       * @description Tissue type
       * @default
       */
      tissue?: string;
      /**
       * Global Sample Id
       * @description Global sample identifier
       * @default
       */
      global_sample_id?: string;
      /**
       * Global Experiment Id
       * @description Global experiment identifier
       * @default
       */
      global_experiment_id?: string;
      /**
       * Description
       * @description Description of the sample
       * @default
       */
      description?: string;
    };
    /** BedPlots */
    BedPlots: {
      chrombins?: components["schemas"]["FileModel"];
      gccontent?: components["schemas"]["FileModel"];
      partitions?: components["schemas"]["FileModel"];
      expected_partitions?: components["schemas"]["FileModel"];
      cumulative_partitions?: components["schemas"]["FileModel"];
      widths_histogram?: components["schemas"]["FileModel"];
      neighbor_distances?: components["schemas"]["FileModel"];
      open_chromatin?: components["schemas"]["FileModel"];
    };
    /** BedSetBedFiles */
    BedSetBedFiles: {
      /** Count */
      count: number;
      /** Results */
      results: components["schemas"]["BedMetadataBasic"][];
    };
    /** BedSetListResult */
    BedSetListResult: {
      /** Count */
      count: number;
      /** Limit */
      limit: number;
      /** Offset */
      offset: number;
      /** Results */
      results: components["schemas"]["BedSetMetadata"][];
    };
    /** BedSetMetadata */
    BedSetMetadata: {
      /** Id */
      id: string;
      /** Name */
      name: string;
      /** Md5Sum */
      md5sum: string;
      statistics?: components["schemas"]["BedSetStats"] | null;
      plots?: components["schemas"]["BedSetPlots"] | null;
      /** Description */
      description?: string;
      /** Bed Ids */
      bed_ids?: string[];
    };
    /** BedSetMinimal */
    BedSetMinimal: {
      /** Id */
      id: string;
      /** Name */
      name?: string | null;
      /** Description */
      description?: string | null;
    };
    /** BedSetPlots */
    BedSetPlots: {
      region_commonality?: components["schemas"]["FileModel"];
    };
    /** BedSetStats */
    BedSetStats: {
      mean?: components["schemas"]["BedStatsModel"];
      sd?: components["schemas"]["BedStatsModel"];
    };
    /** BedStatsModel */
    BedStatsModel: {
      /** Regions No */
      regions_no?: number | null;
      /** Gc Content */
      gc_content?: number | null;
      /** Median Tss Dist */
      median_tss_dist?: number | null;
      /** Mean Region Width */
      mean_region_width?: number | null;
      /** Exon Frequency */
      exon_frequency?: number | null;
      /** Exon Percentage */
      exon_percentage?: number | null;
      /** Intron Frequency */
      intron_frequency?: number | null;
      /** Intron Percentage */
      intron_percentage?: number | null;
      /** Intergenic Percentage */
      intergenic_percentage?: number | null;
      /** Intergenic Frequency */
      intergenic_frequency?: number | null;
      /** Promotercore Frequency */
      promotercore_frequency?: number | null;
      /** Promotercore Percentage */
      promotercore_percentage?: number | null;
      /** Fiveutr Frequency */
      fiveutr_frequency?: number | null;
      /** Fiveutr Percentage */
      fiveutr_percentage?: number | null;
      /** Threeutr Frequency */
      threeutr_frequency?: number | null;
      /** Threeutr Percentage */
      threeutr_percentage?: number | null;
      /** Promoterprox Frequency */
      promoterprox_frequency?: number | null;
      /** Promoterprox Percentage */
      promoterprox_percentage?: number | null;
    };
    /** Body_bed_to_bed_search_v1_bed_search_bed_post */
    Body_bed_to_bed_search_v1_bed_search_bed_post: {
      /**
       * File
       * Format: binary
       */
      file?: string;
    };
    /** ComponentVersions */
    ComponentVersions: {
      /** Bedhost Version */
      bedhost_version: string;
      /** Bbconf Version */
      bbconf_version: string;
      /** Python Version */
      python_version: string;
      /** Geniml Version */
      geniml_version: string;
      /** Openapi Version */
      openapi_version: string;
    };
    /** DRSModel */
    DRSModel: {
      /** Id */
      id: string;
      /** Name */
      name?: string | null;
      /** Self Uri */
      self_uri: string;
      /** Size */
      size?: number | null;
      /** Created Time */
      created_time?: string | null;
      /** Updated Time */
      updated_time?: string | null;
      /** Checksums */
      checksums: string;
      /** Access Methods */
      access_methods: components["schemas"]["AccessMethod"][];
      /** Description */
      description?: string | null;
    };
    /** EmbeddingModels */
    EmbeddingModels: {
      /** Vec2Vec */
      vec2vec: string;
      /** Region2Vec */
      region2vec: string;
      /** Text2Vec */
      text2vec: string;
    };
    /** FileModel */
    FileModel: {
      /** Name */
      name: string;
      /** Title */
      title?: string | null;
      /** Path */
      path: string;
      /** Thumbnail Path */
      thumbnail_path?: string | null;
      /** Description */
      description?: string | null;
      /** Size */
      size?: number | null;
      /** Object Id */
      object_id?: string | null;
      /** Access Methods */
      access_methods?: components["schemas"]["AccessMethod"][];
    };
    /** HTTPValidationError */
    HTTPValidationError: {
      /** Detail */
      detail?: components["schemas"]["ValidationError"][];
    };
    /** Organization */
    Organization: {
      /** Name */
      name: string;
      /** Url */
      url: string;
    };
    /** QdrantSearchResult */
    QdrantSearchResult: {
      /** Id */
      id: string;
      /** Payload */
      payload: Record<string, never>;
      /** Score */
      score: number;
      metadata?: components["schemas"]["BedMetadataBasic"] | null;
    };
    /** ServiceInfoResponse */
    ServiceInfoResponse: {
      /** Id */
      id: string;
      /** Name */
      name: string;
      type: components["schemas"]["Type"];
      /** Description */
      description: string;
      organization: components["schemas"]["Organization"];
      /** Contacturl */
      contactUrl: string;
      /** Documentationurl */
      documentationUrl: string;
      /** Updatedat */
      updatedAt: string;
      /** Environment */
      environment: string;
      /** Version */
      version: string;
      component_versions: components["schemas"]["ComponentVersions"];
      embedding_models: components["schemas"]["EmbeddingModels"];
    };
    /** StatsReturn */
    StatsReturn: {
      /**
       * Bedfiles Number
       * @default 0
       */
      bedfiles_number?: number;
      /**
       * Bedsets Number
       * @default 0
       */
      bedsets_number?: number;
      /**
       * Genomes Number
       * @default 0
       */
      genomes_number?: number;
    };
    /** TokenizedBedResponse */
    TokenizedBedResponse: {
      /** Universe Id */
      universe_id: string;
      /** Bed Id */
      bed_id: string;
      /** Tokenized Bed */
      tokenized_bed: number[];
    };
    /** TokenizedPathResponse */
    TokenizedPathResponse: {
      /** Bed Id */
      bed_id: string;
      /** Universe Id */
      universe_id: string;
      /** File Path */
      file_path: string;
      /** Endpoint Url */
      endpoint_url: string;
    };
    /** Type */
    Type: {
      /** Group */
      group: string;
      /** Artifact */
      artifact: string;
      /** Version */
      version: string;
    };
    /** UniverseMetadata */
    UniverseMetadata: {
      /** Construct Method */
      construct_method?: string | null;
      /** Bedset Id */
      bedset_id?: string | null;
    };
    /** ValidationError */
    ValidationError: {
      /** Location */
      loc: (string | number)[];
      /** Message */
      msg: string;
      /** Error Type */
      type: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export interface operations {

  /**
   * API intro page
   * @description Display the index UI page
   */
  index_v1_get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
    };
  };
  /** Release notes */
  changelog_v1_docs_changelog_get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "text/html": string;
        };
      };
    };
  };
  /** Lending Page */
  lending_page__get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
    };
  };
  /**
   * Get summary statistics for the DRS object store
   * @description Returns statistics
   */
  get_bedbase_db_stats_v1_stats_get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["StatsReturn"];
        };
      };
    };
  };
  /**
   * GA4GH service info
   * @description Returns information about this service, such as versions, name, etc.
   */
  service_info_v1_service_info_get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["ServiceInfoResponse"];
        };
      };
    };
  };
  /**
   * Get example BED record metadata
   * @description Get metadata for an example BED record.
   */
  get_example_bed_record_v1_bed_example_get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedMetadata"];
        };
      };
    };
  };
  /**
   * Paged list of all BED records
   * @description Returns list of BED files in the database with optional filters.
   */
  list_beds_v1_bed_list_get: {
    parameters: {
      query?: {
        limit?: number;
        offset?: number;
        /** @description filter by genome of the bed file. e.g. 'hg38' */
        genome?: string;
        /** @description filter by bed type. e.g. 'bed6+4' */
        bed_type?: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedListResult"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get metadata for a single BED record
   * @description Example
   *  bed_id: bbad85f21962bb8d972444f7f9a3a932
   */
  get_bed_metadata_v1_bed__bed_id__metadata_get: {
    parameters: {
      query?: {
        /** @description Return full record with stats, plots, files and metadata */
        full?: boolean | null;
      };
      path: {
        /** @description BED digest */
        bed_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedMetadata"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get plots for a single BED record
   * @description Example
   *  bed_id: bbad85f21962bb8d972444f7f9a3a932
   */
  get_bed_plots_v1_bed__bed_id__metadata_plots_get: {
    parameters: {
      path: {
        /** @description BED digest */
        bed_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedPlots"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get metadata for a single BED record
   * @description Example
   *  bed_id: bbad85f21962bb8d972444f7f9a3a932
   */
  get_bed_files_v1_bed__bed_id__metadata_files_get: {
    parameters: {
      path: {
        /** @description BED digest */
        bed_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedFiles"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get stats for a single BED record
   * @description Example
   *  bed_id: bbad85f21962bb8d972444f7f9a3a932
   */
  get_bed_stats_v1_bed__bed_id__metadata_stats_get: {
    parameters: {
      path: {
        /** @description BED digest */
        bed_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedStatsModel"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get classification of single BED file
   * @description Example
   *  bed_id: bbad85f21962bb8d972444f7f9a3a932
   */
  get_bed_classification_v1_bed__bed_id__metadata_classification_get: {
    parameters: {
      path: {
        /** @description BED digest */
        bed_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedClassification"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get raw metadata for a single BED record
   * @description Returns raw metadata for a single BED record. This metadata is stored in PEPHub. And is not verified.Example
   *  bed_id: bbad85f21962bb8d972444f7f9a3a932
   */
  get_bed_pephub_v1_bed__bed_id__metadata_raw_get: {
    parameters: {
      path: {
        /** @description BED digest */
        bed_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedPEPHubRestrict"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get embeddings for a single BED record
   * @description Returns embeddings for a single BED record.
   */
  get_bed_embedding_v1_bed__bed_id__embedding_get: {
    parameters: {
      path: {
        /** @description BED digest */
        bed_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedEmbeddingResult"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get regions from a BED file that overlap a query region.
   * @description Returns the queried regions with provided ID and optional query parameters
   */
  get_regions_for_bedfile_v1_bed__bed_id__regions__chr_num__get: {
    parameters: {
      query?: {
        /** @description query range: start coordinate */
        start?: string | null;
        /** @description query range: start coordinate */
        end?: string | null;
      };
      path: {
        /** @description BED digest */
        bed_id: string;
        /**
         * @description Chromosome number
         * @example chr1
         */
        chr_num: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "text/plain": string;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Search for a BedFile
   * @description Search for a BedFile by a text query.
   * Example: query="cancer"
   */
  text_to_bed_search_v1_bed_search_text_post: {
    parameters: {
      query: {
        query: unknown;
        limit?: number;
        offset?: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedListSearchResult"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Search for similar bed files */
  bed_to_bed_search_v1_bed_search_bed_post: {
    parameters: {
      query?: {
        limit?: number;
        offset?: number;
      };
    };
    requestBody?: {
      content: {
        "multipart/form-data": components["schemas"]["Body_bed_to_bed_search_v1_bed_search_bed_post"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedListSearchResult"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get tokenized of bed file
   * @description Return univers of bed file
   * Example: bed: 0dcdf8986a72a3d85805bbc9493a1302 | universe: 58dee1672b7e581c8e1312bd4ca6b3c7
   */
  get_tokens_v1_bed__bed_id__tokens__universe_id__get: {
    parameters: {
      path: {
        bed_id: string;
        universe_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["TokenizedBedResponse"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get link to tokenized bed file
   * @description Return link to tokenized bed file
   * Example: bed: 0dcdf8986a72a3d85805bbc9493a1302 | universe: 58dee1672b7e581c8e1312bd4ca6b3c7
   */
  get_tokens_v1_bed__bed_id__tokens__universe_id__info_get: {
    parameters: {
      path: {
        bed_id: string;
        universe_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["TokenizedPathResponse"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get metadata for an example BEDset record */
  get_example_bedset_record_v1_bedset_example_get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedSetMetadata"];
        };
      };
    };
  };
  /**
   * Paged list of all BEDset records
   * @description Returns a list of BEDset records in the database with optional filters and search.
   */
  list_bedsets_v1_bedset_list_get: {
    parameters: {
      query?: {
        query?: string;
        limit?: number;
        offset?: number;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedSetListResult"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get all metadata for a single BEDset record
   * @description Example
   *  bed_id: gse218680
   */
  get_bedset_metadata_v1_bedset__bedset_id__metadata_get: {
    parameters: {
      query?: {
        full?: boolean;
      };
      path: {
        bedset_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedSetMetadata"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get plots for single bedset record
   * @description Example
   *  bed_id: gse218680
   */
  get_bedset_metadata_v1_bedset__bedset_id__metadata_plots_get: {
    parameters: {
      path: {
        bedset_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedSetPlots"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get stats for a single BEDSET record
   * @description Example
   *  bed_id: gse218680
   */
  get_bedset_metadata_v1_bedset__bedset_id__metadata_stats_get: {
    parameters: {
      path: {
        bedset_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedSetStats"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get Bedfiles In Bedset
   * @description Example
   *  bed_id: gse218680
   */
  get_bedfiles_in_bedset_v1_bedset__bedset_id__bedfiles_get: {
    parameters: {
      path: {
        bedset_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["BedSetBedFiles"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get DRS object metadata
   * @description Returns metadata about a DrsObject.
   */
  get_drs_object_metadata_v1_objects__object_id__get: {
    parameters: {
      path: {
        object_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["DRSModel"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Get URL where you can retrieve files
   * @description Returns a URL that can be used to fetch the bytes of a DrsObject.
   */
  get_object_bytes_url_v1_objects__object_id__access__access_id__get: {
    parameters: {
      path: {
        object_id: string;
        access_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": string;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Download actual file
   * @description Returns the bytes of a DrsObject.
   */
  get_object_bytes_v1_objects__object_id__access__access_id__bytes_get: {
    parameters: {
      path: {
        object_id: string;
        access_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": string;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /**
   * Download thumbnail file
   * @description Returns the bytes of a thumbnail of a DrsObject
   */
  get_object_thumbnail_v1_objects__object_id__access__access_id__thumbnail_get: {
    parameters: {
      path: {
        object_id: string;
        access_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": string;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
}
